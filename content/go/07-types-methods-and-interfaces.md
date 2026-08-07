+++
title = 'ตอนที่ 7: Types, Methods, and Interfaces'
date = '2026-08-07T00:00:00+07:00'
draft = false
description = 'นิยาม user-defined type, ผูก method ด้วย value หรือ pointer receiver, ใช้ embedding และ implicit interface เพื่อออกแบบโค้ดที่ยืดหยุ่นและทดสอบง่าย'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราคุยกันว่า Go เป็น **call-by-value** เสมอ และ pointer ช่วยให้เราแก้ข้อมูลก้อนเดิมได้อย่างไร

แต่พอโปรแกรมเริ่มใหญ่ขึ้น คำถามถัดไปก็มักโผล่มาเอง: ถ้าเรามีข้อมูลกับ behavior ที่ทำงานกับข้อมูลนั้น เราควรจัดวางมันไว้ตรงไหน? แล้วถ้าอยากสลับ implementation โดยไม่ต้องแก้ business logic ทั้งก้อนล่ะ?

บทนี้จะพาเราจาก `struct` ธรรมดาไปสู่ `type`, `method` และ `interface` แบบ Go โดยเริ่มจากโค้ดเล็ก ๆ แล้วค่อยต่อเป็น dependency injection ที่ไม่ต้องใช้ framework ใด ๆ

สิ่งที่จะได้ตอนจบบทนี้:

- นิยาม user-defined type จาก `int`, `map`, `func` และ type อื่นเพื่อให้โค้ดสื่อความหมายขึ้น
- เขียน method และเลือก value receiver หรือ pointer receiver ให้ตรงกับ behavior
- อธิบาย `method set`, method value และ method expression ได้
- แยกให้ออกว่า type declaration ไม่ใช่ inheritance
- ใช้ `iota` ทำ enum ภายในโปรแกรมโดยไม่ผูกกับค่าภายนอกแบบเปราะ ๆ
- ใช้ embedding เพื่อทำ composition และเข้าใจ field/method promotion
- สร้าง interface ขนาดเล็กที่ client เป็นเจ้าของ และใช้ implicit interface ของ Go
- ใช้หลัก `Accept interfaces, return structs` พร้อมทำ dependency injection ด้วยมือ
- ใช้ function type เป็น adapter ให้ function ทำตาม interface ได้
- ใช้ `any`, type assertion และ type switch อย่างปลอดภัย
- ระวัง interface ที่เก็บ typed nil และ interface ที่เทียบแล้วอาจ panic

{{< mermaid >}}
graph TD
  A[User-defined types] --> B[Methods]
  B --> C{เลือก receiver}
  C -->|ไม่แก้ state| D[Value receiver]
  C -->|แก้ state หรือรองรับ nil| E[Pointer receiver]
  B --> F[Method set]
  F --> G[Implicit interface]
  A --> H[Embedding]
  H --> I[Composition ไม่ใช่ inheritance]
  G --> J[Accept interfaces]
  J --> K[Dependency injection]
  G --> L[any / assertion / switch]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-types-methods` เพื่อทดลองโค้ด โดยไม่กระทบ project จากตอนก่อน เปิด terminal แล้วรัน:

```sh
mkdir go-types-methods
cd go-types-methods
go mod init go-types-methods
touch main.go
```

ในแต่ละ step ให้แทนที่โค้ดใน `main.go` ด้วยตัวอย่างของ step นั้น แล้วรัน:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านหรือ panic จะแยกออกจากโค้ดที่รันได้ และมีคำอธิบายกำกับไว้ อย่าวางตัวอย่างเหล่านั้นรวมกับโปรแกรมปกติ

---

## Step 1: User-defined type — ตั้งชื่อให้ concept

เรารู้จัก `int`, `string`, `map` และ `func` กันอยู่แล้ว แต่บางครั้งการใช้ type พื้นฐานตรง ๆ ทำให้โค้ดบอกความหมายไม่พอ เช่น function รับ `int` หนึ่งตัว เราจะรู้ได้อย่างไรว่ามันคือคะแนน, อายุ หรือจำนวนเงิน?

Go ให้เราสร้าง **user-defined type** โดยใช้ `type` ตั้งชื่อให้ underlying type เดิมได้ ไม่ได้จำกัดแค่ `struct`:

```go
package main

import "fmt"

type Score int
type Converter func(string) Score
type TeamScores map[string]Score

func main() {
	rawScore := 80
	score := Score(rawScore)

	scores := TeamScores{
		"Mina": score,
	}

	fmt.Println(score + 10)
	fmt.Println(scores["Mina"])
}
```

ผลลัพธ์คือ:

```text
90
80
```

`Score` ยังเก็บข้อมูลแบบ `int` อยู่ แต่ตอนนี้ชื่อ type บอกเจตนาว่าค่านี้คือคะแนน ส่วน `TeamScores` บอกชัดว่า map นี้เก็บคะแนนของแต่ละทีม และ `Converter` ก็บอกว่า function นี้มีหน้าที่แปลง string ไปเป็น `Score`

User-defined type ไม่ใช่ alias ของ type เดิมแบบที่ assign ข้ามกันได้อัตโนมัติ ลองแยกตัวอย่างนี้ไว้ดูเฉย ๆ อย่านำไปรวมกับ `main.go`:

```go
var raw int = 100
var score Score

score = raw       // compile error: int กับ Score เป็นคนละ type
score = Score(raw) // conversion แบบ explicit จึงใช้ได้
```

นี่เป็นข้อดีมากกว่าข้อเสีย เพราะ compiler ช่วยกันไม่ให้เราเอาค่าคนละความหมายมาปนกันง่าย ๆ

> **Type คือ executable documentation:** ชื่อ `Score` ทำให้คนอ่านและ compiler รู้ว่าค่า `int` ก้อนนี้มีความหมายเฉพาะ ไม่ใช่ตัวเลขอะไรก็ได้

ใน Go ทุก type แบ่งมองได้ง่าย ๆ เป็นสองกลุ่ม:

- **Concrete type** — บอกทั้งข้อมูลเก็บอย่างไรและทำอะไรได้ เช่น `struct`, `int` หรือ `Score`
- **Abstract type** — บอกแค่ว่าทำอะไรได้ โดยไม่สนว่าข้างในทำอย่างไร ซึ่งก็คือ `interface`

เราจะเริ่มผูก behavior ให้ concrete type ใน step ถัดไป

---

## Step 2: Method — function ที่ผูกกับ type

ตอนนี้เรามี `Person` แล้ว แต่ถ้าอยากให้ `Person` อธิบายตัวเองได้ เราสามารถเขียน method แทนการส่ง `Person` เข้า function ทุกครั้ง:

```go
package main

import "fmt"

type Person struct {
	FirstName string
	LastName  string
	Age       int
}

func (p Person) String() string {
	return fmt.Sprintf("%s %s, age %d", p.FirstName, p.LastName, p.Age)
}

func main() {
	person := Person{
		FirstName: "Mina",
		LastName:  "Wong",
		Age:       28,
	}

	fmt.Println(person.String())
}
```

ส่วน `(p Person)` ที่อยู่ระหว่าง `func` กับชื่อ `String` เรียกว่า **receiver** เป็นตัวบอกว่า method นี้ผูกกับ `Person` และใช้ตัวแปรชื่อ `p` อ่านข้อมูลข้างใน

หน้าตาของ method เทียบกับ function ได้แบบนี้:

| ประเด็น | Method | Function |
|---|---|---|
| มี receiver ไหม | มี เช่น `(p Person)` | ไม่มี |
| ประกาศที่ไหน | package block | block ใดก็ได้ที่ Go อนุญาต |
| ผูกกับ type ไหม | ผูกกับ type | ไม่ผูกกับ type |
| อยู่ package ไหน | ต้องเป็น package เดียวกับ type | อยู่ package ใดก็ได้ตาม visibility |

ชื่อ receiver มักใช้ตัวอักษรแรกของ type เช่น `p` สำหรับ `Person`, `c` สำหรับ `Counter` ไม่จำเป็นต้องใช้ `this` หรือ `self` แบบบางภาษา

ข้อจำกัดที่ควรจำคือ เราเพิ่ม method ให้ type ที่ประกาศอยู่ใน package เดียวกันเท่านั้น เราไม่สามารถไปเพิ่ม method ให้ `string` หรือ type จาก package อื่นใน package ของเราได้

ถ้า logic ใช้ state ของ object หรือทำให้ object ทำบางอย่าง method มักอ่านง่ายกว่า แต่ถ้า logic ใช้แค่ input ที่ส่งเข้ามาและไม่เกี่ยวกับ state ของ type นั้น function อาจเหมาะกว่า

อย่ารีบสร้าง getter/setter ให้ทุก field เพราะ Go เปิดให้เข้าถึง field ได้ตรง ๆ อยู่แล้ว เก็บ method ไว้สำหรับ business operation เช่น `Increment` ที่อัปเดตหลาย field พร้อมกันจะคุ้มกว่า

---

## Step 3: Value receiver หรือ pointer receiver?

receiver ใช้กฎเดียวกับ pointer parameter จากตอนที่แล้วเลย:

- ถ้า method ต้องแก้ state ของ receiver ให้ใช้ pointer receiver
- ถ้า method ต้องรองรับ `nil` ให้ใช้ pointer receiver
- ถ้า method อ่านข้อมูลอย่างเดียว value receiver ก็ใช้ได้

ลองดู type เดียวที่มี receiver สองแบบ:

```go
package main

import "fmt"

type Counter struct {
	total int
}

func (c *Counter) Increment() {
	if c == nil {
		return
	}
	c.total++
}

func (c Counter) String() string {
	return fmt.Sprintf("total: %d", c.total)
}

func updateWrong(c Counter) {
	c.Increment() // แก้ Counter ที่เป็น copy ใน function
}

func updateRight(c *Counter) {
	c.Increment() // แก้ Counter ตัวเดิม
}

func main() {
	counter := Counter{}
	counter.Increment()
	fmt.Println(counter.String())

	updateWrong(counter)
	fmt.Println("after updateWrong:", counter.total)

	updateRight(&counter)
	fmt.Println("after updateRight:", counter.total)
}
```

ผลลัพธ์คือ:

```text
total: 1
after updateWrong: 1
after updateRight: 2
```

ตอนเรียก `counter.Increment()` Go ช่วยแปลงให้คล้าย `(&counter).Increment()` เพราะ `counter` เป็นตัวแปรที่มี address ให้หยิบใช้ได้ ส่วนตอน `updateWrong(counter)` function ได้ `Counter` copy ไป จึงแก้แค่ copy นั้น

ในทางกลับกัน `counter.String()` ใช้ value receiver จึงอ่านค่าได้ทั้งจาก value และ pointer เพราะ Go ช่วย dereference pointer ให้เมื่อเรียก method โดยตรง

### Method set สำคัญกว่าที่เห็น

กฎที่ต้องจำไว้สำหรับตอนพูดเรื่อง interface คือ:

- method set ของ **value** มีเฉพาะ method ที่ใช้ value receiver
- method set ของ **pointer** มีทั้ง method ที่ใช้ pointer receiver และ value receiver

ดังนั้นถ้า type มี pointer receiver สัก method แล้วเราตั้งใจให้ type นี้ใช้เป็น interface ให้ถือว่าใช้ pointer เป็นหลักทั้งก้อนจะสม่ำเสมอกว่า แม้บาง method จะไม่ได้แก้ state ก็ตาม

> ⚠️ การเรียก method โดยตรงอาจมี automatic address/dereference ให้ แต่ตอน assign ค่าเข้า interface compiler จะตรวจ method set ตามจริง ไม่ได้หยิบ address ของ value มาเติมให้ทุกกรณี

---

## Step 4: Pointer receiver กับ `nil`

pointer receiver ไม่ได้แปลว่าต้อง panic เมื่อเจอ `nil` เราสามารถออกแบบ method ให้ `nil` เป็นสถานะที่มีความหมายได้:

```go
package main

import "fmt"

type User struct {
	Name string
}

func (u *User) DisplayName() string {
	if u == nil {
		return "anonymous"
	}
	return u.Name
}

func main() {
	var user *User
	fmt.Println(user.DisplayName())

	user = &User{Name: "Mina"}
	fmt.Println(user.DisplayName())
}
```

ผลลัพธ์คือ:

```text
anonymous
Mina
```

method `DisplayName` เช็ค `u == nil` ก่อน จึงเรียกผ่าน nil pointer ได้อย่างปลอดภัย แต่ถ้า method ไปอ่าน `u.Name` ก่อนเช็ค ก็จะ panic ตามปกติ

ส่วน value receiver ไม่สามารถตรวจ `nil` ของ receiver ได้ เพราะมันต้องมี value ให้ copy ก่อน ลองจินตนาการโค้ดนี้เป็นตัวอย่างที่ตั้งใจให้ panic:

```go
type ValueUser struct {
	Name string
}

func (u ValueUser) DisplayName() string {
	return u.Name
}

var user *ValueUser
fmt.Println(user.DisplayName()) // compile ผ่าน แต่ panic ตอน runtime
```

อีกจุดที่ต่อเนื่องจากตอน pointer คือ receiver เองก็เป็น copy ของ pointer เช่นกัน ถ้าเขียน `u = &User{}` ข้างใน method เราจะเปลี่ยนแค่ pointer copy ไม่ได้ทำให้ pointer ของ caller ที่เคยเป็น `nil` กลายเป็น non-nil

---

## Step 5: Method ก็เป็น function ได้

method ใน Go สามารถใช้ตรงที่ต้องการ function ได้สองรูปแบบที่ชื่อคล้ายกันแต่หน้าตาต่างกัน:

```go
package main

import "fmt"

type Adder struct {
	start int
}

func (a Adder) AddTo(value int) int {
	return a.start + value
}

func main() {
	myAdder := Adder{start: 10}

	methodValue := myAdder.AddTo
	methodExpression := Adder.AddTo

	fmt.Println(methodValue(5))
	fmt.Println(methodExpression(myAdder, 15))
}
```

ผลลัพธ์คือ:

```text
15
25
```

ความต่างคือ:

- **Method value**: `myAdder.AddTo` ผูก receiver `myAdder` ไว้แล้ว จึงเหลือ signature เป็น `func(int) int` ทำตัวคล้าย closure ที่จำ state ของ instance
- **Method expression**: `Adder.AddTo` ยังไม่ผูก instance และเปลี่ยน receiver ให้เป็น parameter ตัวแรก จึงเรียกด้วย `methodExpression(myAdder, 15)`

จำง่าย ๆ ว่า `instance.Method` คือ method ที่จับ instance ไว้แล้ว ส่วน `Type.Method` คือ function ที่ให้เราใส่ instance เอง

ถ้า logic ของ function ต้องพึ่ง state หลายอย่างที่ตั้งค่าตอนสร้าง object ให้เก็บ state เหล่านั้นใน struct แล้วใช้ method จะทำให้ dependency ชัดขึ้น แต่ถ้าใช้แค่ input parameter ธรรมดา function ก็ยังเป็นทางเลือกที่ดี ไม่จำเป็นต้องยัดทุกอย่างเข้า struct

---

## Step 6: Type declaration ไม่ใช่ inheritance

Go อนุญาตให้สร้าง type จาก user-defined type อื่นได้ แต่เรื่องนี้ไม่ใช่การสืบทอดแบบ OOP:

```go
package main

import "fmt"

type Score int
type HighScore Score

func main() {
	var score Score = 80
	var highScore HighScore = 100

	score = Score(highScore)
	highScore = HighScore(score)

	fmt.Println(score, highScore)
}
```

ทั้ง `Score` และ `HighScore` มี underlying type เป็น `int` เหมือนกัน แต่เป็นคนละ type และต้อง conversion ก่อน assign ข้ามกัน

ที่สำคัญคือ `HighScore` ไม่ได้เป็นลูกของ `Score` ไม่มี hierarchy และไม่ได้รับ method ที่เราเคยนิยามบน `Score` มาโดยอัตโนมัติ ถ้าเราเขียน `var highScore HighScore = score` จะ compile ไม่ผ่าน

แนวคิดนี้มีประโยชน์เมื่อข้อมูลข้างในเหมือนกัน แต่ operation หรือความหมายต่างกัน เช่น `Meters` กับ `Kilometers` อาจเก็บเป็น `float64` เหมือนกัน แต่ไม่ควรปล่อยให้เอามาบวกกันโดยไม่แปลงหน่วยให้ชัดเจน

> **Go ไม่ได้ถามว่า type เป็นลูกใคร:** มันถามว่าค่านี้เป็น type อะไร และมี behavior ตามที่ต้องการหรือไม่

---

## Step 7: `iota` — ทำ enum แบบ Go

Go ไม่มี enum type โดยเฉพาะ แต่มี `iota` ซึ่งเป็นตัวสร้างค่าตัวเลขที่เพิ่มทีละ 1 ภายใน `const` block เรามักสร้าง type จาก `int` ก่อนเพื่อให้ค่าชุดนี้มีชื่อและ type ของตัวเอง:

```go
package main

import "fmt"

type MailCategory int

const (
	MailUnknown MailCategory = iota
	MailPersonal
	MailSpam
	MailSocial
)

func main() {
	fmt.Println(MailUnknown)
	fmt.Println(MailPersonal)
	fmt.Println(MailSpam)
	fmt.Println(MailSocial)
}
```

ผลลัพธ์คือ `0`, `1`, `2`, `3` ตามลำดับ เพราะ `iota` เริ่มจาก 0 ในแต่ละ `const` block และเพิ่มขึ้นทีละ 1 ทุกบรรทัด ส่วนบรรทัดถัดไปสามารถละทั้ง type และ `iota` ได้ เพราะ compiler ทำซ้ำรูปแบบจากบรรทัดแรกให้

`iota` เหมาะเมื่อเราสนใจแค่การแยกค่าด้วยชื่อภายในโปรแกรม เช่น `MailSpam` ไม่ควรเอาเลข `2` ไปผูกกับระบบภายนอกโดยไม่คิดให้ดี เพราะถ้าแทรก constant ใหม่ตรงกลาง ค่าตัวเลขของรายการที่ตามมาจะเลื่อนทั้งหมด

ถ้าค่าต้องตรงกับ database, protocol หรือไฟล์ที่คนอื่นอ่าน ให้กำหนดค่าตรง ๆ และคิดเรื่อง compatibility เองจะปลอดภัยกว่า

อีก pattern ที่เจอคือ bit field:

```go
type Permission uint8

const (
	CanRead Permission = 1 << iota
	CanWrite
	CanDelete
)
```

มันได้ค่า `1`, `2`, `4` ตามลำดับ แต่ยิ่งต้องระวังการแทรกบรรทัดกลางมากขึ้น ควรใช้เมื่อทีมเข้าใจและ document รูปแบบนี้ชัดเจนจริง ๆ

---

## Step 8: Embedding — composition ไม่ใช่ inheritance

ถ้าอยาก reuse field และ method จาก type อื่น Go สนับสนุน **embedding** ซึ่งเป็นการใส่ field แบบไม่มีชื่อใน struct:

```go
package main

import "fmt"

type Employee struct {
	Name string
	ID   string
}

func (e Employee) Description() string {
	return fmt.Sprintf("%s (%s)", e.Name, e.ID)
}

type Manager struct {
	Employee // embedded field ไม่มีชื่อ
	Reports  []Employee
}

func main() {
	manager := Manager{
		Employee: Employee{Name: "Mina", ID: "12345"},
		Reports:  []Employee{},
	}

	fmt.Println(manager.ID)
	fmt.Println(manager.Description())
	fmt.Println(manager.Employee.Name)
}
```

ผลลัพธ์คือ:

```text
12345
Mina (12345)
Mina
```

`ID` และ `Description` ถูก **promote** ขึ้นมา จึงเรียกผ่าน `manager.ID` และ `manager.Description()` ได้เหมือนเป็นของ `Manager` เอง แต่จริง ๆ แล้ว field และ method ยังอยู่บน `Employee` เราจึงเข้าถึงแบบเต็มได้ด้วย `manager.Employee.Name`

ถ้า field ของ outer type ชื่อชนกับ embedded field ชื่อของ outer จะชนะ:

```go
type Inner struct {
	X int
}

type Outer struct {
	Inner
	X int
}

o := Outer{
	Inner: Inner{X: 10},
	X:     20,
}

fmt.Println(o.X)       // 20
fmt.Println(o.Inner.X) // 10
```

### อย่าสับสนกับ inheritance

`Manager` ไม่ใช่ `Employee` แม้จะ embed `Employee` อยู่ข้างใน ดังนั้นตัวอย่างนี้จึง compile ไม่ผ่าน:

```go
var employee Employee = manager         // compile error
var employee Employee = manager.Employee // ใช้ได้
```

embedding คือ **composition** หรือการประกอบ object จากส่วนย่อย ไม่ใช่ hierarchy และไม่มี dynamic dispatch แบบ inheritance ด้วย ถ้า method ของ `Employee` เรียก method อื่นบน `Employee` มันก็จะเรียก method ของ `Employee` ไม่ได้หันกลับมาหา method ที่ชื่อเดียวกันบน `Manager`

ประโยชน์อีกอย่างคือ method ที่ถูก promote จะนับรวมใน method set ของ `Manager` ด้วย จึงช่วยให้ `Manager` implement interface ได้โดยไม่ต้องเขียน forwarding method เอง

---

## Step 9: Interface — บอกว่าทำอะไรได้

หลังจากเห็น concrete type มาหลายตัว ลองกลับมาดูฝั่ง abstract type กันบ้าง `interface` ไม่ได้บอกว่าข้อมูลเก็บอย่างไร บอกแค่ method ที่ caller ต้องการ:

```go
package main

import "fmt"

type Stringer interface {
	String() string
}

type Person struct {
	Name string
}

func (p Person) String() string {
	return p.Name
}

func printString(value Stringer) {
	fmt.Println(value.String())
}

func main() {
	person := Person{Name: "Mina"}
	printString(person)
}
```

เราไม่ต้องเขียน `implements Stringer` ที่ `Person` เลย ถ้า `Person` มี method ครบตาม interface ก็ใช้แทนได้ทันที นี่คือ **implicit interface** ของ Go

คุณสมบัตินี้เรียกแบบเข้าใจง่าย ๆ ได้ว่าเป็น type-safe duck typing:

| สไตล์ | วิธีทำ | สิ่งที่ได้ |
|---|---|---|
| Dynamic duck typing | ส่งอะไรก็ได้ที่มี method ตอน runtime | ยืดหยุ่น แต่สัญญาอาจไม่ชัด |
| Explicit interface | type ประกาศว่า implements interface | ชัด แต่ provider กับ interface ผูกกัน |
| Go implicit interface | method ครบก็ใช้ได้ ไม่ต้องประกาศ | ได้ทั้ง type safety และ decoupling |

### Method set กับ interface

ลองเพิ่ม interface ที่ต้องการ pointer receiver method:

```go
type Incrementer interface {
	Increment()
}

type Counter struct {
	total int
}

func (c *Counter) Increment() {
	c.total++
}

var _ Incrementer = (*Counter)(nil) // compile-time check: ใช้ได้
// var _ Incrementer = Counter{}     // compile error: value ไม่มี Increment ใน method set
```

บรรทัด `var _ Incrementer = (*Counter)(nil)` เป็น compile-time check ที่ช่วย document ว่าเราตั้งใจให้ `*Counter` implement `Incrementer` ตัว `_` ไม่ได้เก็บค่าไว้ใช้จริง

ชื่อ interface ใน standard library มักลงท้ายด้วย `er` เช่น `io.Reader`, `io.Writer`, `io.Closer`, `fmt.Stringer` และ `http.Handler` เพราะชื่อมักบอก behavior ที่ type ทำได้

### Embed interface ใน interface ได้

เหมือน embedding ใน struct เราสามารถประกอบ interface จาก interface เล็ก ๆ ได้:

```go
type Reader interface {
	Read(p []byte) (n int, err error)
}

type Closer interface {
	Close() error
}

type ReadCloser interface {
	Reader
	Closer
}
```

type ที่ implement `Read` และ `Close` ครบก็ใช้เป็น `ReadCloser` ได้ โดยไม่ต้องประกาศอะไรเพิ่ม

---

## Step 10: Accept interfaces, return structs

หนึ่งในแนวทางออกแบบ API ที่เจอบ่อยใน Go คือ **accept interfaces, return structs**:

- รับ interface เพื่อประกาศแค่ behavior ที่ function ใช้จริง ทำให้สลับ implementation ได้
- คืน concrete struct เพื่อให้เราเพิ่ม field หรือ method ในอนาคตได้โดยไม่ทำให้ caller เดิมต้องแก้ตาม

ถ้าเพิ่ม method ใน interface เดิม implementation ทุกตัวต้องเพิ่ม method ตาม ซึ่งอาจเป็น breaking change แต่ถ้าเพิ่ม field หรือ method บน struct caller เดิมที่ไม่ได้ใช้ของใหม่ยังทำงานต่อได้

ลองทำ dependency injection ขนาดเล็กกัน เราจะมี logic ที่ต้องการทั้ง data store และ logger แต่จะไม่ผูกกับ implementation จริง:

```go
package main

import (
	"errors"
	"fmt"
)

// Interface อยู่ฝั่ง client เพราะ Greeter เป็นคนบอกว่าตัวเองต้องการอะไร
type UserStore interface {
	UserNameForID(userID string) (string, bool)
}

type Logger interface {
	Log(message string)
}

type memoryStore struct {
	users map[string]string
}

func (s memoryStore) UserNameForID(userID string) (string, bool) {
	name, ok := s.users[userID]
	return name, ok
}

// Function type ที่มี method จึงทำตาม Logger interface ได้
type LoggerFunc func(string)

func (f LoggerFunc) Log(message string) {
	f(message)
}

type Greeter struct {
	logger Logger
	store  UserStore
}

func NewGreeter(logger Logger, store UserStore) Greeter {
	return Greeter{
		logger: logger,
		store:  store,
	}
}

func (g Greeter) SayHello(userID string) (string, error) {
	g.logger.Log("looking up " + userID)

	name, ok := g.store.UserNameForID(userID)
	if !ok {
		return "", errors.New("unknown user")
	}
	return "Hello, " + name, nil
}

func main() {
	store := memoryStore{
		users: map[string]string{"1": "Mina"},
	}

	logger := LoggerFunc(func(message string) {
		fmt.Println("log:", message)
	})

	greeter := NewGreeter(logger, store)

	message, err := greeter.SayHello("1")
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(message)

	_, err = greeter.SayHello("404")
	fmt.Println("missing:", err)
}
```

ผลลัพธ์คือ:

```text
log: looking up 1
Hello, Mina
log: looking up 404
missing: unknown user
```

สังเกตว่า `Greeter` รู้จักแค่ `UserStore` กับ `Logger` ไม่รู้จัก `memoryStore` หรือ function ที่พิมพ์ log เลย ส่วน `main` เป็นจุดเดียวที่รู้ว่า concrete type จริงคืออะไรและเป็นคน wire ทุกอย่างเข้าด้วยกัน

ถ้าจะเขียน test เราก็สร้าง fake store หรือ logger ที่มี method ครบสอง interface แล้ว inject เข้า `NewGreeter` ได้ทันที โดยไม่ต้องเปลี่ยน business logic และไม่ต้องใช้ DI framework

### ทำไม interface ควรอยู่ฝั่ง client?

ถ้า provider เป็นคนสร้าง interface ใหญ่ ๆ แล้ว client ต้องรับ interface นั้นทั้งก้อน client จะถูกบังคับให้ผูกกับ method ที่ไม่ได้ใช้ ลองเริ่มจาก interface เล็ก ๆ ตรงจุดที่เรียกใช้และใส่เฉพาะ method ที่ต้องการจริงก่อน

> **Client บอกความต้องการ ส่วน provider แค่บังเอิญทำได้ครบ:** นี่คือพลังของ implicit interface

อย่ารีบคืน interface จากทุก function เพราะคิดว่ายืดหยุ่นกว่า การคืน struct มักทำให้ API evolve ได้ง่ายกว่า ข้อยกเว้นที่เห็นบ่อยคือ `error` ซึ่งเป็น interface เพื่อให้ implementation หลายแบบใช้ร่วมกันได้

---

## Step 11: Function type เป็นสะพานไปสู่ interface

ตัวอย่าง `LoggerFunc` ใน step ก่อนอาจดูแปลกนิดหนึ่ง เรานิยาม type จาก function แล้วแปะ method ให้มัน จึงทำให้ function ธรรมดาเข้า interface ได้

pattern นี้อยู่ใน standard library ด้วย โดย `http.Handler` ต้องการ method `ServeHTTP` และ `http.HandlerFunc` ทำหน้าที่เป็น adapter:

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

type HandlerFunc func(http.ResponseWriter, *http.Request)

func (f HandlerFunc) ServeHTTP(
	w http.ResponseWriter,
	r *http.Request,
) {
	f(w, r)
}

func main() {
	handler := HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello from Go")
	})

	http.Handle("/hello", handler)
	log.Println("listening on http://localhost:8080/hello")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

รัน:

```sh
go run .
```

แล้วเปิดอีก terminal ทดสอบ:

```sh
curl http://localhost:8080/hello
```

จะได้:

```text
hello from Go
```

ในงานจริงใช้ `http.HandlerFunc` ของ standard library ได้เลย เพราะมันมีรูปแบบเดียวกันอยู่แล้ว จุดสำคัญคือ function, method และ closure สามารถถูกแปลงให้เดินผ่าน interface เดียวกันได้

ถ้า callback เป็น function เดี่ยว ๆ ที่ใช้แค่ input ของมัน function type ก็เหมาะสม แต่ถ้า logic ต้องพึ่ง state หรือ dependency หลายตัว interface มักบอกโครงสร้างของระบบได้ชัดกว่า

---

## Step 12: `any`, type assertion และ type switch

บาง API ต้องรับค่าที่ไม่รู้ type ล่วงหน้า เช่นข้อมูล JSON ที่ schema เปลี่ยนไปมา Go มี empty interface เขียนได้ทั้ง `interface{}` และ `any` โดย `any` เป็น alias ที่อ่านง่ายกว่าในโค้ดใหม่ตั้งแต่ Go 1.18:

```go
var value any

value = 20
value = "hello"
value = struct {
	Name string
}{Name: "Mina"}
```

ข้อเสียคือ `any` ไม่บอกอะไรเกี่ยวกับ behavior เลย เราจึงเรียก method หรือใช้ operator กับมันไม่ได้จนกว่าจะรู้ type ที่อยู่ข้างใน ใช้ได้เมื่อ boundary ของข้อมูลไม่แน่นอน เช่น `map[string]any` ที่รับ JSON แต่ไม่ควรใช้เป็น container ทั่วไปเพื่อหนี type system

### Type assertion

ถ้ารู้ว่าค่าใน interface ควรเป็น type ใด เราใช้ **type assertion**:

```go
package main

import "fmt"

type Score int

func main() {
	var value any = Score(20)

	score, ok := value.(Score)
	if !ok {
		fmt.Println("value is not a Score")
		return
	}
	fmt.Println(score + 1)

	_, ok = value.(int)
	fmt.Println("is int:", ok)
}
```

ผลลัพธ์คือ:

```text
21
is int: false
```

อย่าสับสนระหว่างสองรูปแบบนี้:

- `Score(20)` คือ **type conversion** เปลี่ยนค่าจาก type หนึ่งไปเป็นอีก type หนึ่ง และ compiler ช่วยตรวจ syntax ให้
- `value.(Score)` คือ **type assertion** ขอ type ที่อยู่ข้างใน interface ตอน runtime

ถ้าเขียน assertion แบบไม่รับ `ok` แล้ว type ไม่ตรง โปรแกรมจะ panic:

```go
var value any = Score(20)
score := value.(int) // panic ตอน runtime: ข้างในคือ Score ไม่ใช่ int
```

ใช้ comma ok เป็น default เสมอ แม้ตอนนี้จะมั่นใจว่า type ถูกต้อง เพราะ code อาจถูก reuse กับข้อมูลจาก caller อื่นในอนาคต

### Type switch

ถ้าค่าหนึ่งอาจเป็นได้หลาย type ให้ใช้ type switch แทนการต่อ assertion ยาว ๆ:

```go
package main

import "fmt"

type Person struct {
	Name string
}

func (p Person) String() string {
	return p.Name
}

func describe(value any) {
	switch v := value.(type) {
	case nil:
		fmt.Println("nil")
	case int:
		fmt.Println("int:", v)
	case string:
		fmt.Println("string:", v)
	case fmt.Stringer:
		fmt.Println("Stringer:", v.String())
	default:
		fmt.Printf("unknown type: %T\n", v)
	}
}

func main() {
	describe(20)
	describe("hello")
	describe(Person{Name: "Mina"})
	describe(true)
}
```

ผลลัพธ์คือ:

```text
int: 20
string: hello
Stringer: Mina
unknown type: bool
```

ใส่ `default` ไว้เสมอเมื่อ type switch ต้องรับ implementation ที่อาจเพิ่มเข้ามาทีหลัง และพยายามใช้ assertion/switch เท่าที่จำเป็น ถ้า business logic ต้องแยกทุก concrete type ออกจาก interface บ่อย ๆ อาจแปลว่า interface เล็กเกินไปหรือ abstraction ยังไม่ตรงกับงาน

use case ที่ดีของ assertion คือ optional interface เช่น code รับ `io.Reader` แต่ตรวจเพิ่มว่า implementation นั้นมี `io.ReaderFrom` หรือไม่ เพื่อเลือก fast path แบบที่ standard library ทำใน `io.Copy`

ระวัง decorator หรือ wrapper ด้วย เพราะการเอา implementation ไปห่อด้วย type อื่นอาจทำให้ optional interface ที่อยู่ข้างในตรวจไม่เจอ การห่อ error ก็มีเรื่องคล้ายกัน ให้ใช้ `errors.Is` และ `errors.As` แทนการ assertion แบบตรง ๆ กับ wrapped error

---

## Step 13: Interface กับ `nil` ไม่ได้ตรงไปตรงมา

ตัวแปร interface มีทั้ง dynamic type และ dynamic value ในเชิงแนวคิด ดังนั้น interface จะเป็น `nil` ก็ต่อเมื่อทั้งสองส่วนเป็น `nil`:

```go
package main

import "fmt"

type Counter struct {
	total int
}

func (c *Counter) Increment() {
	if c == nil {
		return
	}
	c.total++
}

type Incrementer interface {
	Increment()
}

func main() {
	var pointerCounter *Counter
	var incrementer Incrementer

	fmt.Println(pointerCounter == nil)
	fmt.Println(incrementer == nil)

	incrementer = pointerCounter
	fmt.Println(incrementer == nil)

	// ปลอดภัยในตัวอย่างนี้ เพราะ Increment เช็ค nil ไว้แล้ว
	incrementer.Increment()
}
```

ผลลัพธ์คือ:

```text
true
true
false
```

หลังบรรทัด `incrementer = pointerCounter` interface มี dynamic type เป็น `*Counter` แล้ว แม้ dynamic value จะเป็น nil ก็ตาม จึงไม่เท่ากับ `nil`

นี่คือบั๊กคลาสสิกของ function ที่ return `error`:

```go
type validationError struct{}

func (e *validationError) Error() string {
	return "validation failed"
}

func maybeError() error {
	var err *validationError
	return err // interface มี type *validationError แล้ว
}

err := maybeError()
fmt.Println(err == nil) // false
```

ดังนั้นอย่าดูแค่ value ที่คิดว่าเป็น nil ให้คิดด้วยว่ามันถูกห่ออยู่ใน interface หรือยัง และถ้า method ของ typed nil ไม่ได้รองรับ nil การเรียก method ก็ยัง panic ได้ แม้ interface จะไม่ใช่ nil ก็ตาม

### Interface เทียบได้ แต่อาจ panic

interface ใช้ `==` ได้ แต่ความปลอดภัยขึ้นกับ concrete type ที่อยู่ข้างในด้วย pointer, integer และ string เป็น comparable แต่ slice, map และ function เป็น non-comparable:

```go
type Doubler interface {
	Double()
}

type DoubleSlice []int

func (d DoubleSlice) Double() {}

func compare(a, b Doubler) bool {
	return a == b
}

// compare(DoubleSlice{1}, DoubleSlice{1})
// จะ panic เพราะ dynamic type คือ DoubleSlice ซึ่งเป็น slice
```

การใช้ interface เป็น map key ก็มีความเสี่ยงแบบเดียวกัน ถ้าไม่แน่ใจว่า concrete value comparable อย่าใช้ `==` หรือ interface เป็น key แบบเดาสุ่ม ๆ

> **Interface ไม่ได้ทำให้ค่าข้างใน comparable ขึ้นมา:** มันแค่ห่อ type กับ value ไว้ด้วยกัน

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดเฉลยก่อน:

1. สร้าง `Team` ที่มี field `Name string` และ `Players []string` จากนั้นสร้าง `League` ที่มี `Teams []Team` กับ `Wins map[string]int` แล้วเขียน method `MatchResult(team1 string, score1 int, team2 string, score2 int)` เพื่อเพิ่มจำนวนชนะให้ทีมที่คะแนนมากกว่า
2. เพิ่ม method `Ranking() []string` ให้ `League` โดย return ชื่อทีมเรียงจากจำนวนชนะมากไปน้อย ถ้าจำนวนชนะเท่ากันให้เรียงตามชื่อเพื่อให้ผลลัพธ์ deterministic
3. นิยาม interface `Ranker` ที่มี `Ranking() []string` แล้วเขียน `RankPrinter(r Ranker, w io.Writer) error` ให้เขียนอันดับทีละบรรทัดด้วย `io.WriteString` ทดลองส่ง `League` เข้าไปโดยไม่แก้ `League` ให้ประกาศ implements
4. สร้าง `FakeStore` ที่ implement `UserStore` จาก Step 10 แล้วใช้ inject เข้า `NewGreeter` เพื่อทดสอบทั้งกรณีเจอ user และกรณีไม่เจอ user โดยไม่ใช้ `memoryStore`
5. สร้าง type `Status int` พร้อม `iota` โดยมีค่า `StatusUnknown`, `StatusReady`, `StatusDone` แล้วลองแทรกค่าใหม่กลาง const block สังเกตว่าค่าตัวเลขที่ตามมาเปลี่ยนอย่างไร

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ใช้ pointer receiver แค่บาง method โดยไม่คิดเรื่อง method set** — ถ้า type มี pointer receiver สักตัว ให้ใช้ pointer เป็นหลักกับ method ทั้งชุดเพื่อให้ interface behavior สม่ำเสมอ
- **เรียก pointer receiver บน value ที่ส่งเข้า function แล้วคาดว่าจะแก้ต้นทาง** — function ได้ value copy ไป ต้องส่ง pointer ถ้าต้องการแก้ข้อมูลเดิม
- **เรียก value receiver ผ่าน nil pointer** — compile ผ่านได้ แต่ panic เพราะไม่มี value ให้ copy
- **คิดว่า user-defined type เป็น inheritance** — type ที่มี underlying type เดียวกันก็ยังเป็นคนละ type และไม่ได้สืบทอด method อัตโนมัติ
- **คิดว่า embedding ทำให้ outer type เป็น inner type** — embedding คือ composition; `Manager` ยัง assign ไป `Employee` ตรง ๆ ไม่ได้
- **สร้าง interface ใหญ่จากฝั่ง provider** — ให้ client นิยาม interface เล็ก ๆ ที่บอก behavior ที่ต้องการจริง
- **คืน interface จากทุก function** — ใช้ `Accept interfaces, return structs` เป็น default แล้วค่อยมีเหตุผลเฉพาะกรณีที่ต้องคืน interface
- **แทรก constant กลาง `iota` ทั้งที่ค่าถูกใช้ภายนอก** — ค่าที่ตามมาจะถูก renumber และอาจทำให้ database หรือ protocol ผิด
- **ใช้ `any` เป็น container ทั่วไป** — มันลบข้อมูลเรื่อง type ไป ใช้กับ boundary ที่ schema ไม่แน่นอน และพิจารณา generics สำหรับ container ใหม่
- **ทำ type assertion โดยไม่ใช้ comma ok** — type ไม่ตรงแล้ว panic ใช้ `value, ok := input.(T)` เป็น default
- **ลืม `default` ใน type switch** — implementation ใหม่อาจหลุดจากทุก case และเกิดพฤติกรรมเงียบ ๆ
- **คิดว่า interface ที่เก็บ typed nil เท่ากับ nil** — dynamic type ยังไม่เป็น nil จึงต้องระวังตอน return `error` หรือ interface อื่น
- **เทียบ interface ด้วย `==` โดยไม่ดู concrete type** — ถ้าข้างในเป็น slice, map หรือ function อาจ panic ตอน runtime
- **คาดว่า type assertion จะมองทะลุ wrapper** — decorator และ wrapped error อาจซ่อน optional interface หรือ error type ให้ใช้ API ที่ออกแบบมาสำหรับการ unwrap เช่น `errors.Is` และ `errors.As`

---

## สรุป

1. ใช้ `type` สร้าง user-defined type จาก underlying type ใดก็ได้ เพื่อให้โค้ดสื่อ concept และ compiler ช่วยกันค่าคนละความหมาย
2. method คือ function ที่มี receiver และ receiver ต้องอยู่ใน package เดียวกับ type
3. ใช้ pointer receiver เมื่อ method ต้องแก้ state หรือรองรับ nil; ใช้ value receiver เมื่ออ่านข้อมูลอย่างเดียวได้
4. method set ของ value มีเฉพาะ value receiver ส่วน method set ของ pointer มีทั้ง value และ pointer receiver ซึ่งสำคัญมากตอนใช้ interface
5. method value (`instance.Method`) ผูก instance ไว้แล้ว ส่วน method expression (`Type.Method`) รับ receiver เป็น parameter ตัวแรก
6. user-defined type ไม่ใช่ inheritance แม้จะ share underlying type เดียวกัน ต้อง conversion ก่อน assign ข้ามกัน
7. `iota` เหมาะกับ enum ภายในที่อ้างด้วยชื่อ ไม่เหมาะกับค่าที่ต้องคงที่และถูกใช้โดยระบบภายนอก
8. embedding ช่วย promote field/method เพื่อทำ composition แต่ไม่ได้ทำให้ outer type เป็น inner type และไม่มี dynamic dispatch แบบ inheritance
9. Go ใช้ implicit interface: concrete type ไม่ต้องประกาศว่า implement interface ขอแค่ method set ครบ
10. ให้ client เป็นเจ้าของ interface เล็ก ๆ รับ interface เข้า business logic และคืน struct ออกมาเป็น default
11. function type ที่มี method เป็นสะพานให้ function, method และ closure เดินผ่าน interface เดียวกันได้
12. ใช้ `any` เท่าที่จำเป็น, ใช้ comma ok กับ type assertion, ใส่ `default` ใน type switch และระวัง interface ที่เก็บ typed nil
13. interface เทียบด้วย `==` ได้ก็ต่อเมื่อ dynamic value ข้างใน comparable ด้วย ไม่เช่นนั้นอาจ panic

Go ไม่ได้พยายามเป็น OOP เต็มรูปแบบ ไม่มี inheritance และ method overriding แบบที่บางภาษามี แต่เอา type, method, composition และ interface มาประกอบกันให้โค้ด practical, อ่านง่าย และ maintain ได้นาน ๆ

บทนี้จึงเหมือนการเปลี่ยนจากการมีแค่ "ข้อมูลกับ function แยกกัน" ไปสู่การออกแบบ behavior ที่ชัดเจน และเปลี่ยน implementation ได้โดยไม่ลากทั้งระบบให้เปลี่ยนตาม

> *ตอนถัดไปจะต่อด้วย generics — reuse logic และสร้าง container ที่ทำงานกับหลาย type โดยไม่ต้องหันไปใช้ `any`*

---

## Glossary

- **User-defined type** — type ที่เราสร้างชื่อและความหมายเองจาก underlying type เช่น `type Score int`
- **Underlying type** — type พื้นฐานที่อยู่เบื้องหลัง user-defined type
- **Concrete type** — type ที่บอกทั้งรูปแบบข้อมูลและ implementation เช่น `struct`, `int` หรือ function type
- **Abstract type** — type ที่บอก behavior โดยไม่ระบุวิธีเก็บข้อมูล ซึ่งใน Go คือ interface
- **Receiver** — ตัวแปรที่ผูก method เข้ากับ type อยู่ระหว่าง `func` กับชื่อ method
- **Value receiver** — receiver ที่รับ value copy ของ type และมี method อยู่ใน method set ของ value
- **Pointer receiver** — receiver ที่รับ pointer ไปยัง type เหมาะกับการแก้ state หรือรองรับ nil
- **Method set** — ชุด method ที่ type นั้นใช้ satisfy interface ได้; pointer มีทั้ง pointer และ value receiver ส่วน value มีเฉพาะ value receiver
- **Method value** — method ที่ผูกกับ instance แล้ว เช่น `instance.Method` และทำตัวคล้าย function ที่จำ receiver
- **Method expression** — function ที่สร้างจาก type เช่น `Type.Method` โดย receiver กลายเป็น parameter ตัวแรก
- **Embedding** — การใส่ field หรือ interface แบบไม่มีชื่อ เพื่อ reuse และ promote field/method
- **Promotion** — การที่ field/method ของ embedded type ถูกเรียกตรงผ่าน containing type
- **Composition** — การประกอบ type จากส่วนย่อย ไม่ใช่ inheritance
- **Implicit interface** — การที่ concrete type satisfy interface อัตโนมัติเมื่อ method set ครบ โดยไม่ต้องประกาศ
- **Type-safe duck typing** — ความยืดหยุ่นแบบ duck typing ที่ compiler ของ Go ยังตรวจ method และ type ให้
- **`iota`** — ตัวสร้างค่าที่เพิ่มทีละ 1 ภายใน `const` block
- **Accept interfaces, return structs** — แนวทางรับ abstraction เพื่อความยืดหยุ่น แต่คืน concrete type เพื่อ evolve API ง่าย
- **Dependency injection (DI)** — การส่ง dependency จากภายนอกเข้าไปผ่าน parameter หรือ interface แทนการสร้าง dependency ข้างในเอง
- **Function type adapter** — function type ที่มี method เพื่อทำให้ function ธรรมดา satisfy interface เช่น `http.HandlerFunc`
- **Empty interface / `any`** — interface ที่ไม่มี method จึงเก็บค่าได้ทุก type แต่ให้ข้อมูลเรื่อง type แก่ caller น้อยมาก
- **Type assertion** — การดึง concrete type จาก interface เช่น `value.(string)` ตรวจตอน runtime
- **Type switch** — `switch value := input.(type)` ที่แยก logic ตาม concrete type ใน interface
- **Optional interface** — interface เพิ่มเติมที่ตรวจด้วย type assertion เพื่อเลือก behavior หรือ fast path เมื่อ implementation รองรับ
- **Typed nil** — nil value ที่ถูกเก็บใน interface พร้อม dynamic type ทำให้ interface ทั้งตัวไม่เท่ากับ nil

---

## Related

- [ตอนที่ 6: Pointers](/go/06-pointers/) — value/pointer receiver และ method ที่แก้ state ต่อยอดจาก pointer, call-by-value และ nil
- [ตอนที่ 5: Functions](/go/05-functions/) — function value, closure และการส่ง function เป็น parameter เป็นพื้นฐานของ method value และ function type adapter
- [ตอนที่ 4: Blocks, Shadows, and Control Structures](/go/04-blocks-shadows-and-control-structures/) — `switch`, shadowing และ scope ที่กลับมาใช้ใน type switch และ method implementation
- [ตอนที่ 3: Composite Types](/go/03-composite-types/) — struct, map และ slice ที่นำมาใช้สร้าง user-defined type และ embedded field
- [ตอนที่ 8: Generics](/go/08-generics/) — บทถัดไป ทางเลือกสำหรับ reuse logic และสร้าง container หลาย type โดยไม่ต้องใช้ `any`
