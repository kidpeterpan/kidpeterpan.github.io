+++
title = 'ตอนที่ 1: Setting Up Your Go Environment'
date = '2026-07-30T00:00:00+07:00'
draft = false
description = 'มือใหม่ Go? บทแรกของซีรีส์เรียนรู้ Go — ติดตั้ง toolchain, เขียนโปรแกรมแรก, เรียนรู้ go build / go fmt / go vet และสร้าง Makefile แบบ step by step'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่ 1 ของ Go เราจะมาเซ็ตอัป environment ตั้งแต่ศูนย์ — ติดตั้ง Go, เขียนโปรแกรมแรก, เรียนรู้เครื่องมือหลัก (`go build`, `go fmt`, `go vet`) และสร้าง `Makefile` เพื่อ automate workflow

สิ่งที่ได้ตอนจบบทนี้: โปรแกรม Hello World ที่ compile เป็น native binary ได้ พร้อม workflow มาตรฐานที่ใช้รันได้ทุกเครื่อง

{{< mermaid >}}
graph LR
  A["Source code .go"] -->|go fmt| B["Formatted code"]
  B -->|go vet| C{"Static checks pass?"}
  C -->|yes| D["go build"]
  C -->|no| A
  D --> E["Native binary"]
  E --> F["Deploy / run"]
{{< /mermaid >}}

---

## Step 1: ติดตั้ง Go

Go toolchain มีตัวติดตั้งสำหรับทุก platform — เลือกตามเครื่องของคุณ

### macOS

**วิธีที่ 1: Homebrew (แนะนำ)**

```
brew install go
```

**วิธีที่ 2: ดาวน์โหลด installer**

ดาวน์โหลดไฟล์ `.pkg` จาก [golang.org/dl](https://go.dev/dl/) ดับเบิ้ลคลิกแล้วทำตาม wizard — installer จะลง Go ให้และเซ็ต `PATH` ให้อัตโนมัติ

### Windows

**วิธีที่ 1: Chocolatey**

```
choco install golang
```

**วิธีที่ 2: Installer**

ดาวน์โหลด `.msi` จาก [golang.org/dl](https://go.dev/dl/) แล้วรัน — installer เซ็ต `PATH` ให้เองเหมือนกัน

### Linux / BSD

ดาวน์โหลด tarball แล้ว extract ไปที่ `/usr/local`:

```
# ดาวน์โหลด tarball (เช็ค version ล่าสุดที่ go.dev/dl)
tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz

# เพิ่ม Go ลงใน PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> $HOME/.bash_profile
source $HOME/.bash_profile
```

> ถ้า `tar` fail ให้ใส่ `sudo` เพราะการเขียนใน `/usr/local` ต้องการสิทธิ์ root

---

### ตรวจสอบการติดตั้ง

เปิด terminal ใหม่แล้วพิมพ์:

```
go version
```

ถ้าติดตั้งสำเร็จจะเห็นอะไรประมาณนี้:

```
go version go1.22.0 darwin/arm64
```

ส่วนประกอบของ output:
- **`go1.22.0`** — เวอร์ชันของ Go
- **`darwin`** — kernel ของ macOS (Linux จะเป็น `linux`, Windows เป็น `windows`)
- **`arm64`** — สถาปัตยกรรม CPU (Apple Silicon = `arm64`, Intel/AMD = `amd64`)

### ถ้า `go version` ไม่ทำงาน?

ปัญหามักจะมาจาก:

1. **`go` ไม่อยู่ใน `PATH`** — ตรวจสอบด้วย `which go` (macOS/Linux) ถ้าไม่มี output แปลว่าต้องกลับไปแก้ `PATH`
2. **มีโปรแกรมชื่อ `go` อื่นบดบัง** — `which go` จะบอกว่า binary ที่ถูกเรียกอยู่ที่ไหน
3. **ลงผิด architecture** — ลง 64-bit tools บนระบบ 32-bit หรือผิด chip architecture (เช็คด้วย `uname -m` บน Linux)

---

## Step 2: สร้าง Go Module

ทุก Go project คือ "module" — ระบุด้วยไฟล์ `go.mod` ที่ root ของ project สร้างด้วยคำสั่ง `go mod init`:

```
mkdir hello_world
cd hello_world
go mod init hello_world
```

Output:

```
go: creating new go.mod: module hello_world
```

ไฟล์ `go.mod` ที่สร้างขึ้นจะมีหน้าตาแบบนี้:

```go
module hello_world

go 1.22
```

ไฟล์นี้ทำหน้าที่คล้าย `package.json` ของ Node.js, `requirements.txt` ของ Python หรือ `Gemfile` ของ Ruby — ระบุชื่อ module, เวอร์ชัน Go ขั้นต่ำ และ dependencies

> **อย่าแก้ `go.mod` ด้วยมือ** — ใช้ `go get` และ `go mod tidy` แทน รายละเอียดจะอยู่ในตอนต่อไปของซีรีส์

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

สังเกตว่า `fmt.Println` ไม่ได้ indent — **ตั้งใจเขียนแบบนี้** เพื่อเดโม `go fmt` ในขั้นถัดไป

### โครงสร้างของไฟล์ Go

| ส่วน | คำอธิบาย |
|---|---|
| `package main` | **Package declaration** — บอกว่าไฟล์นี้อยู่ใน package ชื่อ `main` ซึ่งเป็น package พิเศษที่มี entry point ของโปรแกรม |
| `import "fmt"` | **Import declaration** — นำเข้า package `fmt` สำหรับ format และ print output. Go import เป็น whole package เท่านั้น — ไม่ได้ import แค่ type/function เดียวเหมือน Python |
| `func main()` | **Entry point** — ทุกโปรแกรม Go เริ่มที่ `func main()` ใน `package main` |
| `fmt.Println(...)` | เรียกใช้ function `Println` จาก package `fmt` เพื่อ print ข้อความออกทางหน้าจอ |

---

## Step 4: Compile ด้วย `go build`

Compile โค้ดเป็น native binary ด้วยคำสั่ง:

```
go build
```

ถ้าไม่มี error จะได้ binary ชื่อตาม module declaration ออกมา — ในที่นี้คือ `hello_world` ลองรันดู:

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

ถ้าอยากรันแบบไม่สร้าง binary ไฟล์ค้างไว้ ใช้ `go run`:

```
go run .
```

เหมาะกับ script เล็ก ๆ หรือตอนที่ต้องการเทสโค้ดเร็ว ๆ

> **Single native binary** — Go programs compile เป็น binary เดียวที่รันได้ stand-alone ไม่ต้องลง VM หรือ runtime แยก (ต่างจาก Java, Python, Node.js) ทำให้ deploy ง่ายมาก — สำหรับ container ใช้ `scratch` หรือ `distroless` image ได้เลย

---

## Step 5: Format โค้ดด้วย `go fmt`

หนึ่งในการตัดสินใจที่สำคัญที่สุดของ Go คือ **บังคับ code format มาตรฐานเดียว** — ไม่มีทางเลือก ไม่ต้องเถียงกัน

Go ใช้ tab indent และวาง `{` บนบรรทัดเดียวกับ declaration — ทุกคนในโลกเขียนเหมือนกัน

รัน `go fmt` เพื่อ format ไฟล์ทั้งหมดใน project:

```
go fmt ./...
```

Output:

```
hello.go
```

เปิด `hello.go` ดูจะเห็นว่า `fmt.Println` ถูก indent ด้วย tab ให้อัตโนมัติแล้ว:

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}
```

`./...` บอกให้ Go ทำงานกับไฟล์ทุกไฟล์ใน current directory และ subdirectory ทั้งหมด — pattern นี้ใช้บ่อยใน Go tooling

### ทำไมวาง `{` ต้องอยู่บรรทัดเดียวกับ `func`?

Go มีกฎที่เรียกว่า **Semicolon Insertion Rule** — compiler จะเติม `;` ท้ายทุก statement ให้อัตโนมัติ ถ้า token สุดท้ายก่อน newline เป็น:

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

ซึ่งไม่ใช่ valid Go — กฎเรียบง่ายแบบนี้ทำให้ compiler เร็วและบังคับ coding style ไปในตัว

> **อย่าลืม `go fmt` ก่อน commit** — ถ้าลืมแล้วจะ format ภายหลัง ให้ commit แยกตอนรัน `go fmt ./...` อย่างเดียว ไม่ปนกับ logic changes เพื่อให้ diff อ่านง่าย

---

## Step 6: ตรวจสอบโค้ดด้วย `go vet`

`go vet` หา bug ในโค้ดที่ **syntax ถูก แต่ semantic น่าจะผิด** — ตัวอย่างที่ชัดที่สุดคือ `fmt.Printf` ที่ template มี placeholder แต่ไม่ส่ง argument ครบ:

แก้ `hello.go` เป็น:

```go
package main

import "fmt"

func main() {
	fmt.Printf("Hello, %s!\n")
}
```

โค้ดนี้ compile ผ่านและรันได้ แต่ output จะแปลก ๆ — ลองรัน `go vet`:

```
go vet ./...
```

Output:

```
# hello_world
./hello.go:6:2: fmt.Printf format %s reads arg #1, but call has 0 args
```

`go vet` จับ bug ให้เราได้ — จากนั้นเราแค่ แก้ด้วยการส่ง argument ให้ครบ:

```go
fmt.Printf("Hello, %s!\n", "world")
```

รัน `go vet` อีกครั้ง — ถ้าไม่มี output แปลว่าผ่าน

> รัน `go vet` ทุกครั้งเหมือน `go fmt` — มันคือ first line of defense สำหรับการหา bug แบบง่าย ๆ ส่วน bug ที่ซับซ้อนกว่านั้น ใช้ third-party scanners เสริมได้ เช่น `staticcheck`, `golangci-lint`

---

## Step 7: Automate ทุกอย่างด้วย Makefile

IDE สะดวกดี แต่ automate ไม่ได้ — modern software development ต้องมี repeatable build ที่ใครก็รันได้ ที่ไหน เมื่อไหร่ก็ตาม เพื่อหลีกเลี่ยงปัญหาคลาสสิก "It works on my machine!"

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

> ⚠️ **สำคัญมาก** — บรรทัด recipe (คำสั่งใต้ target) ต้อง indent ด้วย **tab** เท่านั้น ถ้าใช้ space จะ fail แบบงง ๆ

### โครงสร้าง Makefile

| Element | ความหมาย |
|---|---|
| `fmt`, `vet`, `build` | **Target** — operation ที่สั่งได้ |
| `.DEFAULT_GOAL` | target ที่รันเมื่อพิมพ์ `make` เฉย ๆ (ไม่ระบุ argument) |
| `vet: fmt` | **Dependencies** — รัน `fmt` ก่อนค่อยรัน `vet` |
| `.PHONY` | บอกว่า target เหล่านี้ไม่ใช่ไฟล์จริง กัน `make` สับสน |

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

จบใน command เดียว — ใช้รัน local และใน CI ได้เหมือนกัน

> บน Windows ต้องลง `make` ก่อน เพราะไม่ได้ติดตั้งมาเอง — ใช้ Chocolatey: `choco install make`

---

## เลือก IDE

เขียน Go ด้วย text editor + คำสั่ง `go` ก็ได้ แต่ project ใหญ่ควรใช้ IDE ที่มี autoformat-on-save, code completion และ error reporting แบบ real-time

### Visual Studio Code (ฟรี)

VS Code เป็น editor ยอดนิยม — แต่ Go support ไม่ได้ติดตั้งมาด้วย ต้องลง **Go extension** จาก Marketplace เอง

extension นี้จะ install third-party tools ให้อัตโนมัติ:
- **`gopls`** — Go language server ทางการจาก Go team (ให้ code completion, type checking, find references ขณะพิมพ์)
- **Delve** — Go debugger

> **Language Server Protocol (LSP)** คือ API spec มาตรฐานที่ทำให้ editor implement code intelligence ได้โดยไม่ต้องเขียน logic ของแต่ละภาษาในตัว editor

### GoLand (เสียเงิน)

Go-specific IDE จาก JetBrains — UI เหมือน IntelliJ/PyCharm มี refactoring, code completion, debugger, database tools ในตัว ไม่ต้องลง plug-in เพิ่ม

มี 30-day free trial และ Free License Program สำหรับ student / core open source contributor

### Go Playground (ออนไลน์)

[go.dev/play](https://go.dev/play) คือ web-based sandbox — ใช้ลอง snippet เล็ก ๆ โดยไม่ต้องลงเครื่อง ปุ่ม **Run** รันโค้ด, **Format** รัน `go fmt`, **Share** สร้าง unique URL สำหรับแชร์


> ⚠️ **ข้อจำกัดของ Playground**
> - ใช้ network ได้แค่ `localhost`
> - process ที่รันนานหรือใช้ memory เยอะถูก kill
> - clock fix ไว้ที่ 10 November 2009 (วัน Go เปิดตัว)
> - **ห้ามใส่ข้อมูล sensitive** เด็ดขาด — ถ้ากด Share ข้อมูลถูกเก็บไว้บน Google servers และเข้าถึงได้โดยใครก็ตามที่มี URL

---

## Go Compatibility Promise

Go ออก release ใหม่ทุก ~6 เดือน พร้อม patch releases สำหรับ bug/security fix

Go Compatibility Promise สัญญาว่าจะ **ไม่ทำ backward-breaking change** กับภาษาและ standard library ใน Go 1.x ยกเว้นเพื่อแก้ bug หรือ security issue

> "I believe that prioritizing compatibility was the most important design decision that we made in Go 1."
> — Russ Cox, GopherCon 2022


> ⚠️ Promise ครอบคลุมเฉพาะ **ภาษาและ standard library** — ไม่ครอบคลุม `go` command ถ้า script CI ใช้ flag ของ `go` command ให้ pin Go version และ test ใหม่ เมื่อมีอัปเดต

### อัปเดต Go

| Platform | วิธี |
|---|---|
| macOS (brew) | `brew upgrade go` |
| Windows (choco) | `choco upgrade golang` |
| Installer | ดาวน์โหลด installer ล่าสุดจาก go.dev/dl — installer ลบเวอร์ชันเก่าให้เอง |
| Linux/BSD | ดาวน์โหลด tarball ใหม่ ย้ายของเก่าไว้สำรอง แล้วค่อยลบ |

ตัวอย่าง upgrade บน Linux:

```
mv /usr/local/go /usr/local/old-go
tar -C /usr/local -xzf go1.22.1.linux-amd64.tar.gz
rm -rf /usr/local/old-go
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **วาง `{` คนละบรรทัดกับ `func`/`if`/`for`** — โดน semicolon insertion rule ทำให้ compile fail แม้ logic จะถูก
- **ลืม `go fmt` ก่อน commit** — diff ภายหลังเต็มไปด้วย whitespace change บดบัง logic change จริง
- **แก้ `go.mod` ด้วยมือ** — ทำให้ state ของ module ไม่ตรงกับ tool ใช้ `go get` / `go mod tidy` แทน
- **เชื่อคำแนะนำเก่าเรื่อง `GOROOT` / `GOPATH`** — module system สมัยใหม่ไม่ต้องการแล้ว วาง project ที่ไหนก็ได้
- **Indent `Makefile` ด้วย space** — Makefile รับเฉพาะ tab จะ fail โดยไม่บอกชัด

---

## สรุป

ในบทนี้เราได้:

1. ✅ ติดตั้ง Go toolchain และตรวจสอบว่าใช้งานได้
2. ✅ สร้าง Go module ด้วย `go mod init`
3. ✅ เขียนโปรแกรมแรก - Hello World
4. ✅ Compile เป็น native binary ด้วย `go build`
5. ✅ Format โค้ดด้วย `go fmt` และเข้าใจ semicolon insertion rule
6. ✅ ตรวจสอบ bug ด้วย `go vet`
7. ✅ สร้าง `Makefile` เพื่อ automate workflow `fmt → vet → build`

Workflow `fmt → vet → build` นี้คือ heartbeat ของ Go development — ใช้ในทุก project ไม่ว่าจะใหญ่หรือเล็กแค่ไหน

> *ในตอนต่อไปเราจะเจาะลึก primitive types และ composite types ของ Go — ตัวแปร, constants, arrays, slices, maps และ structs*
