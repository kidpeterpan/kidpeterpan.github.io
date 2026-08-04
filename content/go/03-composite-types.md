+++
title = 'ตอนที่ 3: Composite Types'
date = '2026-08-01T00:00:00+07:00'
draft = false
description = 'เรียนรู้ array, slice, string, map และ struct ของ Go แบบ step by step พร้อมทำความเข้าใจ length, capacity, backing array, UTF-8 และ comma ok idiom'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่ 3 เราจะเรียนรู้ **composite types** หรือชนิดข้อมูลที่ประกอบขึ้นจากค่าอื่น ได้แก่ `array`, `slice`, `map` และ `struct`

ถ้าตอนที่ 2 สอนให้เราเลือกชนิดของ “ค่าเดี่ยว” เช่น `int`, `string` และ `bool` ตอนนี้เราจะเริ่มจัดกลุ่มค่าเหล่านั้นเป็นข้อมูลที่ใช้งานจริง เช่น รายการสินค้า, คะแนนสอบ, ตารางราคา และข้อมูลผู้ใช้

สิ่งที่จะได้ตอนจบบทนี้:

- เลือกใช้ `array`, `slice`, `map` และ `struct` ได้ถูกสถานการณ์
- ใช้ `len`, `cap`, `append`, `make`, `copy`, `clear` ได้อย่างปลอดภัย
- เข้าใจว่า slice อาจแชร์ backing array เดียวกันได้อย่างไร
- เข้าใจว่า string เป็น sequence ของ byte และจัดการ Unicode ด้วย rune ได้อย่างไร
- อ่าน map ด้วย comma ok idiom และใช้ map จำลอง set

{{< mermaid >}}
graph TD
  Q[ข้อมูลที่ต้องการเก็บ] --> A{"รู้จำนวนแน่นอน?"}
  A -->|ใช่| AR[Array]
  A -->|ไม่ใช่| SL[Slice]
  Q --> M{"ค้นหาด้วย key?"}
  M -->|ใช่| MAP[Map]
  Q --> S{"หลาย field ที่สัมพันธ์กัน?"}
  S -->|ใช่| ST[Struct]
  AR -->|เป็น backing store ให้| SL
{{< /mermaid >}}

---
## วิธีทำตามบทนี้

เราจะสร้าง project ชื่อ `go_composite_types` แยกจาก project ตอนก่อน เพื่อทดลองโค้ดโดยไม่กระทบกัน เปิด terminal แล้วรันคำสั่งนี้:

```sh
mkdir go_composite_types
cd go_composite_types
go mod init go_composite_types
touch main.go
```

ในแต่ละ step ให้เปิด `main.go`, แทนที่โค้ดเดิมด้วยตัวอย่างของ step นั้น แล้วรัน:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านจะมีคำอธิบายกำกับไว้ อย่าวางตัวอย่างเหล่านั้นรวมกับโปรแกรมที่ต้องการรัน

---
## Step 1: เริ่มจาก array

`array` คือลำดับค่าชนิดเดียวกันที่มีขนาดตายตัว ขนาดเป็นส่วนหนึ่งของ type ดังนั้น `[3]int` และ `[4]int` เป็นคนละ type

วางโค้ดนี้ใน `main.go`:

```go
package main

import "fmt"

func main() {
	var scores [3]int
	var primes = [3]int{2, 3, 5}
	var weekdays = [...]string{"Mon", "Tue", "Wed", "Thu", "Fri"}

	scores[0] = 90
	scores[1] = 85

	fmt.Println("scores:", scores)
	fmt.Println("primes:", primes)
	fmt.Println("weekdays:", weekdays)
	fmt.Println("weekdays length:", len(weekdays))
}
```

รัน:

```sh
go run .
```

ผลลัพธ์จะประมาณนี้:

```text
scores: [90 85 0]
primes: [2 3 5]
weekdays: [Mon Tue Wed Thu Fri]
weekdays length: 5
```

สังเกตว่า `var scores [3]int` ได้ zero value เป็น `[0 0 0]` และ `[...]string` ให้ compiler นับจำนวน element ให้เอง

### Sparse array literal

ถ้ารู้ว่า element ส่วนใหญ่เป็น zero value เราระบุเฉพาะ index ที่ต้องการได้:

```go
var lookup = [12]int{
	0:  10,
	5:  50,
	11: 110,
}

fmt.Println(lookup)
// [10 0 0 0 0 50 0 0 0 0 0 110]
```

### ทำไมจึงไม่ใช้ array เป็นค่าเริ่มต้น?

ข้อจำกัดสำคัญคือขนาดอยู่ใน type:

```go
var small [3]int
var large [4]int

// small = large // ❌ compile ไม่ผ่าน: คนละ type
```

ใช้ array เมื่อขนาดถูกกำหนดตายตัวจริง ๆ เช่น checksum ที่ algorithm ระบุว่าต้องมี 32 byte ในงานทั่วไปที่จำนวนข้อมูลอาจเพิ่มขึ้น ให้ใช้ slice แทน

---
## Step 2: ใช้ slice สำหรับลำดับข้อมูล

`slice` คือมุมมอง (view) ไปยังข้อมูลใน backing array ที่ขยายได้ ความยาวของ slice ไม่ได้เป็นส่วนหนึ่งของ type จึงส่ง slice ขนาดใด ๆ เข้า function เดียวกันได้

แทนที่ `main.go` ด้วย:

```go
package main

import "fmt"

func main() {
	var names []string // nil slice: zero value ของ slice

	names = append(names, "Mina")
	names = append(names, "Nina", "Owen")

	moreNames := []string{"Ploy", "Q"}
	names = append(names, moreNames...)

	fmt.Println(names)
	fmt.Println("length:", len(names))
	fmt.Println("capacity:", cap(names))
}
```

> [!CAUTION]
> บรรทัด `names = append(...)` ต้อง assign ผลลัพธ์กลับเสมอ เพราะ `append` อาจสร้าง backing array ใหม่แล้วคืน slice ตัวใหม่มา

รันแล้วจะได้รายการชื่อพร้อม length และ capacity ซึ่ง capacity อาจแตกต่างกันตามเวอร์ชันของ Go runtime แต่ต้องไม่น้อยกว่า length

### `nil` slice กับ empty slice

ทั้งสองแบบมี length เป็นศูนย์ แต่มีสถานะแตกต่างกัน:

```go
var a []int       // nil slice
b := []int{}      // non-nil, length 0

fmt.Println(len(a), len(b)) // 0 0
fmt.Println(a == nil)      // true
fmt.Println(b == nil)      // false
```

`nil` slice ใช้กับ `len` และ `append` ได้ทันที จึงเป็นค่าเริ่มต้นที่เหมาะสมในโค้ดส่วนใหญ่

slice เปรียบเทียบกันด้วย `==` ไม่ได้ ยกเว้นการเทียบกับ `nil` ถ้าต้องการเปรียบเทียบ element ให้ใช้ package `slices` ซึ่งมีมาตั้งแต่ Go 1.21:

```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	a := []int{1, 2, 3}
	b := []int{1, 2, 3}

	fmt.Println(slices.Equal(a, b)) // true
}
```

---
## Step 3: เข้าใจ length และ capacity

`len` คือจำนวน element ที่ slice มีอยู่ ส่วน `cap` คือจำนวน element ที่สามารถใช้ backing array เดิมได้ตั้งแต่ตำแหน่งแรกของ slice

ลองดู capacity เปลี่ยนเมื่อ `append` เติมข้อมูล:

```go
package main

import "fmt"

func main() {
	var values []int

	for i := 1; i <= 8; i++ {
		values = append(values, i)
		fmt.Printf("values=%v len=%d cap=%d\n", values, len(values), cap(values))
	}
}
```

เมื่อ length ถึง capacity เดิม runtime จะ allocate backing array ใหม่ที่ใหญ่ขึ้น แล้วคัดลอกข้อมูลเดิมไปไว้ใน array ใหม่ การเพิ่ม capacity ล่วงหน้าจึงช่วยลดการ allocate และ copy ซ้ำเมื่อเรารู้ขนาดโดยประมาณ

### ใช้ `make` ให้ถูกกับ `append`

`make` รับ type, length และ capacity ได้:

```go
withLength := make([]int, 3)
withCapacity := make([]int, 0, 3)

withLength[0] = 10
withLength[1] = 20
withLength[2] = 30

withCapacity = append(withCapacity, 10, 20, 30)

fmt.Println(withLength)    // [10 20 30]
fmt.Println(withCapacity)  // [10 20 30]
```

ความแตกต่างคือ `make([]int, 3)` สร้าง element ขึ้นมาแล้ว 3 ตัว ส่วน `make([]int, 0, 3)` สร้าง slice ที่ยังว่าง แต่จองพื้นที่ไว้ 3 ตัว

> [!WARNING]
> ถ้าตั้งใจใช้ `append` ให้ใช้ `make([]T, 0, n)` ไม่ใช่ `make([]T, n)` เพราะแบบหลังสร้าง element ที่เป็น zero value ไว้แล้ว:
>
> ```go
> values := make([]int, 3)
> values = append(values, 10)
> fmt.Println(values) // [0 0 0 10]
> ```

### ล้างค่าด้วย `clear`

ตั้งแต่ Go 1.21 built-in `clear` ใช้ตั้งค่าทุก element ใน slice ให้เป็น zero value โดย length ของ slice ยังเท่าเดิม:

```go
items := []string{"first", "second"}
clear(items)

fmt.Println(items)      // [ ]
fmt.Println(len(items)) // 2
```

---
## Step 4: slice จาก slice และ backing array

การเขียน `x[start:end]` ไม่ได้ copy ข้อมูล แต่สร้าง slice ใหม่ที่อ้างถึงพื้นที่ memory เดิม:

```go
package main

import "fmt"

func main() {
	letters := []string{"a", "b", "c", "d"}
	firstTwo := letters[:2]

	firstTwo[0] = "A"

	fmt.Println("letters:", letters)   // [A b c d]
	fmt.Println("firstTwo:", firstTwo) // [A b]
}
```

### Full slice expression ป้องกัน append ทับข้อมูล

subslice ยังอาจแชร์ capacity ที่เหลือกับ parent ได้ ดังนั้น `append` บน subslice อาจไปเขียนทับ element ที่อยู่ถัดไปใน parent:

```go
letters := []string{"a", "b", "c", "d"}
firstTwo := letters[:2]
firstTwo = append(firstTwo, "X")

fmt.Println(letters)  // [a b X d]
fmt.Println(firstTwo) // [a b X]
```

ใช้ full slice expression `low:high:max` จำกัด capacity ของ subslice ให้เท่ากับ length:

```go
letters := []string{"a", "b", "c", "d"}
firstTwo := letters[:2:2]
firstTwo = append(firstTwo, "X")

fmt.Println(letters)  // [a b c d]
fmt.Println(firstTwo) // [a b X]
```

เมื่อ capacity ของ `firstTwo` ไม่พอ `append` จะสร้าง backing array ใหม่ จึงไม่กระทบ `letters`

### ใช้ `copy` เมื่อต้องการข้อมูลที่เป็นอิสระ

ถ้าต้องการ copy ข้อมูลจริง ๆ ให้สร้าง destination แล้วเรียก `copy`:

```go
source := []int{1, 2, 3, 4}
destination := make([]int, len(source))

copied := copy(destination, source)
source[0] = 99

fmt.Println("source:", source)           // [99 2 3 4]
fmt.Println("destination:", destination) // [1 2 3 4]
fmt.Println("copied:", copied)           // 4
```

จำนวนที่ `copy` ได้คือค่าน้อยที่สุดระหว่าง length ของ destination และ source ไม่ใช่ capacity

---
## Step 5: แปลงระหว่าง array กับ slice

array ก็ใช้ slice expression ได้ แต่ slice ที่ได้จะแชร์ memory กับ array:

```go
numbers := [4]int{10, 20, 30, 40}
view := numbers[:]

view[0] = 99
fmt.Println(numbers) // [99 20 30 40]
```

ในทางกลับกัน การแปลง slice เป็น array จะ copy ข้อมูลไปยัง array ใหม่:

```go
values := []int{1, 2, 3, 4}
fixed := [4]int(values)

values[0] = 99
fmt.Println(values) // [99 2 3 4]
fmt.Println(fixed)  // [1 2 3 4]
```

array ที่สร้างจาก slice ต้องมีขนาดไม่เกิน length ของ slice ไม่เช่นนั้นจะ panic ตอน runtime

---
## Step 6: string คือ byte sequence

ใน Go `string` คือ sequence ของ byte ที่มักเข้ารหัสด้วย UTF-8 ไม่ใช่ sequence ของ character หรือ rune โดยตรง

```go
package main

import "fmt"

func main() {
	message := "Hi 😜"

	fmt.Println("bytes:", len(message))
	fmt.Println("byte at index 3:", message[3])
	fmt.Println("runes:", len([]rune(message)))

	for index, r := range message {
		fmt.Printf("byte index=%d rune=%q\n", index, r)
	}
}
```

emoji ใช้หลาย byte ใน UTF-8 ดังนั้น `len(message)` ไม่ใช่จำนวน character และ `message[3]` ก็ไม่ใช่ค่าของ character ที่มนุษย์มองเห็น การวนด้วย `range` จะ decode เป็น rune ให้ และ index ที่ได้คือ byte offset ของ rune นั้น

ถ้าต้องการตัดข้อความตามจำนวน Unicode code point ให้แปลงเป็น `[]rune` ก่อน:

```go
message := "สวัสดี Go"
runes := []rune(message)

firstThree := string(runes[:3])
fmt.Println(firstThree)
```

> [!CAUTION]
> อย่า slice string ที่มี Unicode ด้วย byte index ถ้าไม่แน่ใจว่าตำแหน่งนั้นอยู่ขอบเขตของ UTF-8 code point เพราะอาจได้ string ที่เข้ารหัสไม่สมบูรณ์

อีกจุดที่มักพลาดคือ `string(65)` จะได้ตัวอักษร `A` ไม่ใช่ข้อความ `"65"` ถ้าต้องการแปลงตัวเลขเป็นข้อความ ให้ใช้ `strconv.Itoa(65)`

---
## Step 7: ใช้ map สำหรับ lookup ด้วย key

`map` เก็บความสัมพันธ์ระหว่าง key และ value โดยเขียน type เป็น `map[keyType]valueType` เช่น `map[string]int`

แทนที่ `main.go` ด้วย:

```go
package main

import "fmt"

func main() {
	prices := map[string]int{
		"coffee": 80,
		"tea":    60,
		"cookie": 45,
	}

	prices["cake"] = 120

	fmt.Println("coffee:", prices["coffee"])
	fmt.Println("items:", len(prices))

	delete(prices, "cookie")
	fmt.Println("after delete:", prices)
}
```

key ของ map ต้องเป็น comparable type เช่น `string`, `int`, `bool` หรือ struct ที่ทุก field comparable จึงใช้ slice หรือ map เป็น key ไม่ได้

### nil map กับ empty map

zero value ของ map คือ `nil` อ่านได้ แต่เขียนไม่ได้:

```go
var scores map[string]int
fmt.Println(scores["Mina"]) // 0: อ่านได้ ได้ zero value

// scores["Mina"] = 90 // ❌ panic: assignment to entry in nil map
```

สร้าง map ที่เขียนได้ด้วย map literal หรือ `make`:

```go
scores := map[string]int{}
scores["Mina"] = 90

otherScores := make(map[string]int, 10)
otherScores["Nina"] = 85
```

### comma ok idiom

การอ่าน key ที่ไม่มีอยู่จะคืน zero value จึงอาจแยกไม่ออกว่า key มีค่าเป็น zero จริง หรือไม่มี key ต้องใช้ comma ok idiom:

```go
scores := map[string]int{
	"Mina": 90,
	"Nina": 0,
}

score, ok := scores["Nina"]
fmt.Println(score, ok) // 0 true

score, ok = scores["Owen"]
fmt.Println(score, ok) // 0 false
```

`ok == true` หมายถึง key มีอยู่ แม้ value จะเป็น zero value ส่วน `ok == false` หมายถึงไม่มี key นั้น

### map เป็น counter และ set

map เหมาะกับ counter เพราะการอ่าน key ที่ไม่มีคืนค่าเริ่มต้นเป็นศูนย์:

```go
votes := map[string]int{}
for _, candidate := range []string{"Mina", "Nina", "Mina", "Owen"} {
	votes[candidate]++
}

fmt.Println(votes) // map[Mina:2 Nina:1 Owen:1]
```

Go ไม่มี built-in set แต่จำลองได้ด้วย map โดยเก็บค่าที่สนใจเป็น key:

```go
seen := map[string]bool{}
for _, tag := range []string{"go", "web", "go", "api"} {
	seen[tag] = true
}

fmt.Println(len(seen))   // 3
fmt.Println(seen["go"])  // true
fmt.Println(seen["db"])  // false
```

ถ้าต้องการลดการใช้ memory มาก ๆ ใช้ `map[string]struct{}` ได้ แต่ `map[string]bool` อ่านง่ายกว่าในกรณีทั่วไป

> [!NOTE]
> ลำดับที่ได้จากการวน map ไม่ควรถูกนำไปคาดหวัง เพราะ Go ไม่รับประกัน iteration order

---
## Step 8: ใช้ struct สร้าง schema ของข้อมูล

`struct` ใช้รวม field ที่สัมพันธ์กัน โดยแต่ละ field อาจเป็นคนละ type ต่างจาก map ที่เปิดให้ใช้ key ใดก็ได้และ value มักเป็น type เดียวกัน

```go
package main

import "fmt"

type Employee struct {
	FirstName string
	LastName  string
	ID        int
}

func main() {
	var first Employee
	first.FirstName = "Mina"
	first.LastName = "Sato"
	first.ID = 101

	second := Employee{
		FirstName: "Nina",
		LastName:  "Lee",
		ID:        102,
	}

	third := Employee{"Owen", "Kim", 103}

	fmt.Printf("%+v\n", first)
	fmt.Printf("%+v\n", second)
	fmt.Printf("%+v\n", third)
}
```

struct ที่ประกาศด้วย `var` จะได้ zero value ของทุก field และเข้าถึง field ด้วย dot notation การระบุชื่อ field ใน literal (`Employee{FirstName: ...}`) อ่านง่ายและปลอดภัยกว่าเมื่อ struct มีหลาย field

> [!WARNING]
> อย่าผสม struct literal สองแบบในตัวเดียวกัน: ถ้าจะระบุ field ตามลำดับ ห้ามระบุชื่อ field บางตัว และถ้าต้องการความชัดเจนให้ระบุชื่อ field ทุกตัว

### Anonymous struct

ถ้าข้อมูลใช้เพียงจุดเดียวและไม่จำเป็นต้องตั้งชื่อ type สามารถใช้ anonymous struct ได้:

```go
response := struct {
	Code    int
	Message string
}{
	Code:    200,
	Message: "ok",
}

fmt.Println(response.Code, response.Message)
```

รูปแบบนี้มีประโยชน์กับข้อมูลชั่วคราว, JSON payload บางแบบ และ table-driven test

### Struct เปรียบเทียบได้หรือไม่?

struct จะเปรียบเทียบด้วย `==` ได้เมื่อทุก field เป็น comparable type:

```go
type Point struct {
	X int
	Y int
}

fmt.Println(Point{1, 2} == Point{1, 2}) // true
```

ถ้า struct มี field ชนิด slice, map หรือ function จะเปรียบเทียบด้วย `==` ไม่ได้ เพราะ type เหล่านั้นไม่ comparable

---
## Step 9: รวมทุกอย่างเป็นโปรแกรมสมุดรายชื่อ

ตอนนี้ลองสร้างโปรแกรมเล็ก ๆ ที่ใช้ `struct`, `slice` และ `map` ร่วมกันเป็นสมุดรายชื่อที่ค้นหาด้วยชื่อได้:

```go
package main

import "fmt"

type Contact struct {
	Name  string
	Email string
}

func main() {
	contacts := []Contact{
		{Name: "Mina", Email: "mina@example.com"},
		{Name: "Nina", Email: "nina@example.com"},
	}

	byName := make(map[string]Contact, len(contacts))
	for _, contact := range contacts {
		byName[contact.Name] = contact
	}

	contacts = append(contacts, Contact{
		Name:  "Owen",
		Email: "owen@example.com",
	})

	contact, ok := byName["Nina"]
	if !ok {
		fmt.Println("ไม่พบรายชื่อ")
		return
	}

	fmt.Println("ทั้งหมด:", len(contacts))
	fmt.Printf("พบ %s: %s\n", contact.Name, contact.Email)
}
```

ในตัวอย่างนี้:

- `Contact` เป็น schema ของข้อมูลหนึ่งรายชื่อ
- `contacts` เป็น slice เพราะจำนวนรายชื่อเพิ่มได้
- `byName` เป็น map เพื่อค้นหาด้วยชื่อ
- `ok` ป้องกันการใช้ zero value ราวกับเป็นข้อมูลที่พบจริง

---
## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดเฉลยก่อน:

1. สร้าง slice ชื่อ `greetings` ที่มี `"Hello"`, `"Hola"`, `"नमस्कार"`, `"こんにちは"` และ `"Привіт"` แล้วสร้าง subslice สามชุด: สองตัวแรก, ตัวที่ 2–4 และตัวที่ 4–5
2. สร้าง string `message := "Hi 😜 and 😍"` แล้วใช้ `range` print rune พร้อม byte index
3. สร้าง struct `Employee` ที่มี `FirstName`, `LastName` และ `ID` จากนั้นสร้าง instance ด้วย `var`, keyed literal และ positional literal
4. สร้าง map นับจำนวนคำจาก slice `[]string{"go", "web", "go", "api", "go"}` แล้ว print คำที่พบมากที่สุด
5. เขียน function `clone` ที่รับ `[]int` แล้วคืน slice ใหม่ที่ไม่แชร์ backing array กับต้นฉบับ โดยใช้ `copy`

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---
## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ลืม assign ผลลัพธ์จาก `append`** — ต้องเขียน `items = append(items, value)` เสมอ
- **ใช้ `append` กับ `make([]T, n)`** — จะได้ zero value จำนวน `n` ตัวนำหน้า ใช้ `make([]T, 0, n)` เมื่อจะ append
- **คิดว่า subslice เป็น copy** — `x[a:b]` แชร์ backing array กับ `x`; ใช้ `copy` เมื่อจำเป็นต้องแยกข้อมูล
- **append บน subslice แล้วทับ parent** — ใช้ full slice expression เช่น `x[:2:2]` จำกัด capacity
- **ใช้ byte index กับ Unicode** — `len(string)` นับ byte ไม่ใช่จำนวน character; ใช้ `range` หรือ `[]rune`
- **เขียนลง nil map** — อ่านได้แต่เขียน panic ต้องสร้างด้วย literal หรือ `make`
- **ใช้ `:=` กับ map key** — map assignment ต้องใช้ `m[key] = value` ไม่ใช่ `m[key] := value`
- **คาดหวังลำดับการวน map** — iteration order ไม่ได้ถูกรับประกัน
- **ผสม keyed และ positional struct literal** — เลือกใช้แบบใดแบบหนึ่ง

---
## สรุป

1. ใช้ **array** เมื่อจำนวน element ถูกกำหนดตายตัวจริง ๆ และยอมรับว่าขนาดเป็นส่วนหนึ่งของ type
2. ใช้ **slice** เป็นค่าเริ่มต้นสำหรับลำดับข้อมูล โดยเข้าใจ `len`, `cap` และ backing array
3. ใช้ `make([]T, 0, n)` เมื่อรู้ขนาดโดยประมาณและจะเติมข้อมูลด้วย `append`
4. ใช้ full slice expression หรือ `copy` เมื่อไม่ต้องการให้ slice แชร์ memory โดยไม่ตั้งใจ
5. จำไว้ว่า **string คือ byte sequence** และใช้ `range`/`[]rune` กับ Unicode
6. ใช้ **map** สำหรับ lookup, counter และ set พร้อม comma ok เมื่อต้องแยก key ที่ไม่มีออกจาก zero value
7. ใช้ **struct** เมื่อข้อมูลมี field ที่สัมพันธ์กันและต้องการ schema ที่ compiler ตรวจสอบได้

หลักสำคัญของบทนี้คือ composite type ไม่ได้ต่างกันแค่ syntax แต่มี model เรื่อง ownership และ memory ต่างกันด้วย เมื่อเข้าใจว่าค่าไหน copy, ค่าไหนแชร์ backing data และค่าไหนมี zero value อย่างไร โค้ด Go จะคาดเดาได้ง่ายขึ้นมาก

> *ตอนถัดไปจะต่อด้วย control structures ของ Go — block, scope, shadowing, `if`, `for` ทั้งสี่รูปแบบ, `switch` และ `goto`*

---

## Glossary

- **Array** — ลำดับค่าชนิดเดียวกันที่ขนาด fix และขนาดเป็นส่วนหนึ่งของ type
- **Slice** — ลำดับค่าที่ขยายได้ เป็น view ไปยัง backing array
- **Backing array** — array จริงที่เก็บข้อมูลเบื้องหลัง slice
- **Length (`len`)** — จำนวน element ที่ slice มีอยู่
- **Capacity (`cap`)** — จำนวน element ที่ slice ใช้ backing array เดิมได้
- **Full slice expression** — `x[low:high:max]` ที่ใช้จำกัด capacity ของ subslice
- **Rune** — alias ของ `int32` ที่แทน Unicode code point
- **Byte** — alias ของ `uint8`; string ใน Go เป็น sequence ของ byte
- **Map** — hash map ที่เชื่อม key กับ value
- **Comma ok idiom** — รูปแบบ `value, ok := m[key]` ที่ตรวจว่า key มีอยู่หรือไม่
- **Struct** — type ที่รวม field หลายชนิดเข้าด้วยกันเป็น schema
- **Anonymous struct** — struct ที่ใช้โดยไม่ตั้งชื่อ type ก่อน

---
## Related

- [ตอนที่ 1: Setting Up Your Go Environment](/go/01-setting-up-your-go-environment/) — ติดตั้ง Go, สร้าง module และ workflow พื้นฐาน
- [ตอนที่ 2: Predeclared Types and Declarations](/go/02-predeclared-types-and-declarations/) — ชนิดข้อมูลพื้นฐาน, zero value, การประกาศตัวแปร และการแปลง type
