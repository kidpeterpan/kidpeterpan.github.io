+++
title = 'ตอนที่ 6: Pointers'
date = '2026-08-05T00:00:00+07:00'
draft = false
description = 'ทำความเข้าใจ pointer, address, dereference และ call-by-value พร้อมเลือกใช้ value หรือ pointer ให้เหมาะกับ data flow, slice และ garbage collector ของ Go'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราทิ้งท้ายไว้ว่า Go เป็น **call-by-value** เสมอ ทุกครั้งที่ส่งค่าเข้า function จะมีการ copy ค่าไปเป็น parameter แต่ทำไม `map` กับ `slice` ถึงยังแก้ข้อมูลข้างในแล้วเห็นผลจากฝั่ง caller ได้ล่ะ?

และถ้าอยากให้ function แก้ค่าตัวแปรต้นทางจริง ๆ เราต้องทำอย่างไร?

คำตอบอยู่ในบทนี้: **pointer**

pointer ไม่ใช่เวทมนตร์ และไม่ใช่ของที่ต้องกลัวจนต้องปิดหนังสือหนี มันคือค่าที่เก็บ address ของข้อมูลอีกก้อนหนึ่ง พูดง่าย ๆ คือแทนที่จะส่งบ้านทั้งหลังเข้าไปใน function เราส่งกระดาษที่จดเลขที่บ้านให้ function เดินตามไปดูของข้างใน

สิ่งที่จะได้ตอนจบบทนี้:

- สร้างและอ่าน pointer ด้วย `&` กับ `*` พร้อมตรวจ `nil` ก่อน dereference
- อธิบายได้ว่า Go เป็น call-by-value แม้จะส่ง pointer เข้า function
- แยกให้ออกระหว่างการเปลี่ยน pointer copy กับการแก้ค่าผ่าน pointer
- เลือก return value แทนการส่ง pointer เข้าไปให้ function เติมค่าเมื่อเหมาะสม
- เข้าใจข้อยกเว้นอย่าง `json.Unmarshal` และ field ที่ต้องแยก zero value ออกจาก no value
- อธิบายได้ว่า `map` และ `slice` แชร์ข้อมูลเดิมอย่างไร และทำไม `append` ไม่เปลี่ยน length ของ caller
- ใช้ reusable buffer เพื่อลด allocation ตอนอ่านข้อมูลจาก I/O
- อ่านผลของ escape analysis และแยก stack, heap, garbage กับงานของ GC ได้
- เปรียบเทียบ slice ของ value กับ slice ของ pointer โดยไม่สรุปว่าตัวใดเร็วกว่าเสมอ
- ทดลองปรับ `GOGC` และ `GOMEMLIMIT` อย่างระมัดระวัง

{{< mermaid >}}
graph TD
  A[ส่งข้อมูลเข้า function] --> B{ต้องแก้ข้อมูลต้นทางไหม?}
  B -->|ไม่ต้อง| C[ใช้ value เป็น default]
  B -->|ต้อง| D{function รับ interface เช่น json.Unmarshal?}
  D -->|ใช่| E[ส่ง pointer เป็นข้อยกเว้น]
  D -->|ไม่| F[พิจารณาให้ function return value]
  F -->|จำเป็นจริง| G[ส่ง pointer แล้วแก้ผ่าน *p]
  C --> H[ลดความซับซ้อนของ data flow]
  G --> I[ต้องดูแล nil และ mutability]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-pointers` เพื่อทดลองโค้ด โดยไม่กระทบ project จากตอนก่อน เปิด terminal แล้วรัน:

```sh
mkdir go-pointers
cd go-pointers
go mod init go-pointers
touch main.go
```

ในแต่ละ step ให้แทนที่โค้ดใน `main.go` ด้วยตัวอย่างของ step นั้น แล้วรัน:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านหรือ panic จะมีคำอธิบายกำกับไว้ อย่าวางตัวอย่างเหล่านั้นรวมกับโปรแกรมที่ต้องการรันปกติ

---

## Step 1: Pointer คือกระดาษที่จด address

ลองคิดว่าหน่วยความจำเป็นแถวบ้านที่มีเลขที่บ้านกำกับอยู่ ตัวแปรปกติเก็บของจริงไว้ในบ้าน ส่วน pointer เก็บแค่เลขที่บ้านของของอีกชิ้นหนึ่ง

วางโค้ดนี้ใน `main.go` แล้วรัน:

```go
package main

import "fmt"

func main() {
	name := "Mina"
	p := &name

	fmt.Println("name:", name)
	fmt.Println("pointer:", p)
	fmt.Println("value through pointer:", *p)

	*p = "Nina"
	fmt.Println("name after update:", name)
}
```

ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
name: Mina
pointer: 0x14000122020
value through pointer: Mina
name after update: Nina
```

ค่า address จะต่างกันไปตามเครื่องและการรันแต่ละครั้ง ไม่ต้องพยายามจำตัวเลขนั้น ให้จำ operator สองตัวนี้แทน:

- `&name` คือ **address operator** ขอ address ของตัวแปร `name`
- `*p` คือ **indirection operator** หรือ dereference เดินตาม address ใน `p` ไปอ่านค่าจริง
- `*p = "Nina"` เขียนค่าใหม่ลงใน memory location ที่ `p` ชี้อยู่

เครื่องหมาย `*` จึงมีสองหน้าที่ตามตำแหน่งที่ใช้:

```go
x := 10
var p *int = &x // ประกาศว่า p เป็น pointer ที่ชี้ไปยัง int
value := *p      // dereference p เพื่ออ่านค่า int ที่ถูกชี้
```

ในชีวิตจริง pointer เองมีขนาดเท่ากันตามสถาปัตยกรรมของเครื่อง ไม่ว่าจะชี้ไป `int`, `string` หรือ struct ใหญ่แค่ไหน เพราะมันเก็บ address หนึ่งค่า ไม่ได้เก็บข้อมูลทั้งก้อน

> **จำสั้น ๆ:** `&` เดินจาก value ไปหา address ส่วน `*` เดินจาก pointer กลับไปหา value

---

## Step 2: `nil`, `new` และ pointer ของ struct

zero value ของ pointer คือ `nil` หมายความว่าตอนนี้ pointer ยังไม่ได้ชี้ไปยังข้อมูลใด ๆ:

```go
package main

import "fmt"

func main() {
	var p *int

	fmt.Println(p == nil) // true
}
```

การ dereference pointer ที่เป็น `nil` จะทำให้โปรแกรมเกิด **panic** ดังนั้นโค้ดชุดนี้ตั้งใจให้พัง อย่าเอาไปรวมกับโปรแกรมปกติ:

```go
var p *int
fmt.Println(*p) // panic: runtime error: invalid memory address
```

ถ้า pointer อาจเป็น `nil` ให้ตรวจสอบก่อน:

```go
if p != nil {
	fmt.Println(*p)
}
```

### สร้าง pointer ด้วย `new`

`new(T)` เป็น built-in ที่สร้างพื้นที่สำหรับ type `T` ด้วย zero value แล้วคืน pointer กลับมา:

```go
package main

import "fmt"

func main() {
	p := new(int)

	fmt.Println(p == nil) // false
	fmt.Println(*p)       // 0

	*p = 42
	fmt.Println(*p) // 42
}
```

`new(int)` จึงได้ `*int` ที่ชี้ไปยังค่า `0` ไม่ใช่ `nil` แต่ในโค้ด Go ทั่วไปเราใช้ `new` ไม่บ่อยนัก เพราะประกาศตัวแปรแล้วใช้ `&` อ่านง่ายกว่า:

```go
x := 42
p := &x
```

### สร้าง pointer ของ struct

สำหรับ struct รูปแบบที่ใช้บ่อยคือ `&` หน้า struct literal:

```go
package main

import "fmt"

type Person struct {
	Name string
	Age  int
}

func main() {
	p := &Person{
		Name: "Mina",
		Age:  28,
	}

	// Go ยอมให้เขียน p.Name แทน (*p).Name ได้
	fmt.Println(p.Name, p.Age)
}
```

แต่เราไม่สามารถเขียน `&"Mina"` หรือ `&42` ตรง ๆ ได้ เพราะ literal แบบนี้ไม่ได้เป็นตัวแปรที่มี address ให้หยิบมาใช้ ถ้าต้องการ pointer ของ primitive ให้เก็บค่าไว้ในตัวแปรก่อน:

```go
name := "Mina"
person := Person{
	Name: name,
}
namePointer := &name

fmt.Println(*namePointer, person.Name)
```

เรื่องนี้ดูเหมือนจุกจิกนิดหนึ่ง แต่เป็นจุดที่ช่วยย้ำว่า pointer ไม่ได้ชี้ไปที่คำว่า `"Mina"` แบบลอย ๆ มันชี้ไปยังตัวแปรที่มีที่อยู่ใน memory จริง

---

## Step 3: Go copy ทุกอย่างตอนส่งเข้า function

มาถึงหัวใจของบทนี้กันแล้ว: Go เป็น **call-by-value** หมายความว่าเมื่อส่ง argument เข้า function ค่าของมันจะถูก copy ไปเป็น parameter เสมอ ในที่นี้ **argument** คือค่าที่เราใส่ตอนเรียก function ส่วน **parameter** คือตัวแปรที่ประกาศไว้ใน signature เพื่อรับค่านั้น

ลองเริ่มจาก value ธรรมดา:

```go
package main

import "fmt"

func double(n int) {
	n = n * 2
}

func main() {
	n := 10
	double(n)
	fmt.Println(n) // 10
}
```

`n` ใน `double` เป็นคนละตัวกับ `n` ใน `main` แม้มีชื่อเหมือนกัน การเปลี่ยนตัวหนึ่งจึงไม่เปลี่ยนอีกตัวหนึ่ง

struct ก็เหมือนกัน ทั้ง struct ถูก copy เข้าไป:

```go
package main

import "fmt"

type Person struct {
	Name string
}

func rename(person Person) {
	person.Name = "Nina"
}

func main() {
	person := Person{Name: "Mina"}
	rename(person)
	fmt.Println(person.Name) // Mina
}
```

ถ้าอยากเปลี่ยนข้อมูลของ caller ให้ส่ง pointer เข้าไป แต่ต้องแยกให้ออกว่าคุณกำลังเปลี่ยน **pointer copy** หรือกำลังเปลี่ยน **ข้อมูลที่ pointer ชี้อยู่**

### เปลี่ยน pointer copy ไม่ได้เปลี่ยน caller

```go
package main

import "fmt"

func failedUpdate(p *int) {
	value := 20
	p = &value // เปลี่ยน pointer copy ใน function
}

func main() {
	n := 10
	failedUpdate(&n)
	fmt.Println(n) // 10
}
```

ตอนเรียก `failedUpdate(&n)` parameter `p` ได้รับสำเนาของ address ของ `n` การเขียน `p = &value` จึงเปลี่ยนกระดาษโน้ตสำเนาใบนี้เท่านั้น ส่วน pointer ที่ caller มีอยู่ยังชี้ไปที่ `n` เหมือนเดิม

### Dereference แล้วค่อยแก้ข้อมูลต้นทาง

ถ้าต้องการแก้ค่าที่อยู่ใน address นั้น ให้ใช้ `*p`:

```go
package main

import "fmt"

func update(p *int) {
	*p = 20 // เขียนค่าลง memory location ที่ p ชี้อยู่
}

func main() {
	n := 10
	update(&n)
	fmt.Println(n) // 20
}
```

ภาพในหัวจึงเป็นแบบนี้:

| โค้ดใน function | กำลังเปลี่ยนอะไร | caller เห็นผลไหม? |
|---|---|---|
| `p = &other` | pointer copy | ไม่เห็น |
| `*p = value` | ข้อมูลที่ pointer ทั้งสองตัวชี้อยู่ | เห็น |

ถ้า caller ส่ง `nil` เข้าไปก็ยังไม่สามารถทำให้ pointer ของ caller กลายเป็น non-nil ได้ด้วยการ assign parameter ตรง ๆ:

```go
package main

import "fmt"

func makeNonNil(p *int) {
	value := 10
	p = &value
}

func main() {
	var p *int
	makeNonNil(p)
	fmt.Println(p == nil) // true
}
```

ถ้าต้องการเปลี่ยนตัว pointer ของ caller จริง ๆ จะต้องส่ง pointer ซ้อนอีกชั้น เช่น `**int` ซึ่งเป็นเครื่องมือที่มีอยู่ แต่ควรใช้เมื่อ data flow ต้องการแบบนั้นจริง ๆ ไม่ใช่เพิ่ม `*` เพราะรู้สึกว่า pointer ยังไม่พอ

> **หลักจำ:** ส่ง pointer เข้า function ไม่ได้แปลว่า parameter เป็น reference magic มันยังถูก copy อยู่เสมอ เพียงแต่ค่าที่ copy เป็น address ซึ่งพาเราไปแก้ข้อมูลก้อนเดิมได้

---

## Step 4: Pointer คือสัญญาว่า parameter อาจถูกแก้

Go ไม่มี keyword สำหรับประกาศว่า parameter เป็น immutable โดยตรง แต่ signature ของ function สื่อเจตนาได้ดี:

- `func rename(p Person)` บอกว่ function ได้ข้อมูลเป็น value และแก้ `Person` ของ caller ไม่ได้
- `func rename(p *Person)` บอกว่ function อาจแก้ `Person` ที่ caller ส่งมา

นี่ไม่ได้หมายความว่า function ที่รับ pointer ต้องแก้ค่าเสมอ เพียงแต่คนอ่านควรเตรียมใจว่า data อาจเปลี่ยนได้ และผู้เขียนควร document พฤติกรรมให้ชัดเมื่อเป็น public API

ตัวอย่างการเปลี่ยน field ผ่าน pointer:

```go
package main

import "fmt"

type Account struct {
	Name  string
	Active bool
}

func activate(account *Account) {
	if account == nil {
		return
	}
	account.Active = true
}

func main() {
	account := Account{Name: "Mina"}
	activate(&account)
	fmt.Printf("%+v\n", account)
}
```

ผลลัพธ์คือ:

```text
{Name:Mina Active:true}
```

สังเกตว่าเราเขียน `account.Active` ได้เลย แม้ `account` จะเป็น `*Account` Go จะช่วย dereference ให้ใน field access รูปแบบนี้ ถ้าเขียนแบบเต็มจะเป็น `(*account).Active`

### แล้วทำไมไม่ส่ง pointer ไปทุกที่?

เพราะ pointer ทำให้คนอ่านต้องตาม data flow ว่า function ไหนอาจแก้ข้อมูลต้นทาง นอกจากนี้ข้อมูลที่ pointer ชี้อาจต้องไปอยู่บน heap และเพิ่มงานให้ garbage collector อีกด้วย

ดังนั้น default ที่ดีคือ **เริ่มจาก value ก่อน แล้วใช้ pointer เมื่อมีเหตุผลชัดเจน** เช่น:

- function ต้องแก้ state ของ object เดิมจริง ๆ
- ข้อมูลมีขนาดใหญ่มากจนการ copy มีต้นทุนที่วัดได้
- ต้องสื่อ identity ของ object เดิม ไม่ใช่แค่ข้อมูลที่หน้าตาเหมือนกัน
- API หรือ library ที่เราใช้กำหนดให้ส่ง pointer

pointer ไม่ได้ทำให้โค้ด professional ขึ้นโดยอัตโนมัติ บางครั้งการไม่ใช้ pointer ต่างหากที่อ่านง่ายกว่า

---

## Step 5: สร้างและ return value แทนการให้ function เติม pointer

pattern ที่มือใหม่มักเขียนคือสร้าง struct ไว้ข้างนอก แล้วส่ง pointer เข้าไปให้ function เติมค่า:

```go
// ทำได้ แต่ไม่ใช่ default ที่ควรเลือก
func makePerson(person *Person) error {
	person.Name = "Mina"
	person.Age = 28
	return nil
}
```

ถ้า function มีหน้าที่สร้างข้อมูลขึ้นมาเอง การ return value มักตรงไปตรงมากว่า:

```go
package main

import "fmt"

type Person struct {
	Name string
	Age  int
}

func makePerson() (Person, error) {
	person := Person{
		Name: "Mina",
		Age:  28,
	}
	return person, nil
}

func main() {
	person, err := makePerson()
	if err != nil {
		fmt.Println("สร้างข้อมูลไม่สำเร็จ:", err)
		return
	}

	fmt.Printf("%+v\n", person)
}
```

ข้อดีคือ data flow ชัดเจนมาก: function รับอะไรเข้าไป, คำนวณอะไร และคืนอะไรออกมา ไม่มี object ที่ถูกแก้เงียบ ๆ อยู่ข้าง ๆ

### ข้อยกเว้น: `json.Unmarshal`

ข้อยกเว้นที่เจอบ่อยคือ function ที่รับ `interface` หรือ `any` แล้วต้องเขียนข้อมูลลงใน type ที่ caller เลือกเอง เช่น `json.Unmarshal`:

```go
package main

import (
	"encoding/json"
	"fmt"
)

type Person struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func main() {
	var person Person

	err := json.Unmarshal([]byte(`{"name":"Mina","age":28}`), &person)
	if err != nil {
		fmt.Println("อ่าน JSON ไม่สำเร็จ:", err)
		return
	}

	fmt.Printf("%+v\n", person)
}
```

ผลลัพธ์คือ:

```text
{Name:Mina Age:28}
```

ถ้าส่ง `person` โดยไม่มี `&` `json.Unmarshal` จะคืน error เพราะ argument ต้องเป็น non-nil pointer ที่ function ใช้เขียนผลลัพธ์กลับไปยังตัวแปร `person` ใน `main`

เหตุผลที่ `json.Unmarshal` ไม่ return struct ใหม่แบบง่าย ๆ คือมันต้องรองรับ type ที่ caller เลือกเอง และ API รูปแบบนี้มีมาก่อน generics ของ Go นอกจากนี้การ reuse object เดิมใน loop ยังช่วยลดการสร้าง allocation ได้ในบางงาน

แต่เพราะเราเห็น JSON บ่อย อย่าเผลอสรุปว่า "ส่ง pointer เข้าไปให้เติมค่า" เป็นวิธีปกติของทุก function นะ ถ้า function เป็นคนสร้างค่าขึ้นมาเอง ให้ลอง return value ก่อนเสมอ

---

## Step 6: Pointer ไม่ได้เร็วกว่า value เสมอไป

หลายคนพอเห็นว่า pointer เก็บแค่ address ก็รีบสรุปว่า pointer ต้องเร็วกว่า เพราะ copy แค่ 4 หรือ 8 ไบต์ ฟังดูสมเหตุสมผล แต่โลกจริงมีรายละเอียดกว่านั้นเยอะพอสมควร

สำหรับ struct เล็ก ๆ การส่ง value อาจเร็วมาก และ compiler อาจ optimize จนไม่มีการ copy แบบที่เราจินตนาการด้วยซ้ำ ส่วน pointer อาจเพิ่มงานอื่น เช่น:

- ข้อมูลที่ pointer ชี้อาจ escape จาก stack ไปอยู่บน heap
- garbage collector ต้องติดตาม pointer เพิ่ม
- CPU อาจต้องกระโดดไปอ่านข้อมูลคนละตำแหน่งใน memory
- การ dereference ทำให้การเข้าถึงข้อมูลไม่ต่อเนื่องเท่า value ที่อยู่ติดกัน

ถ้า struct ใหญ่มาก การส่ง pointer อาจคุ้มกว่าเพราะไม่ต้อง copy ข้อมูลทั้งก้อน แต่ไม่มีตัวเลขมหัศจรรย์ที่ใช้ได้กับทุกเครื่อง ทุก compiler และทุก workload

กฎใช้งานจริงจึงเป็นแบบนี้:

1. ใช้ value เพราะ data flow เข้าใจง่ายและเป็น default ที่ปลอดภัย
2. ใช้ pointer เมื่อมีเหตุผลด้าน identity, mutability หรือขนาดข้อมูล
3. ถ้าสงสัยเรื่อง performance ให้เขียน benchmark แล้ววัดด้วย `go test -bench=.`

อย่าเปลี่ยนทุก argument เป็น pointer เพียงเพราะกลัวการ copy ก่อนมีตัวเลขมารองรับ นั่นไม่ใช่ performance optimization แต่เป็นการย้ายความซับซ้อนไปให้คนอ่านแทน

---

## Step 7: Zero value กับ no value ไม่ใช่เรื่องเดียวกัน

บางครั้งเราต้องแยกให้ออกว่า field นี้มีค่าเป็น zero จริง ๆ หรือยังไม่ได้รับค่าเลย เช่น อายุ `0` อาจหมายถึงอายุเป็นศูนย์ใน domain หนึ่ง หรืออาจหมายถึงไม่ได้ส่งข้อมูลอายุมาเลยก็ได้

pointer ช่วยแยกสองสถานะนี้ได้:

```go
package main

import "fmt"

type Profile struct {
	Name string
	Age  *int
}

func main() {
	withoutAge := Profile{Name: "Mina"}
	zero := 0
	withZeroAge := Profile{Name: "Nina", Age: &zero}

	fmt.Println(withoutAge.Age == nil)  // true: ไม่มีค่า
	fmt.Println(withZeroAge.Age == nil) // false: มีค่าเป็น 0
	fmt.Println(*withZeroAge.Age)       // 0
}
```

กรณีนี้มีประโยชน์มากเวลาแปลงข้อมูลจาก JSON หรือ external protocol ที่มีแนวคิด nullable field แต่ถ้าเป็นข้อมูลภายในโปรแกรมธรรมดา อย่าใช้ pointer field เพียงเพื่อแทน "ไม่มีค่า" ทุกครั้ง เพราะ pointer จะทำให้ data flow และการจัดการ `nil` ซับซ้อนขึ้น

ทางเลือกที่ชัดเจนกว่าในหลายกรณีคือ return value คู่กับ boolean แบบ comma ok idiom:

```go
package main

import "fmt"

type User struct {
	Name string
}

func findUser(id int) (User, bool) {
	users := map[int]User{
		1: {Name: "Mina"},
	}
	user, ok := users[id]
	return user, ok
}

func main() {
	user, ok := findUser(2)
	if !ok {
		fmt.Println("ไม่พบ user")
		return
	}
	fmt.Println(user.Name)
}
```

เราได้ value ที่เป็น zero value เมื่อไม่พบข้อมูล แต่มี `ok` บอกชัดเจนว่า value นั้น valid หรือไม่ จึงไม่ต้องส่ง `nil` pointer ไปทั่วระบบ

---

## Step 8: ทำไม `map` กับ `slice` ถึงดูเหมือนส่งแบบ reference

ตอนนี้เรามีชิ้นส่วนพอจะไขปริศนาจากตอนที่ 5 แล้ว ทุก type ใน Go ถูกส่งแบบ value แต่ value บางชนิดมีข้อมูลภายในที่อ้างถึง memory ก้อนอื่น

### `map` แชร์ข้อมูลภายใน

เมื่อส่ง map เข้า function จะมีการ copy ค่า map แต่ copy นั้นยังเชื่อมกับข้อมูลภายในชุดเดิมอยู่ ดังนั้นการแก้ entry จึงเห็นจากฝั่ง caller:

```go
package main

import "fmt"

func updateScores(scores map[string]int) {
	scores["go"] = 100
	scores["rust"] = 90
}

func main() {
	scores := map[string]int{"go": 80}
	updateScores(scores)

	fmt.Println(scores["go"])   // 100
	fmt.Println(scores["rust"]) // 90
}
```

อย่าพึ่งพาลำดับ key ตอนวน map เพราะ Go ไม่รับประกัน iteration order ถ้าต้องการตรวจผลให้ถาม key ที่สนใจโดยตรง หรือ sort key ก่อนแสดงผล

### `slice` เป็น header สามช่อง

slice ไม่ใช่ array ทั้งก้อน แต่เป็นค่าขนาดเล็กที่เก็บข้อมูลประมาณนี้:

```go
// conceptual model ไม่ใช่ type ที่เราใช้แทน slice จริง ๆ
type sliceHeader struct {
	data *int
	len  int
	cap  int
}
```

เวลาส่ง slice เข้า function header ทั้งสามช่องถูก copy แต่ `data` ใน header copy ยังชี้ไปยัง **backing array** เดิม จึงเกิดพฤติกรรมสองแบบ:

```go
package main

import "fmt"

func updateSlice(values []int) {
	values[0] = 99 // แก้ข้อมูลใน backing array เดิม
	values = append(values, 4) // เปลี่ยน len ของ slice copy ใน function

	fmt.Println("inside:", values) // [99 2 3 4]
}

func main() {
	values := []int{1, 2, 3}
	updateSlice(values)

	fmt.Println("outside:", values)     // [99 2 3]
	fmt.Println("outside len:", len(values)) // 3
}
```

ผลลัพธ์ฝั่งนอกเห็น `99` เพราะ element อยู่ใน backing array เดิม แต่ไม่เห็น `4` และ length ใหม่ เพราะ `append` เปลี่ยน `len` ใน slice header copy เท่านั้น

ถ้า `append` เกิน capacity เดิม Go จะสร้าง backing array ใหม่ให้ slice copy แล้วคัดลอกข้อมูลไปอยู่ใน array ใหม่ด้วย ยิ่งตอกย้ำว่า caller ไม่ควรเดาว่า `append` ใน function จะขยาย slice ของตัวเอง

ถ้าต้องการให้ caller เห็น slice ที่ขยายแล้ว ให้ return slice กลับมา:

```go
func addItem(values []int, value int) []int {
	return append(values, value)
}

values := []int{1, 2, 3}
values = addItem(values, 4)
fmt.Println(values) // [1 2 3 4]
```

> **สรุปของ map กับ slice:** การแก้ข้อมูลที่ value อ้างถึงอาจเห็นจาก caller แต่การเปลี่ยนตัว value เอง เช่น pointer, length หรือ capacity ของ slice ไม่ได้ย้อนกลับไปเปลี่ยนตัวแปรที่ caller ถืออยู่

---

## Step 9: ใช้ slice เป็น reusable buffer

พฤติกรรมของ slice ที่แก้เนื้อหาได้ แต่เปลี่ยนขนาดของ caller ไม่ได้ มีประโยชน์มากตอนอ่านข้อมูลจาก external resource

ถ้าเรา allocate `[]byte` ใหม่ทุกครั้งใน loop โปรแกรมจะสร้าง object ชั่วคราวจำนวนมาก ทั้งที่จริงเราใช้ buffer เดิมซ้ำได้:

```go
package main

import (
	"errors"
	"fmt"
	"io"
	"strings"
)

func main() {
	reader := strings.NewReader("Go pointers are values too")
	buffer := make([]byte, 8)

	for {
		count, err := reader.Read(buffer)
		if count > 0 {
			// data ใน buffer จะถูกเขียนทับในรอบถัดไป
			fmt.Printf("%q\n", buffer[:count])
		}

		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			panic(err)
		}
	}
}
```

ผลลัพธ์จะถูกแบ่งเป็นชิ้นละไม่เกิน 8 byte เช่น:

```text
"Go point"
"ers are "
"values t"
"oo"
```

ประเด็นสำคัญคือ `reader.Read(buffer)` แก้ **เนื้อหา** ใน backing array เดิม แล้วคืนจำนวน byte ที่อ่านได้ เราจึงส่งเฉพาะส่วนที่มีข้อมูลจริงด้วย `buffer[:count]`

ถ้า function ที่รับ `buffer[:count]` จะเก็บข้อมูลไว้ใช้หลังจากรอบนี้ ต้อง copy ข้อมูลออกมาก่อน เพราะรอบถัดไปจะเขียนทับ buffer เดิม แต่ถ้า process ให้เสร็จภายใน function เดียวกัน reusable buffer จะช่วยลด allocation และลดงานของ GC ได้มาก

รูปแบบเดียวกันนี้ใช้กับไฟล์ได้:

```go
file, err := os.Open("data.txt")
if err != nil {
	return err
}
defer file.Close()

buffer := make([]byte, 4096)
for {
	count, err := file.Read(buffer)
	if count > 0 {
		process(buffer[:count])
	}
	if err != nil {
		if errors.Is(err, io.EOF) {
			break
		}
		return err
	}
}
```

ตัวอย่างหลังนี้เป็น fragment ที่ต้องอยู่ใน function ซึ่ง return `error` และต้อง import `os` เพิ่ม อย่าวางเดี่ยว ๆ ใน `main.go` แล้วคาดว่าจะ compile ผ่านทันที

---

## Step 10: Stack, heap และ escape analysis

pointer ไม่ได้มีไว้แค่แก้ค่า ยังโยงไปถึงคำถามว่า data ถูกเก็บที่ไหนใน memory ด้วย

### Stack คือพื้นที่ชั่วคราวของ function

เมื่อ function ถูกเรียก จะมีพื้นที่สำหรับ parameter และ local variable ที่เรียกว่า **stack frame** พอ function จบพื้นที่ของ frame ก็ถูกเลื่อนคืนอย่างรวดเร็ว ไม่ต้องรอให้ GC มาตามคืนพื้นที่ทีละ object

ข้อมูลที่ขนาดรู้แน่นอนตอน compile เช่น primitive, array และ struct มักเหมาะกับ stack แต่ compiler ต้องพิสูจน์ก่อนว่าไม่มีใครต้องใช้ข้อมูลนั้นหลัง function จบ

### Heap คือพื้นที่ที่ต้องให้ GC ดูแล

ถ้า pointer ต้องถูกใช้งานหลัง function ที่สร้างข้อมูลจบ compiler มักต้องเก็บข้อมูลนั้นบน heap ตัวอย่างเช่น function นี้ return pointer ของ local variable:

```go
package main

import "fmt"

type Person struct {
	Name string
}

func makePerson(name string) *Person {
	person := Person{Name: name}
	return &person
}

func main() {
	person := makePerson("Mina")
	fmt.Println(person.Name)
}
```

ในภาษาอย่าง C การ return address ของ local variable อาจทำให้ pointer ชี้ไปยัง memory ที่หมดอายุแล้ว แต่ Go compiler จะดูจากการใช้งานและย้าย `person` ไป heap เมื่อจำเป็น จึงปลอดภัยกว่า แม้จะไม่ได้แปลว่าไม่มีต้นทุน

ลองดูสิ่งที่ compiler วิเคราะห์ได้ด้วยคำสั่งนี้:

```sh
go build -gcflags="-m" .
```

compiler จะพิมพ์ข้อมูลเกี่ยวกับการ inline และการ **escape analysis** ว่าค่าใดอาจ escape ไป heap ผลลัพธ์ขึ้นกับ Go version, code ที่เขียน และ optimization จึงอย่าจำ output เป็นตัวเลขตายตัว

สิ่งที่ควรจำมีแค่นี้:

- pointer ที่ถูกเก็บบน stack ไม่ได้แปลว่าข้อมูลที่มันชี้อยู่ต้องอยู่บน stack เสมอ
- การ return pointer ของ local variable ไม่ได้เป็น dangling pointer ใน Go เพราะ compiler จัดการให้
- pointer ไม่ได้ทำให้ allocation หายไปโดยอัตโนมัติ บางครั้งกลับทำให้ค่าหนีไป heap
- อย่า optimize เรื่อง stack/heap จากการเดา ให้เริ่มจาก profile และ benchmark

### ทำไม heap และ garbage ถึงมีต้นทุน?

**garbage** คือข้อมูลที่ไม่มี pointer ใดตามไปถึงแล้ว GC จึงสามารถนำพื้นที่กลับมาใช้ใหม่ได้ ยิ่งโปรแกรมสร้างข้อมูลชั่วคราวเยอะ GC ก็ต้องทำงานมากขึ้นเพื่อค้นหาและเก็บข้อมูลเหล่านั้น

Go มี garbage collector เพื่อไม่ให้คนต้องจัดการ memory เอง แต่มี GC ไม่ได้แปลว่าเราควรสร้าง garbage ไม่จำกัด การลด allocation ที่ไม่จำเป็น เช่น reuse buffer จึงเป็นแนวทางที่ดีตั้งแต่ต้น

---

## Step 11: Mechanical sympathy — ให้ data เข้ากับ hardware

CPU อ่านข้อมูลที่อยู่ติดกันได้ดีมากกว่าการกระโดดไปอ่าน address กระจัดกระจาย แม้ RAM จะถูกเรียกว่า random access แต่การอ่านแบบ sequential มักใช้ cache ของ CPU ได้คุ้มกว่า

ลองนึกถึงข้อมูลคน 1,000 คนสองแบบ:

```go
type Person struct {
	ID    int
	Score int
}

values := make([]Person, 1000)

pointers := make([]*Person, 1000)
for i := range pointers {
	pointers[i] = &Person{ID: i}
}
```

`values` เก็บ struct เรียงต่อกันใน backing array เดียว ส่วน `pointers` เก็บ address เรียงกันก็จริง แต่แต่ละ address อาจชี้ไปยัง `Person` ที่อยู่คนละตำแหน่งใน heap การวนอ่าน `pointers` จึงต้องกระโดดตาม pointer ไปอีกทอดหนึ่ง

แนวคิดการเขียนโค้ดโดยเข้าใจพฤติกรรมของ hardware เรียกว่า **mechanical sympathy** ยืมคำมาจากวงการแข่งรถ: คนขับที่เข้าใจเครื่องยนต์จะรีดประสิทธิภาพได้ดีขึ้น ในโปรแกรมก็เหมือนกัน ถ้า data อยู่ติดกัน CPU จะมีโอกาสอ่านได้เร็วกว่า

แต่อย่าแปลว่า slice ของ value ดีทุกสถานการณ์ slice ของ pointer ก็มีเหตุผลของมัน เช่น:

- object มีขนาดใหญ่มากและไม่อยาก copy ทั้งก้อน
- object ต้องมี identity เดิมที่หลายส่วนอ้างถึงร่วมกัน
- object มี lifecycle หรือ state ที่ต้องแก้ร่วมกัน
- การย้าย object ใน slice ไม่ควรทำให้ reference สำคัญเปลี่ยน

ให้เลือกจาก behavior ที่ต้องการก่อน แล้วค่อยวัด performance ของ workload จริง อย่าเอาคำว่า mechanical sympathy มาเป็นข้ออ้างทำให้โค้ดอ่านยากขึ้น

> **Best practice ที่ดีมักได้ performance พื้นฐานมาด้วย:** ใช้ value เมื่อเหมาะสม, เก็บข้อมูลให้ต่อเนื่อง และสร้าง garbage ให้น้อยตั้งแต่ต้น

---

## Step 12: ปรับจังหวะ GC ด้วย `GOGC` และ `GOMEMLIMIT`

โดยปกติ Go จะปล่อยให้ heap มี garbage สะสมอยู่ระดับหนึ่งก่อนเริ่ม collection รอบใหม่ เพราะถ้าเรียก GC ทุกครั้งที่ object หมดประโยชน์ โปรแกรมจะเสียเวลาไปกับการเก็บขยะมากกว่าทำงานจริง

### `GOGC`

`GOGC` คุมว่า heap ควรโตขึ้นประมาณเท่าไรก่อน trigger GC รอบถัดไป ค่า default คือ `100` ซึ่งคิดแบบคร่าว ๆ ได้ว่า:

```text
target heap = current heap + current heap * GOGC / 100
```

ถ้า heap หลัง collection ปัจจุบันมีขนาด 100 MB และใช้ `GOGC=100` target รอบถัดไปจะอยู่ราว 200 MB:

```sh
GOGC=100 go run .
GOGC=50 go run .
GOGC=200 go run .
```

- ค่าต่ำลง: heap โตน้อยลง, GC ทำงานถี่ขึ้น, ใช้ memory น้อยลงโดยประมาณ
- ค่าสูงขึ้น: GC ทำงานห่างขึ้น, ใช้ CPU กับ GC น้อยลงโดยประมาณ, แต่ heap อาจใหญ่ขึ้น
- `GOGC=off`: ปิด GC ซึ่งเหมาะเฉพาะงานที่ควบคุมอายุโปรแกรมและ memory ได้จริง ไม่ใช่ปุ่ม turbo ที่กดได้ทุก production service

การเปลี่ยน `GOGC` ไม่ได้แก้ allocation ที่ไม่จำเป็น ถ้า loop สร้าง object ใหม่มหาศาลทุกครั้ง เราควรแก้ pattern ก่อนค่อยจูน runtime

### `GOMEMLIMIT`

`GOMEMLIMIT` กำหนดเพดาน memory โดยประมาณที่ Go runtime ควรพยายามรักษาไว้ เช่น:

```sh
GOMEMLIMIT=512MiB go run .
```

หน่วยที่ใช้ได้มี `B`, `KiB`, `MiB`, `GiB` และ `TiB` โดย `MiB` เป็นหน่วยฐานสอง (`2^20`) ไม่ใช่ `MB` ฐานสิบ

การตั้งเพดานช่วยใน container หรือ VM ที่มี memory จำกัด เพราะถ้า heap โตจนเครื่องเริ่ม swap หรือถูก OOM killer จัดการ ความเร็วจะตกแบบไม่ต้องลุ้นเลย แต่ `GOMEMLIMIT` เป็น **soft limit** ไม่ใช่กำแพงแข็ง โปรแกรมอาจเกินได้ในบางสถานการณ์

อย่าตั้ง limit เท่ากับ memory สูงสุดของเครื่องแบบพอดีเกินไป ควรเหลือ buffer ให้ runtime และ process อื่น ๆ ด้วย ถ้าตั้งต่ำเกินไป GC อาจวิ่งถี่จนเกิด **thrashing** คือโปรแกรมใช้เวลาส่วนใหญ่เก็บ garbage แต่แทบไม่ได้ทำงานจริง

โดยทั่วไปให้ใช้ `GOGC` กับ `GOMEMLIMIT` ประกอบกัน และวัดจาก metric จริง ไม่ใช่คัดค่าจาก blog ของคนอื่นมาวางแล้วหวังว่า latency จะดีขึ้นทันที

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดเฉลยก่อน:

1. สร้าง struct `Person` ที่มี `FirstName`, `LastName` เป็น `string` และ `Age` เป็น `int` เขียน `MakePerson` ให้ return `Person` และ `MakePersonPointer` ให้ return `*Person` จากนั้นเรียกทั้งคู่จาก `main` แล้วรัน `go build -gcflags="-m" .` สังเกตว่า compiler รายงานค่าใด escape ไป heap
2. เขียน `UpdateSlice([]string, string)` ให้เปลี่ยน element ตำแหน่งสุดท้ายของ slice แล้วพิมพ์ผลใน function จากนั้นเขียน `GrowSlice([]string, string) []string` ให้ append ข้อมูลและ return slice ใหม่กลับมา เรียกทั้งคู่จาก `main` แล้วพิมพ์ slice ก่อนและหลัง
3. สร้าง reusable buffer ขนาด 16 byte อ่านข้อมูลจาก `strings.NewReader` ทีละชิ้น และเขียน function `process([]byte)` ที่พิมพ์จำนวน byte กับข้อความของชิ้นนั้น ห้ามสร้าง `[]byte` ใหม่ในทุก iteration
4. สร้าง `[]Person` จำนวน 10,000 รายการและ `[]*Person` จำนวนเท่ากัน เขียน benchmark เปรียบเทียบการวนรวม `Score` แล้วอย่าสรุปผลจนกว่าจะรันบนเครื่องของตัวเอง
5. ทดลองรันโปรแกรม benchmark หรือโปรแกรมที่สร้าง allocation ด้วย `GOGC=50`, `GOGC=200` และ `GOMEMLIMIT=512MiB` แล้วบันทึกว่าเวลา, memory usage และจำนวนรอบ GC เปลี่ยนอย่างไร

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **dereference `nil` pointer** — `*p` เมื่อ `p == nil` จะ panic ตรวจ `p != nil` ก่อน หรือออกแบบ API ให้ไม่ส่ง nil มา
- **คิดว่าส่ง `nil` pointer เข้า function แล้วทำให้ pointer ของ caller เป็น non-nil ได้** — ไม่ได้ เพราะ parameter เป็น copy ของ address
- **เขียน `p = &value` แล้วคาดว่า caller จะเปลี่ยน** — เปลี่ยนแค่ pointer copy ถ้าต้องการแก้ข้อมูลเดิมให้เขียน `*p = value`
- **ส่ง pointer เข้าไปทุก function** — เริ่มจาก value ก่อน ใช้ pointer เมื่อจำเป็นด้าน mutability, identity, ขนาดข้อมูล หรือ API
- **ใช้ pointer เป็น output parameter ทั้งที่ function สร้างค่าเอง** — พิจารณาให้ function return value เพื่อให้ data flow ชัดเจน
- **ลืม `&` ตอนเรียก `json.Unmarshal`** — ต้องส่ง pointer เพื่อให้ function เขียนผลลัพธ์กลับไปยังตัวแปรของ caller
- **คิดว่า `map` และ `slice` ถูกส่งแบบ reference** — ทุก type ถูกส่งแบบ value แต่ map/slice value ยังอ้างถึงข้อมูลภายในชุดเดิม
- **append ใน function แล้วคาดว่า length ของ caller จะเพิ่ม** — length ใน slice header ถูกเปลี่ยนเฉพาะ copy ให้ return slice แล้ว assign กลับ
- **เก็บ `buffer[:count]` ไว้ใช้หลังอ่านรอบถัดไป** — buffer เดิมจะถูกเขียนทับ ต้อง copy ข้อมูลออกมาก่อน
- **คิดว่าใช้ pointer แล้วเร็วกว่าเสมอ** — pointer อาจทำให้ข้อมูล escape ไป heap และทำให้ cache locality แย่ลง benchmark ก่อนสรุป
- **ตั้ง `GOGC=off` เป็นค่า production โดยไม่วัด memory** — โปรแกรม long-running อาจใช้ memory จนหมดเครื่อง
- **ตั้ง `GOMEMLIMIT` เท่ากับ RAM สูงสุดพอดี** — ควรเหลือ buffer ไม่เช่นนั้นอาจเกิด thrashing หรือแย่ง memory กับ process อื่น

---

## สรุป

1. pointer คือค่าที่เก็บ address ของข้อมูลอื่น ใช้ `&` เพื่อขอ address และ `*` เพื่อ dereference อ่านหรือแก้ค่าที่ถูกชี้
2. zero value ของ pointer คือ `nil` และการ dereference `nil` จะ panic ส่วน `new(T)` สร้าง pointer ไปยัง zero value ของ `T`
3. Go เป็น call-by-value เสมอ แม้ส่ง pointer เข้า function ก็เป็นการ copy address เข้าไป
4. `p = &value` เปลี่ยน pointer copy แต่ `*p = value` แก้ข้อมูลใน memory location ที่ pointer ชี้อยู่
5. ใช้ value เป็น default และใช้ pointer เมื่อ function ต้องแก้ state, ต้องรักษา identity, ข้อมูลใหญ่จริง หรือ API กำหนดให้ใช้
6. ถ้า function เป็นคนสร้างข้อมูลเอง ให้พิจารณา return value แทนการส่ง pointer เข้าไปให้เติมค่า ข้อยกเว้นที่พบบ่อยคือ `json.Unmarshal`
7. pointer field ช่วยแยก zero value ออกจาก no value ได้ แต่ในข้อมูลภายในทั่วไป value คู่กับ boolean อาจอ่านง่ายกว่า
8. `map` และ `slice` ถูก copy ตอนส่งเข้า function แต่ยังเชื่อมกับข้อมูลเดิม จึงแก้ element ได้ ส่วนการเปลี่ยน slice length ต้อง return slice กลับมา
9. reusable buffer ช่วยลด allocation ตอนอ่าน I/O แต่ข้อมูลใน buffer จะถูกเขียนทับในรอบถัดไป
10. stack เร็วและมีอายุผูกกับ function ส่วน heap ถูก GC ดูแล และ escape analysis ของ compiler เป็นคนตัดสินใจว่าค่าใดต้องย้ายไป heap
11. slice ของ value มักได้ประโยชน์จากข้อมูลที่เรียงต่อกันใน memory แต่ slice ของ pointer ก็เหมาะเมื่อ object ใหญ่หรือมี identity ที่ต้องแชร์
12. `GOGC` และ `GOMEMLIMIT` เป็นเครื่องมือจูน runtime ไม่ใช่ยารักษา allocation ที่ออกแบบมาไม่ดี

pointer เป็นเครื่องหมายเล็ก ๆ แต่เปลี่ยนคำถามของคนอ่านจาก "function นี้รับข้อมูลอะไร" เป็น "function นี้อาจแก้ข้อมูลของฉันไหม" เพราะฉะนั้นใช้ให้พอดีและทำให้เจตนาชัดที่สุด

> *ตอนถัดไปจะต่อด้วย methods, interfaces และ types ของ Go — จากข้อมูลที่มีพฤติกรรม ไปสู่การออกแบบ abstraction ที่ใช้กับ type ต่าง ๆ ได้*

---

## Glossary

- **Pointer** — ค่าที่เก็บ address ของข้อมูลอื่น
- **Address** — ตำแหน่งที่ข้อมูลถูกเก็บอยู่ใน memory
- **Address operator (`&`)** — operator ที่คืน address ของตัวแปรหรือข้อมูลที่มี address
- **Indirection / Dereference (`*`)** — การตาม pointer ไปอ่านหรือเขียนค่าที่ถูกชี้อยู่
- **`nil` pointer** — pointer ที่ยังไม่ชี้ไปยังข้อมูลใด ๆ; การ dereference จะ panic
- **Call-by-value** — การส่งค่าที่ copy ค่าไปเป็น parameter ทุกครั้งเมื่อเรียก function
- **Mutable** — ข้อมูลที่สามารถถูกแก้ไขได้หลังสร้างขึ้น
- **`new(T)`** — built-in ที่สร้าง pointer ไปยัง zero value ของ type `T`
- **Backing array** — array จริงที่เก็บ element เบื้องหลัง slice
- **Slice header** — model เชิงแนวคิดของ slice ที่มี pointer ไปยังข้อมูล, length และ capacity
- **Reusable buffer** — buffer ที่สร้างครั้งเดียวแล้วนำกลับมาใช้ซ้ำหลายรอบเพื่อลด allocation
- **Stack** — พื้นที่ memory สำหรับ call frame และข้อมูลอายุสั้นของ function
- **Heap** — พื้นที่ memory ที่ runtime จัดการและ GC ติดตาม
- **Garbage collector (GC)** — runtime component ที่ค้นหาและคืนพื้นที่ของข้อมูลที่ไม่มี pointer อ้างถึงแล้ว
- **Escape analysis** — การวิเคราะห์ของ compiler ว่าข้อมูลต้องมีชีวิตอยู่นานกว่า scope เดิมจนต้องย้ายไป heap หรือไม่
- **Mechanical sympathy** — การออกแบบโค้ดโดยเข้าใจพฤติกรรมของ hardware เช่น cache และการอ่านข้อมูลที่เรียงต่อกัน
- **`GOGC`** — environment variable ที่ควบคุมจังหวะการ trigger garbage collection
- **`GOMEMLIMIT`** — soft memory limit ที่ใช้ช่วยควบคุม memory ของ Go runtime
- **Thrashing** — ภาวะที่โปรแกรมใช้เวลาส่วนใหญ่ทำงานซ้ำ ๆ เช่น GC จนแทบไม่ได้ทำงานหลัก

---

## Related

- [ตอนที่ 5: Functions](/go/05-functions/) — กฎ call-by-value, `map`, `slice` และ `defer` ที่เป็นพื้นฐานของบทนี้
- [ตอนที่ 4: Blocks, Shadows, and Control Structures](/go/04-blocks-shadows-and-control-structures/) — scope และ shadowing ที่ต้องระวังเมื่อทำงานกับ pointer และ named value
- [ตอนที่ 3: Composite Types](/go/03-composite-types/) — array, slice, map และ struct ที่บทนี้เปิดดูพฤติกรรมภายในมากขึ้น
- ตอนถัดไป — methods, interfaces และ types ของ Go
