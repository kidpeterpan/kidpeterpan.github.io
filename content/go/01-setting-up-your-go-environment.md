+++
title = 'ตอนที่ 1: Setting Up Your Go Environment'
date = '2026-07-30T00:00:00+07:00'
draft = false
description = 'มือใหม่ Go? บทแรกของซีรีส์เรียนรู้ Go — ติดตั้ง toolchain, เขียนโปรแกรมแรก, เรียนรู้ go build / go fmt / go vet และสร้าง Makefile แบบ step by step'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่ 1 ของ Go เราจะตั้งค่า environment ตั้งแต่ศูนย์ — ติดตั้ง Go, เริ่มเขียนโปรแกรมแรก, เรียนรู้เครื่องมือหลักอย่าง `go build` `go fmt` `go vet` และสร้าง `Makefile` เพื่อ automate workflow

สิ่งที่ได้ตอนจบของบทนี้:

- โปรแกรม Hello World ที่ compile เป็น native binary ได้
- เข้าใจ `go build`, `go fmt` และ `go vet` และใช้ให้เป็นนิสัย
- `Makefile` ที่รัน workflow `fmt → vet → build` ใน command เดียว
- workflow มาตรฐานที่นำไปใช้กับ project อื่น ๆ ได้

{{< mermaid >}}
graph TD
  A["Source code .go"] -->|go fmt| B["Formatted code"]
  B -->|go vet| C{"Static checks pass?"}
  C -->|yes| D["go build"]
  C -->|no| A
  D --> E["Native binary"]
  E --> F["Deploy / run"]
{{< /mermaid >}}

---

## Step 1: ติดตั้ง Go

Go toolchain มีตัวติดตั้งสำหรับทุก platform ให้เลือกตามเครื่องที่ใช้งาน

### macOS

**วิธีที่ 1: Homebrew (แนะนำ)**

```
brew install go
```

**วิธีที่ 2: ดาวน์โหลด installer**

ดาวน์โหลดไฟล์ `.pkg` จาก [go.dev/dl](https://go.dev/dl/) ดับเบิลคลิกแล้วทำตาม wizard — installer จะติดตั้ง Go และตั้งค่า `PATH` ให้อัตโนมัติ

### Windows

**วิธีที่ 1: Chocolatey**

```
choco install golang
```

**วิธีที่ 2: Installer**

ดาวน์โหลดไฟล์ `.msi` จาก [go.dev/dl](https://go.dev/dl/) แล้วรัน — installer จะตั้งค่า `PATH` ให้เช่นกัน

### Linux / BSD

ดาวน์โหลด tarball แล้ว extract ไปที่ `/usr/local`:

```
# ดาวน์โหลด tarball (เช็ค version ล่าสุดที่ go.dev/dl)
tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz

# เพิ่ม Go ลงใน PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> $HOME/.bash_profile
source $HOME/.bash_profile
```

> [!CAUTION]
> ถ้า `tar` fail ให้เติม `sudo` เพราะการเขียนใน `/usr/local` ต้องใช้สิทธิ์ root

---

### ตรวจสอบการติดตั้ง

เปิด terminal ใหม่ แล้วพิมพ์:

```
go version
```

ถ้าติดตั้งสำเร็จจะเห็น output ประมาณนี้:

```
go version go1.22.0 darwin/arm64
```

ส่วนประกอบของ output มีดังนี้:
- **`go1.22.0`** — เวอร์ชันของ Go
- **`darwin`** — kernel ของ macOS (Linux จะเป็น `linux`, Windows เป็น `windows`)
- **`arm64`** — สถาปัตยกรรม CPU (Apple Silicon = `arm64`, Intel/AMD = `amd64`)

### ถ้า `go version` ไม่ทำงาน?

ปัญหามักจะมาจาก:

1. **`go` ไม่อยู่ใน `PATH`** — ตรวจสอบด้วย `which go` (macOS/Linux) ถ้าไม่มี output ให้กลับไปแก้ `PATH`
2. **มีโปรแกรมชื่อ `go` อื่นบดบัง** — `which go` จะบอกว่า binary ที่ถูกเรียกอยู่ที่ไหน
3. **ติดตั้งผิด architecture** — ลง 64-bit tools บนระบบ 32-bit หรือเลือก chip architecture ไม่ตรงกับเครื่อง (ตรวจสอบด้วย `uname -m` บน Linux)

---

## Step 2: สร้าง Go Module

ให้เรามองว่า ทุก Go project คือ "module" ซึ่งระบุด้วยไฟล์ `go.mod` ที่ root ของ project สร้างด้วยคำสั่ง `go mod init`:

```
mkdir hello_world
cd hello_world
go mod init hello_world
```

Output:

```
go: creating new go.mod: module hello_world
```

ไฟล์ `go.mod` ที่สร้างขึ้นจะมีหน้าตาประมาณนี้:

```go
module hello_world

go 1.22
```

ไฟล์นี้ทำหน้าที่คล้าย `package.json` ของ Node.js, `requirements.txt` ของ Python หรือ `Gemfile` ของ Ruby โดยระบุชื่อ module, Go version ขั้นต่ำ และ dependencies

> [!WARNING]
> **อย่าแก้ `go.mod` ด้วยมือ** — ให้ใช้ `go get` และ `go mod tidy` แทน รายละเอียดจะอยู่ในตอนต่อไปของซีรีส์

---

## Step 3: เขียนโปรแกรมแรก — Hello World

สร้างไฟล์ `hello.go` ในโฟลเดอร์ `hello_world`:

```go
package main

import "fmt"

func main() {
fmt.Println("Hello, world!")
}
```

สังเกตว่า `fmt.Println` ไม่ได้ indent — **ตั้งใจเขียนแบบนี้** เพื่อสาธิต `go fmt` ในขั้นถัดไป

### โครงสร้างของไฟล์ Go

| ส่วน | คำอธิบาย |
|---|---|
| `package main` | **Package declaration** — บอกว่าไฟล์นี้อยู่ใน package ชื่อ `main` ซึ่งเป็น package พิเศษที่มี entry point ของโปรแกรม |
| `import "fmt"` | **Import declaration** — นำเข้า package `fmt` สำหรับ format และ print output Go import ได้เฉพาะ whole package — ไม่สามารถ import แค่ type หรือ function เดียวเหมือน Python |
| `func main()` | **Entry point** — ทุกโปรแกรม Go เริ่มที่ `func main()` ใน `package main` |
| `fmt.Println(...)` | เรียกใช้ function `Println` จาก package `fmt` เพื่อแสดงข้อความออกทางหน้าจอ |

---

## Step 4: Compile ด้วย `go build`

Compile โค้ดให้เป็น native binary ด้วยคำสั่ง:

```
go build
```

ถ้าไม่มี error จะได้ binary ที่ใช้ชื่อตาม module declaration — ในที่นี้คือ `hello_world` ลองรันดู:

```
./hello_world
```

Output:

```
Hello, world!
```

### ใช้ flag `-o` เพื่อระบุชื่อ binary เอง

```
go build -o hello
./hello
```

### `go run` — รันโดยไม่สร้าง binary file

ถ้าต้องการรันโดยไม่ทิ้ง binary ไว้ในโฟลเดอร์ ให้ใช้ `go run`:

```
go run .
```

เหมาะกับ script เล็ก ๆ หรือเวลาที่ต้องการทดสอบโค้ดอย่างรวดเร็ว

> [!NOTE]
> **Single native binary** — Go programs compile เป็น binary เดียวที่รันแบบ stand-alone ได้ ไม่ต้องติดตั้ง VM หรือ runtime แยก (ต่างจาก Java, Python และ Node.js) ทำให้ deploy ได้ง่ายมาก สำหรับ container สามารถใช้ `scratch` หรือ `distroless` image ได้เลย

---

## Step 5: Format โค้ดด้วย `go fmt`

หนึ่งในการตัดสินใจที่สำคัญที่สุดของ Go คือ **บังคับ code format ให้เป็นมาตรฐานเดียวกัน** — ไม่มีหลายรูปแบบให้ต้องถกเถียงกัน

Go ใช้ tab indent และวาง `{` ไว้บรรทัดเดียวกับ declaration — ทุกคนจึงเขียนโค้ดในรูปแบบเดียวกัน

รัน `go fmt` เพื่อ format ไฟล์ทั้งหมดใน project:

```
go fmt ./...
```

Output:

```
hello.go
```

เปิด `hello.go` ดู จะเห็นว่า `fmt.Println` ถูก indent ด้วย tab ให้อัตโนมัติแล้ว:

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}
```

`./...` คือการบอกให้ Go ทำงานกับทุก package ใน current directory และ subdirectory ทั้งหมด — pattern นี้ใช้บ่อยใน Go tooling

### ทำไม `{` ต้องอยู่บรรทัดเดียวกับ `func`?

Go มีกฎที่เรียกว่า **Semicolon Insertion Rule** — compiler จะเติม `;` ท้ายทุก statement ให้อัตโนมัติ หาก token สุดท้ายก่อน newline เป็น:

- identifier (เช่น `int`, `float64`)
- literal (number, string)
- keyword/token: `break`, `continue`, `fallthrough`, `return`, `++`, `--`, `)`, `}`

ดังนั้นถ้าเขียนแบบนี้:

```go
// ❌ ผิด — compile ไม่ผ่าน
func main()
{
	fmt.Println("Hello, world!")
}
```

Compiler เห็น `)` ท้ายบรรทัด `func main()` แล้วแทรก `;` กลายเป็น:

```go
func main();
{
	fmt.Println("Hello, world!");
};
```

ซึ่งไม่ใช่ valid Go — กฎที่เรียบง่ายนี้ทำให้ compiler ทำงานเร็วและช่วยบังคับ coding style ไปในตัว

> [!WARNING]
> **อย่าลืม `go fmt` ก่อน commit** — หากลืมแล้วต้องมา format ภายหลัง ให้แยก commit ที่รัน `go fmt ./...` อย่างเดียวออกจาก logic changes เพื่อให้ diff อ่านง่าย

---

## Step 6: ตรวจสอบโค้ดด้วย `go vet`

`go vet` ช่วยหา bug ในโค้ดที่ **syntax ถูก แต่ semantic น่าจะผิด** — ตัวอย่างที่ชัดเจนคือ `fmt.Printf` ที่ template มี placeholder แต่ส่ง argument มาไม่ครบ:

แก้ `hello.go` เป็น:

```go
package main

import "fmt"

func main() {
	fmt.Printf("Hello, %s!\n")
}
```

โค้ดนี้ compile ผ่านและรันได้ แต่ output จะผิดปกติ — ลองรัน `go vet`:

```
go vet ./...
```

Output:

```
# hello_world
./hello.go:6:2: fmt.Printf format %s reads arg #1, but call has 0 args
```

`go vet` จับ bug ให้เราได้ จากนั้นแก้ด้วยการส่ง argument ให้ครบ:

```go
fmt.Printf("Hello, %s!\n", "world")
```

รัน `go vet` อีกครั้ง — ถ้าไม่มี output แสดงว่าผ่าน

> [!TIP]
> รัน `go vet` ทุกครั้งเช่นเดียวกับ `go fmt` — มันเป็น first line of defense สำหรับหา bug แบบง่าย ๆ ส่วน bug ที่ซับซ้อนกว่านั้นให้ใช้ third-party scanners เสริม เช่น `staticcheck` และ `golangci-lint`

---

## Step 7: Automate ทุกอย่างด้วย Makefile

IDE สะดวก แต่ automate workflow ไม่ได้ — modern software development ต้องมี repeatable build ที่ใครก็รันได้ ไม่ว่าจะอยู่ที่ไหนหรือรันเมื่อใด เพื่อหลีกเลี่ยงปัญหาคลาสสิก "It works on my machine!"

สร้างไฟล์ `Makefile` ในโฟลเดอร์ `hello_world`:

```
.DEFAULT_GOAL := build

.PHONY: fmt vet build

fmt:
	go fmt ./...

vet: fmt
	go vet ./...

build: vet
	go build
```

> [!CAUTION]
> **สำคัญมาก** — บรรทัด recipe (คำสั่งใต้ target) ต้อง indent ด้วย **tab** เท่านั้น หากใช้ space จะ fail โดยไม่บอกสาเหตุชัดเจน

### โครงสร้าง Makefile

| Element | ความหมาย |
|---|---|
| `fmt`, `vet`, `build` | **Target** — operation ที่สั่งได้ |
| `.DEFAULT_GOAL` | target ที่รันเมื่อพิมพ์ `make` เฉย ๆ (ไม่ระบุ argument) |
| `vet: fmt` | **Dependencies** — รัน `fmt` ก่อน แล้วจึงรัน `vet` |
| `.PHONY` | บอกว่า target เหล่านี้ไม่ใช่ไฟล์จริง เพื่อไม่ให้ `make` สับสน |

รัน `make` ครั้งเดียว — จะทำตามลำดับ `fmt` → `vet` → `build`:

```
make
```

Output:

```
go fmt ./...
go vet ./...
go build
```

จบใน command เดียว — ใช้รันทั้ง local และใน CI ได้เหมือนกัน

> [!NOTE]
> บน Windows `make` ไม่ได้ติดตั้งมาในตัว ต้องติดตั้งผ่าน Chocolatey ด้วยคำสั่ง `choco install make`

---

## เลือก IDE

เขียน Go ด้วย text editor และคำสั่ง `go` ก็ได้ แต่ project ใหญ่ควรใช้ IDE ที่มี autoformat-on-save, code completion และ error reporting แบบ real-time

### Visual Studio Code (ฟรี)

VS Code เป็น editor ยอดนิยม — แต่ Go support ไม่ได้ติดตั้งมาในตัว ต้องลง **Go extension** จาก Marketplace เอง

extension นี้จะติดตั้ง third-party tools ให้อัตโนมัติ:
- **`gopls`** — Go language server ทางการจาก Go team (ให้ code completion, type checking และ find references ขณะพิมพ์)
- **Delve** — Go debugger

> [!NOTE]
> **Language Server Protocol (LSP)** คือ API spec มาตรฐานที่ทำให้ editor implement code intelligence ได้ โดยไม่ต้องเขียน logic ของแต่ละภาษาไว้ในตัว editor

### GoLand (เสียเงิน)

Go-specific IDE จาก JetBrains — UI คล้าย IntelliJ/PyCharm มี refactoring, code completion, debugger และ database tools ในตัว ไม่ต้องลง plug-in เพิ่ม

มี 30-day free trial และ Free License Program สำหรับ student หรือ core open source contributor

### Go Playground (ออนไลน์)

[go.dev/play](https://go.dev/play) คือ web-based sandbox — ใช้ลอง snippet เล็ก ๆ โดยไม่ต้องติดตั้ง Go ในเครื่อง ปุ่ม **Run** ใช้รันโค้ด, **Format** ใช้รัน `go fmt` และ **Share** สร้าง unique URL สำหรับแชร์


> [!WARNING]
> **ข้อจำกัดของ Playground**
> - ใช้ network ได้แค่ `localhost`
> - process ที่รันนานหรือใช้ memory เยอะอาจถูก kill
> - clock ถูกกำหนดตายตัวไว้ที่ 10 November 2009 (วันเปิดตัว Go)
> - **ห้ามใส่ข้อมูล sensitive** เด็ดขาด — เมื่อกด Share ข้อมูลจะถูกเก็บไว้บน Google servers และใครก็ตามที่มี URL ก็เข้าถึงได้

---

## Go Compatibility Promise

Go ออก release ใหม่ประมาณทุก 6 เดือน พร้อม patch releases สำหรับ bug/security fix ตามความจำเป็น

Go Compatibility Promise สัญญาว่าจะ **ไม่ทำ backward-breaking change** กับภาษาและ standard library ใน Go 1.x ยกเว้นเมื่อจำเป็นต้องแก้ bug หรือ security issue

> "I believe that prioritizing compatibility was the most important design decision that we made in Go 1."
> — Russ Cox, GopherCon 2022


> [!WARNING]
> Promise ครอบคลุมเฉพาะ **ภาษาและ standard library** — ไม่ครอบคลุม `go` command หาก script CI ใช้ flag ของ `go` command ให้ pin Go version และ test ใหม่เมื่อมีการอัปเดต

### อัปเดต Go

| Platform | วิธี |
|---|---|
| macOS (brew) | `brew upgrade go` |
| Windows (choco) | `choco upgrade golang` |
| Installer | ดาวน์โหลด installer ล่าสุดจาก [go.dev/dl](https://go.dev/dl/) แล้วรัน — installer จะลบเวอร์ชันเก่าให้เอง |
| Linux/BSD | ดาวน์โหลด tarball ใหม่ ย้ายของเก่าไว้สำรอง แล้วค่อยลบ |

ตัวอย่างการ upgrade บน Linux:

```
mv /usr/local/go /usr/local/old-go
tar -C /usr/local -xzf go1.22.1.linux-amd64.tar.gz
rm -rf /usr/local/old-go
```

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้โดยสร้าง project ใหม่แยกจาก `hello_world` เพื่อไม่ให้กระทบตัวอย่างในบท:

1. สร้าง module ชื่อ `greetings` พร้อมไฟล์ `main.go` ที่ print `Hello from Go!` แล้วรันด้วย `go run .`
2. เขียน `fmt.Printf("Hello, %s!\n")` ที่ลืมส่ง argument แล้วรัน `go vet ./...` — สังเกต error ที่เจอ จากนั้นแก้ให้ผ่าน
3. Compile ด้วย `go build -o hello` แล้วรัน binary จากไดเรกทอรีอื่นด้วย path เต็ม เช่น `./hello`
4. เพิ่ม target `run` และ `clean` ใน Makefile ของ `hello_world` โดย `run` รัน `go run .` และ `clean` ลบ binary ทิ้ง — อย่าลืมเพิ่มทั้งสองใน `.PHONY`
5. ทดลองเขียน `{` คนละบรรทัดกับ `func` แล้วรัน `go build` — อ่าน error ที่ได้ แล้วแก้กลับตาม semicolon insertion rule

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go build
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **วาง `{` คนละบรรทัดกับ `func`/`if`/`for`** — semicolon insertion rule จะทำให้ compile fail แม้ logic จะถูกต้อง
- **ลืม `go fmt` ก่อน commit** — diff ภายหลังจะเต็มไปด้วย whitespace change จนบดบัง logic change จริง
- **แก้ `go.mod` ด้วยมือ** — ทำให้ state ของ module ไม่ตรงกับ tool ให้ใช้ `go get` / `go mod tidy` แทน
- **เชื่อคำแนะนำเก่าเรื่อง `GOROOT` / `GOPATH`** — module system สมัยใหม่ไม่จำเป็นต้องใช้แล้ว วาง project ไว้ที่ไหนก็ได้
- **Indent `Makefile` ด้วย space** — Makefile รับเฉพาะ tab หากใช้ space จะ fail โดยไม่บอกสาเหตุชัดเจน

---

## สรุป

ในบทนี้เราได้:

1. ✅ ติดตั้ง Go toolchain และตรวจสอบว่าใช้งานได้
2. ✅ สร้าง Go module ด้วย `go mod init`
3. ✅ เขียนโปรแกรมแรก — Hello World
4. ✅ Compile เป็น native binary ด้วย `go build`
5. ✅ Format โค้ดด้วย `go fmt` และเข้าใจ semicolon insertion rule
6. ✅ ตรวจสอบ bug ด้วย `go vet`
7. ✅ สร้าง `Makefile` เพื่อ automate workflow `fmt → vet → build`

Workflow `fmt → vet → build` นี้คือ heartbeat ของ Go development — ใช้ได้กับทุก project ไม่ว่าจะใหญ่หรือเล็ก

> *ใน [ตอนต่อไป](/go/02-predeclared-types-and-declarations/) เราจะเจาะลึก primitive types และการประกาศตัวแปรของ Go — ตัวแปร, constants และ type พื้นฐานต่าง ๆ*

---

## Glossary

- **Toolchain** — ชุดเครื่องมือทั้งหมดที่ใช้พัฒนาด้วย Go เช่น compiler, `go` command และ standard library
- **Module** — หน่วยการจัดการ dependency ของ Go ระบุด้วยไฟล์ `go.mod`
- **Package** — กลุ่มไฟล์ Go ที่อยู่ร่วมกัน ประกาศด้วยคำสั่ง `package`
- **Entry point** — จุดเริ่มต้นของโปรแกรม; ใน Go คือ `func main()` ใน `package main`
- **Native binary** — ไฟล์ executable ที่ compile เป็นภาษาเครื่องแล้ว รันได้โดยไม่ต้องมี runtime แยก
- **Semicolon Insertion Rule** — กฎที่ compiler เติม `;` ท้าย statement ให้อัตโนมัติ
- **LSP (Language Server Protocol)** — มาตรฐานที่ให้ editor ทำงานร่วมกับภาษาใดก็ได้ผ่าน language server
- **Dependency** — package ภายนอกที่โปรแกรมใช้งาน
- **CI (Continuous Integration)** — ระบบรัน build และตรวจสอบโค้ดอัตโนมัติทุกครั้งที่ push
- **Go Compatibility Promise** — สัญญาว่า Go 1.x จะไม่ทำ breaking change กับภาษาและ standard library

---

## Related

- [ตอนที่ 2: Predeclared Types and Declarations](/go/02-predeclared-types-and-declarations/) — ชนิดข้อมูลพื้นฐานและการประกาศตัวแปรของ Go ก้าวต่อไปของซีรีส์
