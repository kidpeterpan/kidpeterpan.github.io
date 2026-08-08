+++
title = 'ตอนที่ 9: Errors'
date = '2026-08-08T00:00:00+07:00'
draft = false
description = 'จัดการ failure path ของ Go ด้วย error, wrapping, errors.Is, errors.As และ errors.Join พร้อมรู้ว่าเมื่อไหร่ควรใช้ panic และ recover'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราพูดถึง Generics ที่ช่วยให้เขียนโค้ดชุดเดียวกับหลาย type ได้ บทนี้จะกลับมาดูเรื่องที่ทุกโปรแกรมหนีไม่พ้น: **ถ้าทำงานไม่สำเร็จ เราจะบอก caller อย่างไร?**

Go ไม่มี `try/catch` แบบภาษาที่ใช้ exception แต่ให้ function คืน `error` กลับมาเป็นค่าธรรมดา แล้วให้ caller ตรวจด้วย `if err != nil` เอง ฟังดูเหมือนต้องเขียน `if` เยอะนิดหนึ่ง แต่ข้อดีคือ failure path เปิดเผยมาก ไม่มีเส้นทางลับที่จู่ ๆ กระโดดข้ามโค้ดไปหา `catch` ที่อยู่ไกลออกไป

ลองคิดว่า `error` เป็นใบแจ้งปัญหาที่ function ส่งคืนมาพร้อมผลลัพธ์ ถ้าใบนี้เป็น `nil` ก็แปลว่างานผ่าน ถ้าไม่ใช่ `nil` ก็แปลว่าต้องอ่านและตัดสินใจว่าจะจัดการ, เพิ่ม context หรือส่งต่อ

สิ่งที่จะได้ตอนจบบทนี้:

- สร้างและตรวจ `error` ด้วย `errors.New`, `fmt.Errorf` และ `if err != nil`
- คืน zero value ที่เหมาะสมเมื่อ function ทำงานไม่สำเร็จ
- ใช้ sentinel error และเข้าใจว่าทำไม error ที่ถูก wrap ต้องตรวจด้วย `errors.Is`
- สร้าง custom error type เพื่อแนบ field เพิ่ม แล้วดึงข้อมูลด้วย `errors.As`
- เพิ่ม context ด้วย `%w` และเดินทางใน error tree โดยไม่ทำข้อมูลต้นฉบับหาย
- รวม validation errors หลายตัวด้วย `errors.Join`
- ลดโค้ด wrap ซ้ำด้วย `defer` และ named return value อย่างมีสติ
- แยกให้ออกว่าเมื่อไหร่ควรคืน error และเมื่อไหร่ `panic`/`recover` ถึงจะเหมาะ
- ใช้ `-trimpath` เมื่อไม่ต้องการเผย full path จาก stack trace

{{< mermaid >}}
graph TD
  A["function ทำงาน"] --> B{"err == nil?"}
  B -->|ใช่| C["golden path เดินต่อ"]
  B -->|ไม่ใช่| D["จัดการหรือเพิ่ม context"]
  D --> E{"ต้องตรวจแบบไหน?"}
  E -->|sentinel หรือค่า| F["errors.Is"]
  E -->|custom type| G["errors.As"]
  D --> H["return ... err"]
  H --> I["caller ได้ failure path ที่ชัดเจน"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-errors` เพื่อทดลองโค้ด โดยใช้ Go 1.21 ขึ้นไป แล้วรันคำสั่งนี้:

```sh
mkdir go-errors
cd go-errors
go mod init go-errors
touch main.go
```

ในแต่ละ Step ให้แทนที่โค้ดใน `main.go` ด้วยตัวอย่างของ Step นั้น แล้วรัน:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านหรือ panic จะแยกจากโปรแกรมที่รันได้ชัดเจน อย่านำไปวางรวมกับตัวอย่างปกติ ไม่อย่างนั้นโปรแกรมจะพังตามชื่อบทจริง ๆ

---

## Step 1: `error` คือค่าที่บอกว่า function ทำงานสำเร็จไหม

เริ่มจาก function ง่าย ๆ ที่หารเลข ถ้า denominator เป็นศูนย์ เราไม่ควรปล่อยให้โปรแกรมเดินต่อด้วยผลลัพธ์มั่ว ๆ แต่ควรคืน error ให้ caller ตัดสินใจ:

```go
package main

import (
	"errors"
	"fmt"
)

func divide(numerator, denominator int) (int, error) {
	if denominator == 0 {
		return 0, errors.New("cannot divide by zero")
	}
	return numerator / denominator, nil
}

func main() {
	for _, denominator := range []int{4, 0} {
		result, err := divide(20, denominator)
		if err != nil {
			fmt.Printf("20 / %d failed: %v\n", denominator, err)
			continue
		}

		fmt.Printf("20 / %d = %d\n", denominator, result)
	}
}
```

ผลลัพธ์คือ:

```text
20 / 4 = 5
20 / 0 failed: cannot divide by zero
```

ใน Go `error` เป็น interface ที่มี method เดียวคือ `Error() string` ส่วน `nil` คือ zero value ของ interface ที่ใช้สื่อว่า “ไม่มี error”

เวลาสำเร็จ function จึงคืนผลลัพธ์ตามปกติและคืน `nil` เป็น error ส่วนเวลาไม่สำเร็จให้คืนผลลัพธ์อื่นเป็น zero value ที่เหมาะสม เช่น `0`, `""`, `nil` slice หรือ `nil` pointer พร้อม error ที่อธิบายปัญหา

การวาง `error` เป็น return value ตัวสุดท้ายเป็น convention ไม่ใช่กฎที่ compiler บังคับ แต่เป็น convention ที่แข็งแรงมากจนควรทำตาม เพราะ caller จะอ่าน signature แล้วรู้ได้ทันทีว่าต้องตรวจ failure ตรงไหน

### ทำไมต้องตรวจ error ทันที?

เพราะถ้าเราใช้ค่าต่อก่อนตรวจ error อาจกำลังใช้ข้อมูลที่ไม่สมบูรณ์อยู่ เช่น:

ตัวอย่างนี้เป็น fragment เพื่อชี้จุด อย่าวางรันเดี่ยว ๆ เพราะต้องมี `divide` จากตัวอย่างก่อนหน้าอยู่ด้วย:

```go
result, err := divide(20, 0)
fmt.Println(result + 10) // อย่าใช้ result ก่อนตรวจ err
```

โค้ดด้านบนอาจ compile ผ่านและพิมพ์ `10` ออกมา แต่ `10` ไม่ได้แปลว่าการหารสำเร็จ มันเป็นแค่ zero value ที่ function คืนมาเพื่อให้ signature ครบเท่านั้น

> อ่าน `err` ก่อนใช้ผลลัพธ์เสมอ แล้ว failure path จะไม่แอบปนอยู่ใน golden path ของเรา

---

## Step 2: `errors.New` หรือ `fmt.Errorf` ดี?

ถ้า error message เป็นข้อความคงที่ ใช้ `errors.New` ได้เลย:

นี่เป็น syntax สั้น ๆ สำหรับดูรูปแบบการสร้าง error:

```go
errors.New("cannot divide by zero")
```

แต่ถ้าต้องแทรกข้อมูล runtime เช่นค่าที่ผิดหรือชื่อไฟล์ ให้ใช้ `fmt.Errorf`:

```go
fmt.Errorf("%d is not an even number", value)
```

ลองรันตัวอย่างนี้:

```go
package main

import "fmt"

func doubleEven(value int) (int, error) {
	if value%2 != 0 {
		return 0, fmt.Errorf("%d is not an even number", value)
	}
	return value * 2, nil
}

func main() {
	for _, value := range []int{4, 3} {
		result, err := doubleEven(value)
		if err != nil {
			fmt.Println("error:", err)
			continue
		}
		fmt.Println("result:", result)
	}
}
```

ผลลัพธ์คือ:

```text
result: 8
error: 3 is not an even number
```

เลือกใช้แบบนี้จำง่าย ๆ:

| วิธี | เหมาะกับ | ตัวอย่าง |
|---|---|---|
| `errors.New` | ข้อความคงที่ ไม่ต้องใส่ค่าจาก runtime | `errors.New("user not found")` |
| `fmt.Errorf` | ข้อความที่ต้องแทรกค่า runtime | `fmt.Errorf("user %d not found", id)` |

ตาม convention ของ Go ข้อความ error ควรขึ้นต้นด้วยตัวพิมพ์เล็ก และไม่ควรลงท้ายด้วยจุด, newline หรือเครื่องหมายตกแต่งที่ไม่จำเป็น เพราะ caller อาจนำ error ไป wrap ต่อหรือเอาไปแสดงในประโยคอื่น

---

## Step 3: Sentinel error ใช้สื่อสถานะที่ caller สนใจ

บาง error ไม่ได้มีไว้บอกข้อความอย่างเดียว แต่มีไว้บอกสถานะที่ caller ต้องตัดสินใจ เช่น “หา user ไม่เจอ” หรือ “permission ไม่พอ” เราสามารถประกาศ error กลางระดับ package เรียกว่า **sentinel error** ได้:

```go
package main

import (
	"errors"
	"fmt"
)

var ErrUserNotFound = errors.New("user not found")

func findUser(id string) (string, error) {
	if id != "1" {
		return "", ErrUserNotFound
	}
	return "Mina", nil
}

func greeting(id string) (string, error) {
	name, err := findUser(id)
	if err != nil {
		return "", fmt.Errorf("load greeting for user %q: %w", id, err)
	}
	return "Hello, " + name, nil
}

func main() {
	message, err := greeting("1")
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(message)

	_, err = greeting("404")
	fmt.Println(err)
	fmt.Println("== sentinel:", err == ErrUserNotFound)
	fmt.Println("Is sentinel:", errors.Is(err, ErrUserNotFound))
}
```

ผลลัพธ์คือ:

```text
Hello, Mina
load greeting for user "404": user not found
== sentinel: false
Is sentinel: true
```

ทำไม `err == ErrUserNotFound` ถึงเป็น `false`? เพราะ `greeting` เพิ่ม context ด้วย `%w` แล้ว error ตัวที่ caller ได้ไม่ใช่ sentinel ตรง ๆ แต่เป็น error ที่ห่อ sentinel ไว้อีกชั้น

`errors.Is` จะเดินเข้าไปดู error ที่ถูก wrap อยู่ข้างในให้ จึงใช้ตรวจได้แม้ error จะถูกห่อกี่ชั้นก็ตาม

ชื่อ sentinel มักขึ้นต้นด้วย `Err` และควรปฏิบัติต่อมันเหมือน read-only ถึงแม้ตัวแปรระดับ package จะถูก reassign ได้ในทางเทคนิคก็ตาม การแก้ค่า `ErrUserNotFound` จากที่อื่นจะทำให้ contract ของ package พังและทำให้ test เดายาก

sentinel error ควรใช้เมื่อ caller จำเป็นต้องแยกสถานะนั้นจริง ๆ ถ้า caller สนใจแค่ข้อความสำหรับ log และไม่มี decision อะไรต่อ ก็สร้าง error ธรรมดาใน function ได้ ไม่ต้องประกาศ public API เพิ่มทุกครั้ง

---

## Step 4: Custom error type เอาข้อมูลออกมาใช้

บางครั้งข้อความอย่าง `"invalid input"` ไม่พอ เราอยากรู้ด้วยว่า field ไหนผิดและผิดเพราะอะไร ให้สร้าง struct ที่ implement `Error() string`:

```go
package main

import (
	"errors"
	"fmt"
	"strings"
)

type ValidationError struct {
	Field   string
	Problem string
}

func (e ValidationError) Error() string {
	return e.Field + ": " + e.Problem
}

func validateUsername(username string) error {
	if strings.TrimSpace(username) == "" {
		return ValidationError{
			Field:   "username",
			Problem: "must not be empty",
		}
	}
	return nil
}

func main() {
	err := validateUsername("   ")
	if err == nil {
		fmt.Println("valid")
		return
	}

	fmt.Println("error:", err)

	var validationErr ValidationError
	if errors.As(err, &validationErr) {
		fmt.Println("field:", validationErr.Field)
		fmt.Println("problem:", validationErr.Problem)
	}
}
```

ผลลัพธ์คือ:

```text
error: username: must not be empty
field: username
problem: must not be empty
```

ถึงเราจะสร้าง `ValidationError` เอง แต่ function ยังควรประกาศ return type เป็น `error` ไม่ใช่ `ValidationError` เพราะอนาคต function อาจคืน error หลายรูปแบบ และ caller ไม่ควรถูกผูกกับ implementation เฉพาะตัว

### ระวัง custom error ที่ทำให้ `nil` หาย

โค้ดชุดนี้ตั้งใจให้เห็น bug เป็น fragment ที่ต่อจาก `ValidationError` ด้านบน อย่าวางรันเดี่ยว ๆ และอย่านำไปใช้เป็น pattern:

```go
func broken(flag bool) error {
	var validationErr ValidationError
	if flag {
		validationErr = ValidationError{Field: "username"}
	}
	return validationErr
}
```

ถ้าเรียก `broken(false)` จะได้ `err != nil` เป็น `true` ทั้งที่เราไม่ได้สร้าง error จริง ๆ เพราะตอน return ค่า `ValidationError` เข้า interface แล้ว interface มี dynamic type ติดไปด้วย

ทางที่ปลอดภัยคือ return `nil` ตรง ๆ เมื่อไม่มี error ตัวอย่างนี้เป็น fragment ที่ใช้ `ValidationError` จากด้านบน:

```go
func validate(flag bool) error {
	if flag {
		return ValidationError{Field: "username"}
	}
	return nil
}
```

หรือถ้าจำเป็นต้องมีตัวแปรกลาง ให้ประกาศเป็น `error` ตั้งแต่แรก:

```go
var err error
if flag {
	err = ValidationError{Field: "username"}
}
return err
```

เรื่องนี้ต่อเนื่องจากตอนที่แล้วที่เราคุยเรื่อง interface กับ typed nil เลย เป็นจุดเล็ก ๆ ที่หลอกตาได้เก่งมาก

---

## Step 5: Wrapping เพิ่ม context โดยไม่ทิ้ง error เดิม

เวลาส่ง error ผ่านหลาย function ข้อความต้นฉบับอย่าง `file not found` อาจไม่บอกว่าเกิดตอน operation ไหน เราจึงเพิ่ม context ด้วย **wrapping**

ใช้ `%w` ใน `fmt.Errorf` เพื่อเก็บ error ต้นฉบับไว้ใน error ใหม่:

```go
package main

import (
	"errors"
	"fmt"
	"os"
)

func readConfig(path string) error {
	_, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read config %q: %w", path, err)
	}
	return nil
}

func loadApp(path string) error {
	if err := readConfig(path); err != nil {
		return fmt.Errorf("load app: %w", err)
	}
	return nil
}

func main() {
	err := loadApp("missing.json")
	if err == nil {
		fmt.Println("loaded")
		return
	}

	fmt.Println(err)
	fmt.Println("is missing:", errors.Is(err, os.ErrNotExist))
}
```

ผลลัพธ์จะมีหน้าตาประมาณนี้ ข้อความจากระบบปฏิบัติการอาจต่างกันเล็กน้อย:

```text
load app: read config "missing.json": open missing.json: no such file or directory
is missing: true
```

มอง error ที่ถูก wrap เป็นต้นไม้ได้แบบนี้:

```text
load app
└── read config "missing.json"
    └── open missing.json: no such file or directory
```

ทุกชั้นเพิ่ม context ของตัวเอง แต่ยังเก็บรากเดิมไว้ ทำให้คนอ่าน log เข้าใจเส้นทาง และทำให้ `errors.Is(err, os.ErrNotExist)` ยังตรวจสถานะต้นฉบับได้

ถ้าเขียน `%v` แทน `%w` จะได้แค่ข้อความที่เอามาต่อกัน แต่จะไม่สร้างความสัมพันธ์ให้ `errors.Is` หรือ `errors.As` เดินเข้าไปหา error ข้างในได้:

ตัวอย่างนี้เป็นบรรทัดที่ใช้แทนใน function เดิม ไม่ใช่ไฟล์เต็ม:

```go
return fmt.Errorf("load app: %v", err) // เห็นข้อความ แต่ไม่ wrap
```

โดยทั่วไป convention คือใส่ `: %w` ท้าย format string และวาง error ที่จะ wrap เป็น argument ตัวสุดท้าย เพื่อให้ข้อความอ่านต่อกันเป็นธรรมชาติ

`errors.Unwrap(err)` มีไว้ดึง error ชั้นถัดไปตรง ๆ แต่ในโค้ด application มักใช้ `errors.Is` และ `errors.As` มากกว่า เพราะสองตัวนี้เดินทั้ง error tree และบอกเจตนาของเราได้ชัดกว่า

---

## Step 6: รวมหลาย error ด้วย `errors.Join`

validation เป็นงานที่เจอกรณี “ผิดหลายจุดพร้อมกัน” บ่อยมาก ถ้า return แค่ error แรก ผู้ใช้จะต้องแก้ทีละรอบเหมือนเกมที่ให้บอสโผล่มาทีละตัว น่าหงุดหงิดโดยใช่เหตุ

Go มี `errors.Join` สำหรับรวมหลาย error เป็น error เดียว:

```go
package main

import (
	"errors"
	"fmt"
	"strings"
)

type Person struct {
	FirstName string
	LastName  string
	Age       int
}

func validatePerson(person Person) error {
	var errs []error

	if strings.TrimSpace(person.FirstName) == "" {
		errs = append(errs, errors.New("first name cannot be empty"))
	}
	if strings.TrimSpace(person.LastName) == "" {
		errs = append(errs, errors.New("last name cannot be empty"))
	}
	if person.Age < 0 {
		errs = append(errs, errors.New("age cannot be negative"))
	}

	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	return nil
}

func main() {
	err := validatePerson(Person{Age: -1})
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("valid")
}
```

ผลลัพธ์คือ:

```text
first name cannot be empty
last name cannot be empty
age cannot be negative
```

ข้อควรจำคือ `errors.Join` จะคืน `nil` ถ้าไม่มี error ที่ส่งเข้าไป ดังนั้น function จึงคืน `nil` เองเมื่อ `errs` ว่าง เพื่อให้เจตนาอ่านง่ายและไม่ต้องพึ่งพารายละเอียด implementation

error ที่ได้จาก `errors.Join` ก็ยังตรวจด้วย `errors.Is` และ `errors.As` ได้เหมือน error ที่ wrap ตัวเดียว เพราะข้างในเป็น error tree ที่มีลูกหลายตัว เพียงแต่อย่าใช้ `errors.Unwrap` คาดหวังว่าจะได้ลูกทั้งหมด เพราะ `Unwrap` แบบหลาย error คืน `[]error` และ helper ตัวเก่าไม่ได้เดินรูปแบบนั้นให้เรา

> ถ้าการ validate มีหลายจุดผิด การคืนทุกปัญหาในรอบเดียวมักเป็นมิตรกับ caller มากกว่าคืน error แรกแล้วให้เขาเดาเองว่ามีอะไรอีก

---

## Step 7: จำง่าย ๆ ว่าใช้ `errors.Is` หรือ `errors.As`

สอง function นี้ชื่อคล้ายกันจนมือใหม่มีสิทธิ์สลับได้ ลองจำด้วยคำถามนี้:

| คำถามที่เราอยากรู้ | Function | สิ่งที่หา |
|---|---|---|
| error นี้คือสถานะหรือ instance ที่สนใจไหม? | `errors.Is` | sentinel หรือค่าเฉพาะ |
| error นี้เป็น type ที่มีข้อมูลให้หยิบใช้ไหม? | `errors.As` | custom error type หรือ interface |

ตัวอย่างการใช้ `errors.As` หลัง wrap:

```go
package main

import (
	"errors"
	"fmt"
)

type HTTPError struct {
	StatusCode int
	URL        string
}

func (e HTTPError) Error() string {
	return fmt.Sprintf("request %s failed with status %d", e.URL, e.StatusCode)
}

func request(url string) error {
	return fmt.Errorf("fetch resource: %w", HTTPError{
		StatusCode: 503,
		URL:        url,
	})
}

func main() {
	err := request("https://example.com/data")

	var httpErr HTTPError
	if errors.As(err, &httpErr) {
		fmt.Println("status:", httpErr.StatusCode)
		fmt.Println("url:", httpErr.URL)
	}
}
```

ผลลัพธ์คือ:

```text
status: 503
url: https://example.com/data
```

สังเกตว่า argument ตัวที่สองของ `errors.As` คือ `&httpErr` ซึ่งเป็น pointer ไปยังตัวแปรที่เราต้องการให้ function เติมค่าให้ ถ้าเขียน `errors.As(err, httpErr)` ในตัวอย่างนี้จะ compile ผ่าน เพราะ target รับเป็น `any` แต่จะ panic ตอน runtime เพราะ target ไม่ใช่ pointer ที่ถูกต้อง

เราสามารถหา interface ได้ด้วย เช่นถ้า error หลาย type มี method `StatusCode() int` เราก็ประกาศตัวแปรเป็น interface แล้วส่ง address เข้า `errors.As` ได้ ไม่จำเป็นต้องรู้ชื่อ concrete type ทุกตัว

อย่าใช้ type assertion ตรง ๆ แบบ `err.(HTTPError)` กับ error ที่อาจถูก wrap เพราะมันมองแค่ type ที่อยู่ชั้นนอกสุด ให้ใช้ `errors.As` เพื่อเดินเข้าไปใน tree แทน

---

## Step 8: ลดโค้ด wrap ซ้ำด้วย `defer`

ถ้า function หนึ่งเรียกหลาย function แล้วทุกจุดต้องเติมข้อความเดิม เช่น `in load report: ...` โค้ดจะซ้ำจนเริ่มมองไม่เห็น logic หลัก เราสามารถใช้ `defer` ร่วมกับ **named return value** เพื่อ wrap ก่อน function return:

```go
package main

import (
	"errors"
	"fmt"
)

func fetchReport(id string) (string, error) {
	if id == "404" {
		return "", errors.New("report not found")
	}
	return "report data", nil
}

func loadReport(id string) (report string, err error) {
	defer func() {
		if err != nil {
			err = fmt.Errorf("load report %q: %w", id, err)
		}
	}()

	report, err = fetchReport(id)
	if err != nil {
		return "", err
	}
	return report, nil
}

func main() {
	_, err := loadReport("404")
	fmt.Println(err)
}
```

ผลลัพธ์คือ:

```text
load report "404": report not found
```

เหตุผลที่ `defer` เห็นและแก้ `err` ได้ เพราะ `err` เป็น named return value ที่ function ถืออยู่ตลอดจนถึงจังหวะ return ถ้า function สำเร็จ `err` เป็น `nil` จึงไม่ wrap อะไร ถ้าล้มเหลว deferred function จะเปลี่ยน error ให้มี context เพิ่ม

ถ้าตั้งชื่อ return value แค่ตัวเดียว Go จะบังคับให้ตั้งชื่อทุกตัวใน result list ด้วย ในตัวอย่างนี้จึงใช้ `(report string, err error)` ไม่ใช่ผสม named กับ unnamed return แบบตามใจ

pattern นี้เหมาะเมื่อเราต้อง wrap ทุก failure ด้วยข้อความเดียวกัน ถ้าแต่ละจุดต้องการ context คนละแบบ เขียน `fmt.Errorf` ตรงจุดนั้นจะอ่านง่ายและแม่นกว่า อย่าใช้ `defer` เพียงเพราะลดจำนวนบรรทัด ถ้ามันทำให้คนอ่านต้องกระโดดไปดูโค้ดท้าย function เพื่อรู้ว่า error ถูกเปลี่ยนอย่างไร

---

## Step 9: `panic` และ `recover` ใช้เมื่อไปต่อไม่ได้จริง ๆ

`panic` ไม่ใช่เวอร์ชันที่เขียนสั้นกว่า `error` มันเป็นสัญญาณจาก runtime หรือโปรแกรมว่า state ตอนนี้ไม่ควรเดินหน้าต่อ เช่น access slice เกินขอบเขต, ส่งขนาดติดลบให้ `make` หรือเกิด bug ที่ผู้เขียนไม่ได้จัดการไว้

ลองดู `recover` ใน action กัน ตัวอย่างนี้ตั้งใจให้ `divide60(0)` panic แล้วใช้ deferred function จับไว้เพื่อให้ loop ทำงานต่อ:

```go
package main

import "fmt"

func divide60(value int) {
	defer func() {
		if recovered := recover(); recovered != nil {
			fmt.Println("recovered:", recovered)
		}
	}()

	fmt.Println(60 / value)
}

func main() {
	for _, value := range []int{1, 2, 0, 6} {
		divide60(value)
	}
}
```

ผลลัพธ์คือ:

```text
60
30
recovered: runtime error: integer divide by zero
10
```

ทันทีที่ panic เกิด function ปัจจุบันจะหยุดทำงาน แล้ว deferred function เริ่มทำงาน ถ้าไม่มีใคร `recover` panic จะไล่ย้อนกลับผ่าน defer ของ caller ไปจนถึง `main` และโปรแกรมจบพร้อม stack trace

`recover` ต้องถูกเรียกจากภายใน deferred function และจับ panic ได้เฉพาะ goroutine เดียวกัน ถ้า goroutine อื่น panic แล้วเราไป recover จาก goroutine นี้จะช่วยอะไรไม่ได้

สำหรับ input ที่คาดเดาได้ เช่นตัวหารเป็นศูนย์ ควรตรวจแล้วคืน error แบบนี้มากกว่า:

นี่เป็น function fragment ที่นำไปใส่ในไฟล์เดียวกับ import `errors` ได้:

```go
func divide60Safely(value int) (int, error) {
	if value == 0 {
		return 0, errors.New("cannot divide by zero")
	}
	return 60 / value, nil
}
```

error บอก caller ล่วงหน้าว่า function ล้มเหลวได้อย่างไร ส่วน panic ซ่อน failure path และบังคับให้คนอ่านต้องรู้รายละเอียด runtime ถึงจะเดาได้ว่าจะเกิดอะไรขึ้น

### แล้ว library ควรใช้ recover ไหม?

ถ้าเราเขียน public library และมี panic ที่อาจหลุดออกนอก public API ได้ เราอาจ recover ที่ boundary แล้วแปลงเป็น error ให้ caller ตัดสินใจ:

```go
package main

import "fmt"

func runSafely(action func()) (err error) {
	defer func() {
		if recovered := recover(); recovered != nil {
			err = fmt.Errorf("action panicked: %v", recovered)
		}
	}()

	action()
	return nil
}

func main() {
	err := runSafely(func() {
		panic("broken state")
	})
	fmt.Println(err)
}
```

ผลลัพธ์คือ:

```text
action panicked: broken state
```

ใช้ pattern นี้ตรงขอบเขตที่เราควบคุมได้ เช่น adapter หรือ public entry point ไม่ใช่เอา `recover` ไปครอบ business logic ทั้งโปรแกรมแล้วทำเป็นไม่มีอะไรเกิดขึ้น เพราะการกลืน panic อาจทำให้ข้อมูลที่ควรหยุดกลับถูกใช้งานต่อ

---

## Step 10: อยากได้ stack trace ต้องคิดเรื่องข้อมูลที่เปิดเผยด้วย

error ปกติของ Go ไม่ได้แนบ stack trace มาให้อัตโนมัติ เราจึงมักเพิ่ม context ด้วย wrapping เช่น `load app: read config: ...` เพื่อสร้างเส้นทางการทำงานด้วยมือ

ถ้าใช้ error type จาก third-party library ที่รองรับ stack trace อาจพิมพ์รายละเอียดด้วย verbose format `%+v` ได้ แต่ต้องอ่าน documentation ของ library นั้นก่อน เพราะ `fmt` จะรู้จัก stack trace ก็ต่อเมื่อ error type implement behavior ที่รองรับ

stack trace บางแบบอาจเผย full path บนเครื่องที่ build เช่น `/Users/name/project/internal/...` ถ้าไม่ต้องการเปิดเผย path ให้ build ด้วย `-trimpath`:

```sh
go build -trimpath -o go-errors .
```

นี่ไม่ใช่การทำให้ error ปลอดภัยขึ้นทั้งหมด แต่ช่วยลดข้อมูลภายในเครื่องที่หลุดไปใน binary หรือ output ของ stack trace ได้

> Log ให้พอวิเคราะห์ปัญหา แต่ไม่ควรเผลอแถมโครงสร้างเครื่อง, token หรือข้อมูลส่วนตัวไปพร้อมกับ error

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน `main.go` โดยไม่เปิดเฉลยก่อน:

1. สร้าง sentinel error ชื่อ `ErrInvalidID` และเขียน `findOrder(id string) (Order, error)` ให้คืน error นี้เมื่อ `id` ว่างหรือไม่อยู่ในข้อมูล ทดลอง wrap error ใน function ชั้นบน แล้วให้ `main` ใช้ `errors.Is` ตรวจว่าต้นเหตุคือ ID ไม่ถูกต้องหรือไม่ กรณีสำเร็จต้องคืน `Order` ที่พบคู่กับ `nil`
2. สร้าง custom error type `FieldError` ที่มี `Field string` และ `Problem string` แล้วเขียน `validateEmail(email string) error` ให้คืน `FieldError` เมื่อ email ว่าง จากนั้นใช้ `errors.As` ดึงชื่อ field และข้อความออกมา กรณี valid ต้องคืน `nil`
3. เขียน `validateUser(User) error` ให้ตรวจ `Name`, `Email` และ `Age` ให้ครบทุก field แล้วรวม error ทั้งหมดด้วย `errors.Join` ถ้าผ่านทุกเงื่อนไขให้คืน `nil` และถ้าผิดหลายจุดต้องรายงานได้มากกว่าหนึ่งข้อความในครั้งเดียว
4. เขียน `loadSettings() (Settings, error)` ที่เรียก helper อย่างน้อยสองตัว แล้วใช้ named return value กับ `defer` เพื่อ wrap error ทุกจุดด้วย context เดียวกัน กรณีสำเร็จต้องคืน `Settings` กับ `nil` และห้ามใช้ `panic` แทน error
5. เขียน `runSafely(action func()) (err error)` ที่ recover panic จาก callback แล้วแปลงเป็น error ทดลองทั้ง callback ที่ทำงานปกติและ callback ที่ `panic` โดยต้องไม่ปล่อย panic หลุดออกจาก `main`

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ใช้ผลลัพธ์ก่อนตรวจ `err`** — function อาจคืน zero value ที่ดูเหมือนข้อมูลจริง ตรวจ `if err != nil` ทันทีหลังเรียก function
- **คืน non-zero value คู่กับ error โดยไม่มีเหตุผล** — โดยทั่วไปคืน zero value ของผลลัพธ์เมื่อ error ไม่ใช่ `nil` เพื่อไม่ให้ caller เผลอใช้ค่าที่ไม่สมบูรณ์
- **เขียนข้อความ error ขึ้นต้นด้วยตัวใหญ่หรือลงท้ายด้วยจุด** — ผิด convention ของ Go และทำให้ข้อความที่ถูก wrap อ่านสะดุด
- **ใช้ `==` เทียบ sentinel ที่ถูก wrap** — จะไม่ match เมื่อมี context เพิ่ม ใช้ `errors.Is`
- **ใช้ type assertion กับ custom error ที่ถูก wrap** — assertion ตรง ๆ มองไม่ทะลุ error tree ใช้ `errors.As`
- **คืน custom error type ที่เป็น zero value เข้า `error`** — interface จะไม่เป็น `nil` เพราะมี dynamic type ติดอยู่ ให้ return `nil` ตรง ๆ หรือใช้ตัวแปรชนิด `error`
- **ส่ง target ผิดให้ `errors.As`** — argument ตัวที่สองต้องเป็น pointer ไปยัง error type หรือ interface ไม่เช่นนั้นจะ panic ตอน runtime
- **ใช้ `%v` ทั้งที่ต้องการ wrap** — `%v` ต่อแค่ข้อความและทำให้ `errors.Is`/`errors.As` เดินต่อไม่ได้ ใช้ `%w` เมื่ออยากเก็บต้นเหตุ
- **เรียก `errors.Unwrap` เพื่อจัดการ error tree ทุกแบบ** — มันไม่เหมาะกับ multi-error ใช้ `errors.Is` และ `errors.As` เป็นหลัก
- **คืนแค่ error แรกจาก validation** — ถ้าตรวจได้หลาย field ให้สะสมแล้วใช้ `errors.Join` เพื่อให้ caller แก้ได้ครบในรอบเดียว
- **ใช้ `defer` wrap จนซ่อน data flow** — ใช้เมื่อทุก failure ต้องเติม context เดียวกัน ถ้าแต่ละจุดต่างกันให้ wrap ตรงจุดนั้น
- **ใช้ `panic`/`recover` เป็น exception handling ปกติ** — input ที่คาดเดาได้ควรคืน error ส่วน panic ควรสงวนไว้สำหรับ state ที่โปรแกรมไปต่อไม่ได้จริง ๆ หรือ boundary ของ library
- **recover แล้วกลืนปัญหาเงียบ ๆ** — อย่างน้อยต้อง log, แปลงเป็น error หรือหยุดโปรแกรมตามความรุนแรง อย่าทำเหมือนไม่มีอะไรเกิดขึ้น
- **เผย full path จาก stack trace** — ใช้ `go build -trimpath` เมื่อต้องแจก binary หรือไม่ต้องการเปิดเผยโครงสร้างเครื่อง

---

## สรุป

1. Go ใช้ `error` เป็น return value ไม่ใช้ exception ทำให้ caller เห็น failure path และต้องตัดสินใจอย่างชัดเจน
2. `error` เป็น interface ที่มี `Error() string` และ `nil` หมายถึงไม่มี error
3. ใช้ `errors.New` กับข้อความคงที่ และ `fmt.Errorf` เมื่อข้อความต้องแทรกค่า runtime
4. ตรวจ `err` ทันทีหลังเรียก function และคืน zero value คู่กับ error เมื่อ operation ไม่สำเร็จ
5. sentinel error ใช้สื่อสถานะที่ caller สนใจ แต่ต้องระวังเพราะมันกลายเป็นส่วนหนึ่งของ public API
6. custom error type ช่วยแนบข้อมูลอย่าง field, status หรือ code และควรคืนออกมาเป็น `error`
7. ใช้ `%w` เพื่อ wrap error และเพิ่ม context โดยยังเก็บต้นเหตุไว้ใน error tree
8. ใช้ `errors.Is` หา sentinel หรือ instance และใช้ `errors.As` หา custom type หรือ interface
9. ใช้ `errors.Join` เมื่อ function ต้องคืน validation errors หลายตัวพร้อมกัน
10. `defer` กับ named return value ช่วยลดโค้ด wrap ซ้ำได้ แต่ไม่ควรใช้จนทำให้ data flow อ่านยาก
11. `panic`/`recover` ไม่ใช่ exception handling ทั่วไป ใช้กับ programming error, state ที่ไปต่อไม่ได้ หรือ boundary ของ public library อย่างระมัดระวัง
12. ถ้ามี stack trace ให้คิดถึงข้อมูลที่เปิดเผย และใช้ `-trimpath` เมื่อเหมาะสม

จำประโยคเดียวพอ:

> คืน error ให้ชัด ตรวจให้ไว เพิ่ม context โดยไม่ทำต้นเหตุหาย และอย่าใช้ panic เพื่อหนีการออกแบบ failure path

บทนี้ทำให้เราเห็นว่า error handling ไม่ได้เป็นภาระที่ต้องเขียนให้ผ่าน ๆ ไป มันคือส่วนหนึ่งของ API ที่บอกคนใช้ function ว่า “อะไรผิดได้ และคุณควรทำอะไรต่อ”

> *ตอนถัดไปเราจะไปดู package และ module — วิธีจัดระเบียบโค้ด, import third-party code และแบ่งขอบเขตของ package ให้โปรเจกต์โตได้โดยไม่พันกัน*

---

## Glossary

- **`error`** — built-in interface ที่มี method เดียวคือ `Error() string`; zero value คือ `nil`
- **Error as value** — แนวคิดที่ให้ function คืน error เป็นค่าแทนการโยน exception
- **Sentinel error** — error ที่ประกาศระดับ package เพื่อสื่อสถานะเฉพาะและให้ caller ตรวจได้
- **Custom error type** — type ที่ implement `Error()` และแนบข้อมูลเพิ่มเติม เช่น field หรือ status code
- **Wrapping** — การเพิ่ม context ให้ error โดยยังเก็บ error ต้นฉบับไว้ด้วย `%w`
- **Error tree** — โครงสร้างของ error ที่ถูก wrap ซ้อนกันหลายชั้น หรือมีหลายลูกจาก `errors.Join`
- **`errors.Is`** — ตรวจว่า error tree มี error ที่ match instance หรือค่าที่ระบุหรือไม่
- **`errors.As`** — ตรวจว่า error tree มี error ที่ match type หรือ interface ที่ระบุ แล้วดึงข้อมูลออกมา
- **`errors.Join`** — รวมหลาย error เป็น error เดียวที่ยังตรวจด้วย `Is` และ `As` ได้
- **Named return value** — return value ที่ตั้งชื่อตั้งแต่ function signature และถูกอ้างถึงจาก `defer` ได้
- **`panic`** — กลไก runtime ที่หยุด function ปัจจุบันและ unwind stack ผ่าน deferred function
- **`recover`** — built-in ที่เรียกจาก `defer` เพื่อจับ panic และเลือกว่าจะคืน error หรือทำงานต่อ
- **`-trimpath`** — build flag ที่ลดการเผย full path ของไฟล์ใน binary หรือ stack trace

---

## Related

- [ตอนที่ 8: Generics](/go/08-generics/) — บทก่อนหน้า; generic utility และ container มักออกแบบให้คืน error คู่กับผลลัพธ์
- [ตอนที่ 7: Types, Methods, and Interfaces](/go/07-types-methods-and-interfaces/) — `error` เป็น interface และ custom error ใช้ method set ของ Go
- [ตอนที่ 6: Pointers](/go/06-pointers/) — zero value, `nil` และการแยก no value ออกจากค่าที่มีอยู่
- [ตอนที่ 5: Functions](/go/05-functions/) — multiple return values, named return และ `defer` ที่ใช้ใน error handling
- [ตอนที่ 10: Modules, Packages, and Imports](/go/10-modules-packages-and-imports/) — บทถัดไป การจัดระเบียบ package, ใช้ third-party code และ publish module
