+++
title = 'ตอนที่ 16: Here Be Dragons — Reflect, Unsafe, and Cgo'
date = '2026-08-20T00:00:00+07:00'
draft = false
description = 'รู้จักประตูแหกกฎสามบานของ Go — reflect สำหรับ type ตอน runtime, unsafe สำหรับจัดการ memory โดยตรง และ cgo สำหรับคุยกับ C พร้อมรู้ว่าเมื่อไหร่ควรใช้และเมื่อไหร่ควรเลี่ยง'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราให้ `go test` ช่วยจับบั๊กและวัด performance จนมั่นใจว่าโค้ดในกำแพงปลอดภัยทำงานถูกแล้ว แต่ถ้าวันหนึ่งข้อมูลที่ไหลเข้ามาไม่มี type ให้ compiler เช็ก หรือต้องอ่าน byte ดิบจาก network หรือต้องเรียก library ที่มีแต่ใน C จะทำอย่างไร?

Go มีกำแพงความปลอดภัยที่คอยปกป้องเราตลอด — static typing บอกชัดว่าข้อมูลเป็นอะไร, garbage collection จัดการ memory ให้, และ pointer ก็เชื่องกว่าใน C/C++ มาก แต่กำแพงนี้มีประตูสามบานที่เปิดออกสู่ดินแดนที่แผนที่โบราณเขียนว่า *Here Be Dragons*

1. `reflect` — ตรวจและสร้าง type/value ตอน runtime
2. `unsafe` — จัดการ layout ของ memory ตรง ๆ
3. `cgo` — เรียกโค้ด C จาก Go (และเรียก Go จาก C)

ทั้งสามบานมีป้ายเตือนเหมือนกันว่า *ช้ากว่า เปราะกว่า และ compiler ช่วยคุณได้น้อยลง* กฎเหล็กคือใช้ที่ **ขอบของโปรแกรม** (boundary) เท่านั้น — ตรงที่ข้อมูลเข้า/ออกจากระบบ ไม่ใช่กลาง business logic

สิ่งที่จะได้ตอนจบบทนี้:

- อธิบายได้ว่าเมื่อไหร่ควร (และไม่ควร) ใช้ `reflect` / `unsafe` / `cgo`
- ใช้ `reflect.TypeOf` / `reflect.ValueOf` แยก `Type` vs `Kind` และอ่าน struct tag
- อ่าน เขียน และสร้าง value ด้วย reflection (`Interface`, `SetInt`, `CanSet`, `reflect.New`/`MakeSlice`)
- เขียน helper ตรวจ `nil` ใน interface และทำ CSV marshaler ด้วย reflection
- สร้าง function แบบอัตโนมัติด้วย `reflect.MakeFunc` และรู้ข้อจำกัดของมัน
- ใช้ `unsafe.Sizeof` / `Offsetof` ดูขนาดและตำแหน่ง field เพื่อจัดเรียง struct ให้ประหยัด memory
- แปลงข้อมูล binary แบบ safe (`encoding/binary`) เทียบกับแบบ `unsafe.Pointer`
- เข้าใจ endianness และท่า `unsafe.Slice` / `unsafe.SliceData`
- เปิดประตูแอบดู unexported field ด้วย `reflect` + `unsafe` (และรู้ว่าทำไมไม่ควรทำพร่ำเพรื่อ)
- เรียก C จาก Go ด้วย `cgo` ใช้ `cgo.Handle` ส่งค่าที่บรรจุ pointer และรู้ว่า `cgo` ไม่ใช่เครื่องมือเร่งความเร็ว

{{< mermaid >}}
flowchart TD
  Core["Go ปลอดภัย<br/>static types + GC + tame pointers"] --> R["reflect<br/>ข้อมูล text/dynamic ไม่รู้ type ตอน compile"]
  Core --> U["unsafe<br/>ข้อมูล binary จาก OS/network"]
  Core --> C["cgo<br/>ต้องใช้ C library"]
  R --> Edge["ขอบโปรแกรม<br/>boundary กับโลกภายนอก"]
  U --> Edge
  C --> Edge
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-dragons` เพื่อทดลองประตูทั้งสามบาน เปิด terminal แล้วรัน:

~~~sh
mkdir go-dragons
cd go-dragons
go mod init go-dragons
touch main.go
~~~

ชื่อ `go-dragons` ในบทนี้เป็นชื่อสำหรับทดลองบนเครื่องตัวเอง จึงต้องใช้ให้ตรงกันทั้ง `mkdir`, `cd` และ `go mod init`

ในแต่ละ Step ให้แทนที่ `main.go` ด้วยโค้ดของ Step นั้นแล้วรัน `go run .` ถ้า Step ไหนต้องใช้ C compiler (Step 8–9) ต้องติดตั้ง `gcc`/`clang` ก่อน — บน macOS มีมากับ Xcode Command Line Tools, บน Linux ใช้ `build-essential`, บน Windows ใช้ `mingw` หรือ `WSL` ถ้ายังไม่มีให้ข้าม Step นั้นไปอ่านก่อนได้

เอาล่ะ เปิดประตูบานแรกกัน

---

## Step 1: ทำไมต้องมีประตูแหกกฎ — และทำไมต้องใช้ที่ขอบเท่านั้น

### กำแพงที่ปกป้องเรา (Why)

โค้ด Go ส่วนใหญ่ที่คุณเขียนอยู่ในกำแพงที่ runtime คอยปกป้อง แต่มีงานบางประเภทที่โค้ดปกติแก้ไม่ได้:

- ไม่รู้ type ตอน compile — เช่น map ข้อมูล JSON/CSV ที่ column เพิ่งรู้ตอนรัน
- ต้องยุ่งกับ layout ของ memory — เช่นอ่าน packet 16 byte จาก network ให้เป็น struct
- ต้องใช้ library ที่มีแต่ใน C — เช่น SQLite, ImageMagick, หรือ OS API

ผู้เขียน *Learning Go* ใส่บทนี้ไว้สำหรับมือใหม่ด้วยเหตุผลสองข้อ คือ หนึ่ง นักพัฒนามัก copy เทคนิคเหล่านี้มาโดยไม่เข้าใจข้อควรระวัง สอง มันสนุก — เพราะทำสิ่งที่ปกติทำไม่ได้

### กฎเหล็กของบทนี้ (How)

> ใช้เครื่องมือทั้งสามที่ **boundary** เท่านั้น

| ประตู | เหมาะกับขอบแบบไหน | ตัวอย่างใน stdlib |
|---|---|---|
| `reflect` | ข้อมูล text/dynamic ที่ไม่รู้ type ตอน compile | `encoding/json`, `database/sql`, `text/template`, `fmt` |
| `unsafe` | ข้อมูล binary จาก OS/network | แปลง `[]byte` ↔ struct แบบเร็ว |
| `cgo` | ต้องใช้ C library | เรียก `libsqlite3`, `libmagic` |

ถ้าแก้ปัญหาด้วย generics, interface, หรือ `encoding/binary` ได้ ให้เลือกทางนั้นก่อน — ช้ากว่า 50–75 เท่าและเปราะกว่ามาก (ดู Step 5) คือราคาที่ต้องจ่ายเมื่อเปิดประตู

---

## Step 2: Reflection — แยก `Type` กับ `Kind` ให้ออก

### คนละอย่างกันนะ (Why)

ใน reflection มีสามคำที่ต้องแยกให้ชัด:

- **Type** — ชื่อเฉพาะ เช่น `Foo`, `int`, `MyData`
- **Kind** — โครงสร้างพื้นฐาน เช่น `Struct`, `Slice`, `Pointer`, `Int`
- **Value** — ค่าจริงที่ถืออยู่

ถ้า define `type Foo struct { ... }` แล้ว `Kind` คือ `reflect.Struct` ส่วน `Type` คือ `"Foo"` จำแบบนี้: kind คือพิมพ์เขียวแบบบ้าน ส่วน type คือชื่อบ้านหลังนั้น

### ลอง `TypeOf` และ `Kind` (How)

แทนที่ `main.go` แล้วรัน `go run .`:

~~~go
package main

import (
	"fmt"
	"reflect"
)

type Foo struct {
	A int    `myTag:"value"`
	B string `myTag:"value2"`
}

func main() {
	var x int
	xt := reflect.TypeOf(x)
	fmt.Println("int:", xt.Name(), xt.Kind()) // int int

	f := Foo{}
	ft := reflect.TypeOf(f)
	fmt.Println("Foo:", ft.Name(), ft.Kind()) // Foo struct

	xpt := reflect.TypeOf(&x)
	fmt.Println("pointer name:", xpt.Name())       // "" (pointer ไม่มีชื่อ)
	fmt.Println("pointer kind:", xpt.Kind())       // ptr
	fmt.Println("elem:", xpt.Elem().Name(), xpt.Elem().Kind()) // int int
}
~~~

~~~text
int: int int
Foo: Foo struct
pointer name:
pointer kind: ptr
elem: int int
~~~

- `Name()` ว่างสำหรับ pointer/slice/map/channel — เพราะมันไม่มีชื่อตั้งเอง
- `Elem()` ใช้หา type ที่ถูกชี้/บรรจุ สำหรับ pointer/slice/map/channel/array

### อ่าน struct field และ tag

~~~go
package main

import (
	"fmt"
	"reflect"
)

type Foo struct {
	A int    `myTag:"value"`
	B string `myTag:"value2"`
}

func main() {
	var f Foo
	ft := reflect.TypeOf(f)
	fmt.Println("fields:", ft.NumField())
	for i := 0; i < ft.NumField(); i++ {
		field := ft.Field(i)
		fmt.Println(field.Name, field.Type.Name(), field.Tag.Get("myTag"))
	}
}
~~~

~~~text
fields: 2
A int value
B string value2
~~~

`NumField` / `Field(i)` ใช้ได้เฉพาะ `Kind() == reflect.Struct` ถ้าเรียกกับ kind อื่นจะ **panic** — ต้องเช็ก kind ก่อนเสมอ นี่คือความเปราะของ reflection ที่ต้องระวัง

> ตั้งแต Go 1.21 ถ้าแค่อยากเช็ก `slice`/`map` เท่ากัน ให้ใช้ `slices.Equal` / `maps.Equal` จะเร็วกว่า `reflect.DeepEqual` มาก

**Why:** เข้าใจ Type/Kind ก่อนแล้วค่อยอ่าน Value จะไม่หลง
**How:** `reflect.TypeOf(v)` → เช็ก `Kind()` → ใช้ `Name()`/`Elem()`/`NumField()` ตาม kind

---

## Step 3: Reflection — อ่าน เขียน และสร้างค่า

### อ่านค่ากลับด้วย `ValueOf` + `Interface()` (How)

~~~go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	s := []string{"a", "b", "c"}
	sv := reflect.ValueOf(s)
	fmt.Println("kind:", sv.Kind()) // slice
	fmt.Println("len:", sv.Len())

	// ดึงค่ากลับเป็น Go ปกติ
	s2 := sv.Interface().([]string)
	fmt.Println(s2)

	// มี helper สำหรับ primitive — ถ้าใช้ผิด type จะ panic
	// เช็กก่อนด้วย CanInt/CanFloat/CanConvert ได้
	fmt.Println("CanInt:", sv.CanInt()) // false เพราะเป็น slice
}
~~~

`Interface()` คืน `any` ต้อง type assert กลับเอง ส่วน `Int()`/`String()`/`Bool()` มีเฉพาะ kind ที่ตรงกัน

### เขียนค่า — ทำไมต้องส่ง pointer (Why + How)

Reflection ก็เหมือน function ทั่วไป — ถ้าจะแก้ค่าต้องส่ง pointer บอกว่าให้แก้ของต้นทาง (ดูบท Pointers)

มี 3 ขั้นเสมอ:

1. ส่ง pointer เข้า `ValueOf`
2. ใช้ `Elem()` ไปที่ค่าที่ถูกชี้
3. เรียก `Set*`

~~~go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	i := 10
	iv := reflect.ValueOf(&i) // 1) ส่ง pointer
	fmt.Println("CanSet before Elem:", iv.CanSet()) // false

	ivv := iv.Elem()                               // 2) ไปที่ค่าจริง
	fmt.Println("CanSet after Elem:", ivv.CanSet()) // true
	ivv.SetInt(20)                                  // 3) set
	fmt.Println(i) // 20
}

// เทียบกับ function ธรรมดา — สองอันนี้ทำงานเหมือนกัน
func changeInt(i *int) { *i = 20 }
func changeIntReflect(i *int) {
	iv := reflect.ValueOf(i)
	iv.Elem().SetInt(20)
}
~~~

ถ้าไม่ส่ง pointer ยังอ่านได้ แต่ `Set*` จะ panic — เช็ก `CanSet()` ก่อนเสมอ

### สร้างค่าใหม่โดยไม่มี value ตั้งต้น

`reflect.New` คือ `new` แบบ reflection, `MakeSlice`/`MakeMap`/`MakeChan` คือ `make` แบบ reflection

~~~go
package main

import (
	"fmt"
	"reflect"
)

func main() {
	// trick: สร้าง reflect.Type โดยไม่มี value
	var stringType = reflect.TypeOf((*string)(nil)).Elem()
	var stringSliceType = reflect.TypeOf([]string(nil))

	// สร้าง slice ว่าง capacity 10
	ssv := reflect.MakeSlice(stringSliceType, 0, 10)

	// สร้าง string "hello" แล้ว append
	sv := reflect.New(stringType).Elem()
	sv.SetString("hello")
	ssv = reflect.Append(ssv, sv)

	ss := ssv.Interface().([]string)
	fmt.Println(ss) // [hello]
}
~~~

บรรทัด `reflect.TypeOf((*string)(nil)).Elem()` อ่านว่า แปลง `nil` เป็น `*string` → หา Type ของ pointer → `Elem()` เพื่อได้ type ที่ถูกชี้ ต้องวงเล็บ `(*string)` เพราะลำดับการทำงานของ compiler

**Why:** เข้าใจ 3 ขั้นของการ set จะไม่ panic กลางอากาศ
**How:** `ValueOf(&v).Elem().SetXxx()` และ `reflect.New`/`MakeSlice` เมื่อต้องสร้างของใหม่

---

## Step 4: ใช้ Reflection ตรวจ `nil` และทำ CSV Marshaler

### กับดัก `nil` ใน interface (Why)

จากบท Types/Methods/Interfaces — ถ้า assign `nil` ของ concrete type ลง `any` ตัว interface จะ **ไม่**เป็น `nil` เพราะยังผูก type ไว้

~~~go
var p *int = nil
var i any = p
fmt.Println(i == nil) // false! ทั้งที่ p เป็น nil
~~~

ถ้าต้องเช็กว่า value ข้างในเป็น `nil` จริงไหม ให้ใช้ reflection:

~~~go
package main

import (
	"fmt"
	"reflect"
)

func hasNoValue(i any) bool {
	iv := reflect.ValueOf(i)
	if !iv.IsValid() {
		return true // เป็น nil interface จริง ๆ
	}
	switch iv.Kind() {
	case reflect.Pointer, reflect.Slice, reflect.Map, reflect.Func, reflect.Interface:
		return iv.IsNil()
	default:
		return false
	}
}

func main() {
	var p *int = nil
	var s []string = nil
	fmt.Println(hasNoValue(p))       // true
	fmt.Println(hasNoValue(s))       // true
	fmt.Println(hasNoValue(42))      // false
	fmt.Println(hasNoValue(nil))     // true
	fmt.Println(hasNoValue("hello")) // false
}
~~~

ต้องเช็ก `IsValid()` ก่อนเสมอ เพราะ method อื่นจะ panic ถ้า Value เป็น invalid ส่วน `IsNil()` เรียกได้เฉพาะ kind ที่เป็น nil ได้เท่านั้น

> ทริกจากหนังสือ: แม้ตรวจได้ แต่ให้เขียนโค้ดที่ทำงานถูกแม้ value ใน interface เป็น `nil` ตั้งแต่แรกดีกว่า เก็บท่านี้ไว้เมื่อไม่มีทางเลือก

### ตัวอย่างจริง: CSV marshaler ที่ map struct ↔ CSV (How)

stdlib มี `encoding/csv` แต่อ่าน/เขียน `[][]string` ไม่ได้ map ลง struct อัตโนมัติ เราจะใช้ reflection เติมส่วนนี้ ตั้ง tag `csv:"name"` บน field:

~~~go
type MyData struct {
	Name   string `csv:"name"`
	Age    int    `csv:"age"`
	HasPet bool   `csv:"has_pet"`
}
~~~

API ที่อยากได้:

~~~go
func Marshal(v any) ([][]string, error)
func Unmarshal(data [][]string, v any) error
~~~

**Marshal — รับ `any` เพราะ struct เป็น type อะไรก็ได้**

~~~go
func Marshal(v any) ([][]string, error) {
	sliceVal := reflect.ValueOf(v)
	if sliceVal.Kind() != reflect.Slice {
		return nil, errors.New("must be a slice of structs")
	}
	structType := sliceVal.Type().Elem()
	if structType.Kind() != reflect.Struct {
		return nil, errors.New("must be a slice of structs")
	}
	var out [][]string
	header := marshalHeader(structType)
	out = append(out, header)
	for i := 0; i < sliceVal.Len(); i++ {
		row, err := marshalOne(sliceVal.Index(i))
		if err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, nil
}
~~~

helper สองตัว:

~~~go
func marshalHeader(st reflect.Type) []string {
	var header []string
	for i := 0; i < st.NumField(); i++ {
		if tag, ok := st.Field(i).Tag.Lookup("csv"); ok {
			header = append(header, tag)
		}
	}
	return header
}

func marshalOne(vv reflect.Value) ([]string, error) {
	var row []string
	vt := vv.Type()
	for i := 0; i < vv.NumField(); i++ {
		if _, ok := vt.Field(i).Tag.Lookup("csv"); !ok {
			continue
		}
		fieldVal := vv.Field(i)
		switch fieldVal.Kind() {
		case reflect.Int:
			row = append(row, strconv.FormatInt(fieldVal.Int(), 10))
		case reflect.String:
			row = append(row, fieldVal.String())
		case reflect.Bool:
			row = append(row, strconv.FormatBool(fieldVal.Bool()))
		default:
			return nil, fmt.Errorf("cannot handle field of kind %v", fieldVal.Kind())
		}
	}
	return row, nil
}
~~~

**Unmarshal — ต้องรับ pointer เพราะต้องแก้ค่า**

~~~go
func Unmarshal(data [][]string, v any) error {
	sliceValPointer := reflect.ValueOf(v)
	if sliceValPointer.Kind() != reflect.Pointer {
		return errors.New("must be a pointer to a slice of structs")
	}
	sliceVal := sliceValPointer.Elem()
	if sliceVal.Kind() != reflect.Slice {
		return errors.New("must be a pointer to a slice of structs")
	}
	structType := sliceVal.Type().Elem()
	if structType.Kind() != reflect.Struct {
		return errors.New("must be a pointer to a slice of structs")
	}

	header := data[0]
	namePos := make(map[string]int, len(header))
	for i, name := range header {
		namePos[name] = i
	}
	for _, row := range data[1:] {
		newVal := reflect.New(structType).Elem()
		if err := unmarshalOne(row, namePos, newVal); err != nil {
			return err
		}
		sliceVal.Set(reflect.Append(sliceVal, newVal))
	}
	return nil
}
~~~

`unmarshalOne` วน field หา column จาก `namePos` แล้ว `ParseInt`/`ParseBool`/`SetString` ตาม `Kind()` จากนั้นเอา `[][]string` ที่ได้ไปต่อกับ `csv.NewReader`/`csv.NewWriter` ของ stdlib ได้เลย

ลองรันแบบเต็มใน `go-dragons` จะเห็นว่า `Marshal` แปลง `[]MyData` เป็น `[][]string` ที่มี header `name,age,has_pet` และ `Unmarshal` แปลงกลับได้ — นี่คือ pattern เดียวกับที่ `encoding/json` ใช้อยู่ข้างใน

---

## Step 5: สร้าง Function ด้วย Reflection และราคาที่ต้องจ่าย

### `MakeFunc` ทำอะไรได้ (How)

`reflect.MakeFunc` สร้าง function ได้ ใช้ wrap function เดิมด้วยงานซ้ำ ๆ เช่นจับเวลา โดยไม่เขียนซ้ำ:

~~~go
package main

import (
	"fmt"
	"reflect"
	"time"
)

func MakeTimedFunction(f any) any {
	ft := reflect.TypeOf(f)
	fv := reflect.ValueOf(f)
	wrapperF := reflect.MakeFunc(ft, func(in []reflect.Value) []reflect.Value {
		start := time.Now()
		out := fv.Call(in)
		fmt.Println("took:", time.Since(start))
		return out
	})
	return wrapperF.Interface()
}

func timeMe(a int) int {
	time.Sleep(10 * time.Millisecond)
	return a * 2
}

func main() {
	timed := MakeTimedFunction(timeMe).(func(int) int)
	fmt.Println(timed(2)) // พิมพ์เวลาก่อน แล้วพิมพ์ 4
}
~~~

ต้อง assert กลับเป็น `func(int) int` เอง — compiler ไม่ช่วยเช็กให้

### ทำ struct ได้ แต่ไม่ควร + สร้าง method ไม่ได้ (Why)

- `reflect.StructOf` รับ `[]reflect.StructField` คืน `reflect.Type` ของ struct ใหม่ แต่ struct นี้ assign ได้แค่กับ `any` และอ่าน/เขียนผ่าน reflection เท่านั้น — มีประโยชน์เชิงวิชาการ (เช่น memoizer ที่ใช้ dynamic struct เป็น map key) ไม่ใช่ของที่ใช้ทุกวัน
- **สร้าง method ไม่ได้** — reflection สร้าง function และ struct type ใหม่ได้ แต่เพิ่ม method ให้ type ไม่ได้ จึงสร้าง type ที่ implement interface ไม่ได้

### ทำไมต้องคิดหนักก่อนใช้ — ช้ากว่า 50 เท่า (Why)

ลอง `Filter` แบบ reflection เทียบกับ generic (`08_generics`):

~~~go
func Filter(slice any, filter any) any {
	sv := reflect.ValueOf(slice)
	fv := reflect.ValueOf(filter)
	sliceLen := sv.Len()
	out := reflect.MakeSlice(sv.Type(), 0, sliceLen)
	for i := 0; i < sliceLen; i++ {
		curVal := sv.Index(i)
		values := fv.Call([]reflect.Value{curVal})
		if values[0].Bool() {
			out = reflect.Append(out, curVal)
		}
	}
	return out.Interface()
}
~~~

Benchmark บน Apple Silicon M1 / Go 1.20, slice 1,000 element:

| Benchmark | ns/op | B/op | allocs/op |
|---|---|---|---|
| `FilterReflectString` | 203,962 | 46,616 | 2,219 |
| `FilterGenericString` | 3,920 | 16,384 | 1 |
| `FilterString` (custom) | 3,885 | 16,384 | 1 |
| `FilterReflectInt` | 204,530 | 45,240 | 2,503 |
| `FilterGenericInt` | 2,698 | 8,192 | 1 |

Reflection ช้ากว่า **~50 เท่า** สำหรับ string และ **~75 เท่า** สำหรับ int แถม allocate เป็นพันครั้ง (สร้างงานให้ GC) ที่ร้ายกว่าคือส่ง type ผิด compiler ไม่เตือน — crash ตอน production

> ถ้าแก้ด้วย generics ได้ ให้ใช้ generics — ได้ performance เท่า custom code และ type-safe

---

## Step 6: `unsafe` — ดูขนาดและตำแหน่งเพื่อจัด struct ให้ประหยัด memory

### `unsafe` เล็กแต่แรง (Why)

`unsafe` ดูแลเรื่อง **memory** ต่างจาก `reflect` ที่ดูแล type/value package เล็กมาก มี type เดียวที่พิเศษคือ `unsafe.Pointer` — pointer สากลที่แปลงไปกลับกับ pointer ชนิดใดก็ได้และกับ `uintptr` (integer ที่ทำคณิตศาสตร์กับ pointer ได้) ทำให้เดินเข้าไปแกะ byte หรือทำ pointer arithmetic แบบ C ได้

งานวิจัยปี 2020 สำรวจ 2,438 Go project ยอดนิยมพบว่า 24% ใช้ `unsafe` อย่างน้อยหนึ่งครั้ง ส่วนใหญ่เพื่อคุยกับ OS และ C code หรือเพื่อความเร็ว

มี 2 pattern หลัก: (1) แปลงระหว่าง type ที่ปกติแปลงกันไม่ได้ผ่าน `unsafe.Pointer` ตรงกลาง (2) อ่าน/แก้ byte ใน variable โดยรู้ size/offset ก่อน

### `Sizeof` กับ `Offsetof` บอกอะไร (How)

`unsafe.Sizeof` คืนขนาดเป็น byte ของ value ที่ส่งเข้าไป ใช้ใน `const` ได้เพราะรู้ตอน compile time

แทนที่ `main.go` แล้วรัน `go run .`:

~~~go
package main

import (
	"fmt"
	"unsafe"
)

func main() {
	var x int64
	var p *int
	var s string
	var sl []int
	var m map[string]int
	fmt.Println("int64:", unsafe.Sizeof(x))   // 8
	fmt.Println("pointer:", unsafe.Sizeof(p)) // 8 (ขนาด pointer เอง ไม่ใช่ data)
	fmt.Println("string:", unsafe.Sizeof(s))  // 16 (int len + pointer)
	fmt.Println("slice:", unsafe.Sizeof(sl))  // 24 (len + cap + pointer)
	fmt.Println("map:", unsafe.Sizeof(m))     // 8 (pointer ไป runtime struct)
}
~~~

บน 64-bit จะได้ประมาณนี้ ตารางสรุป:

| Type | ขนาด | เหตุผล |
|---|---|---|
| `int64` / pointer | 8 | ตรงตัว |
| `string` | 16 | len + pointer |
| `slice` | 24 | len + cap + pointer |
| `map` | 8 | pointer ไปโครงสร้างภายใน |
| `array` | len × ขนาด element | เป็น value type |
| `struct` | ผลรวม field + padding | ดูด้านล่าง |

### Padding และลำดับ field

Compiler เติม **padding** ระหว่าง field ให้ align และ pad ท้าย struct ให้ขนาดเป็นพหุคูณของ 8 (บน 64-bit) ลองดู:

~~~go
package main

import (
	"fmt"
	"unsafe"
)

type BoolInt struct{ b bool; i int64 }
type IntBool struct{ i int64; b bool }
type BoolIntBool struct{ b bool; i int64; b2 bool }
type BoolBoolInt struct{ b bool; b2 bool; i int64 }

func main() {
	fmt.Println("BoolInt:", unsafe.Sizeof(BoolInt{}))           // 16
	fmt.Println("BoolInt bool offset:", unsafe.Offsetof(BoolInt{}.b))
	fmt.Println("BoolInt int offset:", unsafe.Offsetof(BoolInt{}.i))
	fmt.Println("BoolIntBool:", unsafe.Sizeof(BoolIntBool{}))   // 24
	fmt.Println("BoolBoolInt:", unsafe.Sizeof(BoolBoolInt{}))   // 16
	fmt.Println("IntBoolBool:", unsafe.Sizeof(IntBoolBool{}))   // 16
}
~~~

~~~text
BoolInt: 16
BoolInt bool offset: 0
BoolInt int offset: 8
BoolIntBool: 24
BoolBoolInt: 16
IntBoolBool: 16
~~~

`BoolIntBool` กิน 24 byte แต่จัดใหม่เป็น `BoolBoolInt` เหลือ 16 byte เพราะ `bool` สองตัวไปอยู่ติดกันแล้วแชร์ padding เดียวกัน

> ทริก: จัด field เล็ก ๆ ให้อยู่ติดกันก่อน field ใหญ่ ในโปรแกรมที่ถือข้อมูลปริมาณมาก การ reorder struct ที่ใช้บ่อยช่วยประหยัด memory ได้มากโดยไม่ต้องแก้ logic

**Why:** เข้าใจขนาดและตำแหน่งก่อนแล้วค่อยคิดเรื่อง binary
**How:** ใช้ `unsafe.Sizeof` / `unsafe.Offsetof` ตรวจ แล้วจัดลำดับ field ใหม่

---

## Step 7: ใช้ `unsafe` แปลงข้อมูล binary — เร็วขึ้น แต่ต้องระวัง endian

### โจทย์: อ่าน packet 16 byte เป็น struct (Why)

สมมติ wire protocol กำหนด: Value 4 byte (uint32 big-endian), Label 10 byte ASCII, Active 1 byte bool, Padding 1 byte → รวม 16 byte

~~~go
type Data struct {
	Value  uint32   // 4
	Label  [10]byte // 10
	Active bool     // 1 (+1 padding)
}

const dataSize = unsafe.Sizeof(Data{}) // 16 — ใช้ใน const ได้!
~~~

`Sizeof` ใช้ใน `const` ได้เพราะ layout รู้ตอน compile time

### แบบ safe ด้วย `encoding/binary` (How)

~~~go
import "encoding/binary"

func DataFromBytes(b [dataSize]byte) Data {
	d := Data{}
	d.Value = binary.BigEndian.Uint32(b[:4])
	copy(d.Label[:], b[4:14])
	d.Active = b[14] != 0
	return d
}

func BytesFromData(d Data) [dataSize]byte {
	var b [dataSize]byte
	binary.BigEndian.PutUint32(b[:4], d.Value)
	copy(b[4:14], d.Label[:])
	if d.Active {
		b[14] = 1
	}
	return b
}
~~~

อ่านง่ายและปลอดภัย — นี่คือทางเลือกเริ่มต้น

### แบบ `unsafe` แบบ reinterpret memory (How)

~~~go
import (
	"math/bits"
	"unsafe"
)

var isLE bool

func init() {
	var x uint16 = 0xFF00
	xb := *(*[2]byte)(unsafe.Pointer(&x))
	isLE = (xb[0] == 0x00)
}

func DataFromBytesUnsafe(b [dataSize]byte) Data {
	data := *(*Data)(unsafe.Pointer(&b))
	if isLE {
		data.Value = bits.ReverseBytes32(data.Value)
	}
	return data
}

func BytesFromDataUnsafe(d Data) [dataSize]byte {
	if isLE {
		d.Value = bits.ReverseBytes32(d.Value)
	}
	b := *(*[dataSize]byte)(unsafe.Pointer(&d))
	return b
}
~~~

บรรทัด `*(*Data)(unsafe.Pointer(&b))` ทำ 3 ขั้น: เอา address ของ array → แปลงเป็น `unsafe.Pointer` → แปลงเป็น `*Data` (ต้องวงเล็บเพราะลำดับการทำงาน) → deref ได้ struct

ทำไมใช้ array ไม่ใช่ slice? เพราะ array เป็น value type — byte ถูก allocate ตรง ๆ จึง map ลง struct ได้เลย ส่วน slice มี len/cap/pointer อยู่ข้างใน

### `unsafe.Slice` เมื่อข้อมูลอยู่ใน slice

ถ้า data อยู่ใน `[]byte` ใช้ `unsafe.Slice` / `unsafe.SliceData`:

~~~go
func BytesFromDataUnsafeSlice(d Data) []byte {
	if isLE {
		d.Value = bits.ReverseBytes32(d.Value)
	}
	bs := unsafe.Slice((*byte)(unsafe.Pointer(&d)), dataSize)
	return bs
}

func DataFromSliceUnsafe(b []byte) Data {
	// ระวัง: ต้องเช็ก len(b) >= dataSize ก่อน
	return *(*Data)(unsafe.Pointer(unsafe.SliceData(b)))
}
~~~

`unsafe.Slice` ต้อง cast สองครั้ง: `*Data` → `unsafe.Pointer` → `*byte` parameter สองคือ length

### เร็วขึ้นแค่ไหน

Benchmark บน Apple Silicon M1 (little-endian):

| Benchmark | ns/op | allocs/op |
|---|---|---|
| `BytesFromData` (safe) | 2.18 | 0 |
| `BytesFromDataUnsafe` (array) | 0.84 | 0 |
| `BytesFromDataUnsafeSlice` | 13.14 | 1 |
| `DataFromBytes` (safe) | 2.18 | 0 |
| `DataFromBytesUnsafe` (array) | 1.16 | 0 |
| `DataFromBytesUnsafeSlice` | 0.96 | 0 |

แบบ array เร็วขึ้น **~2–2.5 เท่า** แต่ `BytesFromDataUnsafeSlice` ช้าสุดและ allocate 1 ครั้งเพราะ data ต้อง escape ไป heap — อย่าคิดว่า `unsafe` เร็วเสมอ ต้องวัด

> ข้อมูลผ่าน network มักเป็น **big-endian** (network byte order) แต่ CPU ส่วนใหญ่เป็น little-endian จึงต้อง reverse byte เมื่ออยู่บน little-endian (ดู `bits.ReverseBytes32` และ `init` ด้านบน)

**Why:** เข้าใจ trade-off ระหว่างอ่านง่ายกับเร็ว
**How:** เริ่มจาก `encoding/binary` ถ้า profile บอกว่าคอขวดจริงค่อยเปลี่ยนเป็น `unsafe` แบบ array

---

## Step 8: แอบดู field ที่ซ่อนอยู่ และเครื่องมือช่วยจับผิด

### อ่าน unexported field ด้วย `reflect` + `unsafe` (How)

ปกติ reflection แก้ unexported field ไม่ได้ แต่ผสม `unsafe` ทำได้ — ใช้เป็น last resort เท่านั้น:

~~~go
package main

import (
	"fmt"
	"reflect"
	"unsafe"
)

type HasUnexportedField struct {
	a string
	b bool
}

func SetBUnsafe(huf *HasUnexportedField) {
	sf, _ := reflect.TypeOf(huf).Elem().FieldByName("b")
	offset := sf.Offset
	start := unsafe.Pointer(huf)
	pos := unsafe.Add(start, offset)
	b := (*bool)(pos)
	fmt.Println("before:", *b)
	*b = true
	fmt.Println("after:", *b)
}

func main() {
	h := &HasUnexportedField{a: "hello", b: false}
	SetBUnsafe(h)
	fmt.Println(h) // &{hello true}
}
~~~

หา offset ของ `b` ด้วย `FieldByName` (คืน `StructField` ได้แม้ unexported) → แปลง `huf` เป็น `unsafe.Pointer` → `unsafe.Add` บวก offset → cast เป็น `*bool` แล้วอ่าน/เขียน

### ตรวจ `unsafe` ด้วย `-d=checkptr` (How)

Compiler มี flag ช่วยจับ misuse ของ `unsafe.Pointer`:

~~~sh
go test -gcflags=-d=checkptr ./...
go run -gcflags=-d=checkptr .
~~~

เพิ่ม check ตอน runtime คล้าย `-race` ไม่การันตีว่าเจอทุกจุดและทำให้ช้า แต่ควรเปิดตอน test ถ้าใช้ `unsafe`

> `unsafe` ทรงพลังและ low-level — อย่าใช้เว้นแต่รู้จริงและจำเป็นต้องได้ performance นั้น

---

## Step 9: `cgo` — คุยกับ C ที่ขอบโปรแกรม

### `cgo` คือ FFI ไปหา C (Why)

`cgo` เหมาะกับการ integrate กับ **C library** — C ยังเป็น lingua franca ของ OS library ทั้งหลาย Go เรียก FFI ไป C ว่า `cgo` ถ้ามี Go replacement ที่ดี ให้ใช้ Go ก่อน เพราะ `cgo` ช้าและซับซ้อน

> Go developers sometimes deride magic in other languages, but using cgo feels like spending time with Merlin. — Jon Bodner

### เรียก C จาก Go — โค้ด C อยู่ใน comment เหนือ `import "C"` (How)

สร้างไฟล์ `main.go` แบบนี้ (ต้องมี C compiler):

~~~go
package main

import "fmt"

/*
	#cgo LDFLAGS: -lm
	#include <stdio.h>
	#include <math.h>
	#include "mylib.h"

	int add(int a, int b) {
		int sum = a + b;
		printf("a: %d, b: %d, sum %d\n", a, b, sum);
		return sum;
	}
*/
import "C"

func main() {
	sum := C.add(3, 2)
	fmt.Println("sum:", sum)          // 5
	fmt.Println(C.sqrt(100))          // 10
	fmt.Println(C.multiply(10, 20))   // จาก mylib.h
}
~~~

แค่มี C compiler ก็ `go build` ได้เลย `C` เป็น pseudopackage ที่ auto-generate — identifier มาจากโค้ด C ใน comment (`C.add`) หรือ header ที่ include (`C.sqrt` จาก `math.h`) และมี type อย่าง `C.int`, `C.char` กับ function อย่าง `C.CString` (แปลง Go string → C string)

`#cgo LDFLAGS: -lm` บอก linker ให้ link กับ `libm` ส่วน `mylib.h` คือ header ของ library เราเอง

### เรียก Go จาก C ด้วย `//export` (How)

ใส่ `//export` หน้า Go function แล้วเขียน C ที่เรียกมัน:

~~~go
//export doubler
func doubler(i int) int {
	return i * 2
}
~~~

เมื่อ export แล้ว จะเขียนโค้ด C ยาว ๆ ใน comment ไม่ได้ — ทำได้แค่ list header แล้วเอาโค้ด C ไปไว้ไฟล์ `.c` พร้อม include `"_cgo_export.h"`:

~~~c
#include "_cgo_export.h"

int add(int a, int b) {
	int doubleA = doubler(a);
	int sum = doubleA + b;
	return sum;
}
~~~

### กับดักเรื่อง memory — อย่าส่งสิ่งที่บรรจุ pointer ตรง ๆ (Why)

Go มี GC แต่ C ไม่มี กฎสำคัญสองข้อ:

1. ส่งสิ่งที่ **บรรจุ pointer** (string, slice, function) เข้า C struct ตรง ๆ ไม่ได้ — เพราะมันมี pointer ข้างใน
2. C function เก็บ copy ของ Go pointer ไว้ข้ามการ return ไม่ได้ — GC อาจย้าย/เก็บไปแล้ว crash ตอน runtime

ถ้าต้องส่งค่าพวกนี้ ใช้ `cgo.Handle`:

~~~go
/*
	#include <stdint.h>
	extern void in_c(uintptr_t handle);
*/
import "C"
import (
	"fmt"
	"runtime/cgo"
)

type Person struct {
	Name string
	Age  int
}

func main() {
	p := Person{Name: "Jon", Age: 21}
	C.in_c(C.uintptr_t(cgo.NewHandle(p)))
}

//export processor
func processor(handle C.uintptr_t) {
	h := cgo.Handle(handle)
	p := h.Value().(Person)
	fmt.Println(p.Name, p.Age)
	h.Delete() // อย่าลืม!
}
~~~

`cgo.NewHandle(p)` ห่อ Go value → cast เป็น `C.uintptr_t` (เหมือน `uintptr` ของ Go) ส่งเข้า C ฝั่ง Go รับกลับ cast เป็น `cgo.Handle` → `Value().(Person)` เสร็จแล้ว `Delete()` ทันที

ข้อจำกัดอื่น: เรียก variadic C function อย่าง `printf` ตรง ๆ ไม่ได้, union ของ C ถูกแปลงเป็น byte array, เรียก function pointer ของ C ตรง ๆ ไม่ได้ (แต่ assign ลง Go variable แล้วส่งกลับเข้า C ได้)

### `cgo` ไม่ใช่เครื่องมือเร่งความเร็ว (Why)

เรียก C function จาก Go ช้ากว่า C เรียก C กันเองราว **29 เท่า** (วัดบน Go 1.21 ~40ns ต่อ call บน Intel i7-12700H) เหตุผลเดียวที่ควรใช้ `cgo` คือต้องใช้ C library ที่ไม่มี Go replacement ที่เหมาะสม และควรหา third-party wrapper ที่มีอยู่แล้วก่อน (เช่น SQLite, ImageMagick)

---

## แบบฝึกหัด

### ข้อ 1: เขียน `ValidateStringLength` ด้วย reflection

สร้าง function `ValidateStringLength(v any) error` ที่รับ struct ใดก็ได้ วน field ที่เป็น `string` และมี tag `minStrlen` ถ้าความยาวน้อยกว่าที่ tag กำหนดให้รายงาน error รวมทุก field ที่ผิดด้วย `errors.Join` และเช็กว่า input เป็น struct จริงก่อนทำ reflection

hint: ใช้ `reflect.TypeOf` → `Kind() == Struct` → `Field(i).Tag.Lookup("minStrlen")` → `ValueOf(v).Field(i).String()` → `strconv.Atoi`

### ข้อ 2: วัดขนาด struct แล้วจัดใหม่ให้เล็กสุด

สร้าง `OrderInfo` ที่มี field หลายชนิด (เช่น `bool`, `int64`, `string`, `bool`) ใช้ `unsafe.Sizeof` และ `unsafe.Offsetof` print ขนาดและ offset ของแต่ละ field แล้วสร้าง `SmallOrderInfo` ที่ reorder field ให้ได้ขนาดเล็กสุด เทียบผล `Sizeof` ก่อน/หลัง

### ข้อ 3: เรียก C จาก Go ด้วย `cgo`

เอาโค้ด `mini_calc` จาก repo ของหนังสือมาใส่ module `go-dragons` แล้วใช้ `cgo` เรียกจาก Go ตาม Step 9 ให้ `go build` ผ่านและพิมพ์ผลลัพธ์ได้

ตรวจหลังทำเสร็จ:

~~~sh
go vet ./...
go test -gcflags=-d=checkptr ./...
go test -race ./...
~~~

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **เรียก `reflect` ผิด kind แล้ว panic** — `NumIn` กับ non-function, `Set*` โดยไม่ส่ง pointer, `IsNil` กับ kind ที่เป็น nil ไม่ได้ เช็ก `Kind()` / `CanSet()` / `IsValid()` ก่อนเสมอ
- **ใช้ reflection ใน hot path** — ช้ากว่า generic/custom 50–75 เท่าและ allocate หนัก เก็บไว้ที่ boundary เท่านั้น
- **คิดว่า compiler จะช่วยเช็ก type ให้เมื่อใช้ reflection** — ส่ง type ผิดจะ crash ตอน runtime/production ไม่ใช่ตอน compile
- **`unsafe` กับ endianness** — ลืม reverse byte บน little-endian เมื่ออ่าน network (big-endian) data ทำให้ค่าผิด
- **คิดว่า `unsafe` เร็วเสมอ** — `struct → slice` แบบ `unsafe.Slice` เป็นตัวเดียวที่ allocate และช้าสุดใน benchmark
- **ส่งสิ่งที่บรรจุ pointer เข้า `cgo` ตรง ๆ** — string/slice/function ส่งใน struct เข้า C ไม่ได้ และ C เก็บ Go pointer ข้าม return ไม่ได้ ใช้ `cgo.Handle` แทน
- **คิดว่า `cgo` ทำให้เร็วขึ้น** — มันช้ากว่า ~29 เท่า/call ใช้เพื่อ integration เท่านั้น ก่อนเขียนเองให้หา wrapper ที่มีอยู่แล้ว
- **ใช้ `reflect.StructOf` แล้วคาดว่าจะได้ struct ปกติ** — ได้ type ที่ assign ได้แค่กับ `any` และต้องอ่าน/เขียนผ่าน reflection เท่านั้น
- **ลืม `h.Delete()` หลังใช้ `cgo.Handle`** — handle ค้างและ memory leak

---

## สรุป

1. Go มีกำแพงความปลอดภัย (static types, GC, tame pointers) แต่มีประตูสามบานสำหรับงานที่โค้ดปกติแก้ไม่ได้ — ใช้ที่ **boundary** กับโลกภายนอกเท่านั้น
2. `reflect` ให้ทำงานกับ type ตอน runtime — เหมาะกับข้อมูล text/dynamic ที่ไม่รู้ type ตอน compile (เช่น `encoding/json`)
3. แยก `Type` (ชื่อเฉพาะ) กับ `Kind` (โครงสร้างพื้นฐาน) ให้ออก ใช้ `reflect.TypeOf` / `Kind()` / `Name()` / `Elem()` / `NumField()`
4. ใช้ `reflect.ValueOf` อ่าน/เขียน/สร้างค่า — อ่านด้วย `Interface()` เขียนต้องส่ง pointer 3 ขั้น `ValueOf(&v).Elem().SetXxx()` เช็ก `CanSet()` ก่อน
5. สร้างค่าใหม่ด้วย `reflect.New` / `MakeSlice` / `MakeMap` / `MakeChan` และสร้าง function ด้วย `reflect.MakeFunc`
6. Reflection ช้ากว่า generic/custom 50–75 เท่าและ allocate หนัก — ถ้าใช้ generics ได้ให้ใช้ generics
7. `reflect` สร้าง struct ได้ด้วย `StructOf` แต่สร้าง method ไม่ได้ จึงสร้าง type ที่ implement interface ไม่ได้
8. `unsafe.Pointer` แปลงไปกลับกับ pointer ทุกชนิดและ `uintptr` ได้ ใช้ `Sizeof`/`Offsetof` ดู layout และจัด field เล็กให้อยู่ติดกันเพื่อลด padding
9. แปลง binary แบบ safe ด้วย `encoding/binary` แบบ `unsafe` เร็วขึ้น ~2 เท่า (array) แต่ต้องจัดการ endianness และระวัง slice ที่ allocate
10. `reflect` + `unsafe` อ่าน unexported field ได้ แต่ควรเป็น last resort และตรวจด้วย `-gcflags=-d=checkptr`
11. `cgo` คือ FFI ไป C — ฝัง C ใน comment เหนือ `import "C"` เรียก Go จาก C ด้วย `//export` และใช้ `cgo.Handle` เมื่อต้องส่งค่าที่บรรจุ pointer
12. `cgo` ไม่ใช่เครื่องมือเพิ่ม performance — ช้ากว่า ~29 เท่า ใช้เมื่อต้องพึ่ง C library ที่ไม่มี Go replacement เท่านั้น

ถ้าจะจำประโยคเดียวจากบทนี้ ให้จำว่า **เครื่องมือแหกกฎทั้งสามมีไว้สำหรับขอบของโปรแกรมเท่านั้น — ถ้าแก้ด้วย Go ปกติได้ ให้ใช้ Go ปกติ**

> Idiomatic Go is a set of tools, practices, and patterns that makes it easier to maintain software across time and changing teams. — Jon Bodner (p.439)

หนังสือ *Learning Go* จบที่บทนี้พอดี — จาก `go fmt` วันแรกจนถึงประตูมังกรทั้งสาม เราได้เห็นภาพว่า Go เลือกความเรียบและยั่งยืนเหนือความหวือหวา และนั่นคือเหตุผลที่โค้ด Go อยู่ได้นานข้ามทีมและข้ามเวลา

แค่นี้แล ลองเอา `unsafe.Sizeof` ไปส่อง struct ที่ใช้บ่อยในโปรเจกต์จริงดู แล้วจะเห็นว่าแค่สลับลำดับ field ก็ประหยัด memory ได้โดยไม่ต้องแก้ logic เลยจ้า

---

## Glossary

- **Reflection** — กลไกตรวจ/แก้/สร้าง type, value, function ตอน runtime ผ่าน `reflect`
- **`reflect.Type`** — ตัวแทนของ type (มี `Name`, `Kind`, `Elem`, `NumField`, `Field`)
- **`reflect.Kind`** — ค่าคงที่บอกโครงสร้างพื้นฐาน (`Struct`, `Slice`, `Pointer`, `Int` ฯลฯ)
- **`reflect.Value`** — ตัวแทนของ value (อ่านด้วย `Interface()` เขียนด้วย `Set*`)
- **`unsafe.Pointer`** — pointer สากลที่แปลงไปกลับกับ pointer ทุกชนิดและ `uintptr`
- **`uintptr`** — integer ที่เก็บค่า pointer และทำ arithmetic ได้
- **Padding** — byte ว่างที่ compiler เติมใน struct เพื่อ alignment
- **Endianness** — ลำดับการเก็บ byte; big-endian = MSB ก่อน (network byte order), little-endian = LSB ก่อน (CPU ส่วนใหญ่)
- **`cgo`** — FFI ของ Go สำหรับเรียก C ผ่าน pseudopackage `C`
- **`cgo.Handle`** — ตัวห่อ Go value ที่บรรจุ pointer ให้ส่งเข้า/ออก C ได้อย่างปลอดภัย
- **FFI** — Foreign Function Interface กลไกให้ภาษาหนึ่งเรียกโค้ดอีกภาษา
- **Boundary** — ขอบของโปรแกรมที่ติดต่อโลกภายนอก เหมาะกับการใช้เครื่องมือแหกกฎ

---

## Related

- [ตอนที่ 15: Writing Tests](/go/15-writing-tests/) — บทก่อนหน้า; `reflect.DeepEqual` และ `go vet` ที่ใช้ตรวจเทสต์
- [ตอนที่ 8: Generics](/go/08-generics/) — ใช้ generics แทน reflection ได้บ่อยครั้งโดยไม่เสีย performance
- [ตอนที่ 7: Types, Methods, and Interfaces](/go/07-types-methods-and-interfaces/) — เรื่อง interface กับ `nil` ที่ reflection ช่วยตรวจได้
- [ตอนที่ 6: Pointers](/go/06-pointers/) — pointer บอก mutable parameter ซึ่งอธิบายว่าทำไม reflection ต้องส่ง pointer ตอน set
- [ตอนที่ 10: Modules, Packages, and Imports](/go/10-modules-packages-and-imports/) — use case ที่เหมาะของ `init` (เช็ก endianness)
