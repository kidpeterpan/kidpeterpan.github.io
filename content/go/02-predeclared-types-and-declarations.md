+++
title = 'ตอนที่ 2: Predeclared Types and Declarations'
date = '2026-07-31T00:00:00+07:00'
draft = false
description = 'เรียนรู้ชนิดข้อมูลพื้นฐานของ Go, zero value, literals, การแปลง type, var, const และกฎการประกาศตัวแปรแบบ step by step'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่ 2 เราจะเริ่มเขียน Go ที่มีข้อมูลจริงมากขึ้น หลังจากตอนที่แล้วเรามี module และ workflow `fmt → vet → build` แล้ว ตอนนี้เราจะเรียนรู้ว่า Go เก็บข้อมูลแต่ละแบบอย่างไร และควรประกาศตัวแปรแบบไหนให้โค้ดสื่อเจตนาได้ชัดเจน

สิ่งที่ได้ตอนจบบทนี้:

- เข้าใจ `bool`, integer, float, complex, string และ rune ว่าควรใช้แบบไหนกับงานแบบใด
- แปลง type ได้อย่างถูกต้องเมื่อ type ไม่ตรงกัน
- เลือกใช้ `var`, `:=` และ `const` ได้เหมาะสมกับบริบท
- รู้ว่าทำไม Go จึงบังคับให้จัดการ unused variable

{{< mermaid >}}
graph TD
  A["สร้าง module"] --> B["ทดลอง zero value และ literal"]
  B --> C["เลือก type ให้เหมาะกับข้อมูล"]
  C --> D["convert เมื่อ type ไม่ตรงกัน"]
  D --> E["ประกาศด้วย var หรือ :="]
  E --> F["ใช้ const กับค่า compile time"]
  F --> G["go fmt → go vet → go build"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะใช้ project แยกชื่อ `go_types` เพื่อให้ทดลองโค้ดได้โดยไม่กระทบ project จากตอนที่ 1 หากมี project นี้อยู่แล้ว ให้ข้ามคำสั่งสร้างโฟลเดอร์ไปได้เลย

```sh
mkdir go_types
cd go_types
go mod init go_types
touch main.go
```

ในแต่ละ step ให้เปิดไฟล์ `main.go`, วางโค้ดตัวอย่างลงไป แล้วรัน:

```sh
go run .
```

> [!NOTE]
> บางตัวอย่างตั้งใจเขียนให้ compile ไม่ผ่าน เพื่อแสดงกฎของ Go ตัวอย่างเหล่านี้จะกำกับด้วย `// ❌` พร้อมคำอธิบาย — อย่าวางรวมกับโปรแกรมที่ต้องการรัน

---
## Step 1: เริ่มจาก `zero value`

Go กำหนดค่าเริ่มต้นให้ตัวแปรที่ประกาศแล้วแต่ยังไม่ได้กำหนดค่าเอง ค่าเริ่มต้นนี้เรียกว่า **zero value** และแตกต่างกันตาม type:

| Type | Zero value |
|---|---|
| `bool` | `false` |
| integer เช่น `int`, `int64` | `0` |
| floating-point เช่น `float64` | `0` |
| `string` | `""` (empty string) |
| complex | ส่วนจริงและส่วนจินตภาพเป็น `0` |

ลองวางโค้ดนี้ใน `main.go`:

```go
package main

import "fmt"

func main() {
	var ok bool
	var count int
	var price float64
	var message string

	fmt.Printf("ok=%v count=%d price=%v message=%q\n", ok, count, price, message)
}
```

รัน:

```sh
go run .
```

ผลลัพธ์จะเป็นค่าประมาณนี้:

```text
ok=false count=0 price=0 message=""
```

ข้อดีของ zero value คือเราไม่ต้องเดาว่าตัวแปรที่ยังไม่ได้กำหนดค่าจะมีค่าอะไร จึงลดปัญหาตัวแปรที่มีค่าขยะซึ่งพบได้ในบางภาษา

---
## Step 2: เข้าใจ `literal` และ `bool`

**Literal** คือค่าที่เขียนไว้ตรง ๆ ในโค้ด เช่น `10`, `3.14`, `'A'` และ `"hello"` literal ใน Go ส่วนใหญ่เป็น **untyped** หมายความว่ายังไม่มี type ตายตัวจนกว่าจะถูกใช้ในบริบทที่กำหนด type ให้

Go มี literal ที่พบบ่อยสี่ชนิด:

| Literal | ตัวอย่าง | ใช้แทน |
|---|---|---|
| Integer literal | `10`, `0xFF`, `1_000` | จำนวนเต็ม |
| Floating-point literal | `3.14`, `6.03e23` | จำนวนทศนิยม |
| Rune literal | `'A'`, `'\n'` | character หนึ่งตัว |
| String literal | `"hello"`, `` `raw string` `` | ข้อความ |

ยังมี literal ชนิดที่ห้าคือ imaginary literal สำหรับ complex number ซึ่งจะลงท้ายด้วย `i`

### ทดลอง boolean

type `bool` มีได้เพียงสองค่า คือ `true` และ `false` และ zero value คือ `false`:

```go
package main

import "fmt"

func main() {
	var ready bool
	var enabled = true

	fmt.Println("ready:", ready)
	fmt.Println("enabled:", enabled)
	fmt.Println("ready == false:", ready == false)
}
```

Go ไม่มี **truthiness** ดังนั้นโค้ดนี้ compile ไม่ผ่าน:

```go
var name string

if name { // ❌ string แปลงเป็น bool อัตโนมัติไม่ได้
	fmt.Println("มีชื่อ")
}
```

ให้เขียนเงื่อนไขอย่างชัดเจนแทน:

```go
if name != "" {
	fmt.Println("มีชื่อ")
}
```

แนวคิดนี้เป็นตัวอย่างของหลักสำคัญใน Go: เขียนเจตนาให้ชัด แทนที่จะพึ่งพากฎ implicit ที่ผู้อ่านอาจคาดเดาไม่ตรงกัน

---
## Step 3: เลือกใช้ integer type

Go มี integer ทั้งแบบ signed และ unsigned:

| Type | ช่วงค่าโดยประมาณ |
|---|---:|
| `int8` | –128 ถึง 127 |
| `int16` | –32,768 ถึง 32,767 |
| `int32` | –2,147,483,648 ถึง 2,147,483,647 |
| `int64` | ประมาณ –9.22×10¹⁸ ถึง 9.22×10¹⁸ |
| `uint8` | 0 ถึง 255 |
| `uint16` | 0 ถึง 65,535 |
| `uint32` | 0 ถึง 4,294,967,295 |
| `uint64` | 0 ถึงประมาณ 1.84×10¹⁹ |

### ชื่อพิเศษที่ควรรู้

- `byte` เป็น alias ของ `uint8` ใช้แทนกันได้ เมื่อข้อมูลหมายถึง byte ในโค้ด Go มักใช้ `byte` เพราะสื่อความหมายชัดกว่า `uint8`
- `int` เป็น signed integer ที่มีขนาด 32 หรือ 64 bit ตาม platform เป็น type ที่ควรใช้เป็นค่าเริ่มต้นสำหรับจำนวนเต็มทั่วไป
- `uint` คล้าย `int` แต่เป็น unsigned จึงมีค่าเป็น 0 หรือค่าบวกเท่านั้น
- `rune` เป็น alias ของ `int32` และใช้แทน character
- `uintptr` เป็น integer ที่สามารถเก็บค่า pointer ได้ จะพูดถึงในบทว่าด้วย pointer

ถ้าไม่ได้ทำงานกับ binary file format หรือ network protocol ที่บังคับขนาดไว้ ให้เริ่มจาก `int` ก่อน:

```go
package main

import "fmt"

func main() {
	var items int = 12
	var bytes byte = 255

	fmt.Println("items:", items)
	fmt.Println("bytes:", bytes)
}
```

ใช้ type ที่ระบุขนาดเมื่อ format หรือ protocol กำหนดไว้ชัดเจน เช่น field ใน binary protocol ต้องเป็น unsigned 16-bit ก็ใช้ `uint16` ให้ตรงกับสัญญาของข้อมูล

### ระวัง `int` กับ `int32`/`int64`

แม้ `int` บนเครื่อง 64-bit มักมีขนาดเท่ากับ `int64` แต่ Go ถือว่าเป็นคนละ type:

```go
var a int = 10
var b int64 = 20

// fmt.Println(a + b) // ❌ compile ไม่ผ่าน เพราะ type ไม่ตรงกัน
```

ถ้าต้องการคำนวณร่วมกัน ต้อง convert ก่อน:

```go
fmt.Println(int64(a) + b)
```

ถ้าเขียน library function ที่ควรรับ integer หลายชนิด ให้ใช้ generics ตามที่จะเรียนในบทว่าด้วย generics แทนการบังคับให้ caller ใช้ type ใด type หนึ่ง

---
## Step 4: ทำความเข้าใจ integer operator

integer รองรับ operator หลักดังนี้:

| กลุ่ม | Operator | ความหมาย |
|---|---|---|
| คณิตศาสตร์ | `+ - * / %` | บวก ลบ คูณ หาร และหารเอาเศษ |
| เปรียบเทียบ | `== != > >= < <=` | เปรียบเทียบค่า |
| Bit | `& \| ^ &^ << >>` | ทำงานระดับ bit |
| Assignment | `+= -= *= /= %=` | คำนวณแล้ว assign กลับ |

ลองดู integer division:

```go
package main

import "fmt"

func main() {
	result := 7 / 2
	remainder := 7 % 2

	fmt.Println("7 / 2 =", result)
	fmt.Println("7 % 2 =", remainder)
}
```

ผลลัพธ์คือ:

```text
7 / 2 = 3
7 % 2 = 1
```

ถ้าต้องการผลทศนิยม ต้อง convert อย่างน้อยหนึ่งฝั่งก่อนหาร:

```go
fmt.Println(float64(7) / 2) // 3.5
```

อย่าหาร integer ด้วย 0 เพราะจะเกิด panic และ integer division จะตัดเศษเข้าหา 0 (truncation toward zero)

---
## Step 5: ใช้ floating-point อย่างระวัง

Go มี floating-point สองชนิด:

- `float32` — precision ประมาณ 6–7 หลัก
- `float64` — precision ประมาณ 15–16 หลัก และเป็น default type ของ float literal

ถ้าไม่ได้จำเป็นต้องเข้ากับ format เดิม ให้ใช้ `float64` เป็นค่าเริ่มต้น:

```go
package main

import "fmt"

func main() {
	var price float64 = 19.95
	discount := 0.10

	fmt.Println(price * (1 - discount))
}
```

floating-point ไม่สามารถแทนค่าทศนิยมได้อย่าง exact จึงไม่ควรใช้แทนเงินหรือค่าที่ต้องการความแม่นยำสูง ใช้ decimal module แทน และหลีกเลี่ยงการเปรียบเทียบด้วย `==`:

```go
package main

import (
	"fmt"
	"math"
)

func main() {
	a := 0.1 + 0.2
	want := 0.3
	epsilon := 1e-9

	fmt.Println("a == want:", a == want)
	fmt.Println("ใกล้เคียงกัน:", math.Abs(a-want) < epsilon)
}
```

สำหรับ float การหารด้วย 0 มีผลต่างจาก integer: nonzero/0 จะได้ `+Inf` หรือ `-Inf` ส่วน 0/0 จะได้ `NaN` และไม่มี `%` สำหรับ float

---
## Step 6: รู้จัก complex และ string/rune

### Complex number

Go รองรับ complex number ในฐานะชนิดข้อมูลหลัก มีสองชนิด:

- `complex64` ใช้ `float32` แทน real part และ imaginary part
- `complex128` ใช้ `float64` แทน real part และ imaginary part

สร้างด้วย built-in function `complex` และอ่านส่วนจริง/ส่วนจินตภาพด้วย `real` และ `imag`:

```go
package main

import (
	"fmt"
	"math/cmplx"
)

func main() {
	x := complex(2.5, 3.1)
	y := complex(10.2, 2)

	fmt.Println("x + y:", x+y)
	fmt.Println("real(x):", real(x))
	fmt.Println("imag(x):", imag(x))
	fmt.Println("abs(x):", cmplx.Abs(x))
}
```

ถ้า argument ทั้งสองเป็น untyped constant/literal ผลลัพธ์จะเป็น untyped complex ซึ่งมี default เป็น `complex128` หากทั้งสองเป็น `float32` จะได้ `complex64` กรณีอื่นโดยทั่วไปจะได้ `complex128` ส่วน imaginary literal จะเขียนลงท้ายด้วย `i` เช่น `2.5i`

ในงานทั่วไป complex ไม่ได้ถูกใช้บ่อย หากต้องทำ numerical computing จริง ๆ ให้ดู package **Gonum** แต่ควรพิจารณาภาษาหรือ library ที่เหมาะกับงานก่อน

### String และ rune

`string` เป็น built-in type ที่รองรับ Unicode และมี zero value เป็น empty string โดย string ใน Go เป็น immutable: assign ค่าใหม่ให้ตัวแปรได้ แต่เปลี่ยนข้อมูลภายใน string เดิมไม่ได้

```go
package main

import "fmt"

func main() {
	message := "สวัสดี Go"

	fmt.Println(message)
	fmt.Println("ว่างหรือไม่:", message == "")
}
```

`rune` ใช้แทน character หนึ่งตัว และเป็น alias ของ `int32` ถ้าตัวแปรหมายถึง character ให้ใช้ `rune` ไม่ใช่ `int32` เพราะชื่อ type ช่วยสื่อเจตนา:

```go
var firstInitial rune = 'J' // สื่อว่าค่านี้เป็น character
```

---
## Step 7: Convert type ด้วยตัวเอง

Go ไม่ทำ automatic type promotion เพื่อป้องกันผลลัพธ์ที่คาดเดาได้ยาก เมื่อ type ไม่ตรงกันต้อง convert อย่างชัดเจน:

```go
package main

import "fmt"

func main() {
	var count int = 10
	var price float64 = 30.2

	total := float64(count) + price
	whole := count + int(price)

	fmt.Println("total:", total)
	fmt.Println("whole:", whole)
}
```

ผลลัพธ์คือ:

```text
total: 40.2
whole: 40
```

การ convert `float64` เป็น `int` จะตัดส่วนทศนิยม ไม่ได้ปัดเศษ จึงควรตรวจสอบว่าการตัดเศษตรงกับความต้องการของงานหรือไม่

---
## Step 8: ทำความเข้าใจว่า literal เป็น untyped

Go ยอมให้ integer literal ใช้กับ float ได้ เพราะ literal ยังไม่มี type ตายตัว:

```go
var x float64 = 10
var y float64 = 200.3 * 5
```

แต่ตัวแปร integer คนละ type นำมาบวกกันไม่ได้โดยไม่ convert:

```go
var a int = 10
var b int64 = 20

// var total = a + b // ❌ compile ไม่ผ่าน
var total = int64(a) + b
```

untyped literal มีขอบเขตเช่นกัน:

- assign string literal ให้ numeric variable ไม่ได้
- assign float literal ให้ `int` ไม่ได้ถ้าค่ามีส่วนทศนิยม
- assign literal ที่เกินช่วงของ type ไม่ได้ เช่น `1000` ให้ `byte`

```go
var ok byte = 100
// var tooLarge byte = 1000 // ❌ 1000 เกินช่วงของ byte
```

---
## Step 9: เลือกใช้ `var` หรือ `:=`

Go มีวิธีประกาศตัวแปรสองแบบที่ใช้บ่อย:

| รูปแบบ | ใช้เมื่อ |
|---|---|
| `var x int = 10` | ต้องการระบุทั้ง type และค่าอย่างชัดเจน |
| `var x = 10` | ต้องการให้ Go infer type จากค่า |
| `var x int` | ตั้งใจใช้ zero value |
| `x := 10` | ประกาศตัวแปรใน function แบบกระชับ |
| `var ( ... )` | จัดกลุ่มการประกาศระดับ package |

### ใช้ `:=` ใน function

`:=` หรือ short declaration ใช้ได้เฉพาะใน function และสามารถ assign ให้ตัวแปรเดิมได้ หากทางซ้ายมีตัวแปรใหม่อย่างน้อยหนึ่งตัว:

```go
func main() {
	x := 10
	x, y := 30, "hello" // x เดิม, y เป็นตัวแปรใหม่
	fmt.Println(x, y)
}
```

ที่ package level ใช้ `:=` ไม่ได้ ต้องใช้ `var`:

```go
var appName = "go-types" // ✅ package level

// appVersion := 1 // ❌ package level ใช้ := ไม่ได้
```

หลักการเลือกใช้:

1. ใน function ใช้ `:=` เป็นหลัก
2. ใช้ `var x int` เมื่อจงใจใช้ zero value
3. ใช้ `var x byte = 20` เมื่อต้องการ type เฉพาะ
4. ใช้ `var` เมื่อกลัวว่า `:=` จะสร้างตัวแปรใหม่โดยไม่ตั้งใจ (shadowing)

หลีกเลี่ยงตัวแปร mutable ที่ package level เพราะทำให้ติดตาม data flow ได้ยาก ควรประกาศ package-level variable เฉพาะค่าที่ effectively immutable เท่านั้น

---
## Step 10: ใช้ `const` กับค่าที่ compile ได้

`const` ใช้ตั้งชื่อให้กับค่าที่ compiler คำนวณได้ตอน compile time ไม่ใช่ immutable variable ที่รับค่า runtime ได้:

```go
const maxRetries = 3
const serviceName string = "checkout"

const (
	statusOK    = "ok"
	statusError = "error"
)
```

ค่าที่ใช้กับ `const` ได้ ได้แก่:

- numeric literal
- `true` และ `false`
- string และ rune
- ค่าที่คืนจาก `complex`, `real`, `imag`, `len`, `cap` ในกรณีที่ compiler คำนวณได้
- นิพจน์ที่ประกอบจากค่าและ operator เหล่านี้

ตัวอย่างต่อไปนี้ compile ไม่ผ่าน เพราะ `x` และ `y` เป็นค่าที่เกิดตอน runtime:

```go
func main() {
	x := 5
	y := 10
	// const z = x + y // ❌ x + y ไม่ใช่ constant
}
```

constant เป็นได้ทั้ง typed และ untyped:

```go
const flexible = 10       // untyped: ยืดหยุ่นกว่า
const typedValue int = 10 // typed: ต้องใช้กับ int

var i int = flexible       // ✅
var f float64 = flexible   // ✅
var b byte = flexible      // ✅
var j int = typedValue     // ✅
// var g float64 = typedValue // ❌ type ไม่ตรงกัน
```

มีค่าพิเศษชื่อ `iota` สำหรับสร้างค่าต่อเนื่องใน `const` ตัวแรกในกลุ่มมีค่า `0` ตัวถัดไปเพิ่มทีละ `1`:

```go
const (
	statusOK    = iota // 0
	statusError        // 1
	statusUnknown      // 2
)
```

`iota` เหมาะกับ enumeration แบบง่าย ๆ และจะกลับมาใช้เต็มรูปแบบในบทว่าด้วย type

Go ไม่มี immutable array, slice, map หรือ struct แบบสำเร็จรูป และไม่มีวิธีทำให้ field ของ struct immutable โดยตรง แต่ภายใน function เรามักเห็นได้ชัดอยู่แล้วว่าตัวแปรถูกแก้ไขหรือไม่

---
## Step 11: เข้าใจกฎ unused variable

Go บังคับว่า local variable ที่ประกาศแล้วต้องถูกอ่านอย่างน้อยหนึ่งครั้ง:

```go
func main() {
	x := 10
	// ถ้าไม่ใช้ x เลย จะ compile ไม่ผ่าน
	fmt.Println(x)
}
```

compiler ตรวจสอบการประกาศตัวแปรได้ดี แต่ไม่ได้ตรวจจับ unused assignment ทุกกรณี:

```go
func main() {
	x := 10 // มีการอ่านภายหลัง จึงไม่ error
	x = 20
	fmt.Println(x)
	x = 30 // assignment นี้ไม่มีการอ่านค่า
}
```

`go vet` ก็ไม่ได้ตรวจจับ unused assignment เหล่านี้ทั้งหมด หากต้องการตรวจละเอียดขึ้นให้ใช้ third-party tool เช่น `staticcheck` หรือ `golangci-lint` ส่วน package-level variable ที่ไม่ถูกอ่าน compiler ไม่ถือเป็น error ซึ่งเป็นอีกเหตุผลที่ควรหลีกเลี่ยง package-level mutable variable

constant ที่ไม่ถูกอ่านไม่ทำให้ compile error เพราะ constant ถูกคำนวณตอน compile time และไม่มี side effect:

```go
const unusedConstant = "ยังไม่ได้ใช้" // ✅ compile ได้
```

---
## Step 12: ตั้งชื่อให้สื่อความหมาย

Go มีกฎพื้นฐานว่าชื่อต้องขึ้นต้นด้วยตัวอักษรหรือ underscore จากนั้นจึงตามด้วยตัวเลข, underscore หรือตัวอักษรได้ Unicode character ที่เป็น letter หรือ digit ก็ใช้ได้ แต่ไม่ควรใช้ชื่อที่มองด้วยตาแล้วคล้ายกัน:

```go
ａ := "Unicode U+FF41"
a := "ASCII lowercase a"

// สองตัวแปรนี้ดูคล้ายกัน แต่เป็นคนละตัวแปร
```

แนวทางตั้งชื่อแบบ idiomatic Go:

- ใช้ `camelCase` ไม่ใช่ `snake_case` เช่น `indexCounter`
- ไม่ใช้ ALL_CAPS สำหรับ constant เพราะ case ของตัวอักษรแรกใช้กำหนดการ export ใน package-level declaration
- ใน function ใช้ชื่อสั้นเมื่อ scope แคบ เช่น `i`, `j`, `k`, `v`
- ไม่ใส่ type ไว้ในชื่อ เพราะ Go เป็น strongly typed อยู่แล้ว
- ใน package block ใช้ชื่อที่บรรยายมากขึ้น เพราะ scope กว้างกว่า

ชื่อ `_` เรียกว่า blank identifier และมีความหมายพิเศษใน Go จะอธิบายเพิ่มเติมในบทว่าด้วย function

---
## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดดูเฉลยก่อน:

1. ประกาศ integer `i` ให้มีค่า 20 แล้ว convert ไปเป็น float `f` จากนั้น print ค่าของทั้งสองตัวแปร
2. ประกาศ untyped constant `value` ที่นำไป assign ให้ทั้ง `int` และ `float64` ได้ แล้ว print ค่าทั้งสองแบบ
3. ประกาศ `b` (byte), `smallI` (int32) และ `bigI` (uint64) กำหนดค่า max ของแต่ละ type แล้วบวก 1 สังเกตผลลัพธ์และ overflow
4. เขียนโค้ดที่ประกาศ `name := ""` แล้ว print `"มีชื่อ"` หรือ `"ไม่มีชื่อ"` ตามค่าของ `name` โดยห้ามใช้ `if name` แบบภาษาอื่น
5. สร้าง constant กลุ่มสถานะด้วย `iota` แล้ว print ค่าของแต่ละสถานะ

หลังทำเสร็จให้ตรวจโค้ด:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---
## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คาดหวัง truthiness** — `if x` ใช้ไม่ได้เมื่อ `x` ไม่ใช่ `bool` ต้องใช้ comparison เช่น `x != ""`
- **ลืม convert type** — Go ไม่มี automatic type promotion แม้แต่ integer คนละขนาดก็ต้อง convert ก่อน
- **ใช้ float แทนเงิน** — floating-point ไม่ exact ใช้ decimal module แทน
- **หาร integer ด้วย 0** — จะเกิด panic
- **ใช้ `==` เปรียบเทียบ float** — ผลอาจคลาดเคลื่อน ให้ใช้ epsilon
- **ใช้ `:=` แล้วเกิด shadowing** — ตรวจให้แน่ใจว่ากำลัง assign ตัวแปรเดิม ไม่ได้สร้างตัวแปรใหม่ใน scope ซ้อน
- **ประกาศ local variable แล้วไม่ใช้** — compile ไม่ผ่าน
- **ใช้ `0777` โดยไม่รู้ว่าเป็น octal** — ใช้ `0o777` เพื่อสื่อความหมายชัดกว่า
- **สร้าง package-level mutable variable มากเกินไป** — ทำให้ติดตาม data flow และหาจุดที่แก้ค่าได้ยาก

---
## สรุป

ในบทนี้เราได้:

1. ✅ ทดลอง `zero value` ของ type พื้นฐาน
2. ✅ เข้าใจว่า literal เป็น untyped จนกว่าจะมีบริบทกำหนด type
3. ✅ เลือกใช้ integer, float, complex, string และ rune ได้เหมาะสม
4. ✅ เรียนรู้ว่า Go ไม่มี truthiness และไม่มี automatic type promotion
5. ✅ convert type ด้วยตัวเองเมื่อ type ไม่ตรงกัน
6. ✅ เลือกใช้ `var` และ `:=` ตาม scope และเจตนา
7. ✅ ใช้ `const` เฉพาะค่าที่คำนวณได้ตอน compile time
8. ✅ เข้าใจกฎ unused local variable และแนวทางตั้งชื่อแบบ idiomatic Go

หลักสำคัญของบทนี้คือ **เขียนโค้ดให้ชัดเจนถึงเจตนา** ความ verbose ที่เพิ่มขึ้นจากการ convert หรือการประกาศ type อย่างชัดเจน เป็นราคาที่ Go ยอมจ่ายเพื่อให้โค้ดอ่านและตรวจสอบได้ง่าย

> *ในตอนต่อไปเราจะเริ่มจาก composite types ของ Go ได้แก่ array, slice, map และ struct*

---

## Glossary

- **Predeclared type** — type ที่ติดมากับภาษา เช่น `bool`, integer, float, complex, string และ rune
- **Zero value** — ค่าเริ่มต้นที่ Go กำหนดให้ตัวแปรที่ประกาศแล้วแต่ยังไม่ได้กำหนดค่า
- **Literal** — ค่าที่เขียนระบุไว้โดยตรงในโค้ด เช่น `10`, `3.14`, `'A'` หรือ `"hello"`
- **Untyped** — ยังไม่มี type ตายตัวจนกว่าจะมีบริบทกำหนด
- **Automatic type promotion** — การแปลง type อัตโนมัติเมื่อ type ไม่ตรงกัน ซึ่ง Go ไม่ทำ
- **Truthiness** — การตีค่า non-bool ให้เป็น boolean ซึ่ง Go ไม่อนุญาต
- **Rune** — alias ของ `int32` ที่ใช้แทน character
- **Typed constant** — constant ที่มี type ระบุไว้และใช้ได้กับตัวแปร type ที่ตรงกัน
- **Untyped constant** — constant ที่ทำงานเหมือน literal และยืดหยุ่นกับ type ที่ compatible
- **Epsilon** — ค่าความแตกต่างสูงสุดที่ยอมรับได้เมื่อเปรียบเทียบ float
- **`iota`** — ค่าพิเศษที่ช่วยสร้างค่าต่อเนื่องภายใน `const`

---
## Related

- [ตอนที่ 1: Setting Up Your Go Environment](/go/01-setting-up-your-go-environment/) — ติดตั้ง Go, สร้าง module และ workflow `fmt → vet → build`
