+++
title = 'ตอนที่ 8: Generics'
date = '2026-08-07T00:00:00+07:00'
draft = false
description = 'ใช้ type parameters สร้าง type และ function ที่ทำงานกับหลายชนิดข้อมูล พร้อมรักษา type safety และให้ compiler ช่วยตรวจตั้งแต่ compile time'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราคุยกันว่า interface ช่วยให้เราเขียน business logic ที่ไม่ผูกกับ implementation ได้อย่างไร แต่มีคำถามหนึ่งที่ interface ตอบได้ไม่ค่อยดีนัก:

ถ้าเราอยากสร้าง `Stack` ที่เก็บ `int`, `string` หรือ `Person` ก็ได้ โดย logic ข้างในเหมือนเดิม เราจะเขียนอย่างไรโดยไม่ต้องก๊อปโค้ดสามรอบ และไม่ใช้ `any` จน compiler ไม่รู้แล้วว่าข้างในเป็นอะไร?

คำตอบคือ **Generics** หรือชื่อทางการว่า **type parameters** มันเหมือนช่องว่างที่บอกว่า “ตอนนี้ยังไม่ระบุ type เดี๋ยวค่อยกรอกตอนเอาไปใช้” แต่ต่างจากช่องว่างทั่วไปตรงที่ compiler จะตรวจให้เราอยู่ดี

สิ่งที่จะได้ตอนจบบทนี้:

- สร้าง generic type ด้วย type parameter เช่น `Stack[T any]`
- เลือก type constraint ให้แคบเท่าที่ operation ต้องการด้วย `any`, `comparable` และ interface ของเราเอง
- เขียน generic function สำหรับ `Filter`, `Map` และ `Reduce`
- ใช้ type term (`int | float64`) และ `~` เพื่อรองรับ user-defined type
- เข้าใจว่าเมื่อไหร่ compiler infer type ให้ได้ และเมื่อไหร่ต้องระบุ type argument เอง
- สร้าง generic binary tree ที่ใช้ได้ทั้งกับตัวเลขและ struct
- ระวัง `comparable` ที่อาจ compile ผ่านแต่ panic ได้เมื่อมี interface ซ่อน slice อยู่ข้างใน
- รู้ว่า generics ไม่ได้แปลว่าเร็วกว่าเสมอ และรู้จักใช้ `slices`, `maps` และ `cmp` ใน standard library

{{< mermaid >}}
graph TD
  A[Generic type หรือ function] --> B[ประกาศ type parameter ใน []]
  B --> C{เลือก constraint}
  C -->|เก็บและคืนค่า| D[any]
  C -->|ต้องเทียบ == !=| E[comparable]
  C -->|ต้องใช้ method| F[Interface constraint]
  C -->|ต้องใช้ operator| G[Type terms และ ~]
  D --> H[Compiler ตรวจตอน instantiate]
  E --> H
  F --> H
  G --> H
  H --> I[โค้ดเดียวใช้กับหลาย concrete type]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-generics` เพื่อทดลองโค้ด โดยใช้ Go 1.21 ขึ้นไป เพราะช่วงท้ายบทจะใช้ package `cmp` และ `slices` ที่มากับ standard library รุ่นใหม่ เปิด terminal แล้วรัน:

```sh
mkdir go-generics
cd go-generics
go mod init go-generics
touch main.go
```

ในแต่ละ Step ให้แทนที่โค้ดใน `main.go` ด้วยตัวอย่างของ Step นั้น แล้วรัน:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านหรือ panic จะแยกออกจากโปรแกรมที่รันได้ และมีคำอธิบายกำกับไว้ อย่าวางตัวอย่างเหล่านั้นรวมกับโปรแกรมปกติ

---

## Step 1: ทำไมต้องมี Generics?

ลองนึกถึง `Stack` เหมือนกองจาน จานที่วางทีหลังต้องถูกหยิบออกก่อน นี่คือ **LIFO (Last In, First Out)**

ถ้าเราต้องการ stack ของ `int` และยังไม่มี generics เราอาจสร้าง type แยกแบบนี้:

```go
type IntStack struct {
    values []int
}

func (s *IntStack) Push(value int) {
    s.values = append(s.values, value)
}

func (s *IntStack) Pop() (int, bool) {
    if len(s.values) == 0 {
        return 0, false
    }

    last := len(s.values) - 1
    value := s.values[last]
    s.values = s.values[:last]
    return value, true
}
```

ถ้าอยากได้ `StringStack` ก็ต้องก๊อปโค้ดไปเปลี่ยน `int` เป็น `string` ซึ่ง logic เหมือนเดิมแทบทุกบรรทัด ต่างกันแค่ type

อีกทางหนึ่งคือใช้ `any`:

```go
package main

import "fmt"

type Stack struct {
    values []any
}

func (s *Stack) Push(value any) {
    s.values = append(s.values, value)
}

func (s *Stack) Pop() (any, bool) {
    if len(s.values) == 0 {
        return nil, false
    }

    last := len(s.values) - 1
    value := s.values[last]
    s.values = s.values[:last]
    return value, true
}

func main() {
    var stack Stack
    stack.Push(10)
    stack.Push("not an int")

    value, _ := stack.Pop()
    number := value.(int)
    fmt.Println(number)
}
```

ตัวอย่างนี้ compile ผ่าน แต่ panic ตอนรัน เพราะค่าบนสุดเป็น `string` ไม่ใช่ `int`:

```text
panic: interface conversion: interface {} is string, not int
```

นี่คือปัญหาของ `any`: มันยืดหยุ่นมากจน compiler ไม่สามารถช่วยกันค่าผิด type ได้ เราต้องรอให้โปรแกรมรันแล้วเจอ type assertion เอง

> `any` เหมาะกับ boundary ที่ข้อมูลไม่แน่นอนจริง ๆ แต่ไม่ควรใช้เป็นข้ออ้างเพื่อเอา type safety ออกจาก container ทุกตัว

Generics เข้ามาตรงกลางระหว่างสองทางเลือกนี้ เราเขียน logic ครั้งเดียว แต่ให้คนใช้ระบุ type ตอน instantiate และให้ compiler ตรวจความถูกต้องตั้งแต่ compile time

---

## Step 2: Generic type คือ type ที่กรอกชนิดข้อมูลทีหลัง

เราจะเขียน `Stack` ใหม่ให้รองรับทุก type ด้วย `[T any]`:

```go
package main

import "fmt"

type Stack[T any] struct {
    values []T
}

func (s *Stack[T]) Push(value T) {
    s.values = append(s.values, value)
}

func (s *Stack[T]) Pop() (T, bool) {
    if len(s.values) == 0 {
        var zero T
        return zero, false
    }

    last := len(s.values) - 1
    value := s.values[last]
    s.values = s.values[:last]
    return value, true
}

func main() {
    var intStack Stack[int]
    intStack.Push(10)
    intStack.Push(20)

    value, ok := intStack.Pop()
    fmt.Println(value, ok)

    var stringStack Stack[string]
    stringStack.Push("hello")
    value2, ok2 := stringStack.Pop()
    fmt.Println(value2, ok2)

    var empty Stack[int]
    value3, ok3 := empty.Pop()
    fmt.Println(value3, ok3)
}
```

ผลลัพธ์คือ:

```text
20 true
hello true
0 false
```

อ่าน `[T any]` เป็นสองส่วน:

- `T` คือชื่อ **type parameter** ตั้งชื่ออื่นได้ แต่ในตัวอย่างทั่วไปนิยมใช้ตัวพิมพ์ใหญ่ เช่น `T`, `K` และ `V`
- `any` คือ **type constraint** ที่บอกว่า `T` เป็น type ใดก็ได้

พอเราเขียน `Stack[int]` ก็เหมือนกรอกช่องว่าง `T` ด้วย `int` และได้ stack ที่ `Push` ได้เฉพาะ `int` ถ้าลองเขียนแบบนี้จะแยกไว้ดูเฉย ๆ เพราะ compile ไม่ผ่าน:

```go
var intStack Stack[int]
intStack.Push("nope") // string ใช้กับ Stack[int] ไม่ได้
```

ใน method ต้องเขียน receiver เป็น `Stack[T]` ไม่ใช่ `Stack` เพราะเรากำลังบอก compiler ว่า method นี้เป็นของ generic type ที่มี type parameter `T` อยู่ด้วย

### แล้วทำไม Pop ถึงไม่ return `nil`?

ตอน stack ว่าง เราต้องคืนค่าอะไรสักอย่างที่เป็น type `T` แต่ `T` อาจเป็น `int`, `struct` หรือ type value อื่น ๆ ที่ไม่มี `nil`

วิธีมาตรฐานคือ:

```go
var zero T
return zero, false
```

`var` จะ initialize ค่าให้เป็น **zero value** ของ type นั้นเอง เช่น `0` สำหรับ `int`, `""` สำหรับ `string` และ struct ที่ทุก field เป็น zero value ส่วน `bool` อีกตัวใช้บอกว่าการ pop สำเร็จหรือไม่

> ถ้า generic function ต้องคืนค่า `T` ที่อาจไม่มีข้อมูล อย่าฝืน return `nil` ให้ใช้ zero value คู่กับ `bool` หรือ `error` ตามความหมายของ API

---

## Step 3: Constraint บอกว่า T ทำอะไรได้บ้าง

ตอนนี้ `Stack[T any]` เก็บและคืนค่าได้ แต่ `any` ไม่รับประกันว่า value สองตัวเอามาเทียบด้วย `==` ได้ ลองเพิ่ม `Contains` แบบนี้:

```go
func (s Stack[T any]) Contains(value T) bool {
    for _, item := range s.values {
        if item == value {
            return true
        }
    }
    return false
}
```

โค้ดนี้ compile ไม่ผ่าน เพราะ compiler ไม่รู้ว่า `T` เป็น type ที่ใช้ `==` ได้หรือเปล่า `any` แปลว่า “อะไรก็ได้” ซึ่งรวมถึง `slice`, `map` และ `func` ที่เทียบด้วย `==` ไม่ได้

ถ้า operation ของเราต้องการ `==` หรือ `!=` ให้เปลี่ยน constraint เป็น `comparable`:

```go
package main

import "fmt"

type Stack[T comparable] struct {
    values []T
}

func (s *Stack[T]) Push(value T) {
    s.values = append(s.values, value)
}

func (s Stack[T]) Contains(value T) bool {
    for _, item := range s.values {
        if item == value {
            return true
        }
    }
    return false
}

func main() {
    var stack Stack[int]
    stack.Push(10)
    stack.Push(20)

    fmt.Println(stack.Contains(20))
    fmt.Println(stack.Contains(99))
}
```

ผลลัพธ์คือ:

```text
true
false
```

`comparable` เป็น built-in constraint ใน universe block ของ Go สำหรับ type ที่ใช้ `==` และ `!=` ได้ ดังนั้น `Stack[[]int]` จะใช้ไม่ได้โดยตรง เพราะ slice ไม่ comparable

เลือก constraint จากสิ่งที่โค้ดต้องทำ ไม่ใช่จากความรู้สึกว่า constraint ยิ่งกว้างยิ่งดี:

| งานที่ generic code ต้องทำ | Constraint ที่เหมาะสม |
|---|---|
| เก็บและคืนค่าอย่างเดียว | `any` |
| ใช้ `==` หรือ `!=` | `comparable` |
| เรียก method บางตัว | interface ที่ประกาศ method นั้น |
| ใช้ `+`, `%`, `<` หรือ operator อื่น | interface ที่มี type terms ครอบคลุม type ที่ต้องการ |

> Constraint ไม่ได้มีไว้ทำให้ generic ดูฉลาดขึ้น แต่มีไว้บอก compiler ว่าใน function นี้เรารับประกันอะไรได้บ้าง

---

## Step 4: Generic function — เขียน algorithm ครั้งเดียว

Generic type ช่วยสร้าง container ที่ใช้ซ้ำได้ ส่วน generic function ช่วย abstract **algorithm** หรือขั้นตอนการคำนวณที่เหมือนกัน แต่ input/output อาจเป็นคนละ type

ลองเขียนสาม function ที่ใช้กับ slice:

```go
package main

import "fmt"

func Filter[T any](values []T, keep func(T) bool) []T {
    var result []T
    for _, value := range values {
        if keep(value) {
            result = append(result, value)
        }
    }
    return result
}

func Map[T1, T2 any](values []T1, transform func(T1) T2) []T2 {
    result := make([]T2, len(values))
    for i, value := range values {
        result[i] = transform(value)
    }
    return result
}

func Reduce[T1, T2 any](values []T1, initial T2, combine func(T2, T1) T2) T2 {
    result := initial
    for _, value := range values {
        result = combine(result, value)
    }
    return result
}

func main() {
    words := []string{"One", "Potato", "Two", "Potato"}

    filtered := Filter(words, func(word string) bool {
        return word != "Potato"
    })
    fmt.Println(filtered)

    lengths := Map(filtered, func(word string) int {
        return len(word)
    })
    fmt.Println(lengths)

    total := Reduce(lengths, 0, func(sum int, length int) int {
        return sum + length
    })
    fmt.Println(total)
}
```

ผลลัพธ์คือ:

```text
[One Two]
[3 3]
6
```

สังเกตว่า `Filter` รับและคืน `T` ชนิดเดิม ส่วน `Map` แปลงจาก `T1` เป็น `T2` จึงต้องมี type parameter สองตัว และ `Reduce` ก็รับ slice ชนิดหนึ่ง แต่สะสมผลเป็นอีกชนิดหนึ่งได้

ตอนเรียกเราไม่ได้เขียน `Filter[string](...)` หรือ `Map[string, int](...)` เพราะ compiler ทำ **type inference** จาก argument ให้เอง เห็นว่า `words` เป็น `[]string` และ callback รับ `string` ก็เติม `T` เป็น `string` ให้

ข้อดีของตัวอย่างนี้คือถ้า callback คืน type ผิด compiler จะบอกทันที ไม่ต้องรอให้โปรแกรมรันแล้วค่อยพบว่าค่าใน `any` เป็นชนิดที่ไม่คาดคิด

---

## Step 5: ใช้ interface เป็น constraint ได้เหมือนกัน

`any` และ `comparable` ไม่ใช่ constraint สองตัวที่มีให้เลือกเท่านั้น เราสามารถใช้ interface ที่มี method เป็น constraint ได้ด้วย

ตัวอย่างนี้บอกว่า `Pair` เก็บของชนิดเดียวกันสองตัว แต่ของที่เก็บต้องมี method `String() string` ตาม `fmt.Stringer`:

```go
package main

import "fmt"

type Label string

func (l Label) String() string {
    return string(l)
}

type Pair[T fmt.Stringer] struct {
    first  T
    second T
}

func describePair[T fmt.Stringer](pair Pair[T]) string {
    return pair.first.String() + " / " + pair.second.String()
}

func main() {
    pair := Pair[Label]{
        first:  Label("Go"),
        second: Label("Generics"),
    }

    fmt.Println(describePair(pair))
}
```

ผลลัพธ์คือ:

```text
Go / Generics
```

`Label` ใช้เป็น `T` ได้เพราะมี `String()` ครบตามที่ constraint ขอ ถ้าเอา `int` มาใช้แทน จะ compile ไม่ผ่านเพราะ `int` ไม่มี method นี้

จุดที่ควรจำคือ `Pair[T fmt.Stringer]` ไม่ได้บอกว่า field เป็น `fmt.Stringer` แบบกว้าง ๆ แล้วจบ แต่มันบอกว่าทั้ง `first` และ `second` ต้องเป็น concrete type เดียวกันที่ satisfy constraint เดียวกัน ดังนั้น `Pair[Label]` จึงไม่สามารถใส่ `string` ปนกับ `Label` ได้

เรายังเขียน constraint ที่มี type parameter ของตัวเองได้ เช่นแนวคิดนี้:

```go
type Differ[T any] interface {
    fmt.Stringer
    Diff(T) float64
}
```

interface นี้หมายถึง type ต้องมีทั้ง `String()` และ `Diff(T)` โดย `T` ใน method ต้องเป็น type เดียวกับ type parameter ที่กำลังตรวจอยู่ ใช้ pattern นี้ได้เมื่อ behavior ของ type มีความสัมพันธ์กับ type ตัวเอง เช่นจุดสองจุดที่วัดระยะห่างระหว่าง `Point2D` กับ `Point2D`

ไม่ต้องรีบสร้าง constraint ใหญ่ ๆ ตั้งแต่แรก เริ่มจาก method ที่ algorithm ต้องเรียกจริง ๆ ก่อน เพราะ constraint ที่ใหญ่เกินไปทำให้ type ที่ควรใช้กลับใช้ไม่ได้โดยไม่จำเป็น

---

## Step 6: Type terms ทำให้ generic ใช้ operator ได้

Interface ที่มี method บอกได้ว่า `T` เรียก method อะไรได้บ้าง แต่ compiler ยังไม่รู้ว่า `T` ใช้ operator ตัวไหนได้ ถ้าเราอยากเขียน function ที่หารและหาเศษด้วย `/` และ `%` เราต้องระบุชุด type ที่รองรับ operator เหล่านี้

สิ่งนี้เรียกว่า **type term** และเขียนรวมกันด้วย `|`:

```go
package main

import (
    "errors"
    "fmt"
)

type Integer interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr
}

func divAndRemainder[T Integer](number, denominator T) (T, T, error) {
    if denominator == 0 {
        var zero T
        return zero, zero, errors.New("cannot divide by zero")
    }

    return number / denominator, number % denominator, nil
}

type MyInt int

func main() {
    quotient, remainder, err := divAndRemainder(MyInt(17), MyInt(5))
    fmt.Println(quotient, remainder, err)
}
```

ผลลัพธ์คือ:

```text
3 2 <nil>
```

รายการ `~int | ~int8 | ...` บอก compiler ว่า `T` ต้องเป็น type ที่มี underlying type อยู่ในรายการ และ operator ที่ใช้ใน function body ต้อง valid กับ type เหล่านี้ทั้งหมด

### ทำไมต้องมี `~`?

ถ้าเขียนแค่ `int | int64` จะ match แบบตรงตัวเท่านั้น `type MyInt int` จะไม่ผ่าน แม้ข้างในจะเก็บข้อมูลแบบ `int` เหมือนกัน

เครื่องหมาย `~` อ่านได้ประมาณว่า “type ใดก็ตามที่มี underlying type เป็น...” จึงทำให้ `MyInt` ใช้กับ `Integer` ได้

ถ้าอยากเขียน constraint สำหรับค่าที่เปรียบเทียบด้วย `<` หรือ `>` ได้ ก็ต้องรวม integer, float และ string ที่รองรับ comparison เข้าไป เช่น:

```go
type Ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
        ~float32 | ~float64 |
        ~string
}
```

แล้วจึงเขียน `Min[T Ordered](a, b T) T` ได้ เพราะทุก type ในรายการรองรับ `<`

> Type terms มีไว้เป็น constraint เท่านั้น interface ที่มี `int | int64` ไม่สามารถเอาไปประกาศเป็นตัวแปร, field, parameter หรือ return type แบบ interface ปกติได้

ตัวอย่างนี้จึง compile ไม่ผ่าน:

```go
type Integer interface {
    int | int64
}

var value Integer // ใช้ type term interface เป็นชนิดของตัวแปรไม่ได้
```

ถ้า constraint มีทั้ง type term และ method term ก็หมายความว่าต้องผ่านทั้งสองเงื่อนไข เช่น `~int` และ `String() string` พร้อมกัน ไม่มีทางใช้ `int` ตรง ๆ ได้เพราะ `int` ไม่มี method `String`

---

## Step 7: Type inference และข้อจำกัดเรื่อง constant

ที่ผ่านมา compiler infer type ให้จาก argument ได้ เช่น:

```go
lengths := Map(filtered, func(word string) int {
    return len(word)
})
```

แต่ compiler เดา type ที่ปรากฏเฉพาะใน return value ไม่ได้ ลองดู function แปลง integer นี้:

```go
package main

import "fmt"

type Integer interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
        ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr
}

func Convert[T1, T2 Integer](input T1) T2 {
    return T2(input)
}

func main() {
    input := 10
    output := Convert[int, int64](input)
    fmt.Printf("%T %v\n", output, output)
}
```

ผลลัพธ์คือ:

```text
int64 10
```

จาก `input` compiler รู้ว่า `T1` เป็น `int` แต่ไม่มี argument ไหนบอกว่า return `T2` ควรเป็น type อะไร จึงต้องระบุทั้ง `[int, int64]` เอง

หลักเดียวกันนี้เกิดกับ function ที่มี type parameter ใน return อย่างเดียว:

```go
func Zero[T any]() T {
    var zero T
    return zero
}

value := Zero[int]()
```

เขียน `Zero()` เฉย ๆ ไม่ได้ เพราะไม่มีข้อมูลให้ compiler infer `T`

### Constant ต้องใช้ได้กับทุก type ใน constraint

ตัวเลขที่เขียนตรง ๆ ใน generic function ต้อง represent ได้กับทุก type ใน type set ด้วย ตัวอย่างนี้จึง compile ไม่ผ่าน:

```go
func PlusOneThousand[T Integer](value T) T {
    return value + 1_000
}
```

สาเหตุคือ `Integer` ครอบคลุม `int8` และ `uint8` ซึ่งเก็บ `1_000` ไม่ได้ ถึงแม้ตอนเรียกจริงเราจะตั้งใจใช้ `int64` ก็ตาม compiler ต้องตรวจ body ให้ปลอดภัยสำหรับทุก type ที่ constraint อนุญาต

ถ้าใช้ค่าที่ represent ได้กับทุก type ใน constraint เช่น `100` ก็ทำได้:

```go
func PlusOneHundred[T Integer](value T) T {
    return value + 100
}
```

ถ้า logic ต้องรองรับช่วงค่ากว้างจริง ๆ ให้เลือก constraint ให้ตรงกับงานหรือรับค่าคงที่เข้ามาเป็น parameter แทน อย่าปล่อยให้ generic ดูกว้าง แต่ข้างในแอบใช้สมมติฐานว่า type ต้องใหญ่พอ

---

## Step 8: รวม generic function กับ generic data structure

ลองกลับมาที่ binary tree กันอีกครั้ง ปัญหาของ tree คือมันต้องรู้ว่า value ไหนควรไปทางซ้ายหรือขวา แต่ generic tree ไม่ควรเดาเองว่า `T` เป็นตัวเลข, string หรือ struct แบบไหน

เราจึงส่ง function สำหรับเปรียบเทียบเข้าไปเป็น dependency:

```go
package main

import (
    "cmp"
    "fmt"
)

type OrderableFunc[T any] func(T, T) int

type Tree[T any] struct {
    compare OrderableFunc[T]
    root    *node[T]
}

type node[T any] struct {
    value       T
    left, right *node[T]
}

func NewTree[T any](compare OrderableFunc[T]) *Tree[T] {
    return &Tree[T]{compare: compare}
}

func (t *Tree[T]) Add(value T) {
    t.root = t.root.add(t.compare, value)
}

func (t *Tree[T]) Contains(value T) bool {
    return t.root.contains(t.compare, value)
}

func (n *node[T]) add(compare OrderableFunc[T], value T) *node[T] {
    if n == nil {
        return &node[T]{value: value}
    }

    result := compare(value, n.value)
    switch {
    case result < 0:
        n.left = n.left.add(compare, value)
    case result > 0:
        n.right = n.right.add(compare, value)
    }
    return n
}

func (n *node[T]) contains(compare OrderableFunc[T], value T) bool {
    if n == nil {
        return false
    }

    result := compare(value, n.value)
    switch {
    case result < 0:
        return n.left.contains(compare, value)
    case result > 0:
        return n.right.contains(compare, value)
    default:
        return true
    }
}

type Person struct {
    Name string
    Age  int
}

func comparePeople(first, second Person) int {
    if result := cmp.Compare(first.Name, second.Name); result != 0 {
        return result
    }
    return cmp.Compare(first.Age, second.Age)
}

func main() {
    numbers := NewTree(cmp.Compare[int])
    numbers.Add(10)
    numbers.Add(30)
    numbers.Add(15)

    fmt.Println(numbers.Contains(15))
    fmt.Println(numbers.Contains(40))

    people := NewTree(comparePeople)
    people.Add(Person{Name: "Bob", Age: 30})
    people.Add(Person{Name: "Mina", Age: 28})

    fmt.Println(people.Contains(Person{Name: "Bob", Age: 30}))
}
```

ผลลัพธ์คือ:

```text
true
false
true
```

ในตัวอย่างนี้ `Tree[T]` รับผิดชอบโครงสร้าง tree ส่วน `compare` รับผิดชอบกติกาของ domain ว่าจะเรียง `T` อย่างไร เราจึงใช้ tree เดิมกับ `int` และ `Person` ได้ โดยไม่ต้องทำ type assertion หรือสร้าง tree แยกสองชุด

`cmp.Compare[int]` คือการ instantiate generic function ของ standard library ให้กลายเป็น function ที่เปรียบเทียบ `int` ส่วน `comparePeople` เป็น function ที่เราเขียนเองให้ตรงกับ `OrderableFunc[Person]`

นี่เป็น pattern ที่น่าใช้มาก: generic algorithm ไม่จำเป็นต้องรู้รายละเอียดของข้อมูล ขอแค่ caller ส่ง behavior ที่ algorithm ต้องใช้เข้ามาให้ครบ

---

## Step 9: `comparable` ยังมีหลุมพรางเมื่อเจอ interface

เราบอกไปว่า `comparable` ช่วยให้ใช้ `==` ได้ และ compiler จะไม่รับ `[]int` ตรง ๆ แต่มีกรณีหนึ่งที่ต้องระวัง: interface เองสามารถผ่าน constraint `comparable` ได้ แม้ค่าที่ถูกเก็บอยู่ข้างในภายหลังจะเป็น type ที่เทียบไม่ได้

ลองแยกตัวอย่างนี้ไว้ดูเฉย ๆ เพราะโปรแกรมจะ panic ตอนรอบที่สอง:

```go
package main

import "fmt"

type Thinger interface {
    Thing()
}

type ThingerInt int

func (ThingerInt) Thing() {}

type ThingerSlice []int

func (ThingerSlice) Thing() {}

func compare[T comparable](first, second T) {
    fmt.Println(first == second)
}

func main() {
    var first Thinger = ThingerInt(10)
    var second Thinger = ThingerInt(10)
    compare(first, second)

    first = ThingerSlice{1, 2, 3}
    second = ThingerSlice{1, 2, 3}
    compare(first, second)
}
```

ผลลัพธ์ช่วงแรกคือ `true` แต่ตอนเรียกครั้งที่สองจะ panic ประมาณนี้:

```text
true
panic: runtime error: comparing uncomparable type main.ThingerSlice
```

ทำไมถึงเกิดขึ้น? ตอน compiler เห็น `first` และ `second` มันเห็น type ที่ประกาศคือ `Thinger` ซึ่งเป็น interface และ interface ผ่าน `comparable` ได้ แต่ตอน runtime interface กลับห่อ `ThingerSlice` ที่เป็น slice อยู่ข้างใน การใช้ `==` จึงทำไม่ได้

ถ้าเรียกแบบนี้ตรง ๆ compiler จะปฏิเสธตั้งแต่แรก:

```go
compare(ThingerSlice{1, 2, 3}, ThingerSlice{1, 2, 3})
// ThingerSlice does not satisfy comparable
```

ดังนั้น `comparable` ไม่ใช่ใบรับประกันว่า value ที่อาจถูกซ่อนอยู่ใน interface จะ comparable เสมอ ถ้า API รับ interface ที่มี dynamic type ไม่แน่นอน อย่าเอาไปเทียบด้วย `==` หรือใช้เป็น map key แบบไม่ตรวจให้ดี

> Interface แค่ห่อ type กับ value ไว้ด้วยกัน มันไม่ได้เปลี่ยน slice ให้กลายเป็น type ที่เปรียบเทียบได้

---

## Step 10: ใช้ Generics เมื่อเหมาะ ไม่ใช่ใช้ทุกที่

Generics เป็นเครื่องมือใหม่ที่มีพลัง แต่ไม่ได้แปลว่าทุก function ต้องรีบเปลี่ยนเป็น generic และไม่ได้แปลว่า generic จะเร็วกว่า interface ทุกกรณี

### ฟีเจอร์ที่ Go ตั้งใจไม่ใส่

Go เลือกเก็บ generics ให้เล็กและอ่านง่าย จึงยังไม่มีสิ่งเหล่านี้:

| สิ่งที่ไม่มี | ผลกับการเขียนโค้ด |
|---|---|
| Operator overloading | เรานิยามความหมายใหม่ให้ `+` หรือ `==` บน user-defined type ไม่ได้ ใช้ function อย่าง comparator แทน |
| Parameterized methods | method เพิ่ม type parameter ใหม่เองไม่ได้ ใช้ generic function แยก หรือ nest function call |
| Variadic type parameters | variadic parameter หนึ่งชุดต้องใช้ type เดียว ไม่สามารถประกาศ pattern สลับ `string` กับ `int` ได้ |
| Specialization/overloading | ไม่มี generic version แล้วเขียน overload เฉพาะ type แบบบางภาษา |

ตัวอย่าง method ที่ดูเหมือนน่าจะเขียนได้ แต่ Go ไม่รองรับ:

```go
// ใช้ไม่ได้: method เพิ่ม type parameter E เองไม่ได้
func (s Stack[T]) Map[E any](transform func(T) E) []E {
    return nil
}
```

จึงแยก `Map` เป็น generic function แบบที่ทำใน Step 4 แทน

### Interface กับ Generics เลือกอย่างไร?

ใช้แนวทางสั้น ๆ นี้ก่อน:

- ใช้ interface เมื่อ behavior สำคัญกว่าชนิดข้อมูล และต้องการส่ง implementation หลายแบบเข้ามา
- ใช้ generics เมื่อ algorithm เหมือนกัน แต่ต้องการเก็บหรือคืน concrete type ที่ compiler รู้ชนิดชัดเจน
- ใช้ `any` เมื่อข้อมูลไม่แน่นอนที่ boundary จริง ๆ เช่น JSON ที่ schema เปลี่ยนไปมา ไม่ใช่เพื่อทำ container ใหม่ทุกใบ
- อย่า refactor โค้ดเก่าทั้งหมดมาเป็น generics เพียงเพราะ Go รองรับแล้ว โค้ดเดิมที่อ่านง่ายและทำงานดีไม่จำเป็นต้องถูกเปลี่ยน

### Generic ไม่ได้เร็วกว่าเสมอ

ในบาง function เล็ก ๆ ที่มีแค่การเรียก method การใช้ generic type parameter อาจช้ากว่าการรับ interface ด้วยซ้ำ เพราะ compiler ของ Go อาจแชร์ implementation ตาม underlying type และมี runtime lookup เพิ่มขึ้น ใน benchmark บางแบบความต่างอาจอยู่ราว 30% สำหรับ function ที่ trivial แต่ตัวเลขนี้ขึ้นกับ Go version, code และ workload

อย่าเดาจาก syntax ให้ benchmark และ profile งานจริงก่อนตัดสินใจ เรื่องหลักของ generics คือ reuse และ type safety ไม่ใช่ปุ่มเร่งความเร็วอัตโนมัติ

### ใช้ generic helper ใน standard library ก่อนเขียนเอง

ตั้งแต่ Go 1.21 มี package ที่ใช้ generics ช่วยงานทั่วไปแล้ว ลองรันตัวอย่างนี้:

```go
package main

import (
    "cmp"
    "fmt"
    "slices"
)

func main() {
    scores := []int{30, 10, 20}
    slices.Sort(scores)

    fmt.Println(scores)
    fmt.Println(slices.Contains(scores, 20))
    fmt.Println(cmp.Compare(10, 20))
}
```

ผลลัพธ์คือ:

```text
[10 20 30]
true
-1
```

`[]int` ในตัวอย่างนี้ทำให้ `slices.Sort` และ `slices.Contains` infer type ให้เอง ถ้าเราต้องการเปรียบเทียบ struct ที่ไม่ได้มีลำดับตามธรรมชาติ ก็ใช้ `slices.SortFunc` แล้วส่ง comparator ของเราเข้าไปแทน

ก่อนเขียน `Equal`, `Insert`, `Delete`, `Clone` หรือ helper สำหรับ map เอง ลองค้นใน package `slices` และ `maps` ก่อน อนาคตของ standard library จะเพิ่ม generic helper มากขึ้นเรื่อย ๆ

> โค้ดที่ดีไม่ใช่โค้ดที่เขียน generic เองเยอะที่สุด แต่คือโค้ดที่เลือก abstraction พอดีกับปัญหา

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดเฉลยก่อน:

1. สร้าง constraint ชื่อ `Number` ที่รองรับ `int`, `int64`, `float32` และ `float64` รวมถึง user-defined type ที่มี underlying type เหล่านี้ แล้วเขียน `Double[T Number](value T) T` ให้คืนค่าที่เพิ่มเป็นสองเท่า ทดลองกับ `int` และ `float64`
2. สร้าง constraint ชื่อ `Printable` ที่ต้องมี underlying type เป็น `int` หรือ `float64` และมี method `String() string` จากนั้นเขียน `PrintValue[T Printable](value T)` ให้พิมพ์ค่าผ่าน `fmt.Println` ทดลองสร้างทั้ง `Score int` และ `Ratio float64` ที่ satisfy constraint
3. สร้าง generic singly linked list ชื่อ `List[T comparable]` โดยแต่ละ node เก็บ `value T` และ pointer ไป node ถัดไป ให้ implement `Add(value T)` สำหรับเพิ่มท้าย list, `Insert(value T, index int) error` โดย index ที่ใช้ได้อยู่ในช่วง `0` ถึง `len(list)` ให้คืน `nil` เมื่อสำเร็จและคืน error เมื่อ index ติดลบหรือเกินช่วง และ `Index(value T) int` ที่คืน index แรกหรือ `-1` เมื่อไม่พบ
4. นำ `Tree[T]` จาก Step 8 ไปใช้กับ `Person` โดยเรียงตาม `Age` ก่อน แล้วใช้ `Name` เป็น tie-breaker เมื่ออายุเท่ากัน ทดสอบ `Contains` ทั้งคนที่มีอยู่และคนที่ไม่มี โดยผลลัพธ์ต้อง deterministic

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ใช้ `any` เป็น container ทั้งหมด** — ใส่ค่าคนละ type ได้ง่ายและต้องพึ่ง type assertion ตอน runtime ใช้ generic type เมื่อ container ควรเก็บ type เดียวกัน
- **ใช้ `any` แล้วคาดว่าจะใช้ operator ได้** — `any` ไม่รับประกันว่า `T` เทียบหรือบวกได้ เลือก `comparable`, method constraint หรือ type terms ให้ตรงกับ operation
- **ลืมใส่ `[T]` ที่ receiver** — method ของ `Stack[T]` ต้องเขียน receiver เป็น `Stack[T]` เพื่อให้ compiler รู้จัก type parameter
- **return `nil` จาก function ที่คืน `T`** — `T` อาจเป็น value type ที่ไม่มี `nil` ใช้ `var zero T` แล้วคืนคู่กับ `bool` หรือ `error`
- **ลืม `~` ใน type term** — `int` match เฉพาะ `int` ตรง ๆ ถ้าต้องการรองรับ `type MyInt int` ให้ใช้ `~int`
- **เอา type-term interface ไปใช้เป็นตัวแปรหรือ field** — interface ที่มี `|` เป็น constraint เท่านั้น ไม่ใช่ interface type สำหรับเก็บค่า
- **คาดว่า type inference จะดูจาก return value ได้** — ถ้า type parameter ปรากฏเฉพาะใน return ต้องระบุ type argument เอง เช่น `Zero[int]()`
- **ใส่ constant ที่ใหญ่เกินบาง type รับไม่ได้** — generic body ต้อง valid กับทุก type ใน constraint เลือกค่าให้ represent ได้ทุกตัว หรือทำ constraint ให้แคบลง
- **คิดว่า `comparable` ป้องกัน panic ได้ทุกกรณี** — interface ที่ผ่าน constraint อาจห่อ slice, map หรือ func อยู่ข้างในและ panic ตอน `==`
- **สร้าง generic เองทั้งที่ standard library มีแล้ว** — ตรวจ `slices`, `maps` และ `cmp` ก่อนเขียน helper ซ้ำ
- **เปลี่ยน interface เป็น generic เพราะหวัง performance** — generic function ไม่ได้เร็วกว่าเสมอ benchmark กับ workload จริงก่อน refactor
- **คาดหวัง operator overloading หรือ generic method แบบภาษาอื่น** — Go ไม่รองรับ ให้ส่ง comparator/function เป็น dependency หรือใช้ generic function แยก

---

## สรุป

1. Generics คือการประกาศ type parameter เพื่อเขียน type หรือ function ที่ทำงานกับหลาย concrete type โดยยังให้ compiler ตรวจความถูกต้อง
2. เขียน generic type ด้วยรูปแบบ `Stack[T any]` และ instantiate ด้วย `Stack[int]` หรือ `Stack[string]`
3. `any` ใช้เมื่อ code แค่เก็บและคืนค่า ส่วน `comparable` ใช้เมื่อจำเป็นต้องใช้ `==` หรือ `!=`
4. Interface ที่มี method ใช้เป็น type constraint ได้ ทำให้ generic code เรียก behavior ที่ต้องการได้โดยไม่ผูกกับ implementation
5. Type terms ที่คั่นด้วย `|` ใช้จำกัดชุด type และบอก compiler ว่า operator ใดใช้ได้กับ type parameter
6. ใส่ `~` หน้า term เพื่อรองรับ user-defined type ที่มี underlying type ตรงกับ term นั้น
7. Generic function มัก infer type argument จาก argument ได้ แต่ infer type ที่ปรากฏเฉพาะใน return ไม่ได้
8. Constant ใน generic body ต้อง represent ได้กับทุก type ที่ constraint อนุญาต
9. Generic data structure สามารถรับ comparator หรือ function เป็น dependency เพื่อใช้กับข้อมูลที่เรียงต่างกติกากันได้
10. `comparable` ยังต้องระวัง interface ที่ห่อ non-comparable type เพราะอาจ compile ผ่านแต่ panic ตอน runtime
11. Generics เน้น reuse และ type safety ไม่ได้ทำให้เร็วกว่า interface เสมอ และไม่จำเป็นต้อง refactor โค้ดเก่าทั้งหมด
12. ก่อนเขียน generic helper เอง ให้ดู `slices`, `maps` และ `cmp` ใน standard library ก่อน

Generics ไม่ได้ทำให้ Go กลายเป็นภาษาเวทมนตร์ มันแค่เพิ่มช่องว่างให้เรา reuse logic ได้โดยไม่ต้องทิ้งความเข้มงวดเรื่อง type ของ Go ไป

เลือก constraint ให้พอดี เขียน code ให้ compiler ช่วยตรวจ แล้วค่อยวัด performance จากงานจริง แค่นี้ก็ใช้ generics ได้แบบไม่หลงทางแล้ว

> *ตอนถัดไปเราจะคุยเรื่อง errors — วิธีส่งต่อ, ห่อ, ตรวจ และออกแบบ error ให้คนใช้ function เข้าใจว่าเกิดอะไรขึ้น*

---

## Glossary

- **Generics / type parameters** — ความสามารถในการเขียน type หรือ function ที่รับ type เป็น parameter แล้วค่อยระบุ concrete type ตอนใช้งาน
- **Type parameter** — ชื่อตัวแทนของ type เช่น `T` ใน `Stack[T any]`
- **Type argument** — concrete type ที่นำมาแทน type parameter เช่น `int` ใน `Stack[int]`
- **Type constraint** — เงื่อนไขที่บอกว่า type parameter ใช้กับ type ใดได้บ้าง เช่น `any`, `comparable` หรือ interface ของเรา
- **Type inference** — การที่ compiler เดา type argument จาก argument ที่ส่งเข้า generic function
- **Type term** — รายการ type ใน constraint ที่คั่นด้วย `|` เช่น `int | float64`
- **Underlying type** — type พื้นฐานที่อยู่เบื้องหลัง user-defined type เช่น `int` ใน `type MyInt int`
- **`~`** — เครื่องหมายที่ทำให้ type term รองรับทุก type ที่มี underlying type ตรงกัน
- **`comparable`** — built-in constraint สำหรับ type ที่ใช้ `==` และ `!=` ได้ โดยยังต้องระวังกรณี interface ซ่อน non-comparable value
- **Instantiation** — การนำ concrete type มาเติมให้ generic type หรือ function เช่น `Stack[int]`
- **Zero value** — ค่าเริ่มต้นของ type เมื่อประกาศโดยไม่กำหนดค่า เช่น `0`, `""`, `false` หรือ struct ที่ field เป็น zero value
- **Generic function** — function ที่มี type parameter เช่น `Filter[T any]` และใช้ algorithm เดิมกับหลาย type ได้

---

## Related

- [ตอนที่ 7: Types, Methods, and Interfaces](/go/07-types-methods-and-interfaces/) — type constraint คือ interface รูปแบบหนึ่ง และ method set จากบทนี้ต่อยอดมาใช้กับ generic constraint
- [ตอนที่ 6: Pointers](/go/06-pointers/) — zero value, `nil`, slice และ map ที่ใช้เป็นพื้นฐานใน generic container
- [ตอนที่ 5: Functions](/go/05-functions/) — function value และการส่ง function เป็น parameter ที่นำมาใช้เป็น comparator, `Map`, `Filter` และ `Reduce`
- [ตอนที่ 3: Composite Types](/go/03-composite-types/) — slice, map และ struct ที่เป็นข้อมูลหลักของตัวอย่าง generic type ในบทนี้
- [ตอนที่ 9: Errors](/go/09-errors/) — บทถัดไป วิธีออกแบบและจัดการ error ใน Go
