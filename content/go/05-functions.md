+++
title = 'ตอนที่ 5: Functions'
date = '2026-08-04T00:00:00+07:00'
draft = false
description = 'เรียนรู้ syntax พื้นฐาน, variadic, multiple return values, closure, defer และ call by value ซึ่งเป็นพื้นฐานสำคัญก่อนเข้าสู่เรื่อง pointer'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่ 5 เราจะค่อย ๆ ย้ายโค้ดที่กองอยู่ใน `main` ออกมาแบ่งเป็น function กันบ้าง หลังจากตอนที่แล้วเราใช้ block และ control structures ควบคุม flow ของโปรแกรมได้แล้ว
ในตอนนี้เราจะจัดโค้ดให้เรียกใช้ซ้ำได้ ตั้งแต่ syntax พื้นฐาน ไปจนถึงฟีเจอร์เฉพาะของ Go อย่าง multiple return values, closure และ `defer`
แล้วปิดท้ายด้วยกฎ **call by value** ที่จะช่วยไขปริศนาอีกหลายอย่างในตอนถัด ๆ ไป

สิ่งที่จะได้ตอนจบบทนี้:

- เขียน function ตั้งแต่ syntax พื้นฐานจนถึงการจำลอง named/optional parameters ด้วย struct
- ใช้ variadic parameter รับค่าไม่จำกัด และส่ง slice เข้าไปด้วย `...`
- ใช้ multiple return values พร้อม `error` เป็นค่าสุดท้าย ตาม convention ของ Go
- รู้จัก named return values และรู้ว่าทำไมควรหลีกเลี่ยง blank return
- ใช้ function เป็น value เก็บในตัวแปรและ map ได้เหมือน value ทั่วไป
- เขียน anonymous function และ closure เพื่อ capture ตัวแปรรอบตัว
- ส่ง function เป็น parameter และ return function ออกมา (higher-order function)
- ใช้ `defer` ผูก cleanup ให้รันอัตโนมัติทุกครั้งที่ function จบ
- เข้าใจกฎ call by value — ทำไม `map`/`slice` ถึงมี behavior ต่างจากที่คิด

{{< mermaid >}}
graph TD
  A[Function พื้นฐาน: input -> output] --> B[Return tricks: หลายค่า + named return]
  A --> C[Input tricks: variadic + struct options]
  B --> D[Function เป็น value: ตัวแปร / map]
  D --> E[Closure: capture ตัวแปรรอบตัว]
  E --> F[ส่ง function เป็น parameter: sort.Slice]
  E --> G[return function: factory]
  E --> H[defer: cleanup แบบ LIFO]
  H --> I[Call by value: copy เสมอ]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ ชื่อ `go-functions` เพื่อให้ทดลองโค้ดได้โดยไม่กระทบ project จากตอนก่อน เปิด terminal แล้วรัน:

```sh
mkdir go-functions
cd go-functions
go mod init go-functions
touch main.go
```

ในแต่ละ step ให้เปิดไฟล์ `main.go`, วางโค้ดตัวอย่างลงไป แล้วรัน:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านจะมีคำอธิบายกำกับไว้ อย่าวางตัวอย่างเหล่านั้นรวมกับโปรแกรมที่ต้องการรัน

---

## Step 1: ประกาศและเรียก function — สี่ส่วนที่ต้องมี

function declaration ของ Go น่าจะคุ้นตาสำหรับคนที่เคยเขียนภาษาอย่าง C, Python หรือ JavaScript (ส่วน method ที่ผูกกับ type เราจะค่อยพูดถึงในตอนที่ 7) โดยมีสี่ส่วน:

1. keyword `func`
2. ชื่อ function
3. input parameters — เขียนชื่อ parameter ก่อน แล้วตามด้วย type (Go เป็น typed language จึงต้องระบุ type)
4. return type — วางหลังวงเล็บปิดของ parameters และก่อนปีกกาเปิดของ body

```go
package main

import "fmt"

func div(num int, denom int) int {
	if denom == 0 {
		return 0
	}
	return num / denom
}

func main() {
	result := div(5, 2)
	fmt.Println(result)
}
```

ถ้า function ไม่รับ input ให้ใช้วงเล็บว่าง `()` และถ้าไม่ return อะไรก็ไม่ต้องเขียน type ก่อนปีกกาเปิด ส่วนการเรียก function ก็ตรงไปตรงมา — เขียนไว้ด้านขวาของ `:=` แล้วเก็บค่าที่ function return ไว้ในตัวแปร

> **เคล็ดลับ:** ถ้ามี input parameters ที่อยู่ติดกันตั้งแต่สองตัวขึ้นไปและเป็น type เดียวกัน เราระบุ type แค่ครั้งเดียวได้เลย:
>
> ```go
> func div(num, denom int) int {
> ```

---

## Step 2: Named/optional parameters — ไม่มี แต่จำลองด้วย struct ได้

Go **ตั้งใจไม่รองรับ** named และ optional input parameters เวลาเรียก function จึงต้องส่ง parameter ตามที่กำหนดไว้ ส่วน variadic ใน Step 3 ไม่ใช่ named หรือ optional parameter แต่เป็นวิธีรับ argument จำนวนไม่จำกัด ถ้าอยากได้พฤติกรรมแบบ named หรือ optional parameters ให้นิยาม `struct` ที่มี field เป็น option ต่าง ๆ แล้วส่ง struct เข้าไป:

```go
package main

import "fmt"

type MyFuncOpts struct {
	FirstName string
	LastName  string
	Age       int
}

func MyFunc(opts MyFuncOpts) error {
	fmt.Println(opts)
	return nil
}

func main() {
	MyFunc(MyFuncOpts{LastName: "Patel", Age: 50})
	MyFunc(MyFuncOpts{FirstName: "Joe", LastName: "Smith"})
}
```

ในทางปฏิบัติ การไม่มี named/optional parameters ไม่ได้เป็นข้อจำกัดใหญ่ เพราะ function ที่ดีไม่ควรรับ parameter มากเกินไป — named/optional parameters จะมีประโยชน์เมื่อ function มี input เยอะ ๆ และนั่นก็มักเป็นสัญญาณว่า function นั้นอาจซับซ้อนเกินไปจนควรแยกออกเป็นส่วนย่อย ๆ

---

## Step 3: Variadic parameters — parameter ตัวสุดท้ายที่รับค่าไม่จำกัด

`fmt.Println` รับ parameter ได้ไม่จำกัดจำนวน เพราะ Go รองรับ **variadic parameter** — parameter แบบนี้ต้องอยู่ตัวสุดท้าย (หรือเป็น parameter เดียว) ในรายการ เราเขียน `...` ไว้หน้า type และภายใน function ค่าที่อยู่ใน parameter นี้จะเป็น **slice** ของ type นั้น:

```go
package main

import "fmt"

func addTo(base int, vals ...int) []int {
	out := make([]int, 0, len(vals))
	for _, v := range vals {
		out = append(out, base+v)
	}
	return out
}

func main() {
	fmt.Println(addTo(3))                        // []
	fmt.Println(addTo(3, 2))                     // [5]
	fmt.Println(addTo(3, 2, 4, 6, 8))            // [5 7 9 11]
	a := []int{4, 3}
	fmt.Println(addTo(3, a...))                  // [7 6]
	fmt.Println(addTo(3, []int{1, 2, 3, 4, 5}...)) // [4 5 6 7 8]
}
```

เพราะ variadic parameter ทำงานเหมือน slice คุณจึงส่ง slice ที่มีอยู่แล้วเข้าไปได้ด้วย **แต่ต้องใส่ `...` ต่อท้ายตัวแปรหรือ slice literal เสมอ** — ถ้าไม่ใส่จะได้ compile-time error:

```go
addTo(3, a) // ❌ compile error: cannot use a (variable of type []int) as int value
```

---

## Step 4: Multiple return values — ความแตกต่างแรกที่มักเจอ

สิ่งหนึ่งที่ต่างจากภาษาส่วนใหญ่คือ Go รองรับ **multiple return values** หรือการ return หลายค่า เมื่อ function return หลายค่า ให้ระบุ type ของแต่ละค่าไว้ในวงเล็บและคั่นด้วย comma จากนั้นตอน `return` ก็ต้องส่งค่ากลับให้ครบตามลำดับและคั่นด้วย comma เช่นกัน

**อย่าใส่วงเล็บครอบค่าที่ return** เพราะจะกลายเป็น compile-time error — วงเล็บใช้เฉพาะตอนประกาศ type ของค่าที่ return:

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

func divAndRemainder(num, denom int) (int, int, error) {
	if denom == 0 {
		return 0, 0, errors.New("cannot divide by zero")
	}
	return num / denom, num % denom, nil
}

func main() {
	result, remainder, err := divAndRemainder(5, 2)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println(result, remainder) // 2 1
}
```

นี่คือครั้งแรกที่เราเห็นการสร้างและ return `error` — จำไว้ก่อนว่า Go ใช้ multiple return values เพื่อส่ง error กลับมาเมื่อมีบางอย่างผิดพลาด ถ้าทำงานสำเร็จให้ return `nil` ในตำแหน่งของ `error` ตาม **convention ที่มักวาง `error` ไว้เป็นค่าสุดท้าย (หรือเป็นค่าเดียวที่ return)**

จากนั้นตอนเรียก function ให้เช็ค `err != nil` ทุกครั้ง

### Multiple return values ไม่ใช่ tuple

ถ้าคุ้นกับ Python อาจคิดว่า multiple return values เหมือน tuple ที่จะแยกเก็บแบบไหนก็ได้ — **แต่ Go ไม่ได้ทำงานแบบนั้น** ใน Python เราเก็บค่าที่ return ทั้งหมดไว้ในตัวแปรเดียวหรือแยกเป็นหลายตัวก็ได้:

```python
>>> def div_and_remainder(n, d):
...     if d == 0:
...         raise Exception("cannot divide by zero")
...     return n / d, n % d
>>> v = div_and_remainder(5, 2)
>>> v
(2.5, 1)
```

ใน Go เราต้อง assign แต่ละค่าที่ return ให้ตัวแปรแยกกัน ถ้าพยายาม assign ผลลัพธ์ทั้งหมดลงตัวแปรเดียวจะได้ compile-time error:

```go
v := divAndRemainder(5, 2) // ❌ compile error: assignment mismatch: 1 variable but divAndRemainder returns 3 values
```

### ทิ้งค่าที่ไม่ใช้ด้วย `_`

Go ไม่อนุญาตให้มี unused variables ถ้าเรียก function แล้วไม่ต้องการใช้ค่าบางตัว ให้ assign ค่านั้นลงชื่อ `_`:

```go
result, _, err := divAndRemainder(5, 2)
```

> ⚠️ Go ยอมให้เรียก function แล้วทิ้งค่าที่ return ทั้งหมดโดยไม่ assign ได้ เช่นเขียน `divAndRemainder(5, 2)` เฉย ๆ คุณทำแบบนี้มาตลอดกับ `fmt.Println` ซึ่ง return ค่ากลับมาสองค่าแต่เรามักไม่ใช้ อย่างไรก็ตาม ในกรณีอื่นเกือบทั้งหมดควรใช้ `_` เพื่อบอกให้ชัดว่าเราตั้งใจทิ้งค่าใด

---

## Step 5: Named return values — และ blank return ที่ควรหลีกเลี่ยง

นอกจากการ return หลายค่า Go ยังให้เราตั้งชื่อให้ค่า return ได้ การตั้งชื่อนี้คือการ **predeclare ตัวแปร** ที่ใช้ภายใน function เพื่อเก็บค่า return ตัวแปรเหล่านี้จะเริ่มต้นด้วย **zero value** เมื่อ function เริ่มทำงาน จึงมีค่าให้ return ได้แม้ยังไม่ได้ assign ค่าใหม่:

```go
package main

import (
	"errors"
	"fmt"
)

func divAndRemainder(num, denom int) (result int, remainder int, err error) {
	if denom == 0 {
		err = errors.New("cannot divide by zero")
		return result, remainder, err
	}
	result, remainder = num/denom, num%denom
	return result, remainder, err
}

func main() {
	x, y, z := divAndRemainder(5, 2)
	fmt.Println(x, y, z) // 2 1 <nil>
}
```

ข้อควรระวังสองข้อของ named return values:

- **Shadowing** — เผลอใช้ `:=` ใน block ชั้นในจะสร้างตัวแปรใหม่บัง named return value ตัวจริง
- **ไม่บังคับให้ return ตัวมันเอง** — ค่าที่เขียนไว้หลัง `return` จะถูกนำไปใช้เป็นผลลัพธ์จริง ถ้า assign ค่าให้ `result, remainder` ไว้ก่อนหน้าแล้ว return ค่าอื่นทับ ค่าที่ออกมาจะเป็นค่าที่ return ไม่ใช่ค่าที่ assign ไว้:

```go
func divAndRemainder(num, denom int) (result int, remainder int, err error) {
	result, remainder = 20, 30
	if denom == 0 {
		return 0, 0, errors.New("cannot divide by zero")
	}
	return num / denom, num % denom, nil // ส่ง 5, 2 → ได้ 2 1 ไม่ใช่ 20 30
}
```

Named return values มีประโยชน์อยู่หลายกรณี แต่ในบทนี้ประโยชน์ที่เห็นชัดที่สุดคือการใช้คู่กับ `defer` เพื่อให้ deferred function ตรวจหรือแก้ค่าที่ function กำลังจะ return (จะเห็นตัวอย่างใน Step 9)

### Blank return — misfeature ที่ห้ามใช้

เมื่อมี named return values คุณเขียน `return` เปล่า ๆ ได้ ซึ่งจะ return ค่าปัจจุบันของ named return values:

```go
func divAndRemainder(num, denom int) (result int, remainder int, err error) {
	if denom == 0 {
		err = errors.New("cannot divide by zero")
		return
	}
	result, remainder = num/denom, num%denom
	return
}
```

> ⚠️ ถ้า function ของคุณ return ค่า **อย่าใช้ blank return** เพราะคนอ่านต้องไล่โค้ดย้อนกลับไปดูว่าค่าปัจจุบันของตัวแปร return คืออะไร จึงจะรู้ว่า function กำลังส่งอะไรออกมา เขียนค่าหลัง `return` ให้ชัดเจนจะอ่านง่ายกว่ามาก

---

## Step 6: Function เป็น value — เก็บในตัวแปรและ map ได้

เช่นเดียวกับหลายภาษา function ใน Go เป็น **value** ได้ ชนิดของ function ถูกกำหนดจากจำนวนและ type ของ parameters รวมถึง return values ชุดนี้เรียกว่า **signature** ถ้า function ใดมี signature ตรงกันก็ใช้เป็น function type เดียวกันได้

เราจึงประกาศตัวแปรที่เก็บ function ได้:

```go
var myFuncVariable func(string) int
```

`myFuncVariable` รับ function ใดก็ได้ที่มี parameter เป็น `string` หนึ่งตัวและ return `int` หนึ่งตัว zero value ของ function variable คือ `nil` — **ถ้าเรียก function variable ที่เป็น `nil` โปรแกรมจะเกิด panic** (เรื่อง panic อยู่ในตอนถัดไป)

การมี function เป็น value เปิดทางให้ทำ pattern ที่ยืดหยุ่นขึ้น เช่นสร้าง calculator ด้วย map ที่จับ operator แต่ละตัวคู่กับ function:

```go
package main

import (
	"fmt"
	"strconv"
)

func add(i int, j int) int { return i + j }
func sub(i int, j int) int { return i - j }
func mul(i int, j int) int { return i * j }
func div(i int, j int) int { return i / j }

var opMap = map[string]func(int, int) int{
	"+": add,
	"-": sub,
	"*": mul,
	"/": div,
}

func main() {
	expressions := [][]string{
		{"2", "+", "3"},
		{"2", "-", "3"},
		{"2", "*", "3"},
		{"2", "/", "3"},
		{"2", "%", "3"},
		{"two", "+", "three"},
		{"5"},
	}
	for _, expression := range expressions {
		if len(expression) != 3 {
			fmt.Println("invalid expression:", expression)
			continue
		}
		p1, err := strconv.Atoi(expression[0])
		if err != nil {
			fmt.Println(err)
			continue
		}
		op := expression[1]
		opFunc, ok := opMap[op]
		if !ok {
			fmt.Println("unsupported operator:", op)
			continue
		}
		p2, err := strconv.Atoi(expression[2])
		if err != nil {
			fmt.Println(err)
			continue
		}
		result := opFunc(p1, p2)
		fmt.Println(result)
	}
}
```

สังเกตว่าโค้ดใน loop มี logic หลักอยู่ไม่กี่บรรทัด ที่เหลือเป็นการเช็ค error และตรวจสอบ input — เราอาจอยากข้ามส่วนเหล่านี้เพราะดูเหมือนเขียนซ้ำ ๆ แต่การทำแบบนั้นจะได้โค้ดที่เปราะบางและดูแลยาก:

> **Error handling is what separates the professionals from the amateurs**

### Function type declaration

เช่นเดียวกับการใช้ keyword `type` นิยาม struct เราใช้มันนิยาม function type ได้ เพื่อตั้งชื่อให้ signature ที่ต้องใช้ซ้ำหลายครั้ง:

```go
type opFuncType func(int, int) int

var opMap = map[string]opFuncType{
	"+": add,
	"-": sub,
	"*": mul,
	"/": div,
}
```

ไม่ต้องแก้ function เดิมเลย — function ใดที่รับ `int` สองตัวและ return `int` หนึ่งตัวก็ใช้กับ type นี้ได้ ข้อดีคือชื่อ type ช่วยบอกเจตนาของโค้ด และประโยชน์อีกอย่างจะเห็นตอนพูดถึง interfaces

---

## Step 7: Anonymous function และ closure — function ที่จำตัวแปรรอบตัวได้

นอกจากเก็บ function ไว้ในตัวแปรแล้ว เรายังนิยาม function ใหม่ภายใน function อื่นได้ — function แบบนี้เป็น **anonymous** (ไม่มีชื่อ) เขียนด้วย `func` ตามด้วย input parameters, return values และ body ได้เลย ไม่มีชื่อคั่นกลาง (ถ้าใส่ชื่อระหว่าง `func` กับ parameters จะเป็น compile-time error):

```go
package main

import "fmt"

func main() {
	f := func(j int) {
		fmt.Println("printing", j, "from inside of an anonymous function")
	}
	for i := 0; i < 5; i++ {
		f(i)
	}
}
```

ไม่ต้อง assign ให้ตัวแปรก็ได้ — เราเขียน function ไว้ inline แล้วเรียกทันทีด้วยวงเล็บต่อท้าย เช่น `func(j int) { ... }(i)` แต่ปกติไม่ค่อยทำแบบนี้ ถ้าต้องการประกาศแล้วรันทันที การเขียนโค้ดตรง ๆ มักอ่านง่ายกว่า ยกเว้นกรณีที่ต้องใช้ anonymous function กับ `defer` statements (Step 9) หรือการ launch goroutines (ตอนเรื่อง concurrency)

### Closure — function ที่ capture ตัวแปรชั้นนอก

anonymous function ที่อ้างถึงตัวแปรจาก function ชั้นนอกจะเรียกว่า **closure** — แนวคิดนี้หมายถึง function ภายในสามารถเข้าถึงและ**แก้ไข**ตัวแปรจาก scope ชั้นนอกได้ แม้เราไม่ได้ส่งตัวแปรนั้นเป็น parameter:

```go
package main

import "fmt"

func main() {
	a := 20
	f := func() {
		fmt.Println(a)
		a = 30
	}
	f()
	fmt.Println(a)
}
// output: 20 then 30
```

anonymous function ที่เก็บไว้ใน `f` อ่านและเขียน `a` ได้แม้ไม่ได้ส่ง `a` เข้าไป และเช่นเดียวกับ inner scope อื่น ๆ เรา shadow ตัวแปรใน closure ได้ — ถ้าใช้ `:=` แทน `=` ภายใน closure จะสร้าง `a` ตัวใหม่ขึ้นมา ตัวใหม่นี้จะหายไปเมื่อ closure จบ ทำให้ output ของโค้ดตัวอย่างกลายเป็น `20 20` เพราะ `a` ตัวนอกยังเป็น 20 อยู่:

> ⚠️ ระวังเลือก assignment operator ให้ถูกใน inner function โดยเฉพาะเมื่อมีหลายตัวแปรฝั่งซ้าย — `:=` สร้างตัวใหม่ (shadow), `=` เขียนทับตัวเดิมของ scope ชั้นนอก

ประโยชน์ของ closure ในตัวอย่างนี้มีสองข้อ:

1. **จำกัด scope ของ function** — ถ้า function ถูกเรียกจากที่เดียวแต่หลายครั้ง เราใช้ inner function "ซ่อน" มันไว้ได้ ลดจำนวน declaration ที่ package level
2. **ลดการซ้ำของ logic** ภายใน function เดียว

closure จะน่าสนใจจริง ๆ เมื่อถูกส่งไปยัง function อื่นหรือถูก return ออกมา — เพราะมันพาตัวแปรภายใน function ออกไปใช้ข้างนอกได้ ซึ่งคือเรื่องของ Step 8

---

## Step 8: ส่ง function เป็น parameter และ return function ออกมา

### ส่ง function เป็น parameter

เพราะ function เป็น value และมี type ชัดเจน เราจึงส่ง function เป็น parameter ให้ function อื่นได้ ตัวอย่างคลาสสิกคือการ sort slice — `sort.Slice` รับ slice ใด ๆ และรับ function สำหรับเปรียบเทียบสมาชิก:

```go
package main

import (
	"fmt"
	"sort"
)

type Person struct {
	FirstName string
	LastName  string
	Age       int
}

func main() {
	people := []Person{
		{"Pat", "Patterson", 37},
		{"Tracy", "Bobdaughter", 23},
		{"Fred", "Fredson", 18},
	}

	// sort by last name
	sort.Slice(people, func(i, j int) bool {
		return people[i].LastName < people[j].LastName
	})
	fmt.Println(people)

	// sort by age
	sort.Slice(people, func(i, j int) bool {
		return people[i].Age < people[j].Age
	})
	fmt.Println(people)
}
```

closure ที่ส่งให้ `sort.Slice` มี parameter `i, j` แต่ภายในยังใช้ `people` ได้ — ในเชิง computer science เราเรียกว่า closure **capture** ตัวแปร `people` ไว้ ทำให้เปลี่ยนเกณฑ์การ sort ตาม field ต่าง ๆ ได้

`sort.Slice` จะเรียงสมาชิกใน slice `people` โดยตรง (in place) เรื่องนี้จะโยงกลับไปที่ call by value และ pointer ในตอนถัดไป

> [!NOTE]
> `sort.Slice` มีมาก่อน generics ถูกเพิ่มเข้า Go จึงใช้ reflection ภายในเพื่อทำงานกับ slice หลายชนิดได้ — การส่ง function เป็น parameter มีประโยชน์มากสำหรับการทำ operation ต่างกันบน data ชนิดเดียวกัน

### Return function จาก function

นอกจากส่ง closure เข้า function แล้ว เรายัง **return closure กลับออกมาจาก function** ได้ด้วย ตัวอย่างนี้คือ factory ที่สร้าง function สำหรับคูณเลข:

```go
package main

import "fmt"

func makeMult(base int) func(int) int {
	return func(factor int) int {
		return base * factor
	}
}

func main() {
	twoBase := makeMult(2)
	threeBase := makeMult(3)
	for i := 0; i < 3; i++ {
		fmt.Println(twoBase(i), threeBase(i))
	}
}
// 0 0
// 2 3
// 4 6
```

ถ้าได้คุยกับโปรแกรมเมอร์สาย functional language อาจได้ยินคำว่า **higher-order function** — เป็นชื่อเรียก function ที่รับ function เป็น input parameter หรือ return function ออกมา

ในฐานะ Go developer เราก็ใช้ pattern แบบนี้ได้เต็มที่ เช่น sort slice, ค้นหาใน sorted slice ด้วย `sort.Search`, สร้าง middleware ของ web server และที่สำคัญคือ `defer` ใน Step 9

---

## Step 9: `defer` — ผูก cleanup ให้รันอัตโนมัติ

โปรแกรมมักสร้าง temporary resource เช่น file หรือ network connection ที่ต้อง cleanup ไม่ว่า function จะออกจากจุดไหนหรือจบแบบสำเร็จ/ล้มเหลว ใน Go เราผูกโค้ด cleanup ไว้กับ function ด้วย keyword `defer` ได้

ลองดูตัวอย่าง `cat` เวอร์ชันง่าย ๆ:

```go
package main

import (
	"io"
	"log"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("no file specified")
	}
	f, err := os.Open(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()
	data := make([]byte, 2048)
	for {
		count, err := f.Read(data)
		os.Stdout.Write(data[:count])
		if err != nil {
			if err != io.EOF {
				log.Fatal(err)
			}
			break
		}
	}
}
```

`os.Args` เป็น slice ใน package `os` โดย index 0 คือชื่อโปรแกรม ส่วนสมาชิกที่เหลือคือ argument ที่ส่งเข้ามาตอนรัน หลังเปิดไฟล์ด้วย `os.Open` (ซึ่ง return `error` เป็นค่าที่สอง) เราต้องปิด file handle หลังใช้เสร็จไม่ว่าจะออกจาก function ทางไหน

จึงเขียน `defer` ตามด้วยการเรียก function หรือ method ปกติ — **`defer` จะเลื่อนการเรียกนั้นไปจนกว่า function ที่ครอบอยู่จะจบการทำงาน**

เรื่องที่ต้องรู้เกี่ยวกับ `defer`:

| ประเด็น | พฤติกรรม |
|---|---|
| รับอะไรได้ | function, method หรือ closure |
| หลายตัว | เขียน `defer` ได้หลายครั้ง และจะรันแบบ **LIFO** (last-in, first-out) — ตัวที่เขียนทีหลังจะรันก่อน |
| เวลารัน | โค้ดใน defer รัน **หลัง** `return` statement |
| arguments | ถ้า defer function รับ input parameter ค่า argument จะถูก **eval ทันที** แล้วเก็บไว้จนกว่า function จะรัน |

ลองดูตัวอย่างที่แสดงทั้ง LIFO และการ eval argument ทันที:

```go
package main

import "fmt"

func deferExample() int {
	a := 10
	defer func(val int) { fmt.Println("first:", val) }(a)
	a = 20
	defer func(val int) { fmt.Println("second:", val) }(a)
	a = 30
	fmt.Println("exiting:", a)
	return a
}

func main() {
	deferExample()
}
// exiting: 30
// second: 20
// first: 10
```

`first` ได้ค่า `10` ไม่ใช่ `30` เพราะ argument `a` ถูก eval ตั้งแต่ตอนเจอ `defer` (ตอนนั้น `a` ยังเป็น 10) และ `first` รันท้ายสุดเพราะถูกเขียนไว้ก่อน (LIFO)

> ⚠️ นักพัฒนา Go มือใหม่มักลืมใส่วงเล็บ `()` หลังชื่อ function เมื่อใช้ `defer` — ถ้าละไว้จะเป็น compile-time error จำไว้ว่าวงเล็บคือจุดที่เราใส่ argument ซึ่งจะถูกส่งเข้า function ตอนมันรัน

### defer + named return values — จุดที่ named return มีค่าจริง

เหตุผลที่เห็นประโยชน์ชัดที่สุดในบทนี้ของ named return values คือช่วยให้ deferred function ตรวจหรือแก้ค่า return ของ function ที่ครอบอยู่ได้

ตัวอย่างคือ database transaction ที่ commit ถ้าทุกอย่างสำเร็จและ rollback ถ้ามี error:

```go
func DoSomeInserts(ctx context.Context, db *sql.DB, value1, value2 string) (err error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer func() {
		if err == nil {
			err = tx.Commit()
		}
		if err != nil {
			tx.Rollback()
		}
	}()
	_, err = tx.ExecContext(ctx, "INSERT INTO FOO (val) values $1", value1)
	if err != nil {
		return err
	}
	return nil
}
```

closure ใน `defer` ตรวจค่า `err` ก่อน ถ้า `err == nil` ก็แปลว่าทุกอย่างสำเร็จ จึงเรียก `tx.Commit()` (ซึ่งอาจ return error เองและถูกเก็บลง `err`) แต่ถ้าเกิด error ใด ๆ ก็เรียก `tx.Rollback()`

ถ้าไม่มี named return value `err` deferred function ก็จะไม่รู้ว่า function กำลังจะ return ค่าอะไร

### Pattern: function ที่ return cleanup closure

pattern ที่พบบ่อยใน Go คือ function ที่เปิดหรือสร้าง resource จะ return closure สำหรับ cleanup resource นั้น:

```go
func getFile(name string) (*os.File, func(), error) {
	file, err := os.Open(name)
	if err != nil {
		return nil, nil, err
	}
	return file, func() { file.Close() }, nil
}

// in main:
f, closer, err := getFile(os.Args[1])
if err != nil {
	log.Fatal(err)
}
defer closer()
```

เครื่องหมาย `*` หมายถึงค่าที่ return เป็น pointer ไปยัง `os.File` (รายละเอียดในตอนถัดไป) ถ้าเราเก็บ `closer` ไว้แต่ไม่เรียกใช้ Go จะฟ้อง unused variable ตอน compile

การ return cleanup closure ออกมาจึงช่วยเตือนผู้ใช้ให้จำไว้เขียน `defer closer()`

---

## Step 10: Go เป็น call-by-value — parameter ได้รับสำเนาของค่า

Go เป็น **call-by-value language** หมายความว่าเมื่อส่งตัวแปรเข้า function Go จะ **copy ค่า** ของตัวแปรนั้นไปเป็น parameter เสมอ ลองดูกับ primitive และ struct:

```go
package main

import "fmt"

type person struct {
	age  int
	name string
}

func modifyFails(i int, s string, p person) {
	i = i * 2
	s = "Goodbye"
	p.name = "Bob"
}

func main() {
	p := person{}
	i := 2
	s := "Hello"
	modifyFails(i, s, p)
	fmt.Println(i, s, p) // 2 Hello {0 }
}
```

การแก้ค่าภายใน function ไม่กระทบตัวแปรเดิม — รวมถึง field ของ struct ด้วย เพราะ function กำลังแก้สำเนาของค่าเดิม แต่ **`map` และ `slice` มี behavior ที่ดูต่างออกไป**:

```go
package main

import "fmt"

func modMap(m map[int]string) {
	m[2] = "hello"
	m[3] = "goodbye"
	delete(m, 1)
}

func modSlice(s []int) {
	for k, v := range s {
		s[k] = v * 2
	}
	s = append(s, 10)
}

func main() {
	m := map[int]string{
		1: "first",
		2: "second",
	}
	modMap(m)
	fmt.Println(m) // มี key 2, 3; key 1 ถูกลบ (ลำดับการพิมพ์อาจต่างกัน)

	slice := []int{1, 2, 3}
	modSlice(slice)
	fmt.Println(slice) // [2 4 6]
}
```

ผลลัพธ์ของ map จะมี key `2` กับ `3` และไม่มี key `1` ส่วน slice จะเป็น `[2 4 6]` — เมื่อส่ง `map` หรือ `slice` เข้า function parameter จะได้รับสำเนาของ value ที่ยังอ้างถึงข้อมูลชุดเดิม จึงแก้ข้อมูลที่อยู่ข้างในได้เหมือนกัน

จุดต่างสำคัญคือ slice ยังมีความยาว (`length`) และความจุ (`capacity`) ติดอยู่ในค่าของมันด้วย เมื่อเราเรียก `append` ใน function จึงเปลี่ยนความยาวของ slice สำเนาใน function เท่านั้น ไม่ได้เปลี่ยนความยาวของ slice ฝั่ง caller (รายละเอียดเรื่อง pointer และ slice จะต่อในตอนถัดไป)

> **หลักจำ:** ทุก type ใน Go ถูกส่งแบบ value — บาง value อ้างถึงข้อมูลที่อยู่ข้างนอกด้วย (`map`, `slice`) จึงแก้ข้อมูลข้างในได้ แต่การเปลี่ยนตัว value เอง เช่นความยาวของ slice จะไม่ย้อนกลับไปแก้ตัวแปรฝั่ง caller

กฎ call by value ช่วยให้เราเข้าใจ data flow ได้ง่ายขึ้น: โดยทั่วไป function จะไม่เปลี่ยน input ที่เป็นค่าธรรมดา แต่จะคำนวณแล้ว return ค่าใหม่กลับมาแทน

อย่างไรก็ตาม บางครั้งเราก็ต้องการส่งข้อมูลที่แก้ไขได้เข้า function จริง ๆ — นั่นคือตอนที่ต้องใช้ **pointer** ซึ่งเป็นเรื่องของตอนถัดไป

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดเฉลยก่อน:

1. แก้ calculator จาก Step 6 ให้จัดการ division by zero — เปลี่ยน signature ของ function คำนวณให้ return ทั้ง `int` และ `error` ใน `div` ถ้า divisor เป็น 0 ให้ return `0` กับ `errors.New("division by zero")` ถ้าไม่ใช่ให้ return ผลหารกับ `nil` แล้วปรับ loop ใน `main` ให้เช็ค error
2. เขียน function `fileLen` ที่รับ `string` (filename) และ return `int` (จำนวน byte ในไฟล์) กับ `error` ถ้าเปิดหรืออ่านไฟล์ไม่สำเร็จให้ return error และใช้ `defer` ปิดไฟล์ให้เรียบร้อย
3. เขียน function `prefixer` ที่รับ `string` (prefix) แล้ว return function ซึ่งรับ `string` และ return `string` อีกที โดย function ที่ return ออกมาจะเติม prefix ไว้หน้าข้อความ เพื่อฝึก closure และการ return function

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ลืม `...` ตอนส่ง slice ให้ variadic parameter** — `addTo(3, a)` ไม่ผ่าน ต้องเขียน `addTo(3, a...)` มิฉะนั้นเป็น compile-time error
- **ใส่วงเล็บรอบค่าที่ return จาก multiple return** — `return (0, 0, err)` เป็น compile-time error; วงเล็บมีไว้เฉพาะตอนระบุรายการ type ของค่าที่ return
- **คิดว่า multiple return values เป็น tuple แบบ Python** — assign ลงตัวแปรเดียวไม่ได้ ต้องแยกทุกค่า
- **ใช้ blank (naked) return** — `return` เปล่า ๆ จะคืนค่าปัจจุบันของ named return values ทำให้คนอ่านต้องไล่หา data flow เอง ควรเขียนค่าที่ return ให้ชัดเจน
- **เรียก function variable ที่เป็น `nil`** — zero value ของ function คือ `nil` และการเรียกมันจะเกิด panic
- **ลืมวงเล็บ `()` หลังชื่อ function ใน `defer`** — เป็น compile-time error; วงเล็บคือจุดที่ใส่ argument ซึ่งถูก eval ทันทีตอนเจอ `defer`
- **คาดหวังให้ `append` ใน function ขยาย slice ของ caller** — แก้ element เดิมได้ แต่การเพิ่มความยาวจะเกิดกับ slice สำเนาใน function เพราะ Go เป็น call by value
- **ใช้ `:=` ภายใน closure โดยไม่ตั้งใจ** — shadow ตัวแปรชั้นนอกแทนที่จะแก้ค่ามัน (อย่าลืม `=` เขียนทับ, `:=` สร้างใหม่)

---

## สรุป

1. function declaration มีสี่ส่วน: `func`, ชื่อ, parameters และ return type — ถ้า parameter ที่อยู่ติดกันมี type เดียวกัน เรารวบ type ได้ เช่น `func div(num, denom int) int`
2. Go ไม่มี named/optional parameters — จำลองได้ด้วย struct ที่รวม option ไว้ และ function ที่รับ parameter เยอะเกินไปมักเป็นสัญญาณว่าควรแยก logic ออกเป็นส่วนย่อย
3. variadic parameter ระบุด้วย `...type` เป็น parameter ตัวสุดท้าย ภายในเป็น slice และส่ง slice เข้าไปด้วย `slice...`
4. ใช้ multiple return values โดย convention มักวาง `error` เป็นค่าสุดท้าย และใช้ `_` ทิ้งค่าที่ไม่ต้องการอ่าน
5. named return values มีประโยชน์หลายกรณี (ในบทนี้เห็นชัดที่สุดเมื่อใช้คู่กับ `defer`) แต่ควรหลีกเลี่ยง blank return เพราะทำให้ data flow อ่านยาก
6. function เป็น value — เก็บในตัวแปร, map (dispatch table), struct และกำหนด type ใหม่ด้วย `type opFuncType func(int, int) int`
7. closure capture ตัวแปรชั้นนอกได้ทั้งอ่านและเขียน — ระวัง `:=` vs `=` ภายใน closure
8. ส่ง function เป็น parameter (เช่น `sort.Slice`) และ return function ออกมา (factory) — นี่คือ higher-order function
9. `defer` ผูก cleanup กับ function ให้รันหลัง `return` แบบ LIFO และ argument ถูก eval ทันที — อย่าลืมวงเล็บ `()` หลังชื่อ function
10. Go เป็น call-by-value เสมอ — `map`/`slice` ที่ส่งเข้า function ยังอ้างถึงข้อมูลเดิม จึงแก้ element ได้ แต่การเปลี่ยนความยาวของ slice ไม่ย้อนกลับไปที่ caller

บทนี้พาเราขึ้นบันไดจาก "function กล่องรับส่งค่า" ไปจนถึง "function เป็นพลเมืองชั้นหนึ่ง" — เก็บไว้ในตัวแปร ส่งไปมา และ return ออกมาได้ เมื่อรวมกับ closure และ `defer` เราก็มีเครื่องมือจัดระเบียบโค้ดสำหรับโปรแกรมจริงมากขึ้นแล้ว

กฎ call by value ที่เข้าใจในวันนี้จะเป็นกุญแจสำคัญสำหรับทำความเข้าใจ pointer ในตอนหน้าครับ

> *ตอนถัดไปจะต่อด้วย pointers — ทำไม `map`/`slice` ถึงมี behavior แบบนั้น และวิธีส่งข้อมูลที่แก้ไขได้เข้า function อย่างมีประสิทธิภาพ*

---

## Glossary

- **Signature** — ชุดของ keyword `func` พร้อม type ของ parameters และ return values ที่ใช้กำหนด type ของ function
- **Variadic parameter** — parameter ตัวสุดท้ายที่ระบุ `...type` รับค่าได้ไม่จำกัด ภายใน function เป็น slice
- **Multiple return values** — ความสามารถของ Go ในการ return หลายค่า ระบุ type ในวงเล็บคั่นด้วย comma
- **Named return values** — การตั้งชื่อค่า return ใน declaration ซึ่งเป็นการ predeclare ตัวแปรที่เริ่มต้นด้วย zero value
- **Blank (naked) return** — `return` เปล่า ๆ เมื่อมี named return values จะคืนค่าปัจจุบันของตัวแปรที่ตั้งชื่อไว้ — ไม่ควรใช้
- **Function value** — function ที่ถูกปฏิบัติเหมือน value: เก็บใส่ตัวแปร, map, ส่งเป็น argument, return ออกมาได้
- **Function type declaration** — การใช้ `type` ตั้งชื่อให้ function signature เพื่อ reuse และ documentation
- **Anonymous function** — function ที่ไม่มีชื่อ ประกาศ inline หรือ assign ให้ตัวแปร
- **Closure** — function ที่อ้างถึงตัวแปรจาก scope ชั้นนอก ทำให้เข้าถึงและแก้ไขตัวแปรนั้นได้
- **Captured variable** — ตัวแปรของ scope ชั้นนอกที่ closure อ้างถึงและพาไปใช้ภายนอกได้
- **Higher-order function** — function ที่รับ function เป็น input หรือ return function ออกมา
- **`defer`** — keyword ที่เลื่อนการเรียก function/method/closure ไปจนกว่า function ที่ครอบอยู่จะจบ
- **LIFO** — last-in, first-out; ลำดับการรันของ deferred functions หลายตัว (ตัวที่เขียนทีหลังรันก่อน)
- **Call by value** — Go จะ copy ค่าตัวแปรเสมอตอนส่งเข้า function; `map` และ `slice` ยังอ้างถึงข้อมูลเดิม จึงแก้ข้อมูลข้างในได้ แต่การเปลี่ยนตัว value เองไม่ย้อนกลับไปที่ caller

---

## Related

- [ตอนที่ 4: Blocks, Shadows, and Control Structures](/go/04-blocks-shadows-and-control-structures/) — ความรู้เรื่อง block และ shadowing กลับมาสำคัญอีกครั้งใน closure และ named return values พร้อมกับ `_` ที่ใช้ทิ้งค่าที่ไม่ใช้
- [ตอนที่ 3: Composite Types](/go/03-composite-types/) — slice, map และ struct ที่นิยามไว้ถูกใช้บ่อยในบทนี้: variadic เป็น slice, behavior แบบ call by value ของ map/slice และ struct จำลอง named parameters
- [ตอนที่ 2: Predeclared Types and Declarations](/go/02-predeclared-types-and-declarations/) — การประกาศตัวแปรด้วย `var` และ `:=` และเรื่อง zero value ที่ named return values ใช้เป็นค่าเริ่มต้น
