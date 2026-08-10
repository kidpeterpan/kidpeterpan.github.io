+++
title = 'ตอนที่ 10: Modules, Packages, and Imports'
date = '2026-08-10T00:00:00+07:00'
draft = false
description = 'จัดระเบียบโค้ด Go ด้วย module, package และ import พร้อมจัดการ dependency, internal package และ version ให้โปรเจกต์โตได้โดยไม่พันกัน'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราคุยกันเรื่อง `error` และ failure path ของ Go ว่า function ควรบอก caller อย่างไรเมื่อทำงานไม่สำเร็จ

แต่พอโค้ดเริ่มโต คำถามใหม่ก็มาแล้ว: ถ้าไม่อยากกองทุกอย่างไว้ใน `main.go` เราควรแบ่งโค้ดอย่างไร? แล้วถ้าต้องใช้ library ของคนอื่น เราจะบอก Go ให้ดาวน์โหลดและล็อก version ให้ตรงกันได้อย่างไร?

บทนี้จะพาเราสร้าง project เล็ก ๆ แล้วค่อย ๆ แยกโค้ดเป็น package, import package ของตัวเอง, เพิ่ม third-party dependency และดูแล `go.mod` กับ `go.sum` ให้เป็นระเบียบ

สิ่งที่จะได้ตอนจบบทนี้:

- สร้าง module ด้วย `go mod init` และอ่านความหมายของ `go.mod`
- แยกโค้ดออกเป็น package แล้ว import ด้วย module path
- ใช้ตัวพิมพ์ใหญ่เพื่อ export API และตั้งชื่อ package ให้อ่านรู้เรื่อง
- ใช้ `internal` ซ่อน implementation ที่ไม่อยากเปิดเป็น public API
- รู้ว่าทำไม circular dependency ถึง compile ไม่ผ่าน และควรแก้อย่างไร
- เขียน Go Doc comment ให้ exported identifier ของเรา
- เพิ่ม third-party dependency ด้วย `go get` และ sync ด้วย `go mod tidy`
- อ่าน `go.sum`, pin version และเข้าใจ Semantic Versioning กับ Minimal Version Selection
- เปลี่ยน major version แบบไม่ทำให้ import path กำกวมด้วย semantic import versioning
- ใช้ workspace, vendoring, module proxy และ `GOPRIVATE` ให้เหมาะกับสถานการณ์

{{< mermaid >}}
graph TD
  R["Repository - Git"] --> M["Module - go.mod"]
  M --> P1["package main"]
  M --> P2["package greeting"]
  M --> INT["internal package"]
  M --> D["third-party module"]
  D --> SUM["go.sum + checksum database"]
  T["go get / go mod tidy"] --> M
  T --> D
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-modules` เพื่อทดลองโค้ด โดยใช้ Go 1.21 ขึ้นไป เปิด terminal แล้วรันคำสั่งนี้:

```sh
mkdir go-modules
cd go-modules
go mod init go-modules
touch main.go
```

หลังรัน เราจะเห็นไฟล์ `go.mod` ถูกสร้างขึ้น และมีข้อความประมาณว่า module `go-modules` ถูกสร้างแล้ว เลข version ในไฟล์อาจต่างกันตาม Go ที่ติดตั้งอยู่

ในแต่ละ Step ให้แทนที่ไฟล์ที่เกี่ยวข้องด้วยตัวอย่างของ Step นั้น แล้วรัน:

```sh
go run .
```

ถ้าโปรแกรมทำงานได้ เราจะเห็น output ตามที่อธิบายไว้ใต้ code block แต่ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่านจะมีป้ายกำกับชัดเจน อย่านำไปวางรวมกับโปรแกรมปกติ ไม่อย่างนั้น compiler จะทำหน้าที่ของมันอย่างซื่อสัตย์มาก นั่นคือไม่ยอม build ให้เรา

---

## Step 1: Repository, Module และ Package ต่างกันอย่างไร?

สามคำนี้มักทำให้คนเริ่มต้นสับสน เพราะแต่ละ ecosystem ใช้คำคล้ายกัน แต่ใน Go เราแยกมองเป็นสามชั้นได้แบบนี้:

| ชั้น | ความหมาย | สิ่งที่เราเห็นในโปรเจกต์ |
|---|---|---|
| Repository | ที่เก็บ source code ใน Git หรือระบบ version control | GitHub repository |
| Module | กลุ่ม Go source code ที่ถูกแจกและ version พร้อมกัน | `go.mod` ที่ root |
| Package | directory ที่มีไฟล์ `.go` และใช้ package clause เดียวกัน | `main`, `greeting`, `internal/message` |

ลองนึกภาพเป็นกล่องสามชั้น: repository เป็นกล่องใหญ่สุด, module เป็นกล่องที่เราติด version และ dependency ให้พร้อมกัน, ส่วน package เป็นช่องย่อยที่แบ่งความรับผิดชอบของโค้ด

**Why:** เราแบ่ง code เป็น package เพื่อจำกัดขอบเขตความรับผิดชอบและลดจำนวนสิ่งที่แต่ละส่วนต้องรู้จัก

**How:** เริ่มจากสร้าง module ที่ root ด้วย `go mod init` แล้วค่อยเพิ่ม package เป็น directory ใต้ module นั้น

เปิดไฟล์ `go.mod` ที่คำสั่งก่อนหน้าสร้างขึ้นมา เราจะเห็นหน้าตาประมาณนี้ ไม่ต้องตกใจถ้าเลข version ต่างกัน:

```go
module go-modules

go 1.21
```

บรรทัด `module` คือชื่อที่ใช้ระบุ module นี้เวลา package อื่น import ส่วน `go` บอก language level และ version ขั้นต่ำที่ source ของ module ควรรองรับ ไฟล์นี้ยังจะมี `require` เพิ่มเมื่อเราใช้ dependency ภายนอก

module path ควรเป็นชื่อที่ unique ถ้าเราจะ publish เช่น `github.com/yourname/go-modules` ส่วน `go-modules` ในบทนี้เหมาะกับการทดลองบนเครื่องตัวเองเท่านั้น

> `go.mod` คือป้ายชื่อและรายการส่วนประกอบของ module ส่วน package คือห้องต่าง ๆ ที่อยู่ข้างใน module นั้น

---

## Step 2: แยกโค้ดเป็น Package แล้ว Import อย่างไร?

เราจะสร้าง package ชื่อ `greeting` โดยสร้าง directory `greeting/` ใต้ root ของ project จากนั้นสร้างไฟล์ `greeting.go` ใน directory นี้

วางโค้ดนี้ใน `greeting/greeting.go`:

```go
package greeting

func Hello(name string) string {
	return "Hello, " + name + "!"
}
```

ไฟล์นี้ใช้ `package greeting` เพราะทุกไฟล์ `.go` ใน directory เดียวกันต้องใช้ package clause เดียวกัน ต่อไปวางโค้ดนี้ใน `main.go`:

```go
package main

import (
	"fmt"

	"go-modules/greeting"
)

func main() {
	fmt.Println(greeting.Hello("Mina"))
}
```

รันด้วย `go run .` แล้วเราจะได้:

```text
Hello, Mina!
```

`go-modules/greeting` ประกอบจาก module path ใน `go.mod` คือ `go-modules` ต่อด้วย directory ของ package คือ `/greeting` ส่วนชื่อ `greeting` หน้า `Hello` มาจาก `package greeting` ในไฟล์ ไม่ใช่ชื่อที่ compiler เดาจาก import path แบบตายตัว

นี่เป็นจุดที่ควรจำให้แม่น:

- **Import path** บอกว่า source code อยู่ที่ไหน เช่น `go-modules/greeting`
- **Package name** บอกว่าเราจะเรียก identifier ผ่าน prefix อะไร เช่น `greeting.Hello`
- ทุกไฟล์ใน directory เดียวกันต้องเป็น package เดียวกัน แต่ module หนึ่งมีหลาย package ได้

โดยทั่วไปตั้งชื่อ package ให้ตรงกับ directory จะอ่านง่ายที่สุด ถ้า directory ชื่อ `do-format` แต่ package clause เป็น `format` เราก็ต้องเรียก `format.Number` อยู่ดี อย่างไรก็ตามการตั้งชื่อ directory ที่มี hyphen มักทำให้คนอ่านสะดุด จึงควรเลือกชื่อที่เป็น Go identifier ได้ตั้งแต่แรก

> Import path คือที่อยู่ ส่วน package name คือชื่อที่เราใช้เรียกคนในที่อยู่นั้น

---

## Step 3: Export API ด้วยตัวพิมพ์ใหญ่

Go ไม่มี keyword อย่าง `public` หรือ `private` สำหรับ package-level identifier กติกาง่ายกว่านั้นมาก: ถ้าชื่อขึ้นต้นด้วยตัวพิมพ์ใหญ่ก็ export ออกนอก package ได้ ถ้าขึ้นต้นด้วยตัวพิมพ์เล็กก็ใช้ได้เฉพาะใน package เดียวกัน

ลองแทนที่ `greeting/greeting.go` ด้วยโค้ดนี้ แล้วสังเกตว่า `Hello` เรียกจาก `main` ได้ แต่ `normalize` จะเป็น implementation ภายใน:

```go
package greeting

import "strings"

func Hello(name string) string {
	return "Hello, " + normalize(name) + "!"
}

func normalize(name string) string {
	return strings.TrimSpace(name)
}
```

ใช้ `main.go` เดิมแล้วรัน `go run .` ผลลัพธ์คือ:

```text
Hello, Mina!
```

ในที่นี้ `Hello` เป็น public API ของ package แต่ `normalize` เป็นรายละเอียดข้างในที่เราเปลี่ยนได้โดยไม่บังคับให้ caller รู้เรื่อง

ตัวอย่างต่อไปนี้เป็น fragment ที่ตั้งใจให้ compile ไม่ผ่าน อย่านำไปวางใน `main.go`:

```go
fmt.Println(greeting.normalize(" Mina "))
```

compiler จะไม่ยอมให้ package อื่นเรียก `normalize` เพราะชื่อขึ้นต้นด้วยตัวพิมพ์เล็ก นี่เป็นการซ่อน implementation แบบพื้นฐานของ Go

### ตั้งชื่อ package และ identifier ให้ไม่ซ้ำความหมาย

ชื่อ package ควรเป็น noun ที่บอกว่ามันจัดการเรื่องอะไร ส่วน function หรือ method มักเป็น verb ที่บอก action เช่น:

- `names.Extract` และ `names.Format` อ่านรู้เรื่องกว่า `util.ExtractNames` และ `util.FormatNames`
- ใน package `names` ไม่จำเป็นต้องตั้ง function ว่า `ExtractNames` เพราะ prefix บอก `names` อยู่แล้ว
- ข้อยกเว้นที่พบได้คือชื่ออย่าง `sort.Sort` หรือ `context.Context` ที่ใช้ชื่อ package ซ้ำเพื่อบอก concept สำคัญ

ถ้า package สองตัวชื่อชนกันในไฟล์เดียว เราตั้ง alias ตอน import ได้ ตัวอย่างนี้เป็น fragment สำหรับดู syntax ไม่ใช่โปรแกรมเต็ม:

```go
import (
	crand "crypto/rand"
	"math/rand"
)

// เรียก crand.Read(...) สำหรับ crypto/rand
// เรียก rand.Intn(...) สำหรับ math/rand
```

alias `crand` ช่วยแยก package สองตัวที่มี package name เป็น `rand` เหมือนกัน ส่วนการ import ด้วย `.` ที่ทำให้เรียก identifier โดยไม่ใส่ prefix มักทำให้คนอ่านไม่รู้ว่า code มาจาก package ไหน จึงควรหลีกเลี่ยง การใช้ `_` เป็น blank import มีความหมายพิเศษ คือ import เพื่อ side effect อย่างการรัน `init` โดยไม่เรียก identifier จาก package นั้น

> ทุก identifier ที่เรา export คือคำสัญญาใน API อย่า export เพียงเพราะอยากให้ตัวอย่าง compile ผ่าน

---

## Step 4: ใช้ `internal` ซ่อน Implementation

บางโค้ดอยากให้ package ใน application ใช้ร่วมกัน แต่ไม่อยากเปิดให้ module อื่น import ได้ เช่น database adapter, validation rule หรือ helper ที่ยังไม่อยากสัญญาว่าจะรักษา API ไปตลอด

Go มี directory ชื่อพิเศษคือ `internal` ให้ใช้ตรงนี้ได้เลย สร้าง `internal/message/message.go` แล้ววางโค้ดนี้:

```go
package message

import "strings"

func Welcome(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Welcome, guest!"
	}
	return "Welcome, " + name + "!"
}
```

จากนั้นแทนที่ `main.go` ด้วยโค้ดนี้:

```go
package main

import (
	"fmt"

	"go-modules/internal/message"
)

func main() {
	fmt.Println(message.Welcome("Mina"))
	fmt.Println(message.Welcome("  "))
}
```

รัน `go run .` แล้วจะได้:

```text
Welcome, Mina!
Welcome, guest!
```

แม้ `Welcome` จะขึ้นต้นด้วยตัวพิมพ์ใหญ่ แต่ package นี้ยังไม่ใช่ public API ของโลกภายนอก เพราะอยู่ใต้ `internal/` กฎคือ package ใต้ `internal` จะถูก import ได้จาก package ที่อยู่ใน directory ต้นทางของ `internal` และลูกหลานของมันเท่านั้น

ในตัวอย่างนี้ `go-modules/internal/message` จึงถูกใช้จาก `go-modules` ได้ แต่ถ้ามี module อื่นพยายาม import path เดียวกัน จะ compile ไม่ผ่านพร้อมข้อความประมาณ `use of internal package ... not allowed`

**Why:** `internal` ช่วยกันไม่ให้คนอื่นมา depend กับ implementation ที่เรายังอยาก refactor ได้

**How:** วาง logic ของ application ไว้ใน `internal/` แล้วให้ `main` ทำหน้าที่ wire dependency และเริ่มโปรแกรมเป็นหลัก โดยไม่กอง business logic ไว้ตรงนั้น

### แล้ว Circular Dependency ล่ะ?

Go ไม่อนุญาตให้ package import กันเป็นวงกลม เช่น `pet` import `person` แล้ว `person` กลับมา import `pet` อีกที ไม่ว่าจะเป็นการวนตรง ๆ หรือวนผ่าน package ที่สามก็ตาม

ตัวอย่างต่อไปนี้เป็นภาพจำลองที่ตั้งใจให้ compile ไม่ผ่าน:

```go
// package pet
import "go-modules/person"

// package person
import "go-modules/pet"
```

ถ้าเจอ `import cycle not allowed` ให้ลองทำตามลำดับนี้:

1. ดูว่าจริง ๆ แล้วสอง package ละเอียดเกินไปหรือไม่ ถ้า logic เป็นเรื่องเดียวกัน ให้ merge กลับมา
2. ถ้าต้องแยก ให้ย้าย type หรือ function ที่ทำให้เกิด cycle ไป package ใหม่ที่มี dependency ทางเดียว
3. ถ้าเป็น behavior ที่ caller ต้องการ อาจให้ package ฝั่ง caller นิยาม interface เล็ก ๆ แล้วส่ง implementation เข้ามา แต่อย่าใช้ interface เพื่อซ่อนโครงสร้างที่ยังจัดไม่ลงตัว

> Dependency ควรไหลไปข้างหน้า ถ้าลูกศรวิ่งกลับมาหาตัวเอง แปลว่าโครงสร้างกำลังพันกันแล้ว

---

## Step 5: เขียน Go Doc ให้ package ใช้งานได้จริง

เมื่อเรา export function หรือ type มันกลายเป็นส่วนหนึ่งของ API คนอื่นจึงไม่ควรต้องเปิด source code มาเดาว่าใช้ยังไง Go มีรูปแบบ comment ที่เครื่องมืออย่าง `go doc` และ `pkgsite` อ่านได้โดยตรง

แทนที่ `greeting/greeting.go` ด้วยเวอร์ชันที่มี documentation:

```go
// Package greeting provides small messages for application users.
package greeting

import "strings"

// Hello returns a greeting for name after removing surrounding spaces.
func Hello(name string) string {
	return "Hello, " + normalize(name) + "!"
}

func normalize(name string) string {
	return strings.TrimSpace(name)
}
```

รัน formatter และเปิด documentation จาก command line:

```sh
go fmt ./...
go doc ./greeting
```

ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
package greeting // import "go-modules/greeting"

Package greeting provides small messages for application users.

func Hello(name string) string
```

comment ของ package ควรอยู่ติดกับ `package greeting` และ comment ของ exported identifier ควรเริ่มต้นด้วยชื่อของ identifier นั้น เช่น `Hello returns ...` ไม่ใช่ comment กว้าง ๆ ที่ไม่บอกว่า symbol ทำอะไร

กฎสั้น ๆ ที่ใช้ได้เกือบทุกครั้ง:

- ใช้ `//` และเว้น space หลังเครื่องหมาย
- วาง comment ติดกับ item โดยไม่เว้นบรรทัดว่าง
- ขึ้นต้นด้วยชื่อ package, function, type หรือ constant ที่กำลังอธิบาย
- ถ้า comment ยาว ให้ใช้บรรทัด `//` เปล่าแบ่งย่อหน้า

> API ที่ดีไม่ได้มีแค่ชื่อที่ดี แต่ทำให้คนใช้เปิด documentation แล้วเริ่มใช้งานได้โดยไม่ต้องอ่านความคิดของคนเขียน

---

## Step 6: เพิ่ม Third-party Dependency ด้วย `go get`

Go ใช้รูปแบบ import เดียวกันทั้ง standard library และ package จากคนอื่น เราจะลองเพิ่ม `github.com/google/uuid` เพื่อสร้างและอ่าน UUID แบบมี type ชัดเจน

แทนที่ `main.go` ด้วยโค้ดนี้:

```go
package main

import (
	"fmt"

	"github.com/google/uuid"
)

func main() {
	id := uuid.MustParse("3f2504e0-4f89-41d3-9a0c-0305e82c3301")
	fmt.Println("id:", id)
}
```

จาก root ของ `go-modules` รันคำสั่งนี้:

```sh
go get github.com/google/uuid
go mod tidy
```

Go จะดาวน์โหลด module เพิ่มรายการ `require` ใน `go.mod` และสร้างหรืออัปเดต `go.sum` ที่เก็บ checksum ของ module คำสั่ง `go mod tidy` จะ scan import ใน source แล้วจัด direct และ indirect dependency ให้ตรงกับ code ที่ใช้จริง

จากนั้นรันโปรแกรม:

```sh
go run .
```

ผลลัพธ์คือ:

```text
id: 3f2504e0-4f89-41d3-9a0c-0305e82c3301
```

สังเกตว่าเรา import package ด้วย path ของ repository แต่เรียกผ่านชื่อ package `uuid` นี่คือเหตุผลที่ module path ต้องระบุได้ชัดและควร unique เมื่อเอาไป publish

**Why:** dependency ที่ประกาศใน `go.mod` ทำให้ทุกคนในทีมรู้ว่าโปรเจกต์ต้องใช้ module อะไรและ version ไหน

**How:** เพิ่ม import, ใช้ `go get` เมื่อจะเพิ่มหรือเปลี่ยน version แล้วรัน `go mod tidy` ให้ไฟล์ module สะอาดก่อน commit

เมื่อ commit project เข้า source control ให้ commit `go.mod` และ `go.sum` ที่อัปเดตแล้วไปพร้อมกันเสมอ อย่าคิดว่า `go.sum` เป็นไฟล์ชั่วคราว เพราะมันช่วยตรวจว่า byte ของ dependency ที่ดาวน์โหลดวันนี้ตรงกับ version ที่เคยตรวจไว้หรือไม่

ถ้าเราใช้ `go get` ด้วย module path ตรง ๆ โดยยังไม่มี import ใน source มันอาจถูกบันทึกเป็น `// indirect` ได้ `go mod tidy` จะช่วยแก้สถานะให้ตรงกับการใช้งานจริง

---

## Step 7: Version, SemVer และ Minimal Version Selection

dependency ไม่ควรลอยไปตาม version ล่าสุดแบบที่เราไม่รู้ตัว Go ใช้ version ตามรูปแบบ **Semantic Versioning** หรือ SemVer:

| ส่วน | ใช้เมื่อ | ผลที่คาดหวัง |
|---|---|---|
| `patch` | แก้ bug โดยไม่เปลี่ยน API | ควร backward-compatible |
| `minor` | เพิ่ม feature ที่ไม่ทำของเดิมพัง | code เดิมควรยังใช้ได้ |
| `major` | เปลี่ยน API จนของเดิมใช้ไม่ได้ | ต้องมีการเปลี่ยน major version |

version ของ Go module จะเขียนเป็น `vMAJOR.MINOR.PATCH` เช่น `v1.6.0`

ลองดู version ที่ module มี และ pin ไปที่ version ที่ต้องการ:

```sh
go list -m -versions github.com/google/uuid
go get github.com/google/uuid@v1.6.0
go mod tidy
go mod graph
```

คำสั่งแรกจะแสดงรายชื่อ version ที่มีอยู่ คำสั่งที่สองจะปรับ dependency เป็น `v1.6.0` ส่วน `go mod graph` จะแสดงเส้นเชื่อมว่า module ของเราและ dependency แต่ละตัวต้องการ module อื่น version ไหน output ของสองคำสั่งนี้อาจเปลี่ยนตาม version ที่มีในวันที่รัน

### Go เลือก version ไหนเมื่อ dependency ซ้ำกัน?

สมมติ module A ต้องการ D อย่างน้อย `v1.1.0` และ module B ต้องการ D อย่างน้อย `v1.2.3` Go จะเลือก D ที่ `v1.2.3` ซึ่งเป็น version ต่ำสุดที่ตอบโจทย์ทุกคน หลักนี้เรียกว่า **Minimal Version Selection**

มันต่างจากความรู้สึกแรกที่คิดว่า “เลือก version ล่าสุดเสมอ” เพราะ Go พยายามเลือก version ที่ graph ระบุว่าจำเป็นจริง ๆ ทำให้ build มีพฤติกรรมคาดเดาได้มากขึ้น แต่เรายังใช้ `go get -u` เพื่อ upgrade หรือระบุ `@vX.Y.Z` เพื่อ pin version เองได้

คำสั่งที่ใช้บ่อย:

```sh
go get -u=patch github.com/google/uuid
go get -u github.com/google/uuid
go get github.com/google/uuid@v1.6.0
```

สามบรรทัดนี้หมายถึง upgrade patch ในสายเดิม, upgrade ไป version ใหม่ที่เข้ากันได้ตามที่ Go เลือก และกำหนด version เจาะจงตามลำดับ หลังเปลี่ยน dependency ให้รัน `go mod tidy` แล้วดู diff ของ `go.mod` กับ `go.sum` ทุกครั้ง

### ถ้าต้อง break compatibility ต้องเปลี่ยน Import Path

ใน Go import path ทำหน้าที่ระบุ package แบบ unique ดังนั้น major version ตั้งแต่ 2 ขึ้นไปต้องใส่ `/vN` ต่อท้าย module path ด้วย ตัวอย่างนี้เป็น fragment สำหรับ module ที่มี v2 จริง ไม่ใช่โค้ดที่นำไปวางใน `go-modules` ได้ทันที:

```go
import "github.com/example/formatter/v2"
```

module v1 จะใช้ path เดิม เช่น `github.com/example/formatter` ส่วน v2 จะใช้ `github.com/example/formatter/v2` ทำให้โปรเจกต์หนึ่ง import v1 และ v2 พร้อมกันได้ระหว่าง migration

ถ้าเราแก้ API ของ library แล้วอยากเปลี่ยนชื่ออย่างไม่ทำของเดิมพัง อย่าเพิ่งลบชื่อเก่า ให้คง wrapper หรือ alias ไว้ก่อน ตัวอย่างนี้แสดง type alias ซึ่ง `=` สำคัญมาก:

```go
type OldUser struct {
	Name string
}

type User = OldUser
```

`User` ในตัวอย่างคือชื่ออีกชื่อของ `OldUser` ไม่ใช่ type ใหม่ จึงยังมี field และ method ชุดเดียวกัน การเปลี่ยน major version ค่อยเป็นทางเลือกเมื่อเราตั้งใจทำ breaking change จริง ๆ

> เปลี่ยน behavior ได้ง่ายกว่าการเปลี่ยน public API เพราะทุกอย่างที่ export แล้วมีคนอาจพึ่งพาอยู่ แม้เราไม่ได้เขียนไว้ในเอกสารก็ตาม

ใน `go.mod` ยังมี directive ที่ใช้ตอนดูแล dependency เป็นกรณี ๆ ไปด้วย: `exclude` ใช้กันไม่ให้ module ของเราเลือก version ที่มีปัญหาของ dependency อื่น ส่วน `retract` ใช้ประกาศว่า version ของ module เราเองไม่ควรถูกเลือก เช่น release ที่พลาดหรือมีช่องโหว่ ทั้งคู่ไม่ใช่สิ่งที่ต้องเติมในทุกโปรเจกต์ แต่ควรรู้จักไว้เวลาเจอเหตุการณ์จริง

---

## Step 8: Proxy, Checksum, Private Repository และ Workspace

เวลารัน `go get` กับ public module โดย default Go มักใช้ module proxy เพื่อ cache source ไว้ ไม่ต้องให้ทุกเครื่องไปดึงจาก repository ต้นทางเองทุกครั้ง และมี checksum database ช่วยตรวจว่า module version ที่ดาวน์โหลดไม่ถูกแก้เงียบ ๆ

ดูค่าที่เครื่องกำลังใช้ได้ด้วย:

```sh
go env GOPROXY GOSUMDB
```

โดยทั่วไปจะเห็นค่า proxy ของ Go และ checksum database ถ้าองค์กรมี proxy ของตัวเอง เราสามารถตั้ง `GOPROXY` เป็น URL ของ proxy นั้นได้ หรือใช้ `GOPROXY=direct` เพื่อดึงตรงจาก repository แต่การดึงตรงจะเสียประโยชน์เรื่อง cache และอาจหา version ที่ถูกลบจากต้นทางไม่เจอ

### Private Repository

ถ้า module เป็น private เราไม่อยากให้ชื่อ repository หลุดไปถาม public proxy ตั้ง `GOPRIVATE` ให้ตรงกับ path ของบริษัทก่อนดาวน์โหลด:

```sh
GOPRIVATE=*.example.com,company.com/repo go mod download
```

คำสั่งนี้บอก Go ว่า module ที่ตรงกับ pattern เหล่านี้ควรดึงตรงและไม่ส่งไป public proxy หรือ checksum database ภายนอก ในระบบจริงควรตั้งค่าไว้ใน environment ของเครื่อง developer และ CI ให้ authentication ถูกจัดการโดย secret manager ของทีม

### Workspace สำหรับแก้หลาย Module พร้อมกัน

ถ้าเรามี `app/` และ `lib/` ที่เป็นคนละ module และอยากแก้ทั้งคู่บนเครื่องเดียวโดยยังไม่ต้อง push `lib` ขึ้น repository ให้ใช้ workspace:

```sh
go work init ./app
go work use ./lib
go env GOWORK
(cd app && GOWORK=off go build ./...)
```

สองคำสั่งแรกจะสร้างหรือแก้ `go.work` ให้ `app` เห็น source ของ `lib` ในเครื่อง คำสั่ง `go env GOWORK` ช่วยดูว่า Go กำลังใช้ workspace ไฟล์ไหน ส่วนคำสั่งในวงเล็บจะเข้า `app/` ชั่วคราวแล้วใช้ `GOWORK=off` ตรวจว่าเมื่อปิด workspace แล้ว module ยัง build ได้จริงกับ dependency ที่ประกาศไว้หรือไม่

`go.work` เหมาะกับ local development และไม่ควร commit เข้า source control เพราะ path ในเครื่องของเราอาจไม่มีอยู่บนเครื่องเพื่อนหรือใน CI

ก่อนมี workspace หลายคนแก้ปัญหาด้วย `replace` แบบ local ใน `go.mod`:

```go
replace example.com/formatter => ../formatter
```

fragment นี้ทำงานได้เฉพาะเครื่องที่มี path เดียวกัน จึงไม่ควรปล่อยค้างหรือ commit เป็นวิธีแก้ถาวร ถ้าต้องพัฒนา dependency หลาย module พร้อมกันให้ใช้ `go.work` แทน

### Vendoring

บาง CI เป็นเครื่องชั่วคราวที่ไม่มี module cache เราสามารถเก็บสำเนา dependency ไว้ใน repository ด้วย `vendor/`:

```sh
go mod vendor
go build -mod=vendor ./...
```

ผลลัพธ์คือ Go จะใช้ source ใน `vendor/` ตอน build ถ้าใช้วิธีนี้ต้องรัน `go mod vendor` ใหม่ทุกครั้งที่เพิ่มหรือ upgrade dependency ไม่เช่นนั้น build อาจหยุดเพราะ `vendor/` ไม่ตรงกับ `go.mod` ข้อแลกเปลี่ยนคือ repository ใหญ่ขึ้น จึงไม่จำเป็นต้องทำทุกโปรเจกต์

**Why:** proxy ช่วยเรื่องความเร็วและความถูกต้อง ส่วน workspace ช่วยให้แก้หลาย module พร้อมกัน และ vendoring ช่วยให้ build ได้แม้ไม่มี cache

**How:** เลือกตามปัญหาจริง อย่า commit ทั้ง `replace` และ `go.work` เพียงเพราะ build บนเครื่องตัวเองผ่าน

---

## Step 9: `init` และ Blank Import ใช้เมื่อไหร่?

`init` เป็น function ที่ไม่รับ parameter และไม่คืนค่า Go จะเรียกให้อัตโนมัติก่อน `main` ของ package นั้น เหมาะกับ initialization เล็ก ๆ ที่ทำใน assignment เดียวได้ แต่ถ้าใส่ logic เยอะหรือทำ I/O เงียบ ๆ คนอ่านจะตาม data flow ยาก

ลองวางโค้ดนี้ใน `main.go` เพื่อดูจังหวะการทำงาน:

```go
package main

import "fmt"

var message string

func init() {
	message = "configured"
}

func main() {
	fmt.Println(message)
}
```

รัน `go run .` แล้วได้:

```text
configured
```

output นี้แสดงว่า `init` ทำงานก่อน `main` แต่ใน code จริงควรหลีกเลี่ยงการใช้ `init` เพื่อซ่อนการ register หรือโหลดไฟล์/network ถ้าเป็น state ที่เปลี่ยนได้ การสร้าง struct ผ่าน `New...` แล้วส่งกลับมามักอ่านและทดสอบง่ายกว่า

กรณีที่ยังพบใน standard library ecosystem คือ blank import เพื่อให้ package driver register ตัวเองผ่าน `init` ตัวอย่างนี้เป็น fragment ที่ต้องอยู่ในโปรแกรมซึ่งใช้ `database/sql` ต่อ ไม่ใช่ไฟล์เต็มสำหรับรันเดี่ยว ๆ:

```go
import (
	"database/sql"

	_ "github.com/lib/pq"
)

// ใช้ sql.Open("postgres", dsn) ในส่วนอื่นของโปรแกรม
```

`_` บอก compiler ว่าเราไม่ได้เรียก identifier จาก package แต่ต้องการ side effect ตอน package ถูก initialize รูปแบบนี้ยังจำเป็นกับ driver บางชนิดเพื่อ compatibility แต่ถ้าเป็น registry หรือ plugin ที่เราออกแบบเอง การ register แบบ explicit จะบอก data flow ได้ชัดกว่า

> `init` ทำให้ code สั้นลงได้ แต่ไม่ได้ทำให้เหตุผลของ code ชัดขึ้นเสมอ

---

## Step 10: จัดโครงสร้าง Module ให้โปรเจกต์โตได้

ไม่มี official layout แบบเดียวที่ทุกโปรเจกต์ต้องทำตาม ให้เริ่มจากขอบเขตของปัญหาและจำนวน package ที่มีจริงก่อน โครงสร้างเล็ก ๆ ของบทนี้อาจหน้าตาประมาณนี้:

```text
go-modules/
  go.mod
  go.sum
  main.go
  greeting/
    greeting.go
  internal/
    message/
      message.go
```

tree นี้เป็นภาพประกอบ ไม่ต้องนำไปวางรัน จุดสำคัญคือ `main.go` เป็น entry point ที่ควรมี logic น้อย ส่วน behavior หลักค่อยแยกไป package ที่สื่อความหมาย

แนวทางที่ใช้เริ่มต้นได้:

- **Application module:** ให้ root เป็น `main` และวาง implementation ที่ไม่อยากเปิดเป็น API ไว้ใน `internal`
- **Library module:** ให้ package ที่ root มีชื่อสื่อความหมายและ module path อิงจาก repository
- **Library ที่มีหลาย binary:** ใช้ `cmd/ชื่อโปรแกรม/` แยก `main` ของแต่ละ binary
- **โปรเจกต์ที่ซับซ้อน:** แบ่งตาม functionality เช่น `customer`, `inventory` หรือ `billing` แทนการกองทุกอย่างไว้ใน package `util`

ถ้าเป็น library ที่จะ publish ให้คิด checklist นี้ก่อน:

1. module path ตรงกับ repository path และ unique พอให้คนอื่น import ได้
2. commit `go.mod`, `go.sum`, README และ LICENSE ที่ชัดเจน
3. ใช้ tag ตาม SemVer เช่น `v1.2.3` และอย่าเปลี่ยน behavior ที่เป็น public โดยไม่คิดเรื่อง compatibility
4. document exported identifier และตรวจตัวอย่างด้วย `go test` หรือ `go vet`
5. ถ้าต้องทำ breaking change ตั้งแต่ v2 ให้เปลี่ยน path เป็น `/v2` และเก็บ code ของ version เก่าให้คนหาได้

Go ไม่ต้องการให้เรา upload package เข้า central repository แบบ Maven Central หรือ npm เพราะ module ถูกระบุด้วย repository path และ build จาก source โดยตรง ส่วน `pkg.go.dev` ทำหน้าที่ index public module และแสดง documentation ให้คนค้นหาได้ง่ายขึ้น

Hyrum's law สรุปเรื่อง public API ได้เจ็บดี: เมื่อมีคนใช้มากพอ ทุก behavior ที่สังเกตเห็นได้อาจถูกพึ่งพา ดังนั้นถ้ายังไม่อยากรับภาระ support ให้เก็บ code ไว้ใน `internal` ก่อน

> โครงสร้างที่ดีไม่ใช่โครงสร้างที่มี directory เยอะที่สุด แต่คือโครงสร้างที่ทำให้ dependency ไหลไปทางเดียวและคนเปิดไฟล์แล้วรู้ว่าจะเริ่มตรงไหน

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน project `go-modules` โดยไม่เปิดเฉลยก่อน:

1. สร้าง package `formatter` ใน `formatter/` พร้อม function `FormatName(input string) (string, error)` รับ input ที่อาจมีช่องว่างรอบข้าง ถ้า input ว่างหลัง trim ให้คืน `"", error` ถ้าสำเร็จให้คืนข้อความ `Hello, Mina!` ตามชื่อที่รับเข้ามาและคืน `nil` จาก `main` ให้ import `go-modules/formatter` แล้วทดสอบทั้ง input `" Mina "` และ `"   "` ไม่ต้อง cleanup resource ใด ๆ
2. ย้าย logic ตรวจชื่อจากข้อแรกไปไว้ใน `internal/validation` แล้วให้ package `formatter` เรียกใช้ ทดลองสร้างไฟล์จำลองนอก tree ของ `go-modules` ที่ import `go-modules/internal/validation` และบันทึก error ที่ compiler แจ้ง โดยไม่ต้องทำให้ตัวอย่างนั้น build ผ่าน
3. เพิ่ม package `config` พร้อม function `Load(path string) (string, error)` ให้ใช้ `os.ReadFile` อ่านไฟล์ตาม path ถ้าอ่านสำเร็จให้คืนเนื้อหาและ `nil` ถ้าไฟล์ไม่มีให้คืน string ว่างกับ error และไม่ต้องเรียก `Close` เพราะ `os.ReadFile` จัดการ file handle ให้แล้ว จาก `main` ให้สร้างไฟล์ชั่วคราว, เรียก function, แล้วลบไฟล์หลังทดสอบเสร็จ
4. ใช้ `go list -m -versions github.com/google/uuid` ดู version ที่มี จากนั้น pin ไป version ที่เลือกด้วย `go get module@version` แล้วรัน `go mod tidy` อธิบายว่า `go.mod` และ `go.sum` เปลี่ยนอย่างไร และตรวจด้วย `go mod graph`
5. สร้างสอง module ชื่อ `app` และ `lib` ใน directory แยกกัน ให้ `app` import `lib` แล้วใช้ `go work init` กับ `go work use` เชื่อม source ในเครื่อง จากนั้นรัน `(cd app && GOWORK=off go build ./...)` และอธิบายว่าต้อง publish หรือ tag `lib` ก่อนอย่างไรจึงจะ build แบบไม่พึ่ง workspace ได้

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build ./...
```

ถ้าทุกอย่างผ่าน command เหล่านี้จะไม่มี error สำคัญออกมา เพราะ formatter, vet และ compiler ช่วยตรวจทั้งรูปแบบ, ปัญหาที่น่าสงสัย และ dependency ของ package ใน module

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ใช้ import path ไม่ตรงกับ `module` ใน `go.mod`** — ต่อ path จาก module path จริงก่อน แล้วค่อยเติม directory ของ package
- **คิดว่าชื่อ directory คือชื่อ package เสมอ** — ชื่อที่ใช้เรียกมาจาก `package` clause ในไฟล์
- **ตั้งชื่อ exported identifier ด้วยตัวพิมพ์เล็ก** — package อื่นจะมองไม่เห็น ให้ขึ้นต้นด้วยตัวพิมพ์ใหญ่เฉพาะสิ่งที่ตั้งใจทำเป็น API
- **import package แล้วไม่ใช้** — Go จะ compile ไม่ผ่าน ลบ import ที่ไม่ใช้หรือใช้ blank import เฉพาะกรณี side effect ที่ตั้งใจจริง ๆ
- **สร้าง package ชื่อ `util` หรือ `common` ใหญ่เกินไป** — ตั้งตาม domain หรือ functionality เพื่อให้ dependency และหน้าที่ชัด
- **ให้ package import กันเป็นวงกลม** — merge package ที่แยกละเอียดเกินไป หรือย้าย shared behavior ไป package ใหม่ที่ dependency ไหลทางเดียว
- **เปิด implementation ทั้งหมดเป็น public** — วาง code ที่ยังไม่อยากให้คนอื่น depend ไว้ใน `internal`
- **ลืมรัน `go mod tidy`** — `go.mod` และ `go.sum` อาจไม่ตรงกับ import จริง และ `// indirect` อาจทำให้คนอ่านเข้าใจผิด
- **ไม่ commit `go.sum`** — คนอื่นและ CI จะเสียข้อมูลที่ใช้ verify dependency และ build ซ้ำ
- **คิดว่า `go get` เลือก version ล่าสุดแบบไม่มีหลัก** — ใช้ `go mod graph` ดู dependency graph และเข้าใจว่า MVS เลือก version ต่ำสุดที่ requirement ทั้งหมดรับได้
- **ทำ breaking change แต่ยังใช้ import path เดิม** — major version ตั้งแต่ 2 ต้องเปลี่ยน path ให้ลงท้าย `/vN`
- **commit local `replace` หรือ `go.work`** — path เหล่านี้มักมีเฉพาะเครื่องเรา ใช้ workspace สำหรับ local development และตรวจด้วย `GOWORK=off`
- **ใช้ `init` ซ่อน I/O หรือ global mutable state** — ใช้ constructor หรือ explicit registration เพื่อให้ลำดับการทำงานอ่านง่ายและ test ได้
- **ใช้ private module โดยไม่ตั้ง `GOPRIVATE`** — ชื่อ repository อาจถูกส่งไป public service ตั้ง pattern ให้ตรงกับองค์กรก่อนดาวน์โหลด
- **สร้าง `vendor/` แล้วไม่ update** — รัน `go mod vendor` ใหม่ทุกครั้งที่ dependency เปลี่ยน

---

## สรุป

1. Repository คือที่เก็บใน version control, module คือหน่วยที่ version และ distribute พร้อมกัน, ส่วน package คือ directory ที่จัดกลุ่ม source code
2. `go mod init` สร้าง module root และ `go.mod` ที่บอก module path, Go version และ dependency
3. Import path ประกอบจาก module path กับ directory ของ package ส่วนชื่อที่ใช้เรียกมาจาก package clause
4. Go ใช้ตัวพิมพ์ใหญ่กำหนด exported identifier แทน keyword `public` หรือ `private`
5. ตั้งชื่อ package ให้สื่อความหมายและหลีกเลี่ยง package กว้าง ๆ อย่าง `util` หรือ `common`
6. `internal` ช่วยจำกัดการ import ไว้เฉพาะ parent tree ทำให้ share implementation ภายในได้โดยไม่เปิด public API
7. Go ไม่อนุญาต circular dependency ให้ merge package หรือแยก shared behavior ไป package ใหม่เมื่อเจอ cycle
8. Exported identifier ควรมี Go Doc comment ที่เริ่มด้วยชื่อของ symbol และตรวจได้ด้วย `go doc` หรือ `pkgsite`
9. ใช้ `go get` เพิ่มหรือเปลี่ยน dependency, ใช้ `go mod tidy` sync กับ source และ commit `go.mod` กับ `go.sum` ไปด้วยกัน
10. SemVer แยก patch, minor และ major ส่วน Minimal Version Selection เลือก version ต่ำสุดที่ requirement ทั้ง graph ยอมรับร่วมกัน
11. Major version ตั้งแต่ 2 ต้องเปลี่ยน import path เป็น `/vN` เพื่อให้ v1 และ v2 อยู่ร่วมกันได้
12. Module proxy กับ checksum database ช่วยเรื่อง cache และความถูกต้อง, `GOPRIVATE` ช่วยป้องกัน private path รั่ว, workspace ช่วยแก้หลาย module ในเครื่อง และ vendoring ช่วย build โดยไม่พึ่ง cache

จำประโยคเดียวพอ:

> แบ่ง package ให้หน้าที่ชัด ซ่อนของที่ยังไม่อยากสัญญาด้วย `internal` และปล่อยให้ `go.mod` เป็นแหล่งความจริงของ dependency

การจัด package ไม่ใช่การย้ายไฟล์เพื่อให้ tree ดูสวย มันคือการกำหนดว่าแต่ละส่วนรู้อะไรได้บ้างและใครมีสิทธิ์พึ่งพาใคร ถ้ากำหนดขอบเขตดี โปรเจกต์จะโตขึ้นโดยไม่ลาก dependency พันกันไปทั้งก้อน

> *ตอนถัดไปเราจะไปดูเครื่องมือรอบตัว Go — ตั้งแต่ `go install`, `go test`, `go vet` ไปจนถึงการตรวจคุณภาพ code และสร้าง binary ให้พร้อมใช้งาน*

---

## Glossary

- **Repository** — ที่เก็บ source code ในระบบ version control เช่น GitHub repository
- **Module** — กลุ่ม Go source code ที่ถูก distribute และ version พร้อมกัน มี `go.mod` ที่ root
- **Package** — directory ของ source code ที่ใช้ package clause เดียวกัน
- **Module path** — identifier ของ module ที่มักอิงจาก repository path
- **Package clause** — บรรทัด `package <name>` ที่กำหนดชื่อ package จริงในไฟล์ Go
- **Exported identifier** — constant, variable, function, method หรือ type ที่ขึ้นต้นด้วยตัวพิมพ์ใหญ่และถูกใช้จาก package อื่นได้
- **`go.mod`** — ไฟล์ที่ประกาศ module path, Go version และ dependency ที่ module ต้องใช้
- **`go.sum`** — ไฟล์ checksum ที่ช่วยตรวจความถูกต้องของ module ที่ดาวน์โหลดมา
- **`internal` package** — package ที่ import ได้เฉพาะจาก parent tree ของ directory `internal`
- **Semantic Versioning (SemVer)** — รูปแบบ version `vMAJOR.MINOR.PATCH` ที่สื่อระดับการเปลี่ยนแปลงของ API
- **Minimal Version Selection** — กฎเลือก version ต่ำสุดที่ requirement ใน dependency graph ยอมรับร่วมกัน
- **Semantic import versioning** — กฎที่ major version ตั้งแต่ 2 ต้องใส่ `/vN` ใน module path
- **Pseudoversion** — version ที่ Go สร้างจาก timestamp และ commit เมื่อ module ยังไม่มี version tag
- **Module proxy** — server ที่ cache Go module เพื่อให้ดาวน์โหลดได้เร็วและทนทานขึ้น
- **Checksum database** — database ของ checksum ที่ช่วยตรวจว่า module version ไม่ถูกแก้ไขเงียบ ๆ
- **Workspace** — การใช้ `go.work` ให้หลาย module resolve ไปยัง source ในเครื่องเดียวกัน
- **Vendoring** — การเก็บสำเนา dependency ไว้ใน directory `vendor/` ของ module
- **Go Doc comment** — comment รูปแบบที่เครื่องมือ Go นำไปสร้าง documentation ให้ package และ exported identifier
- **`init`** — function ที่ Go เรียกอัตโนมัติก่อน `main` ของ package
- **Blank import** — การ import ด้วย `_` เพื่อ side effect โดยไม่เรียก identifier จาก package
- **`GOPRIVATE`** — environment variable ที่บอก Go ว่า module path ใดเป็น private และไม่ควรส่งไป public proxy

---

## Related

- [ตอนที่ 9: Errors](/go/09-errors/) — บทก่อนหน้า; ออกแบบ error ใน package และส่ง failure path กลับไปยัง caller
- [ตอนที่ 8: Generics](/go/08-generics/) — generic type และ function ที่เราสามารถย้ายไปจัดเป็น package เพื่อ reuse ได้
- [ตอนที่ 7: Types, Methods, and Interfaces](/go/07-types-methods-and-interfaces/) — method set, interface และการออกแบบ API ที่ package อื่นนำไปใช้
- [ตอนที่ 6: Pointers](/go/06-pointers/) — `nil`, zero value และ pointer ที่มักพบใน package-level API
- [ตอนที่ 11: Go Tooling](/go/11-go-tooling/) — บทถัดไป เครื่องมือสำหรับ format, test, vet, install และตรวจคุณภาพโค้ด
