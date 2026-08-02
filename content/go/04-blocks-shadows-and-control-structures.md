+++
title = 'ตอนที่ 4: Blocks, Shadows, and Control Structures'
date = '2026-08-02T00:00:00+07:00'
draft = false
description = 'เรียนรู้ block, scope และ shadowing พร้อม control structures ทั้งหมดของ Go — if, for ทั้งสี่รูปแบบ, for-range, switch, blank switch และ goto แบบ step by step'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่ 4 เราจะปูพื้นฐาน "ตรรกะและการจัดระเบียบโปรแกรม" ของ Go หลังจากตอนที่แล้วเราจัดกลุ่มข้อมูลด้วย composite types ได้แล้ว ตอนนี้เราจะมาทำให้โปรแกรมตัดสินใจและวนซ้ำได้ด้วย block, `if`, `for`, `switch` และรู้ว่า `goto` มีอยู่จริงแต่แทบไม่ควรใช้

สิ่งที่ได้ตอนจบบทนี้:

- เข้าใจ block และกฎการมองเห็นตัวแปร (scope) ซึ่งเป็นรากของทุกอย่างที่เหลือ
- รู้จัก shadowing และหลีกเลี่ยงบั๊กที่เกิดจาก `:=`
- ใช้ `if` พร้อมตัวแปรที่ scope กับทั้ง if/else
- ใช้ `for` ทั้งสี่รูปแบบ และเลือก `for-range` ให้ถูกงาน
- ใช้ `switch` และ blank switch ให้สื่อเจตนา
- รู้ว่าทำไม `goto` จึงถูกจำกัดจนแทบไร้อันตราย

{{< mermaid >}}
graph TD
  U[Universe block: predeclared identifiers] --> P[Package block]
  P --> F[File block: imports]
  F --> Fn[Function block: params + locals]
  Fn --> B["Inner blocks: {} ของ if / for / switch"]
  B -->|declare ชื่อซ้ำกับชั้นนอก| S[Shadowing]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะใช้ project แยกชื่อ `go_blocks_control` เพื่อให้ทดลองโค้ดได้โดยไม่กระทบ project จากตอนก่อน เปิด terminal แล้วรัน:

```sh
mkdir go_blocks_control
cd go_blocks_control
go mod init go_blocks_control
touch main.go
```

ในแต่ละ step ให้เปิดไฟล์ `main.go`, วางโค้ดตัวอย่างลงไป แล้วรัน:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านจะมีคำอธิบายกำกับไว้ อย่าวางตัวอย่างเหล่านั้นรวมกับโปรแกรมที่ต้องการรัน

---
## Step 1: เริ่มจาก block — ทุกตำแหน่งที่ประกาศตัวแปร

ก่อนอื่นเรามาทำความเข้าใจว่า "ตัวแปรมองเห็นได้ที่ไหน" ซึ่ง Go กำหนดด้วยโครงสร้างที่เรียกว่า **block** ทุกที่ที่เกิด declaration คือ block และ block ก็ซ้อนกันเป็นชั้นได้:

- **Package block** — ตัวแปร, constant, type และ function ที่ประกาศนอก function ทั้งหมด
- **File block** — ชื่อ package ที่เกิดจาก `import` (valid เฉพาะไฟล์ที่มี import นั้น)
- **Function block** — ตัวแปรที่ define ที่ top level ของ function รวมถึง parameter
- **Inner block** — ทุกคู่ `{}` ภายใน function รวมถึง control structures อย่าง `if`, `for`, `switch` ที่สร้าง block ของตัวเอง

หลักการสำคัญคือ **เข้าถึง identifier ที่ define ใน block ชั้นนอกได้จาก block ชั้นในใด ๆ** ลองวางโค้ดนี้แล้วรัน:

```go
package main

import "fmt"

var hello = "สวัสดีจาก package block" // package block

func main() {
	message := "สวัสดีจาก function block" // function block
	if true {
		inner := "สวัสดีจาก inner block" // inner block
		fmt.Println(hello)
		fmt.Println(message)
		fmt.Println(inner)
	}
	// fmt.Println(inner) // ❌ compile error: undefined: inner
}
```

`inner` ถูกประกาศใน block ของ `if` จึงเห็นได้เฉพาะข้างใน เมื่อปิด `}` ของ `if` ตัวแปรก็หมดอายุ ส่วน `hello` กับ `message` อยู่ใน block ชั้นนอก จึงมองเห็นได้จาก block ชั้นในทุกชั้น

---
## Step 2: Shadowing — เมื่อชื่อซ้ำ ชั้นในสุดชนะ

คำถามต่อมาคือ ถ้าใน block ชั้นในมี declaration ที่ชื่อซ้ำกับ identifier ใน block ที่ครอบอยู่ จะเกิดอะไรขึ้น — คำตอบคือคุณกำลัง **shadow** identifier ตัวที่อยู่ชั้นนอก

ลองโค้ดนี้ดู:

```go
package main

import "fmt"

func main() {
	x := 10
	if x > 5 {
		fmt.Println(x) // 10 — เห็น x ชั้นนอก
		x := 5         // declare x ใหม่ใน block ของ if → shadow
		fmt.Println(x) // 5 — เห็น x ที่บัง
	}
	fmt.Println(x) // 10 — กลับมาเห็น x ชั้นนอก
}
```

ผลลัพธ์คือ `10`, `5`, `10` สังเกตว่า `x` ตัวนอก **ไม่ได้หายไปหรือถูก reassign** เพียงแต่เอื้อมไม่ถึงตอนที่ถูกบัง และเมื่อ `if` block จบลง ตัวที่บังก็จบตามไปด้วย

> [!WARNING]
> เหตุผลที่บางครั้งควรหลีกเลี่ยง `:=` เพราะมัน shadow ตัวแปรโดยไม่ตั้งใจได้ง่ายมาก จำไว้ว่า `:=` ใช้สร้างและ assign หลายตัวพร้อมกันได้ และไม่จำเป็นต้องเป็นตัวใหม่ทุกตัวทางซ้าย — ขอแค่มีตัวใหม่อย่างน้อยหนึ่งตัว `:=` ก็ legal แล้ว ซึ่งเป็นช่องให้เผลอ shadow

### Shadowing ด้วย multiple assignment

แม้มี `x` ใน block ชั้นนอก การเขียน `x, y := 5, 20` ภายใน `if` ก็ยัง shadow `x` อยู่ดี เพราะ `:=` **reuse เฉพาะตัวแปรที่ declare ใน block ปัจจุบันเท่านั้น**:

```go
package main

import "fmt"

func main() {
	x := 10
	if x > 5 {
		x, y := 5, 20 // x ถูก shadow (ไม่ reuse ตัวนอก), y เป็นตัวใหม่
		fmt.Println(x, y) // 5 20
	}
	fmt.Println(x) // 10
}
```

### Shadowing package name

ต้องระวังไม่ให้ shadow ชื่อ package ที่ import มา ตัวอย่างนี้ compile ไม่ผ่าน:

```go
package main

import "fmt"

func main() {
	x := 10
	fmt.Println(x)
	fmt := "oops" // ← shadow package fmt
	fmt.Println(fmt) // ❌ compile error: fmt.Println undefined (type string has no field or method Println)
}
```

local variable `fmt` (ชนิด `string`) บัง package `fmt` ใน file block ทำให้เรียกใช้ `fmt.Println` ไม่ได้ตลอดส่วนที่เหลือของ `main`

### Universe block — identifier ที่ห้ามแตะ

Go มี keyword แค่ 25 ตัว และ built-in types (`int`, `string`), constants (`true`, `false`), functions (`make`, `close`) รวมถึง `nil` **ไม่ได้เป็น keyword** — มันคือ **predeclared identifiers** ที่ define ใน **universe block** ซึ่งเป็น block ที่ครอบ block อื่นทั้งหมด

เพราะอยู่ใน universe block จึงถูก shadow ใน scope อื่นได้ เช่น `true := 10` แล้ว `fmt.Println(true)` จะพิมพ์ `10` ได้จริง:

```go
true := 10            // ❌ อย่าทำตามเด็ดขาด — compile ผ่านแต่สร้างความสับสน
fmt.Println(true)     // 10
```

> [!WARNING]
> อย่า redefine identifier ใน universe block เด็ดขาด ถ้าโชคดีได้ compilation error ถ้าไม่โชคดีจะตามหา bug ยากมาก ส่วน shadowing ทั่วไป `go vet` ไม่รายงานเป็น error เพราะมันมีประโยชน์ในบางกรณี — ต้องพึ่ง third-party tool ในการตรวจจับ accidental shadowing

---
## Step 3: `if` — ไม่มีวงเล็บ มี scoped variable

`if` ใน Go คล้ายภาษาอื่นมาก ความต่างที่เห็นชัดสุดคือ **ไม่ใส่วงเล็บรอบ condition** และจุดเด่นเฉพาะคือประกาศตัวแปรที่ **scope เข้ากับทั้ง block ของ if และ else**:

```go
package main

import (
	"fmt"
	"math/rand"
)

func main() {
	if n := rand.Intn(10); n == 0 {
		fmt.Println("That's too low")
	} else if n > 5 {
		fmt.Println("That's too big:", n)
	} else {
		fmt.Println("That's a good number:", n)
	}
}
```

ตัวแปร `n` ถูก declare ไว้ในส่วนก่อน semicolon แล้ว scope ของมันครอบคลุมทั้ง `if`, `else if` และ `else` พอจบชุด if/else `n` ก็หมดอายุ — ลองเพิ่ม `fmt.Println(n)` หลังจบชุดดู จะได้ compile error `undefined: n` ประโยชน์คือสร้างตัวแปรที่ available เฉพาะตรงที่ต้องใช้ ไม่หลุดไปปนกับ scope อื่น

> [!CAUTION]
> ทางเทคนิคคุณใส่ simple statement อะไรก็ได้ก่อน comparison (เช่น function call หรือ assign ค่าใหม่ให้ตัวแปรเดิม) แต่ **อย่าทำ** — ใช้ฟีเจอร์นี้เพื่อ define ตัวแปรใหม่ที่ scope กับ if/else เท่านั้น อย่างอื่นทำให้สับสน และจำไว้ว่าตัวแปรที่ declare ใน `if` ก็ shadow ตัวแปรชั้นนอกได้เหมือน block อื่น ๆ

---
## Step 4: `for` สี่รูปแบบ — keyword วนซ้ำตัวเดียวของภาษา

เช่นเดียวกับภาษาตระกูล C Go ใช้ `for` วนซ้ำ แต่จุดต่างคือ **`for` เป็น keyword วนซ้ำตัวเดียวของภาษา** — ไม่มี `while` ไม่มี `do` Go ทำได้ด้วยการให้ `for` มีสี่รูปแบบ:

| รูปแบบ | หน้าตา | ใช้เมื่อ |
|---|---|---|
| Complete (C-style) | `for i := 0; i < 10; i++` | วนแบบไม่ใช่จากต้นถึงท้าย / คุม index เอง |
| Condition-only | `for i < 100` | วนตามค่าที่คำนวณ (แทน `while`) |
| Infinite | `for {}` | วนไม่จบ ต้องมี `break`/`return` ข้างใน |
| for-range | `for i, v := range x` | วนทุก element ของ compound type |

### Complete for

แบบแรกเหมือน C/Java/JavaScript มีสามส่วนคั่นด้วย semicolon และไม่มีวงเล็บ:

```go
package main

import "fmt"

func main() {
	for i := 0; i < 10; i++ {
		fmt.Println(i) // 0..9
	}
}
```

รายละเอียดที่ต้องจำ:

- **Initialization** — ต้องใช้ `:=` (ใช้ `var` ไม่ได้) และ shadow ตัวแปรชั้นนอกตรงนี้ได้เช่นกัน
- **Comparison** — ต้องเป็น expression ที่ได้ `bool` เช็คก่อนทุก iteration ถ้า `true` จึงรัน body
- **Increment** — มักเป็น `i++` แต่เป็น assignment อะไรก็ได้ รันหลังจบแต่ละ iteration ก่อนเช็ค condition

Go ยอมให้ละส่วนใดส่วนหนึ่งของ for ได้ ที่พบบ่อยคือละ initialization (เพราะคำนวณค่ามาก่อน loop) หรือละ increment (เพราะมี logic เพิ่มค่าซับซ้อนใน body):

```go
i := 0
for ; i < 10; i++ { // ละ initialization — semicolon ยังอยู่
	fmt.Println(i)
}

for i := 0; i < 10; { // ละ increment
	fmt.Println(i)
	if i%2 == 0 {
		i++
	} else {
		i += 2
	}
}
```

### Condition-only for — แทน `while`

เมื่อละ **ทั้ง** initialization และ increment ให้ **ไม่ใส่ semicolon** เหลือ `for` ที่ทำงานเหมือน `while` ในภาษาอื่น:

```go
package main

import "fmt"

func main() {
	i := 1
	for i < 100 {
		fmt.Println(i)
		i = i * 2
	}
}
```

### Infinite for

แบบที่สามตัด condition ออกด้วย ได้ loop ที่วนไม่จบ:

```go
package main

import "fmt"

func main() {
	for {
		fmt.Println("Hello")
	}
}
```

กด Ctrl-C เพื่อหยุด (และถ้ารันบน The Go Playground จะถูกตัดหลังไม่กี่วินาทีเพราะเป็น shared resource)

### break และ continue

`break` ออกจาก loop ทันที ใช้ได้กับ for ทุกแบบไม่ใช่แค่ infinite for ส่วน `continue` ข้าม body ที่เหลือไป iteration ถัดไป ทางเทคนิคไม่จำเป็นต้องมี แต่ช่วยให้โค้ดอ่านง่ายขึ้นมาก

Go สนับสนุน **if body สั้น ๆ ชิดซ้ายมากที่สุด** เพราะ nested code อ่านยาก เทียบ FizzBuzz ที่ใช้ `continue` ให้เงื่อนไขเรียงชิดซ้าย:

```go
for i := 1; i <= 100; i++ {
	if i%3 == 0 && i%5 == 0 {
		fmt.Println("FizzBuzz")
		continue
	}
	if i%3 == 0 {
		fmt.Println("Fizz")
		continue
	}
	if i%5 == 0 {
		fmt.Println("Buzz")
		continue
	}
	fmt.Println(i)
}
```

> [!TIP]
> Go ไม่มี `do` แบบ Java/C/JavaScript ถ้าต้องการวนอย่างน้อยหนึ่งรอบ วิธีสะอาดที่สุดคือ infinite for ที่จบด้วย `if`:
>
> ```go
> for {
> 	// things to do in the loop
> 	if !CONDITION {
> 		break
> 	}
> }
> ```
>
> สังเกตว่า condition มี `!` นำหน้า — โค้ด Go ระบุ "เงื่อนไขที่จะออก" ขณะที่ Java `do/while` ระบุ "เงื่อนไขที่จะอยู่ต่อ"

---
## Step 5: `for-range` — วนทุก element ของ compound type

รูปแบบที่สี่ใช้วน element ของ built-in types บางตัว ใช้ได้กับ string, array, slice, map (และ channel ซึ่งจะเจอในตอนเรื่อง concurrency) — **เฉพาะ built-in compound types และ user-defined types ที่สร้างบนพวกนี้**:

```go
package main

import "fmt"

func main() {
	evenVals := []int{2, 4, 6, 8, 10, 12}
	for i, v := range evenVals {
		fmt.Println(i, v) // i = index, v = value
	}
}
```

จุดเด่นคือได้ **สอง loop variable**: ตัวแรกคือตำแหน่ง (index/key) ตัวที่สองคือค่า ณ ตำแหน่งนั้น ชื่อ idiomatic ขึ้นกับสิ่งที่วน — array/slice/string ใช้ `i`, map ใช้ `k`, ค่ามักใช้ `v`

ถ้า **ไม่ต้องการตัวแรก** ใช้ `_` แทน (Go บังคับให้เข้าถึงตัวแปรที่ declare ทุกตัว):

```go
for _, v := range evenVals {
	fmt.Println(v)
}
```

ถ้าต้องการ **key แต่ไม่เอา value** ให้ละตัวที่สองทิ้งได้เลย: `for k := range uniqueNames` เหตุผลที่พบบ่อยคือใช้ map เป็น set ส่วนการละ value ตอนวน array/slice นั้นหายาก — ถ้าเจอตัวเองทำแบบนี้กับ array/slice มีโอกาสสูงว่าเลือก data structure ผิดและควร refactor

### วน map — ลำดับไม่คงที่ และนั่นคือความตั้งใจ

การวน map ด้วย for-range มีพฤติกรรมพิเศษ: **ลำดับ key/value แตกต่างกันในแต่ละครั้งที่วน** ลองวน map เดิมสามรอบดู จะได้ลำดับต่างกันทุกครั้ง นี่คือ **security feature** — ใน Go รุ่นเก่า ลำดับ iteration มักจะ (แต่ไม่เสมอ) เหมือนเดิมถ้า insert items ชุดเดิม ซึ่งก่อให้เกิดสองปัญหา: คนเขียนโค้ดสมมติว่าลำดับคงที่แล้วโค้ดพังในเวลาแปลก ๆ และถ้า map hash items ไปค่าเดิมเสมอ จะโดน attack ชื่อ **Hash DoS** ที่ส่งข้อมูลให้ key hash ลง bucket เดียวกันทั้งหมดจน server ช้า

Go team แก้สองอย่าง: ปรับ hash algorithm ของ map ให้ใส่ random number ที่ generate ทุกครั้งที่สร้าง map variable และทำให้ลำดับ for-range iteration บน map แกว่งเล็กน้อยทุกรอบ ทั้งสองทำให้ Hash DoS ยากขึ้นมาก

> [!NOTE]
> มีข้อยกเว้นหนึ่ง: เพื่อให้ debug/log map ง่าย formatting functions (เช่น `fmt.Println`) จะพิมพ์ map โดยเรียง key จากน้อยไปมากเสมอ

### วน string — ได้ rune ไม่ใช่ byte

การวน string ด้วย for-range ก็มีพฤติกรรมพิเศษเช่นกัน — มัน **วนบน rune ไม่ใช่ byte** เมื่อเจอ multibyte rune มันแปลง UTF-8 เป็นเลข 32-bit ตัวเดียวแล้ว assign ให้ value ส่วน offset เพิ่มตามจำนวน byte ของ rune นั้น:

```go
package main

import "fmt"

func main() {
	samples := []string{"hello", "apple_π!"}
	for _, sample := range samples {
		for i, r := range sample {
			fmt.Println(i, r, string(r))
		}
		fmt.Println()
	}
}
```

เมื่อวน `"apple_π!"` index จะ **ข้ามเลข 7** — เพราะ `π` กิน 2 byte ตำแหน่งถัดไปจึงเป็น 8 (ไม่ใช่ 7) และที่ตำแหน่ง 6 ได้ค่า `960` (`π`) ซึ่งใหญ่เกิน byte ถ้าเจอ byte ที่ไม่ใช่ UTF-8 ที่ valid จะคืน Unicode replacement character (`0xfffd`)

> [!IMPORTANT]
> ใช้ for-range loop เพื่อเข้าถึง rune ใน string ตามลำดับ — ตัวแปรแรกคือจำนวน byte จากต้น string แต่ type ของตัวแปรที่สองคือ `rune`

### ค่าใน for-range เป็น copy

ทุก iteration for-range **copy** ค่าจาก compound type ไปยัง value variable การแก้ value variable **ไม่กระทบ** ค่าใน compound type ต้นทาง:

```go
package main

import "fmt"

func main() {
	evenVals := []int{2, 4, 6, 8, 10, 12}
	for _, v := range evenVals {
		v *= 2
	}
	fmt.Println(evenVals) // [2 4 6 8 10 12] — ไม่เปลี่ยน
}
```

> [!WARNING]
> **การเปลี่ยนพฤติกรรมตั้งแต่ Go 1.22:** ก่อน 1.22 — index และ value variable ถูกสร้างครั้งเดียวแล้ว reuse ทุก iteration ตั้งแต่ 1.22 — default คือสร้าง index และ value variable **ใหม่ทุก iteration** การเปลี่ยนนี้ป้องกัน bug ที่พบบ่อยตอน launch goroutine ใน for-range loop และเป็น backward-breaking change จึงควบคุมได้ด้วยการระบุ Go version ใน `go` directive ของ `go.mod`

### เลือกใช้ for ให้ตรงงาน

| สถานการณ์ | ใช้ |
|---|---|
| วนทุก element ของ compound type | **for-range** (ตัด boilerplate, ให้ rune ถูกต้องตอนวน string) |
| ไม่ได้วนจากตัวแรกถึงตัวสุดท้าย / คุม start-end เอง | complete for |
| วนตามค่าที่คำนวณ (เหมือน `while`) | condition-only |
| iterator pattern / loop ที่ต้องมี break-return | infinite for |

ส่วนใหญ่จะใช้ **for-range** เป็นวิธีที่ดีที่สุดในการเดิน string, slice, map และ channel เทียบโค้ดวน element ที่สองถึงรองสุดท้าย — complete for สั้นและเข้าใจง่ายกว่า for-range ที่ต้องใส่ `if` + `continue` + `break`:

```go
evenVals := []int{2, 4, 6, 8, 10}
for i := 1; i < len(evenVals)-1; i++ {
	fmt.Println(i, evenVals[i])
}
```

> [!CAUTION]
> pattern complete for แบบข้างบนใช้ข้ามต้น string ไม่ได้ เพราะ standard for ไม่ handle multibyte character — ถ้าจะข้าม rune บางตัวใน string ต้องใช้ for-range เพื่อให้ process rune ถูกต้อง และ infinite for ควรมี `break` หรือ `return` ใน body เสมอ เพราะแทบไม่มีงานจริงที่อยากวนตลอดกาล

---
## Step 6: Label — ตอนที่ต้อง break/continue loop ชั้นนอก

โดย default `break`/`continue` มีผลกับ for loop ที่ครอบมันโดยตรง ถ้ามี nested for แล้วอยากออก/ข้าม iteration ของ loop ชั้นนอก ให้ **ใส่ label** บน for ชั้นนอก:

```go
package main

import "fmt"

func main() {
	samples := []string{"hello", "apple_π!"}
outer:
	for _, sample := range samples {
		for i, r := range sample {
			fmt.Println(i, r, string(r))
			if r == 'l' {
				continue outer // ข้ามไป sample ถัดไปทันทีที่เจอ 'l'
			}
		}
		fmt.Println()
	}
}
```

`go fmt` จะ indent label `outer` ให้อยู่ระดับเดียวกับ brace ของ block เพื่อให้สังเกตง่าย nested for พร้อม label นั้นหายาก ส่วนใหญ่ใช้ implement algorithm ที่ต้องข้ามไป iteration ชั้นนอกเมื่อเจอเงื่อนไขไม่ผ่านระหว่างวน inner values

---
## Step 7: `switch` — ไม่ fall through โดย default

Go มี `switch` แบบภาษาตระกูล C แต่แก้ข้อจำกัดจนใช้ได้จริง (นักพัฒนาภาษาอื่นมักเลี่ยง switch เพราะข้อจำกัดเรื่องค่าที่ switch ได้และพฤติกรรม fall-through) ตอนนี้ครอบคลุม **expression switch** ส่วน **type switch** จะพูดตอน interfaces:

```go
package main

import "fmt"

func main() {
	words := []string{"a", "cow", "smile", "gopher", "octopus", "anthropologist"}
	for _, word := range words {
		switch size := len(word); size {
		case 1, 2, 3, 4:
			fmt.Println(word, "is a short word!")
		case 5:
			fmt.Println(word, "is exactly the right length:", len(word))
		case 6, 7, 8, 9:
			// empty case — ไม่ทำอะไร
		default:
			fmt.Println(word, "is a long word!")
		}
	}
}
```

ประเด็นสำคัญของ switch ใน Go:

- **ไม่ใส่วงเล็บ** รอบค่าที่เปรียบเทียบ และ declare ตัวแปรที่ scope กับทุก branch ได้ (เช่น `size`)
- ทุก `case`/`default` อยู่ใน `{}` ของ switch แต่ **ไม่ใส่ `{}` รอบเนื้อ case** — มีหลายบรรทัดใน case ได้ ถือเป็น block เดียวกัน ตัวแปรที่ declare ใน case เห็นเฉพาะใน case นั้น
- **ไม่ fall through โดย default** — ไม่ต้องใส่ `break` ท้าย case
- หลายค่าที่ trigger logic เดียวกันให้คั่นด้วย comma (`case 1, 2, 3, 4`)
- **empty case = ไม่ทำอะไร** (เช่น `case 6, 7, 8, 9:` ทำให้ `octopus`/`gopher` ไม่พิมพ์อะไร)
- switch ได้บน **ทุก type ที่เทียบด้วย `==` ได้** — ทุก built-in type ยกเว้น slice, map, channel, function และ struct ที่มี field ของชนิดเหล่านี้

> [!CAUTION]
> Go มี keyword `fallthrough` ให้ case หนึ่งไหลต่อไป case ถัดไป แต่ **คิดให้ดีก่อนใช้** ถ้าพบว่าต้องใช้ `fallthrough` ลอง restructure logic เพื่อตัด dependency ระหว่าง case ออก

และถ้ามี switch อยู่ใน for แล้วอยาก break ออกจาก **for** ต้องใส่ label บน for แล้วใช้ชื่อ label กับ break ไม่งั้น Go จะถือว่า break ออกจาก **case**:

```go
loop:
	for i := 0; i < 10; i++ {
		switch i {
		case 7:
			fmt.Println("exit the loop!")
			break loop // ออกจาก for ไม่ใช่แค่ case
		default:
			fmt.Println(i)
		}
	}
```

### Blank switch — switch ที่ไม่ระบุค่าที่เปรียบเทียบ

เช่นเดียวกับที่ละส่วนของ for ได้ คุณเขียน switch ที่ **ไม่ระบุค่าที่เปรียบเทียบ** ได้ เรียก **blank switch** — switch ปกติเช็คได้แค่ความเท่ากัน แต่ blank switch ใช้ **boolean comparison อะไรก็ได้** ในแต่ละ case:

```go
package main

import "fmt"

func main() {
	words := []string{"hi", "salutations", "hello"}
	for _, word := range words {
		switch wordLen := len(word); { // มี short declaration ได้ แต่ไม่ระบุค่าเทียบ
		case wordLen < 5:
			fmt.Println(word, "is a short word!")
		case wordLen > 10:
			fmt.Println(word, "is a long word!")
		default:
			fmt.Println(word, "is exactly the right length.")
		}
	}
}
```

> [!WARNING]
> Blank switch เจ๋งแต่อย่าใช้เกินจำเป็น ถ้าพบว่าเขียน blank switch ที่ทุก case เป็นการเทียบความเท่ากันกับตัวแปรเดียวกัน (`case a == 2`, `case a == 3`, ...) ให้แทนด้วย expression switch ธรรมดา (`switch a { case 2: ... }`)

### เลือกใช้ if หรือ switch

ในแง่ฟังก์ชัน if/else chain กับ blank switch แทบไม่ต่างกัน — ทั้งคู่ให้เปรียบเทียบเป็นชุด แต่ **switch (แม้ blank switch) สื่อว่ามีความสัมพันธ์ระหว่างค่า/การเปรียบเทียบในแต่ละ case** เขียน FizzBuzz ด้วย blank switch จะอ่านง่ายสุด ไม่ต้องมี `continue` และ default behavior ชัดเจนผ่าน `default`:

```go
for i := 1; i <= 100; i++ {
	switch {
	case i%3 == 0 && i%5 == 0:
		fmt.Println("FizzBuzz")
	case i%3 == 0:
		fmt.Println("Fizz")
	case i%5 == 0:
		fmt.Println("Buzz")
	default:
		fmt.Println(i)
	}
}
```

> [!TIP]
> เลือก blank switch แทน if/else chain เมื่อมี **case ที่สัมพันธ์กันหลายตัว** — switch ทำให้การเปรียบเทียบเด่นชัดและตอกย้ำว่ามันเป็นชุดเรื่องที่เกี่ยวข้องกัน หากแต่ละ case เป็นการเปรียบเทียบที่ไม่เกี่ยวกันเลย ให้ใช้ if/else (Go ไม่ห้าม แต่ไม่ idiomatic)

---
## Step 8: `goto` — มีอยู่จริงแต่ไม่ควรใช้

Go มี control statement ตัวที่สี่คือ `goto` แต่คุณคงแทบไม่ได้ใช้ ตั้งแต่ Edsger Dijkstra เขียน "Go To Statement Considered Harmful" (1968) `goto` ก็เป็นแกะดำของวงการ เพราะดั้งเดิมมันกระโดดไปไหนก็ได้ในโปรแกรม — เข้า/ออก loop, ข้าม variable definition, เข้ากลางชุด statement ใน `if` — ทำให้เข้าใจโปรแกรมยาก ภาษาสมัยใหม่ส่วนใหญ่จึงไม่มี

แต่ Go มี `goto` พร้อม **ข้อจำกัดที่ทำให้เข้ากับ structured programming ได้ดีขึ้น**: `goto` ระบุ labeled line แล้วกระโดดไป แต่ **ห้ามกระโดดข้าม variable declaration** และ **ห้ามกระโดดเข้า inner หรือ parallel block**:

```go
package main

import "fmt"

func main() {
	a := 10
	goto skip
	b := 20
skip:
	c := 30
	fmt.Println(a, b, c)
	if c > a {
		goto inner
	}
	if a < b {
	inner:
		fmt.Println("a is less than b")
	}
}
// ❌ compile errors:
// goto skip jumps over declaration of b
// goto inner jumps into block starting at ...
```

แล้วควรใช้ `goto` ทำอะไร? **ส่วนใหญ่ไม่ควรใช้** labeled `break`/`continue` จัดการการกระโดดออก/ข้าม nested loop ได้แล้ว แต่มี valid use case หนึ่ง: มี logic ที่ไม่อยากรันกลางทาง แต่อยากรันตอนจบ function:

```go
package main

import (
	"fmt"
	"math/rand"
)

func main() {
	a := rand.Intn(10)
	for a < 100 {
		if a%5 == 0 {
			goto done
		}
		a = a*2 + 1
	}
	fmt.Println("do something when the loop completes normally")
done:
	fmt.Println("do complicated stuff no matter why we left the loop")
	fmt.Println(a)
}
```

ทางเลือกแทน `goto` คือ boolean flag หรือ duplicate โค้ดซับซ้อนหลัง loop — แต่ทั้งคู่มีข้อเสีย boolean flag ก็คือ `goto` แบบ verbose กว่า ส่วน duplicate โค้ดทำให้ maintain ยาก ตัวอย่างจริงดูได้ที่ method `floatBits` ใน `atof.go` ของ package `strconv` ใน standard library ซึ่งจบด้วย label `overflow:` และ `out:` ที่หลายเงื่อนไข `goto` เข้าหา

> [!IMPORTANT]
> พยายามอย่างยิ่งที่จะเลี่ยง `goto` แต่ในสถานการณ์ที่หายากซึ่งมันทำให้โค้ดอ่านง่ายขึ้นจริง มันก็เป็นทางเลือกหนึ่ง

---
## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดเฉลยก่อน:

1. เขียน for loop ใส่เลขสุ่ม 100 ตัว (0–100) ลง int slice
2. วน slice จากข้อ 1: หาร 2 ลงตัวพิมพ์ `"Two!"`, หาร 3 ลงตัวพิมพ์ `"Three!"`, หารทั้ง 2 และ 3 ลงตัวพิมพ์ `"Six!"`, นอกนั้นพิมพ์ `"Never mind"`
3. declare `total := 0` แล้ววน `i` จาก 0 ถึง 10 โดย body เป็น `total := total + i; fmt.Println(total)` — สังเกตว่าผลลัพธ์เพี้ยน เพราะ `total :=` ใน loop body **shadow** `total` ชั้นนอกทุกรอบ (โยงกลับเรื่อง shadowing ใน Step 2)

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---
## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **เผลอ shadow ด้วย `:=`** — `:=` reuse เฉพาะตัวแปรใน block ปัจจุบัน ตัวแปรชื่อซ้ำจาก scope นอกจะถูกสร้างใหม่/บัง ตรวจให้ดีว่าทางซ้ายมีตัวแปรนอก scope หรือไม่
- **Shadow package name** — ตั้งตัวแปรชื่อ `fmt` หรือ package อื่น ทำให้ใช้ package นั้นไม่ได้ตลอด scope ที่เหลือ
- **Redefine identifier ใน universe block** — `true := 10` compile ผ่านแต่สร้างพฤติกรรมประหลาด
- **พึ่งลำดับ key ของ map** — ลำดับ for-range บน map แกว่งทุกรอบโดยตั้งใจ อย่าเขียนโค้ดที่สมมติว่าคงที่
- **คิดว่า standard for ข้าม rune ใน string ได้** — มันนับ byte ทำให้ multibyte character เพี้ยน ต้องใช้ for-range
- **แก้ value variable ใน for-range แล้วคาดว่า source เปลี่ยน** — value เป็น copy ต้นทางไม่เปลี่ยน
- **`break` ใน switch-in-for** — break ออกแค่ case ไม่ใช่ for ต้องใส่ label ที่ for แล้ว `break label`
- **ใส่ simple statement แปลก ๆ ก่อน condition ของ if** — ทำได้แต่สับสน ใช้เพื่อ define ตัวแปร scope กับ if/else เท่านั้น

---
## สรุป

1. เข้าใจ block hierarchy (universe → package → file → function → inner) แล้วพฤติกรรม scope ของ `if`/`for`/`switch` จะตามมาเอง — ทุกคู่ `{}` คือ block ใหม่
2. ระวัง shadowing ที่เกิดจาก `:=` — reuse เฉพาะตัวแปรใน block ปัจจุบัน และอย่าแตะ universe block
3. ใช้ `if n := ...; n == 0` เพื่อ scope ตัวแปรชั่วคราวให้แคบที่สุด ลดโอกาส bug จากตัวแปรหลุด scope
4. จำ `for` สี่แบบ: **for-range เป็น default** สำหรับวน compound type, complete for เมื่อคุม index เอง, condition-only แทน `while`, infinite for ต้องมีทางออก
5. วน string ด้วย for-range เสมอเมื่อสนใจ character เพราะให้ rune ไม่ใช่ byte; ใช้ `_` ทิ้งค่าที่ไม่ใช้
6. ใช้ blank switch แทน if/else chain เมื่อ case สัมพันธ์กัน เพื่อสื่อเจตนา; อย่าใช้ `fallthrough` เว้นแต่จำเป็นจริง
7. ลืม `goto` ไปได้เลยในงานทั่วไป — labeled break/continue ครอบคลุมเกือบทุกกรณีแล้ว

หลักสำคัญของบทนี้คือ control structures ของ Go ไม่ได้มีไว้แค่ให้เขียน loop ได้ แต่มีกฎเรื่อง scope ที่สม่ำเสมอจนคาดเดาได้ — เมื่อเข้าใจ block และ shadowing แล้ว `if`/`for`/`switch` จะเป็นแค่ตัวเลือกที่คุณเลือกตามเจตนา ไม่ใช่ความลึกลับของภาษา และแน่นอนว่าถ้าเจอ shadowing แปลก ๆ ในโค้ด ลองดูที่ `:=` ก่อนเป็นที่แรกครับ

> *ตอนถัดไปจะต่อด้วย functions — จัดระเบียบโค้ดให้อยู่นอก `main` และจะเจอ `_` pattern ที่ใช้ทิ้งค่าอีกครั้ง*

---

## Glossary

- **Block** — ขอบเขตที่เกิด declaration; package/file/function block และทุกคู่ `{}`
- **Package block** — block ที่บรรจุ identifier ที่ declare นอก function ทั้งหมด
- **File block** — block ที่บรรจุชื่อ package จาก `import` (valid เฉพาะไฟล์นั้น)
- **Universe block** — block นอกสุดที่บรรจุ predeclared identifiers (`int`, `true`, `nil`, `make`, ...)
- **Shadowing** — การ declare identifier ชื่อซ้ำใน block ชั้นใน บังตัวที่อยู่ชั้นนอก
- **Predeclared identifier** — ชื่อที่ define ใน universe block ไม่ใช่ keyword (เช่น built-in types/constants/functions)
- **for-range** — รูปแบบ for ที่วน element ของ compound type ให้ index/key + value (value เป็น copy)
- **Hash DoS** — attack ที่ส่งข้อมูลให้ key hash ลง bucket เดียวกันทั้งหมดเพื่อทำให้ server ช้า; Go กันด้วย random hash seed + ลำดับ iteration ที่แกว่ง
- **Blank switch** — switch ที่ไม่ระบุค่าเปรียบเทียบ ใช้ boolean comparison ในแต่ละ case ได้
- **fallthrough** — keyword ให้ case หนึ่งไหลต่อไป case ถัดไป (ไม่แนะนำให้ใช้)
- **goto** — statement กระโดดไป labeled line; Go จำกัดไม่ให้ข้าม declaration หรือเข้า inner/parallel block

---
## Related

- [ตอนที่ 3: Composite Types](/go/03-composite-types/) — ความรู้เรื่อง slice, map และ string ที่บทนี้เอามาวนด้วย `for-range`; เคยเตือนเรื่อง `:=` ไว้แล้ว บทนี้ขยายเป็นกฎ shadowing เต็มรูปแบบ
- [ตอนที่ 2: Predeclared Types and Declarations](/go/02-predeclared-types-and-declarations/) — การประกาศตัวแปรด้วย `var` และ `:=` ซึ่งเป็นจุดเริ่มของ shadowing และเรื่อง zero value
- [ตอนที่ 1: Setting Up Your Go Environment](/go/01-setting-up-your-go-environment/) — workflow `go fmt → go vet → go build` ที่ใช้ตรวจแบบฝึกหัดของบทนี้
