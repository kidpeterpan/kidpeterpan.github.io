+++
title = 'ตอนที่ 15: Writing Tests'
date = '2026-08-20T00:00:00+07:00'
draft = false
description = 'เขียนเทสต์ Go ให้เป็นนิสัยด้วย testing และ go test ตั้งแต่เทสต์แรก table test coverage fuzzing benchmark ไปจนถึง stub httptest และ race detector'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราให้ `context` ช่วยพกข้อมูลและส่งสัญญาณยกเลิกผ่าน request ทั้งสายแล้ว คำถามต่อไปคือ จะรู้ได้อย่างไรว่าโค้ดที่เราส่งสัญญาณเก่งขนาดนี้ยังทำงานถูกเมื่อแก้ไปแก้มา?

คำตอบของ Go ตรงไปตรงมามาก คือฝังเครื่องมือเทสต์ไว้ในกล่องตั้งแต่วันแรก ไม่ต้องลง framework เพิ่ม ไม่ต้องเถียงกันว่าเทสต์ควรอยู่ตรงไหน — วางไฟล์ `_test.go` ไว้ข้าง `*.go` แล้วรัน `go test` ได้เลย

ถ้าวางพีระมิดของบทนี้ออกมาจะเห็นว่า ทุกอย่างวิ่งกลับมาที่ `go test` ตัวเดียว ฐานคือ unit test ธรรมดา ต่อยอดด้วย table test ที่เป็นท่ามาตรฐานของ Go แล้วค่อยแตกแขนงไปหาเครื่องมือเฉพาะทางตามงาน

สิ่งที่จะได้ตอนจบบทนี้:

- เขียนเทสต์แรกด้วย `testing` + `go test` และเลือกระหว่าง `Error` กับ `Fatal` ให้ถูกจังหวะ
- จัดฉากก่อนเทสต์ด้วย `TestMain`, `t.Cleanup`, `t.TempDir` และ `t.Setenv` โดยไม่ทิ้งขยะไว้
- เก็บไฟล์ตัวอย่างใน `testdata` ใช้ `go-cmp` เทียบ struct และเทสต์ public API แบบ black box
- เขียน table test ด้วย `t.Run` ให้เพิ่มเคสใหม่แค่เติมบรรทัด
- รันเทสต์แบบขนานด้วย `t.Parallel()` และเลี่ยงกับดัก loop variable
- วัด coverage หาเคสที่ขาดด้วย `-cover` และดู HTML report
- ให้ fuzzer หา input ประหลาดด้วย `Fuzz*` + `f.Fuzz`
- วัดความเร็วด้วย `Benchmark*` + `b.N` และ `-benchmem`
- ตัด dependency ด้วย stub (รวมท่า embed interface และ function field)
- stub HTTP service ด้วย `net/http/httptest`
- แยก integration test ด้วย build tag `//go:build integration` และจับ data race ด้วย `-race`

{{< mermaid >}}
flowchart TD
  A["go test"] --> B["Unit test: Test* + *testing.T"]
  A --> C["Table test: slice + t.Run"]
  A --> D["Benchmark: Benchmark* + b.N"]
  A --> E["Fuzz: Fuzz* + f.Fuzz"]
  B --> F["-cover: coverage"]
  B --> G["-race: race detector"]
  B --> H["stub / httptest"]
  C --> I["-tags integration"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-testing` เพื่อลองทุกท่าตั้งแต่เทสต์แรกจนถึง race detector แนะนำ Go 1.22 ขึ้นไป (พฤติกรรม loop variable ใน Step 5 จะต่างกันระหว่าง 1.21 กับ 1.22)

เปิด terminal แล้วรัน:

~~~sh
mkdir go-testing
cd go-testing
go mod init go-testing
touch math.go
~~~

ชื่อ `go-testing` ในบทนี้เป็นชื่อสำหรับทดลองบนเครื่องตัวเอง จึงต้องใช้ให้ตรงกันทั้ง `mkdir`, `cd` และ `go mod init`

ในแต่ละ Step ให้แทนที่ไฟล์ที่ระบุด้วยโค้ดของ Step นั้นแล้วรันคำสั่งใต้ตัวอย่างทันที ถ้า Step ไหนมีหลายไฟล์ ให้สร้างตามชื่อที่บอกไว้ให้ครบก่อนรัน

เอาให้ชัดก่อน ว่าเทสต์ใน Go หน้าตาเป็นอย่างไร

---

## Step 1: เทสต์แรก — ไฟล์ `_test.go` และ `go test`

### ทำไมต้องวางเทสต์ข้างโค้ด (Why)

Go แบ่ง support ออกเป็นสองส่วน คือ library (`testing` package ที่ให้ type และ function สำหรับเขียนเทสต์) กับ tooling (`go test` ที่รันและออกรายงาน) ต่างจากหลายภาษาตรงที่ Go ให้เทสต์อยู่ใน directory เดียวกัน package เดียวกันกับ production code จึงเข้าถึง unexported function ได้เลย

ผลคือไม่มีข้ออ้างเรื่อง tool — เปิดไฟล์ `_test.go` ข้าง `foo.go` แล้วเริ่มได้ทันที

### เขียนให้รันได้จริง (How)

กติกา 3 ข้อที่ต้องจำ:

1. ไฟล์เทสต์ต้องลงท้ายด้วย `_test.go` เช่น `math_test.go`
2. ฟังก์ชันเทสต์ขึ้นต้นด้วย `Test` รับ `*testing.T` ตัวเดียว (ธรรมเนียมตั้งชื่อว่า `t`) ไม่ return ค่า
3. รันด้วย `go test` เหมือน `go build`/`go run`

ลองของจริง สร้างไฟล์ `math.go`:

~~~go
package main

func addNumbers(x, y int) int {
	return x + x // ตั้งใจใส่บั๊ก: ดันบวก x กับ x
}
~~~

สร้างไฟล์ `math_test.go` ข้างกัน:

~~~go
package main

import "testing"

func Test_addNumbers(t *testing.T) {
	result := addNumbers(2, 3)
	if result != 5 {
		t.Error("incorrect result: expected 5, got", result)
	}
}
~~~

รัน:

~~~sh
go test -v
~~~

จะเห็น `--- FAIL` ชัด ๆ:

~~~text
=== RUN   Test_addNumbers
    math_test.go:7: incorrect result: expected 5, got 4
--- FAIL: Test_addNumbers (0.00s)
FAIL
~~~

แก้ `math.go` ให้เป็น `return x + y` แล้วรันใหม่:

~~~text
=== RUN   Test_addNumbers
--- PASS: Test_addNumbers (0.00s)
PASS
ok  	go-testing	0.2s
~~~

ท่าประจำที่ต้องรู้:

| คำสั่ง | ทำอะไร |
|---|---|
| `go test` | รันเทสต์ใน package ปัจจุบัน |
| `go test ./...` | รันทุก package รวม subdirectory |
| `go test -v` | verbose เห็นชื่อเทสต์ทีละตัว |
| `go test -run Test_addNumbers` | รันเฉพาะชื่อที่ match |

**Why:** เขียนเทสต์ใกล้โค้ดทำให้เข้าถึงทุกอย่างที่ต้องตรวจ และลดแรงเสียดทานในการเริ่ม
**How:** ตั้งชื่อไฟล์ `_test.go` ตั้งชื่อฟังก์ชัน `TestXxx` แล้วรัน `go test -v ./...`

### รายงานแบบ `Error` vs `Fatal` เลือกอย่างไร

`*testing.T` มี 4 ท่าหลักที่ต้องแยกให้ออก:

| Method | ทำงานอย่างไร |
|---|---|
| `t.Error` / `t.Errorf` | mark ว่า fail แต่รันต่อ — เหมาะกับ check อิสระหลายจุด |
| `t.Fatal` / `t.Fatalf` | mark ว่า fail แล้วหยุดฟังก์ชันทันที — ไม่หยุดเทสต์อื่น |

ตัวอย่าง:

~~~go
func Test_addNumbers(t *testing.T) {
	result := addNumbers(2, 3)
	if result != 5 {
		t.Fatalf("incorrect result: expected 5, got %d", result)
	}
	// ถ้าถึงตรงนี้แปลว่าบรรทัดบนผ่านแล้ว
	if result%2 == 0 {
		t.Error("should be odd in this case")
	}
}
~~~

กฎนิ้วโป้ง: ถ้า check หนึ่งพังแล้ว check ที่เหลือในฟังก์ชันเดียวกันพังหรือ panic ต่อแน่ ๆ ให้ใช้ `Fatal`/`Fatalf` ถ้าตรวจหลาย field ที่เป็นอิสระต่อกัน ให้ใช้ `Error`/`Errorf` จะได้เห็นทุกปัญหาพร้อมกัน แก้ทีเดียวจบ

---

## Step 2: จัดฉากก่อนเทสต์ — `TestMain`, `Cleanup`, `TempDir` และ `Setenv`

### `TestMain` มีได้ครั้งเดียวต่อ package (Why)

เมื่อต้องตั้ง state ร่วมก่อนรันทุกเทสต์ เช่น ต่อ database จริง ให้ใช้ `TestMain(m *testing.M)` ถ้ามีฟังก์ชันชื่อนี้ `go test` จะเรียกมันแทนการเรียกเทสต์ตรง ๆ เราต้องเรียก `m.Run()` เอง แล้วจบด้วย `os.Exit`

~~~go
func TestMain(m *testing.M) {
	fmt.Println("Set up stuff for tests here")
	code := m.Run()
	fmt.Println("Clean up stuff after tests here")
	os.Exit(code)
}
~~~

ข้อควรจำ: `TestMain` ถูกเรียกครั้งเดียว ไม่ใช่ก่อน/หลังแต่ละเทสต์ และมีได้หนึ่งตัวต่อ package ถ้าใช้เพราะ package-level variable ต้อง init ก่อน ลองพิจารณา refactor ก่อน เพราะ state ระดับ package ทำให้ตาม data flow ยาก

### ดูแลของชั่วคราวด้วย `t.Cleanup` และ `t.TempDir` (How)

สำหรับของที่ใช้แล้วทิ้งในเทสต์ตัวเดียว `t.Cleanup` สะดวกกว่า `defer` เพราะมันอยู่กับ helper ได้ และเรียกหลายครั้งได้แบบ last-added-first-called เหมือน `defer`:

~~~go
func createFile(t *testing.T) (string, error) {
	t.Helper()
	f, err := os.CreateTemp("", "example")
	if err != nil {
		return "", err
	}
	f.Close()
	t.Cleanup(func() {
		os.Remove(f.Name())
	})
	return f.Name(), nil
}
~~~

ถ้าเป็น directory ใช้ `t.TempDir()` จบเร็วกว่า — มันสร้าง directory ชั่วคราวใหม่ทุกครั้ง คืน path และลงทะเบียน cleanup ให้ลบทั้ง directory เมื่อเทสต์จบ:

~~~go
func TestWithTempDir(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "data.txt"), []byte("hello"), 0o644); err != nil {
		t.Fatal(err)
	}
	// อ่านกลับมาตรวจได้ตามปกติ
}
~~~

### ตั้ง env var แบบไม่ลืมคืนค่าด้วย `t.Setenv`

การ config ด้วย environment variable เป็นเรื่องปกติ แต่ถ้า `os.Setenv` เองแล้วลืมคืนค่า เทสต์ถัดไปจะเห็นค่าค้างได้ `t.Setenv` จัดการให้:

~~~go
func ProcessEnvVars() struct{ OutputFormat string } {
	return struct{ OutputFormat string }{OutputFormat: os.Getenv("OUTPUT_FORMAT")}
}

func TestEnvVarProcess(t *testing.T) {
	t.Setenv("OUTPUT_FORMAT", "JSON")
	cfg := ProcessEnvVars()
	if cfg.OutputFormat != "JSON" {
		t.Error("OutputFormat not set correctly")
	}
}
~~~

ทริกจากหนังสือ: ย้ายค่าจาก env var เข้า config struct ตั้งแต่ใน `main` ให้โค้ดส่วนใหญ่ไม่ต้องรู้จัก env var เลย จะเทสต์และ reuse ง่ายกว่า ถ้าอยากได้ helper ลองดู Viper หรือ envconfig ส่วน `godotenv` ช่วยโหลด `.env` ตอน dev/CI ได้

**Why:** ลดงานซ้ำก่อน/หลังเทสต์ และกันลืม cleanup จนเทสต์ถัดไปรวน
**How:** ใช้ `TestMain` เมื่องานระดับ package ใช้ `t.Cleanup`/`t.TempDir` เมื่องานระดับเทสต์ และ `t.Setenv` เมื่อต้องแตะ env var

---

## Step 3: `testdata`, cache, เทสต์ public API และ `go-cmp`

### เก็บไฟล์ตัวอย่างใน `testdata` (How)

`go test` ใช้ directory ของ package ปัจจุบันเป็น working directory ถ้าต้องการ sample file ให้สร้าง `testdata/` — ชื่อนี้ถูกสงวนไว้สำหรับเทสต์โดยเฉพาะ แล้วอ่านด้วย relative path เสมอ เพราะแต่ละ package เห็น `testdata` ของตัวเอง:

~~~sh
mkdir -p testdata
echo "hello from testdata" > testdata/sample.txt
~~~

~~~go
func TestReadSample(t *testing.T) {
	data, err := os.ReadFile("testdata/sample.txt")
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "hello from testdata\n" {
		t.Errorf("unexpected data: %q", string(data))
	}
}
~~~

### Cache ของ `go test` และ `-count=1`

ถ้าเทสต์ผ่านและไม่มีไฟล์ใน package หรือ `testdata` เปลี่ยน การรัน `go test` ซ้ำอาจใช้ cache:

~~~sh
go test ./...        # ครั้งถัดไปอาจขึ้น (cached)
go test -count=1 ./... # บังคับรันใหม่จริง
~~~

### เทสต์แบบ black box ด้วย `package xxx_test`

เทสต์ที่ผ่านมาใช้ `package main` จึงเห็นทั้ง exported และ unexported ถ้าอยากบังคับให้มองแบบผู้ใช้จริง ให้ตั้งชื่อ package เป็น `packagename_test` แม้ไฟล์ยังอยู่ directory เดียวกัน:

~~~go
// ไฟล์ math_public_test.go
package main_test

import (
	"testing"
	"go-testing"
)

func TestAddNumbersPublic(t *testing.T) {
	// เรียกได้เฉพาะ exported เท่านั้น
	if go_testing.AddNumbers(2, 3) != 5 {
		t.Error("public API failed")
	}
}
~~~

ต้อง import package นั้นแม้อยู่ directory เดียวกัน และเรียกผ่าน `packagename.AddNumbers` ข้อดีคือไฟล์ทั้งสอง package ปนกันใน directory เดียวได้ — เลือกมุมมองให้เหมาะกับสิ่งที่อยากพิสูจน์

### เทียบ struct โดยไม่เขียน `if` ยาวด้วย `go-cmp`

เทียบ compound type ด้วย `reflect.DeepEqual` พอได้ แต่ `go-cmp` ให้ diff ที่อ่านง่ายกว่า ติดตั้งก่อน:

~~~sh
go get github.com/google/go-cmp/cmp
~~~

~~~go
import "github.com/google/go-cmp/cmp"

type Person struct {
	Name      string
	Age       int
	DateAdded time.Time
}

func TestCreatePerson(t *testing.T) {
	expected := Person{Name: "Dennis", Age: 37}
	result := CreatePerson("Dennis", 37)
	if diff := cmp.Diff(expected, result); diff != "" {
		t.Error(diff)
	}
}
~~~

output จะมีบรรทัดขึ้นต้นด้วย `-` และ `+` บอก field ที่ต่างกัน ถ้า field อย่าง `DateAdded` ควบคุมไม่ได้ ให้ ignore ด้วย `cmp.Comparer`:

~~~go
comparer := cmp.Comparer(func(x, y Person) bool {
	return x.Name == y.Name && x.Age == y.Age
})
if diff := cmp.Diff(expected, result, comparer); diff != "" {
	t.Error(diff)
}
~~~

ฟังก์ชันที่ส่งให้ `cmp.Comparer` ต้องรับ parameter สองตัวชนิดเดียวกัน คืน `bool` และต้อง symmetric, deterministic, pure (ไม่แก้ parameter)

---

## Step 4: Table test — ท่ามาตรฐานของ Go

### ทำไมต้องเป็น table (Why)

การ validate ฟังก์ชันหนึ่งต้องใช้หลายเคส ถ้าเขียนหลายฟังก์ชันหรือยัดทุกอย่างในฟังก์ชันเดียวจะซ้ำ logic เยอะ table test แก้ด้วยการประกาศ slice ของ struct ที่มี ชื่อเคส + input + expected output

นึกภาพเป็นตาราง excel ที่แต่ละแถวคือหนึ่งเคส แล้ว `for` + `t.Run` เป็นคนวิ่งตรวจทีละแถว

### เขียนให้เพิ่มเคสใหม่แค่เติมบรรทัด (How)

สมมติเรามี `DoMath` ที่รองรับ `+ - * /` สร้าง `math.go`:

~~~go
package main

import (
	"errors"
	"fmt"
)

func DoMath(a, b int, op string) (int, error) {
	switch op {
	case "+":
		return a + b, nil
	case "-":
		return a - b, nil
	case "*":
		return a * b, nil // เคยมีบั๊ก copy-paste เป็น a + b ตรงนี้
	case "/":
		if b == 0 {
			return 0, errors.New("division by zero")
		}
		return a / b, nil
	default:
		return 0, fmt.Errorf("unknown operator %s", op)
	}
}
~~~

แล้วเขียน `math_test.go` แบบ table:

~~~go
func TestDoMath(t *testing.T) {
	data := []struct {
		name     string
		num1     int
		num2     int
		op       string
		expected int
		errMsg   string
	}{
		{"addition", 2, 2, "+", 4, ""},
		{"subtraction", 2, 2, "-", 0, ""},
		{"multiplication", 2, 2, "*", 4, ""},
		{"division", 2, 2, "/", 1, ""},
		{"bad_division", 2, 0, "/", 0, "division by zero"},
	}

	for _, d := range data {
		t.Run(d.name, func(t *testing.T) {
			result, err := DoMath(d.num1, d.num2, d.op)
			if result != d.expected {
				t.Errorf("Expected %d, got %d", d.expected, result)
			}
			var errMsg string
			if err != nil {
				errMsg = err.Error()
			}
			if errMsg != d.errMsg {
				t.Errorf("Expected error message %q, got %q", d.errMsg, errMsg)
			}
		})
	}
}
~~~

รัน:

~~~sh
go test -v -run TestDoMath
~~~

~~~text
=== RUN   TestDoMath
=== RUN   TestDoMath/addition
=== RUN   TestDoMath/subtraction
=== RUN   TestDoMath/multiplication
=== RUN   TestDoMath/division
=== RUN   TestDoMath/bad_division
--- PASS: TestDoMath (0.00s)
~~~

ชื่อใน `t.Run(d.name, ...)` ทำให้ report บอกได้ว่าเคสไหนพัง และรันเฉพาะเคสได้ด้วย `-run TestDoMath/bad_division`

> ⚠️ อย่าเทียบ error ด้วยข้อความตรง ๆ ถ้า error เป็น sentinel หรือ custom type ให้ใช้ `errors.Is` / `errors.As` แทน เพราะข้อความอาจเปลี่ยนโดยไม่มี compatibility guarantee (ดูบท Errors)

**Why:** เพิ่มเคสใหม่ไม่ต้องเพิ่มโค้ด แถมได้ชื่อ subtest ที่ค้นง่าย
**How:** สร้าง slice ของ anonymous struct แล้ว loop ด้วย `for _, d := range data { t.Run(d.name, func(t *testing.T) { ... }) }`

---

## Step 5: รันเทสต์แบบขนาน — `t.Parallel()` และกับดัก loop variable

### เมื่อไหร่ควร parallel (Why)

โดย default เทสต์รันแบบ sequential เพราะแต่ละ unit test ควรอิสระต่อกัน จึงเหมาะกับ concurrency พอดี เรียก `t.Parallel()` เป็นบรรทัดแรกเพื่อให้รันพร้อมเทสต์อื่นที่ mark parallel เหมือนกัน

เหมาะกับ suite ที่รันนาน ถ้าเทสต์พึ่ง shared mutable state เดียวกัน อย่า mark parallel จะได้ผลแกว่ง และจะ panic ถ้าเรียก `t.Setenv` ใน parallel test

### ใส่ให้ถูกที่ และระวัง Go 1.21 vs 1.22 (How)

~~~go
func TestDoMath_parallel(t *testing.T) {
	t.Parallel()
	// ...
}
~~~

กับดักคลาสสิกคือ parallel table test บน Go 1.21 หรือเก่ากว่า:

~~~go
for _, d := range data {
	d := d // shadow บรรทัดนี้สำคัญบน Go <= 1.21
	t.Run(d.name, func(t *testing.T) {
		t.Parallel()
		result, err := DoMath(d.num1, d.num2, d.op)
		// assert ...
		_ = err
		_ = result
	})
}
~~~

ก่อน Go 1.22 ตัวแปร `d` ถูก reuse ทำให้ทุก parallel subtest เห็นค่าเดียวกัน (มักเป็นตัวสุดท้าย) Go 1.20 เพิ่ม `go vet` check `loop variable d captured by func literal` และ Go 1.22 แก้พฤติกรรม for loop ให้สร้างตัวแปรใหม่ทุก iteration แล้ว ถ้าต้องดูแลโค้ดเก่าให้ shadow `d := d` หรือส่งเป็น parameter เข้า closure ไว้

รันแบบขนาน:

~~~sh
go test -v -run TestDoMath_parallel
go test -v -parallel 4 ./...
~~~

---

## Step 6: Coverage — รู้ว่ายังไม่ได้เทสต์ตรงไหน

### 100% ไม่ได้แปลว่าไม่มีบั๊ก (Why)

Coverage บอกว่าเทสต์แตะบรรทัดไหนบ้าง แต่ไม่การันตีว่า logic ถูก ใช้เพื่อหาเคสที่ลืม ไม่ใช่เพื่ออวดตัวเลข

รันจาก `go-testing`:

~~~sh
go test -cover -coverprofile=c.out
go test -v -cover
~~~

ตัวอย่าง table test จาก Step 4 จะได้ประมาณ `87.5%` เพราะยังไม่มีเคส `unknown operator`:

~~~text
coverage: 87.5% of statements
~~~

ดูแบบ HTML ว่าแดงตรงไหน:

~~~sh
go tool cover -html=c.out
~~~

ใน HTML สีมีความหมาย: **เทา** = ไม่นับเป็น statement, **เขียว** = cover แล้ว, **แดง** = ยังไม่มีเทสต์แตะ (ถ้ามองสีลำบาก เทาอ่อนคือ cover แล้ว) ในครั้งแรกบรรทัด `default: return 0, fmt.Errorf("unknown operator %s", op)` จะเป็นสีแดง

เติมเคสเดียวก็เขียวหมด:

~~~go
{"bad_op", 2, 2, "?", 0, "unknown operator ?"},
~~~

รันใหม่:

~~~sh
go test -cover
# coverage: 100.0% of statements
~~~

แต่ 100% ก็ยังมีบั๊กได้ ถ้า case `*` เคยเขียนเป็น `return num1 + num2` แทน `num1 * num2` เคส `{"multiplication", 2, 2, "*", 4, ""}` จะยังผ่าน เพราะ `2*2 == 2+2` ต้องเติมเคสที่จับความต่างจริง:

~~~go
{"another_mult", 2, 3, "*", 6, ""}, // ถ้า logic ผิดจะได้ 5 แทน 6
~~~

บทเรียนคือ อย่า copy-paste เคสแล้วแก้เลขแบบขอไปที

**Why:** หาเคสที่ขาดด้วยสายตาใน HTML ได้เร็วกว่าเดา
**How:** `go test -cover -coverprofile=c.out` แล้ว `go tool cover -html=c.out`

---

## Step 7: Fuzzing — ให้คอมช่วยคิด input ที่เราคิดไม่ถึง

### ทุก input น่าสงสัย (Why)

แม้ spec ดีแค่ไหน วันหนึ่งก็ต้องเจอ input แปลก — เสียระหว่างส่ง, บั๊กจากโปรแกรมต้นทาง, หรือ corner case ใน spec เอง unit test ที่คิดเคสเองจึงไม่พอ **Fuzzing** คือให้ fuzzer สุ่ม mutate ข้อมูลจาก seed corpus แล้วป้อนเข้าโค้ดเพื่อดูว่าพังไหม

### เขียน `Fuzz*` ให้จับสองอย่าง (How)

ตัวอย่าง `ParseData` ที่อ่านจำนวนบรรทัดแล้วตามด้วย string หลายบรรทัด ถ้า spec บอกว่า `count` คุมจำนวนบรรทัดพอดี แต่ input จริงอาจเป็น `300000000000` หรือ `-1` หรือบรรทัดว่าง `\r`:

~~~go
func FuzzParseData(f *testing.F) {
	testcases := [][]byte{
		[]byte("3\nhello\ngoodbye\ngreetings\n"),
		[]byte("0\n"),
	}
	for _, tc := range testcases {
		f.Add(tc)
	}
	f.Fuzz(func(t *testing.T, in []byte) {
		r := bytes.NewReader(in)
		out, err := ParseData(r)
		if err != nil {
			t.Skip("handled error")
		}
		roundTrip := ToData(out)
		rtr := bytes.NewReader(roundTrip)
		out2, err := ParseData(rtr)
		if diff := cmp.Diff(out, out2); diff != "" {
			t.Error(diff)
		}
	})
}
~~~

กติกา:

- ชื่อขึ้นต้นด้วย `Fuzz` รับ `*testing.F` ตัวเดียว ไม่ return
- แต่ละ entry ใน seed ส่งผ่าน `f.Add` รองรับ `int` ทุกชนิดรวม `rune`/`byte`, `float`, `bool`, `string`, `[]byte` ใส่ type ผิดเป็น runtime error
- `f.Fuzz` รับฟังก์ชันที่ parameter แรกเป็น `*testing.T` ที่เหลือต้องตรงกับ type/ลำดับ/จำนวนที่ `Add` ไว้ (เช็กตอน runtime)

รัน:

~~~sh
go test -fuzz=FuzzParseData
~~~

ถ้าไม่ใส่ `-fuzz` fuzz test จะรันเหมือน unit test กับ seed เท่านั้น และ fuzz ได้ทีละตัว เมื่อเจอ input ที่พัง fuzzer จะเขียนลง `testdata/fuzz/FuzzParseData/` กลายเป็น regression test ทันที ตัวอย่างไฟล์:

~~~text
go test fuzz v1
[]byte("300000000000")
~~~

ในหนังสือ fuzzer เจอบั๊กสามดอกติด:

1. allocate `300_000_000_000` string → แก้ด้วย `if count > 1000 { return nil, errors.New("too many") }`
2. `count == -1` ทำให้ `make([]string, 0, count)` panic → `if count < 0 { return nil, errors.New("no negative numbers") }`
3. บรรทัดที่มีแต่ `\r` → ใช้ `strings.TrimSpace` แล้วเช็ก `len(line) == 0`

> ⚠️ fuzz test อาจ allocate หลาย GB และเขียนไฟล์หลาย GB ลง disk ถ้ารันอย่างอื่นบนเครื่องเดียวกันอย่าแปลกใจที่ช้าลง และการที่ fuzzer ไม่เจออะไรเพิ่มไม่ได้แปลว่าไม่มีบั๊ก

**Why:** หา edge case ที่เราไม่ได้คิด — ตัวเลขใหญ่เกิน ติดลบ whitespace แปลก
**How:** ให้ seed ที่ดี เขียน condition ที่ต้องจริงสำหรับทุก input (เช่น round-trip แล้วได้เดิม) แล้วรัน `-fuzz`

---

## Step 8: Benchmark — วัดให้ถูกก่อน optimize

### อย่าเดา ให้วัด (Why)

การบอกว่าโค้ดเร็วแค่ไหนยากกว่าที่คิด benchmark ที่ฝังมาใน Go จึงมีประโยชน์กว่า `time.Now()` เอง benchmark จะถูกเรียกซ้ำด้วย `b.N` ที่ใหญ่ขึ้นเรื่อย ๆ จนผลเสถียร

### เขียน loop `0..b.N` และกัน compiler แอบตัดโค้ดทิ้ง (How)

~~~go
var blackhole int

func BenchmarkFileLen1(b *testing.B) {
	for i := 0; i < b.N; i++ {
		result, err := FileLen("testdata/data.txt", 1)
		if err != nil {
			b.Fatal(err)
		}
		blackhole = result
	}
}
~~~

`blackhole` ระดับ package ทำให้ compiler ไม่ optimize การเรียก `FileLen` ทิ้ง

รัน:

~~~sh
go test -bench=. -benchmem
~~~

> เทสต์ทั้งหมดต้องผ่านก่อน benchmark จึงจะรัน

output มี 5 column:

| Column | ความหมาย |
|---|---|
| `BenchmarkFileLen1-12` | ชื่อ benchmark + `GOMAXPROCS` |
| `25` | จำนวนรอบที่รันจนเสถียร |
| `47201025 ns/op` | เวลาต่อรอบ (1_000_000_000 ns = 1 วินาที) |
| `65342 B/op` | byte ที่ allocate ต่อรอบ |
| `65208 allocs/op` | จำนวนครั้งที่ allocate จาก heap ต่อรอบ |

อยากเทียบหลาย buffer ใช้ `b.Run` เหมือน `t.Run`:

~~~go
func BenchmarkFileLen(b *testing.B) {
	for _, v := range []int{1, 10, 100, 1000, 10000, 100000} {
		b.Run(fmt.Sprintf("FileLen-%d", v), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				result, err := FileLen("testdata/data.txt", v)
				if err != nil {
					b.Fatal(err)
				}
				blackhole = result
			}
		})
	}
}
~~~

ผลมักออกมาว่า buffer ใหญ่ขึ้น allocate น้อยลงและเร็วขึ้นจนกว่า buffer จะใหญ่กว่าไฟล์ หลังจากนั้น allocation ส่วนเกินทำให้ช้าลง เช่นไฟล์ขนาดนี้ `10000` อาจดีสุด แต่พอขยับ allocation ของ byte slice ออกนอก loop จะเหลือ 4 alloc คงที่ทุกขนาด — ถ้า memory จำกัด ใช้ buffer เล็กแลก performance ได้

> ท่องไว้: optimize เมื่อจำเป็นจริง ถ้าโปรแกรมเร็วพอตาม requirement เอาเวลาไปเพิ่ม feature/แก้บั๊กดีกว่า ส่วน profiling แบบลึกให้เริ่มจาก "Profiling Go Programs with pprof" ของ Julia Evans

**Why:** เลือก trade-off จากตัวเลข ไม่ใช่ความรู้สึก
**How:** เขียน `BenchmarkXxx(b *testing.B)` วน `b.N` รอบ แล้วรัน `-bench` + `-benchmem`

---

## Step 9: ตัด dependency ด้วย stub และ `httptest`

### พึ่ง abstraction แล้วเทสต์จะง่าย (Why)

โค้ดส่วนใหญ่เต็มไปด้วย dependency ตามที่เห็นในบท Types/Methods/Interfaces Go ให้ abstract ได้สองทาง: function type และ interface พอโค้ดพึ่ง abstraction เทสต์ก็แค่เสียบของปลอมเข้าไปแทน

> คำว่า stub กับ mock มักสลับกัน แต่ตาม Martin Fowler **stub** คือคืนค่า canned ตาม input ส่วน **mock** คือตรวจว่าชุด call เกิดตามลำดับและ input ที่คาดหวัง ตัวอย่างในบทใช้ stub ถ้าจะใช้ library ลองดู `gomock` หรือ `testify`

### Stub แบบง่าย (How)

สมมติ `Processor` มี field `MathSolver` ที่มี `Resolve(ctx, expr)`:

~~~go
type MathSolverStub struct{}

func (ms MathSolverStub) Resolve(ctx context.Context, expr string) (float64, error) {
	switch expr {
	case "2 + 2 * 10":
		return 22, nil
	case "( 2 + 2 ) * 10":
		return 40, nil
	case "( 2 + 2 * 10":
		return 0, errors.New("invalid expression: ( 2 + 2 * 10")
	}
	return 0, nil
}
~~~

ในเทสต์แค่ยัด stub เข้า `Processor{Solver: MathSolverStub{}}` แล้วตรวจว่า `ProcessExpression` จัดการ input/ error ถูกไหม

### เมื่อ interface มีหลาย method (How)

มีสองท่าให้เลือก:

**ท่าแรก: embed interface ใน struct** เหมาะเมื่ออยาก implement แค่หนึ่งสอง method — struct จะได้ทุก method ของ interface แบบไม่มี implementation เราเติมเฉพาะที่สนใจ:

~~~go
type GetPetNamesStub struct {
	Entities // interface ที่มี GetPets, GetUser, ...
}

func (ps GetPetNamesStub) GetPets(userID string) ([]Pet, error) {
	switch userID {
	case "1":
		return []Pet{{Name: "Bubbles"}}, nil
	case "2":
		return []Pet{{Name: "Stampy"}, {Name: "Snowball II"}}, nil
	default:
		return nil, fmt.Errorf("invalid id: %s", userID)
	}
}
~~~

> ถ้า embed แล้วลืม implement method ที่ถูกเรียก เทสต์จะ panic และระวังบั๊กยอดฮิตในตัวอย่าง — `make([]string, len(pets))` แล้ว `append` จะได้ empty string นำหน้า

**ท่าที่สอง: proxy ผ่าน function field** เหมาะเมื่อแต่ละ test case อยากให้ method เดียวกันคืนค่าต่างกัน:

~~~go
type EntitiesStub struct {
	getUser     func(id string) (User, error)
	getPets     func(userID string) ([]Pet, error)
	getChildren func(userID string) ([]Person, error)
	getFriends  func(userID string) ([]Person, error)
	saveUser    func(user User) error
}

func (es EntitiesStub) GetPets(userID string) ([]Pet, error) {
	return es.getPets(userID)
}
~~~

แล้วใน table test แต่ละแถวใส่ function ที่คืนค่าต่างกันได้เลย เห็นชัดว่าเคสไหน stub ควรคืนอะไร

### `httptest` — stub HTTP แบบไม่ต้องตั้ง server จริง

ถ้า `RemoteSolver` เรียก HTTP service จริง เดิมต้องทำ integration test `net/http/httptest` ช่วยสร้าง server ปลอม:

~~~go
server := httptest.NewServer(
	http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		expression := r.URL.Query().Get("expression")
		if expression != io.expression {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprintf(w, "expected expression %q, got %q", io.expression, expression)
			return
		}
		w.WriteHeader(io.code)
		w.Write([]byte(io.body))
	}))
defer server.Close()

rs := RemoteSolver{
	MathServerURL: server.URL,
	Client:        server.Client(),
}
~~~

`NewServer` หา port ว่างแบบสุ่มให้ ต้องส่ง `http.Handler` และต้อง `Close` เมื่อจบ `server.URL` กับ `server.Client()` ที่ตั้งค่าให้คุยกับ test server ได้เลย จากนั้นที่เหลือก็เป็น table test ปกติ

> ตัวแปร `io` ถูก capture โดยสอง closure (ของ stub server กับของแต่ละเทสต์) เขียนใน closure หนึ่งแล้วอ่านในอีกอัน — ใน production แบบนี้ไม่ดี แต่ใน test code ภายในฟังก์ชันเดียวพอรับได้

---

## Step 10: แยก integration test และจับ data race

### Build tag สำหรับ integration test (Why + How)

แม้ `httptest` ช่วยเลี่ยง service จริง แต่ก็ควรมี **integration test** ที่คุยกับ service จริงเพื่อพิสูจน์ว่าเข้าใจ API ถูกต้อง ปัญหาคือมันช้าและต้องมี environment พร้อม จึงอยากแยกให้รันเมื่อพร้อมเท่านั้น

ใช้ build tag ที่บรรทัดแรกของไฟล์ (เว้นบรรทัดว่างก่อน `package`):

~~~go
//go:build integration

package main

import "testing"

func TestRemoteIntegration(t *testing.T) {
	// คุยกับ service จริง
}
~~~

รัน:

~~~sh
go test -tags integration -v ./...
~~~

อีกแนวที่ community นิยมคือเช็ก environment variable แล้ว `t.Skip` พร้อมข้อความบอกวิธีรัน — ชัดเจนกว่าเรื่อง discoverability แต่ต้องเขียน `if` ในแต่ละเทสต์ เลือกแบบไหนก็ได้ที่ทีมตกลงกัน อีกท่าที่ Go มีให้คือ `go test -short` คู่กับ `if testing.Short() { t.Skip(...) }` แต่มีแค่สองระดับและคนเขียนมองว่าไม่ intuitive เท่า tag

### Data race detector — `-race` (Why + How)

แม้ Go มี concurrency ในตัว บั๊กก็ยังเกิด ง่ายมากที่จะเผลออ้างตัวแปรจากหลาย goroutine โดยไม่ lock เรียกว่า **data race** Go มี checker ที่ช่วยหา ไม่การันตีว่าเจอทุกจุด แต่ถ้าเจอควรใส่ lock ให้ถูกต้อง

ตัวอย่างที่พังเงียบ:

~~~go
func getCounter() int {
	var counter int
	var wg sync.WaitGroup
	wg.Add(5)
	for i := 0; i < 5; i++ {
		go func() {
			for j := 0; j < 1000; j++ {
				counter++
			}
			wg.Done()
		}()
	}
	wg.Wait()
	return counter
}
~~~

คาดว่าได้ 5000 แต่บ่อยครั้งได้ `3673` เพราะหลาย goroutine เขียน `counter` พร้อมกัน

เปิด detector:

~~~sh
go test -race ./...
go build -race -o app .
./app # binary ที่มี detector จะรายงาน race ที่เจอตอนรัน
~~~

ถ้าเจอจะเห็น:

~~~text
WARNING: DATA RACE
Read at 0x00c000128070 by goroutine 10:
  race.getCounter.func1()
      race.go:12 +0x45
Previous write at 0x00c000128070 by goroutine 8:
  race.getCounter.func1()
      race.go:12 +0x5b
~~~

trace ชี้ไปที่ `counter++` ตรง ๆ แก้ด้วยการใส่ `sync.Mutex` หรือใช้ `sync/atomic` ให้ถูกต้อง

> อย่าแก้ race ด้วยการยัด `time.Sleep` เพื่อเว้นจังหวะ — โค้ดยังผิดและจะพังในบางจังหวะอยู่ดี และอย่าเปิด `-race` ตลอด เพราะ binary จะช้าลง ~10 เท่า เหมาะกับ test suite มากกว่ารัน production ยาว ๆ

---

## แบบฝึกหัด

ลองทำใน `go-testing` โดยไม่เปิดเฉลยก่อน:

### ข้อ 1: ดัน coverage ให้ใกล้ 100% แล้วแก้บั๊กที่เจอ

โหลด Simple Web App จาก repo ของหนังสือ (หรือใช้ `DoMath`/`FileLen` ที่เราสร้างในบทนี้) แล้วเขียน unit test ให้ coverage สูงที่สุด ถ้าเจอ logic ผิดอย่างเคส `*` ที่ดันเป็น `+` ให้แก้โค้ด ไม่ใช่แก้เทสต์ให้ผ่าน

ตรวจด้วย:

~~~sh
go test -cover -coverprofile=c.out ./...
go tool cover -html=c.out
~~~

### ข้อ 2: หา data race แล้วแก้ให้ถูก

สร้างโปรแกรมที่มีหลาย goroutine เขียนตัวแปรเดียวกันแบบ `getCounter` แล้วรัน `go test -race` จนเจอ warning จากนั้นแก้ด้วย `sync.Mutex` หรือ `atomic` แล้วรัน `-race` ซ้ำจนเงียบ

### ข้อ 3: เขียน fuzz test ให้ parser

เขียน `FuzzParseData` ให้ parser ที่รับ `io.Reader` ตาม Step 7 เริ่มจาก seed อย่าง `3\nhello\n...` และ `0\n` แล้วรัน `go test -fuzz=FuzzParseData` หา input ที่ทำให้ panic หรือ allocate เกินเหตุ แก้ด้วยการ guard `count` และ `TrimSpace` แล้วดูว่า fuzzer เขียน regression case ลง `testdata/fuzz/` ให้อย่างไร

ตรวจหลังทำเสร็จ:

~~~sh
go vet ./...
go test -race ./...
go test -cover ./...
~~~

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **เทียบ error ด้วยข้อความตรง ๆ** — ข้อความไม่มี compatibility guarantee ถ้าเป็น sentinel/custom error ใช้ `errors.Is`/`errors.As` แทน
- **mark parallel ทั้งที่แชร์ mutable state** — ได้ผลแกว่งและ panic ถ้าใช้ `t.Setenv` ใน parallel test
- **loop variable capture ใน parallel table test (Go ≤ 1.21)** — ต้อง shadow `d := d` ก่อน `t.Run` หรืออัปเป็น Go 1.22
- **เชื่อ 100% coverage** — จำเป็นแต่ไม่เพียงพอ บั๊ก logic ที่ถูก cover แล้วยังพังได้
- **embed interface ใน stub แล้วลืม implement method ที่ถูกเรียก** — เทสต์จะ panic กลางอากาศ
- **ลืมกัน compiler optimize benchmark ทิ้ง** — ต้องเขียนผลลง package-level variable อย่าง `blackhole`
- **แก้ data race ด้วย `sleep`** — ไม่ได้แก้จริง โค้ดยังผิดอยู่
- **ใช้ `defer` ใน loop แทน `t.Cleanup`** — cleanup ของ helper จะไม่ถูกเรียกตรงจังหวะที่ต้องการ
- **ลืม `server.Close()` ของ `httptest`** — port และ goroutine ค้าง
- **เขียน `// go:build` มีช่องว่าง** — Go จะไม่ถือว่าเป็น build tag ไฟล์อาจถูก compile ผิดเงื่อนไขโดยไม่เตือน

---

## สรุป

1. `testing` + `go test` คือฐาน — ไฟล์ `_test.go` ฟังก์ชัน `TestXxx(t *testing.T)` และ `go test ./...` / `-v` / `-run`
2. `t.Error`/`Errorf` รายงานแล้วรันต่อ ส่วน `Fatal`/`Fatalf` หยุดฟังก์ชันนั้นทันที
3. `TestMain` สำหรับ setup ระดับ package `t.Cleanup`/`t.TempDir`/`t.Setenv` สำหรับระดับเทสต์ `testdata` สำหรับไฟล์ตัวอย่างและ `-count=1` สำหรับบังคับรันใหม่
4. ใช้ `package xxx_test` เมื่ออยากเทสต์แบบ black box และใช้ `go-cmp` เทียบ struct พร้อม diff ที่อ่านง่าย
5. **table test** คือ default pattern — slice ของ struct + `t.Run` ลดโค้ดซ้ำและได้ชื่อ subtest
6. `t.Parallel()` เร่ง suite ได้ แต่ต้องไม่แชร์ mutable state และระวัง loop variable บน Go เก่า
7. `-cover` + `go tool cover -html` หาเคสที่ขาด แต่อย่าหลงว่า 100% = ไม่มีบั๊ก
8. **fuzzing** หา input แปลกที่ unit test คิดไม่ถึง — ให้ seed ดี เขียน invariant (เช่น round-trip) แล้วรัน `-fuzz`
9. **benchmark** วัดด้วย `b.N` และ `-benchmem` แล้วตัดสินใจจากตัวเลขก่อน optimize
10. ตัด dependency ด้วย **stub** (embed interface หรือ function field) และ stub HTTP ด้วย **`httptest.NewServer`**
11. แยก **integration test** ด้วย `//go:build integration` + `-tags integration` และจับ race ด้วย **`-race`**

ถ้าจะจำประโยคเดียวจากบทนี้ ให้จำว่า **เขียนโค้ดให้ testable (พึ่ง abstraction) แล้วเทสต์จะง่ายตามมาเอง — ที่เหลือคือให้ `go test` ทำงานของมัน**

บทถัดไปจะพาแหกกฎบ้างด้วย `unsafe`, `reflect` และ `cgo` — เครื่องมือที่ทรงพลังแต่ต้องใช้อย่างระวัง

แค่นี้แล ลองหยิบ `go test` ไปรันกับโค้ดที่กำลังเขียนอยู่ แล้วดูว่า table test แรกจะจับบั๊กอะไรให้เราได้บ้างจ้า

---

## Glossary

- **Table test** — pattern เก็บ test case เป็น slice ของ struct แล้ว loop ผ่าน `t.Run`
- **Code coverage** — สัดส่วน statement ที่ถูกเทสต์แตะ วัดด้วย `-cover`
- **Fuzzing** — สุ่ม mutate ข้อมูลจาก seed corpus เพื่อหา input ที่จัดการผิด
- **Seed corpus** — ชุดข้อมูลตั้งต้นที่ fuzzer ใช้เป็นฐานสร้าง input
- **Benchmark** — ฟังก์ชัน `Benchmark*` ที่วน `b.N` รอบเพื่อวัด performance และ allocation
- **Stub** — implementation ปลอมที่คืนค่า canned ตาม input ที่กำหนด
- **Mock** — implementation ปลอมที่ตรวจว่า call เกิดตามลำดับและ input ที่คาดหวัง
- **Build tag** — directive `//go:build` คุมว่าไฟล์ถูก compile เมื่อไหร่ ใช้แยก integration test
- **Data race** — หลาย goroutine เข้าถึงตัวแปรเดียวกันโดยไม่มี lock อย่างน้อยหนึ่งคือการเขียน
- **`httptest`** — package ใน standard library สำหรับสร้าง HTTP server/client ปลอมในเทสต์
- **`go-cmp`** — library เทียบค่าแบบ diff-friendly จาก Google
- **`t.Cleanup` / `t.TempDir` / `t.Setenv`** — helper ของ `testing` ที่ลงทะเบียน cleanup ให้รันเมื่อเทสต์จบ
- **`TestMain`** — hook ระดับ package ที่ให้ตั้ง/เคลียร์ state รอบ `m.Run()`

---

## Related

- [ตอนที่ 14: The Context](/go/14-the-context/) — บทก่อนหน้า; `context.Context` ที่ stub และ `httptest` ในบทนี้พาดพิงถึง
- [ตอนที่ 7: Types, Methods, and Interfaces](/go/07-types-methods-and-interfaces/) — interface และ dependency injection ที่ทำให้ stub ง่าย
- [ตอนที่ 12: Concurrency in Go](/go/12-concurrency-in-go/) — goroutine/channel และ `-race` ที่ใช้จับบั๊ก concurrency
- [ตอนที่ 9: Errors](/go/09-errors/) — `errors.Is`/`As` สำหรับตรวจ error แบบไม่เทียบข้อความตรง ๆ
