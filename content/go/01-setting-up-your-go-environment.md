+++
title = 'ตอนที่ 1: Setting Up Your Go Environment'
date = '2026-07-30T00:00:00+07:00'
draft = false
description = 'มือใหม่ Go? มาเริ่มจากศูนย์: ติดตั้ง toolchain, เขียนโปรแกรมแรก, ใช้ go build/go fmt/go vet และสร้าง Makefile แบบ step by step'
tags = ['programming', 'go', 'tutorial', 'verified']
+++

ตอนแรกของซีรีส์ Go เราจะเริ่มตั้งค่า environment ตั้งแต่ศูนย์ ตั้งแต่ติดตั้ง Go ไปจนถึงเขียนโปรแกรมแรกและใช้เครื่องมือพื้นฐานที่ควรรู้จัก เช่น `go build`, `go fmt`, `go vet` และ `Makefile`

เมื่อจบบทนี้ คุณจะสามารถ:

- ติดตั้ง Go และตรวจสอบว่าใช้งานได้
- สร้าง Go module และเขียนโปรแกรมแรก
- Compile โปรแกรมให้เป็น native binary
- ใช้ `go fmt` และ `go vet` เพื่อตรวจสอบโค้ด
- สร้าง `Makefile` เพื่อรวม workflow ทั้งหมดไว้ในคำสั่งเดียว
- นำ workflow แบบนี้ไปใช้กับ Go project อื่นได้

Workflow หลักของเราจะเป็นแบบนี้:

{{< mermaid >}}
flowchart TD
  A["Source code (.go)"] --> B["go fmt"]
  B --> C["go vet"]
  C -->|ผ่าน| D["go build"]
  C -->|ไม่ผ่าน| A
  D --> E["Native binary"]
  E --> F["Run / Deploy"]
{{< /mermaid >}}

---

## Step 1: ติดตั้ง Go

Go มีตัวติดตั้งสำหรับหลาย platform ให้เลือกใช้ตามระบบปฏิบัติการของคุณ

### macOS

#### วิธีที่ 1: Homebrew

ถ้าใช้ Homebrew วิธีนี้ง่ายที่สุด:

```sh
brew install go
```

#### วิธีที่ 2: ดาวน์โหลด Installer

ดาวน์โหลดไฟล์ `.pkg` จาก [go.dev/dl](https://go.dev/dl/) แล้วเปิดไฟล์ จากนั้นทำตามขั้นตอนใน installer

โดยปกติ installer จะจัดการ `PATH` ให้ด้วย

### Windows

#### วิธีที่ 1: Chocolatey

```sh
choco install golang
```

#### วิธีที่ 2: Installer

ดาวน์โหลดไฟล์ `.msi` จาก [go.dev/dl](https://go.dev/dl/) แล้วติดตั้งตามขั้นตอน

Installer จะตั้งค่า `PATH` ให้โดยอัตโนมัติ

### Linux / BSD

ดาวน์โหลด Go tarball จาก [go.dev/dl](https://go.dev/dl/) แล้วแตกไฟล์ไปที่ `/usr/local`

ตัวอย่าง:

```sh
# ดาวน์โหลด tarball จาก go.dev/dl ก่อน
tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz

# เพิ่ม Go ลงใน PATH
echo 'export PATH=$PATH:/usr/local/go/bin' >> $HOME/.bash_profile
source $HOME/.bash_profile
```

> [!CAUTION]
> ถ้า `tar` ขึ้น permission error ให้ใช้ `sudo` เพราะ `/usr/local` ต้องใช้สิทธิ์ root ในหลายระบบ

---

### ตรวจสอบการติดตั้ง

เปิด terminal ใหม่แล้วรัน:

```sh
go version
```

ถ้าติดตั้งสำเร็จ จะเห็น output ประมาณนี้:

```text
go version go1.22.0 darwin/arm64
```

ค่าต่าง ๆ หมายถึง:

- `go1.22.0` — เวอร์ชันของ Go
- `darwin` — ระบบปฏิบัติการของเครื่อง ซึ่ง macOS ใช้ `darwin`
- `arm64` — architecture ของ CPU เช่น Apple Silicon

บน Linux จะเห็น `linux` และบน Windows จะเห็น `windows`

สำหรับ architecture ที่พบบ่อย:

- `arm64` — Apple Silicon และ ARM 64-bit
- `amd64` — Intel/AMD 64-bit

### ถ้า `go version` ใช้งานไม่ได้

ปัญหาที่พบบ่อยมีอยู่ไม่กี่อย่าง:

1. `go` ไม่ได้อยู่ใน `PATH`

   บน macOS/Linux ลอง:

   ```sh
   which go
   ```

   ถ้าไม่มี output ให้ตรวจสอบ `PATH`

2. มีโปรแกรมอื่นชื่อ `go` อยู่ก่อนหน้าใน `PATH`

   `which go` จะช่วยบอกว่า shell กำลังเรียก `go` จากที่ไหน

3. ติดตั้ง architecture ไม่ตรงกับเครื่อง

   บน Linux ตรวจสอบได้ด้วย:

   ```sh
   uname -m
   ```

---

## Step 2: สร้าง Go Module

ใน Go แต่ละ project มักจะถูกจัดการเป็น **module**

module จะมีไฟล์ `go.mod` อยู่ที่ root ของ project

เริ่มจากสร้างโฟลเดอร์:

```sh
mkdir hello_world
cd hello_world
go mod init hello_world
```

เราจะได้ output ประมาณนี้:

```text
go: creating new go.mod: module hello_world
```

จากนั้นจะมีไฟล์ `go.mod`:

```go
module hello_world

go 1.22
```

ไฟล์นี้ใช้เก็บข้อมูลสำคัญของ project เช่น:

- ชื่อ module
- Go version
- dependencies ที่ project ใช้

ถ้าเคยใช้ Node.js ให้คิดว่า `go.mod` มีหน้าที่คล้าย `package.json`

ถ้าเคยใช้ Python ก็มีแนวคิดใกล้เคียงกับไฟล์ที่ใช้ระบุ dependencies ของ project

> [!WARNING]
> พยายามอย่าแก้ dependency ใน `go.mod` ด้วยมือ ให้ใช้คำสั่งของ Go เช่น `go get` และ `go mod tidy` แทน

---

## Step 3: เขียนโปรแกรมแรก — Hello World

สร้างไฟล์ `hello.go` ในโฟลเดอร์ `hello_world`

```go
package main

import "fmt"

func main() {
fmt.Println("Hello, world!")
}
```

ตอนนี้เราเขียน `fmt.Println` ให้ไม่ตรงรูปแบบ เพื่อให้เห็นว่า `go fmt` ช่วยจัด format ให้เราอย่างไรในขั้นตอนถัดไป

### โครงสร้างของไฟล์ Go

| ส่วน | ความหมาย |
| --- | --- |
| `package main` | บอกว่าไฟล์นี้อยู่ใน package `main` ซึ่งเป็น package สำหรับ executable program |
| `import "fmt"` | นำ package `fmt` เข้ามาใช้สำหรับแสดงข้อความและจัดรูปแบบ output |
| `func main()` | จุดเริ่มต้นของโปรแกรม |
| `fmt.Println(...)` | เรียก `Println` จาก package `fmt` เพื่อแสดงข้อความ |

---

## Step 4: Compile ด้วย `go build`

ใช้ `go build` เพื่อ compile โปรแกรม:

```sh
go build
```

ถ้าไม่มี error Go จะสร้าง binary ให้

ในตัวอย่างนี้ binary จะชื่อ `hello_world` ตามชื่อ module

ลองรัน:

```sh
./hello_world
```

Output:

```text
Hello, world!
```

### ตั้งชื่อ binary เองด้วย `-o`

เราสามารถเลือกชื่อ binary เองได้:

```sh
go build -o hello
./hello
```

### `go run` — รันโดยไม่เก็บ binary ไว้

ถ้าต้องการทดลองโปรแกรมเร็ว ๆ และไม่อยากเก็บ binary ไว้ในโฟลเดอร์ ให้ใช้:

```sh
go run .
```

เหมาะมากสำหรับการทดลองโค้ดหรือโปรแกรมเล็ก ๆ

> [!NOTE]
> Go สามารถ compile โปรแกรมเป็น native binary ที่รันได้โดยตรง จึงไม่ต้องติดตั้ง VM หรือ runtime แยกเหมือนบางภาษา ทำให้การ deploy ค่อนข้างตรงไปตรงมา

---

## Step 5: Format โค้ดด้วย `go fmt`

Go มีแนวคิดสำคัญอย่างหนึ่งคือ **ทุกคนควรใช้ code format แบบเดียวกัน**

แทนที่จะเสียเวลาถกกันว่า indent แบบไหนดี หรือ `{` ควรอยู่ตรงไหน Go จึงมี formatter มาให้ในตัว

ใช้คำสั่งนี้เพื่อ format ทุก package ใน project:

```sh
go fmt ./...
```

Output อาจเป็น:

```text
hello.go
```

หลังจากนั้นลองเปิด `hello.go` อีกครั้ง:

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}
```

สังเกตว่า `fmt.Println` ถูก indent ให้เรียบร้อยแล้ว

### `./...` หมายถึงอะไร?

`./...` หมายถึง:

> ทุก package ตั้งแต่ directory ปัจจุบัน รวมไปถึง subdirectory ต่าง ๆ

pattern นี้พบได้บ่อยมากใน Go commands

### ทำไม `{` ต้องอยู่บรรทัดเดียวกับ `func`?

Go มีสิ่งที่เรียกว่า **semicolon insertion**

Compiler จะเติม `;` ให้บางตำแหน่งโดยอัตโนมัติเมื่อเจอ newline

ดังนั้นรูปแบบนี้:

```go
func main()
{
	fmt.Println("Hello, world!")
}
```

จะไม่สามารถ compile ได้

สาเหตุคือ compiler มองว่าหลัง `func main()` จบบรรทัดแล้ว จึงตีความเหมือนมี `;` อยู่ตรงนั้น

แนวคิดโดยประมาณจะกลายเป็น:

```go
func main();
{
	fmt.Println("Hello, world!");
};
```

ซึ่งไม่ใช่ syntax ที่ถูกต้องของ Go

เพราะฉะนั้นใน Go จึงต้องเขียนแบบนี้:

```go
func main() {
	fmt.Println("Hello, world!")
}
```

กฎนี้ไม่ได้เป็นแค่เรื่อง style แต่เป็นส่วนหนึ่งของ syntax ของภาษา

> [!TIP]
> ก่อน commit ควรรัน `go fmt ./...` เสมอ จะช่วยให้ทุกคนในทีมใช้ format เดียวกัน

---

## Step 6: ตรวจสอบโค้ดด้วย `go vet`

`go vet` ช่วยตรวจหา code ที่ compile ได้ แต่มีโอกาสทำงานผิดจากที่ตั้งใจ

ตัวอย่างเช่น:

```go
package main

import "fmt"

func main() {
	fmt.Printf("Hello, %s!\n")
}
```

โค้ดนี้ compile ได้ แต่ `%s` ต้องการ argument เพิ่ม ซึ่งเรายังไม่ได้ส่งเข้าไป

ลองรัน:

```sh
go vet ./...
```

อาจเห็น error แบบนี้:

```text
# hello_world
./hello.go:6:2: fmt.Printf format %s reads arg #1, but call has 0 args
```

`go vet` ช่วยบอกให้เรารู้ว่ามีปัญหา

แก้โดยส่ง argument เข้าไป:

```go
fmt.Printf("Hello, %s!\n", "world")
```

จากนั้นรันอีกครั้ง:

```sh
go vet ./...
```

ถ้าไม่มี output แสดงว่าผ่านการตรวจสอบแล้ว

> [!TIP]
> ควรใช้ `go vet` เป็นขั้นตอนปกติของ development เช่นเดียวกับ `go fmt`
>
> สำหรับการตรวจที่ละเอียดขึ้น สามารถใช้เครื่องมือเพิ่มเติม เช่น `staticcheck` หรือ `golangci-lint`

---

## Step 7: Automate ทุกอย่างด้วย Makefile

ตอนนี้เรามี workflow 3 ขั้นตอน:

```text
fmt → vet → build
```

เราสามารถรวมทั้งหมดไว้ใน `Makefile` เพื่อให้รันด้วยคำสั่งเดียว

สร้างไฟล์ชื่อ `Makefile` ในโฟลเดอร์ project:

```makefile
.DEFAULT_GOAL := build

.PHONY: fmt vet build

fmt:
	go fmt ./...

vet: fmt
	go vet ./...

build: vet
	go build
```

ตอนนี้แค่รัน:

```sh
make
```

Make จะทำตามลำดับ:

```text
go fmt ./...
go vet ./...
go build
```

### โครงสร้างของ Makefile

| Element | ความหมาย |
| --- | --- |
| `fmt`, `vet`, `build` | target ที่เราสามารถสั่งให้ Make รันได้ |
| `.DEFAULT_GOAL` | target ที่จะถูกรันเมื่อพิมพ์ `make` โดยไม่ระบุ target |
| `vet: fmt` | บอกว่า `fmt` ต้องทำก่อน `vet` |
| `.PHONY` | บอกว่า target เหล่านี้เป็น command ไม่ใช่ชื่อไฟล์ |

ดังนั้นคำสั่ง:

```sh
make
```

จะทำงานเป็น:

{{< mermaid >}}
flowchart LR
  make["make"] --> fmt["fmt · go fmt ./..."] --> vet["vet · go vet ./..."] --> build["build · go build"]
{{< /mermaid >}}

ข้อดีคือทุกคนในทีมสามารถใช้ workflow เดียวกันได้ ทั้งตอนทำงานในเครื่องและตอนรันใน CI

> [!CAUTION]
> บรรทัด command ใต้ target ใน `Makefile` ต้องขึ้นต้นด้วย **tab**
>
> ใช้ space แทน tab แล้ว Make อาจ error

บน Windows `make` อาจไม่ได้ติดตั้งมาให้ สามารถติดตั้งผ่าน Chocolatey:

```sh
choco install make
```

---

## เลือก IDE

จริง ๆ แล้ว Go ใช้แค่ text editor กับ command line ก็ได้

แต่ถ้า project ใหญ่ขึ้น IDE จะช่วยได้มาก เช่น:

- auto-format
- code completion
- error checking
- debugging
- refactoring

### Visual Studio Code

VS Code เป็นตัวเลือกยอดนิยมและใช้ฟรี

ให้ติดตั้ง Go extension จาก VS Code Marketplace

Go extension จะช่วยติดตั้งและตั้งค่าเครื่องมือที่จำเป็น เช่น:

- `gopls` — ช่วยเรื่อง completion, type checking และการค้นหา references
- Delve — debugger สำหรับ Go

#### LSP คืออะไร?

`LSP` หรือ **Language Server Protocol** เป็นมาตรฐานที่ช่วยให้ editor ทำงานร่วมกับ language server ของแต่ละภาษาได้

ทำให้ editor ไม่จำเป็นต้องรู้รายละเอียดของทุกภาษาเอง

### GoLand

GoLand เป็น IDE จาก JetBrains ที่ออกแบบมาสำหรับ Go โดยเฉพาะ

มีฟีเจอร์อย่าง:

- code completion
- refactoring
- debugger
- database tools

เหมาะกับคนที่ชอบ workflow แบบ IntelliJ หรือ PyCharm

GoLand มีช่วงทดลองใช้งานฟรี และมี license บางประเภทสำหรับนักเรียนและ open-source contributors

### Go Playground

ถ้าแค่ต้องการทดลอง Go แบบเร็ว ๆ โดยไม่ติดตั้งอะไรในเครื่อง สามารถใช้:

[go.dev/play](https://go.dev/play)

Go Playground เป็น sandbox สำหรับทดลอง code snippet ขนาดเล็ก

มีปุ่มหลัก ๆ เช่น:

- **Run** — รันโปรแกรม
- **Format** — format code
- **Share** — สร้าง URL สำหรับแชร์โค้ด

#### ข้อจำกัดของ Playground

Go Playground ไม่ได้เหมือน environment จริงทั้งหมด เช่น:

- network access มีข้อจำกัด
- process ที่ใช้เวลานานหรือใช้ memory มากอาจถูกหยุด
- เวลาใน Playground ถูกกำหนดไว้ตายตัว
- ไม่ควรใส่ข้อมูลลับหรือข้อมูล sensitive ลงไป

---

## Go Compatibility Promise

หนึ่งในจุดเด่นของ Go คือการให้ความสำคัญกับ backward compatibility

Go มีการ release version ใหม่เป็นระยะ และมี patch release สำหรับ bug และ security fixes

แนวคิดของ **Go Compatibility Promise** คือ Go 1.x พยายามรักษาความเข้ากันได้ของภาษาและ standard library เพื่อให้โค้ดเดิมยังใช้งานได้เมื่ออัปเกรด Go version

แต่ promise นี้ไม่ได้หมายความว่า command ทุกอย่างรอบ ๆ Go จะไม่มีการเปลี่ยนแปลง

โดยเฉพาะ script หรือ CI ที่พึ่งพา behavior หรือ flag ของ `go` command ควรทดสอบทุกครั้งหลังอัปเดต version

### อัปเดต Go

วิธีอัปเดตขึ้นอยู่กับวิธีที่ติดตั้ง Go

| Platform | วิธี |
| --- | --- |
| macOS + Homebrew | `brew upgrade go` |
| Windows + Chocolatey | `choco upgrade golang` |
| Installer | ดาวน์โหลด version ใหม่จาก [go.dev/dl](https://go.dev/dl/) |
| Linux / BSD | ดาวน์โหลด tarball version ใหม่แล้วติดตั้งแทน version เดิม |

ตัวอย่างบน Linux:

```sh
mv /usr/local/go /usr/local/old-go
tar -C /usr/local -xzf go1.22.1.linux-amd64.tar.gz
rm -rf /usr/local/old-go
```

ก่อนลบ version เก่า ควรตรวจสอบให้แน่ใจก่อนว่า version ใหม่ทำงานได้ตามปกติ

---

## แบบฝึกหัด

ลองสร้าง project ใหม่แยกจาก `hello_world` เพื่อไม่ให้กระทบตัวอย่างในบทนี้

### 1. สร้าง Hello World ใหม่

สร้าง module ชื่อ `greetings`

ให้มี `main.go` ที่แสดง:

```text
Hello from Go!
```

แล้วรันด้วย:

```sh
go run .
```

### 2. ลองใช้ `go vet`

เขียนโค้ดแบบนี้:

```go
fmt.Printf("Hello, %s!\n")
```

แล้วรัน:

```sh
go vet ./...
```

ดูว่า error อะไรเกิดขึ้น จากนั้นแก้โค้ดให้ถูกต้อง

### 3. สร้าง binary ชื่อ `hello`

ใช้:

```sh
go build -o hello
```

จากนั้นลองกลับไปที่ parent directory แล้วรัน binary ผ่าน path เช่น:

```sh
./hello_world/hello
```

### 4. เพิ่ม `run` และ `clean` ใน Makefile

เพิ่ม target:

```text
run
clean
```

โดย:

- `run` ใช้ `go run .`
- `clean` ใช้ลบ binary

อย่าลืมเพิ่มทั้งสอง target ใน `.PHONY`

### 5. ทดลองเรื่อง `{`

ลองเขียน `{` คนละบรรทัดกับ `func`

จากนั้นรัน:

```sh
go build
```

อ่าน error ที่ได้ แล้วแก้กลับมาเป็นรูปแบบที่ถูกต้อง

สุดท้ายตรวจ project ด้วย:

```sh
go fmt ./...
go vet ./...
go build
```

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

นี่คือข้อผิดพลาดที่มือใหม่มักเจอ:

### 1. วาง `{` คนละบรรทัด

ตัวอย่างเช่น:

```go
func main()
{
}
```

จะ compile ไม่ผ่าน เพราะกฎ semicolon insertion ของ Go

### 2. ลืม `go fmt`

ถ้าไม่ format ก่อน commit diff อาจมี whitespace changes เยอะจนมองไม่เห็นการเปลี่ยนแปลงของ logic

### 3. แก้ `go.mod` เองโดยไม่จำเป็น

ใช้ `go get` และ `go mod tidy` ช่วยจัดการ dependencies แทน

### 4. ใช้คำแนะนำเก่าเกี่ยวกับ `GOPATH`

สำหรับ Go modules สมัยใหม่ ไม่จำเป็นต้องวาง project ไว้ใน `GOPATH`

### 5. ใช้ space ใน Makefile

Command ใต้ target ต้องขึ้นต้นด้วย tab

---

## สรุป

ในบทนี้เราได้ทำสิ่งสำคัญทั้งหมดตั้งแต่เริ่มต้น:

1. ✅ ติดตั้ง Go และตรวจสอบว่าใช้งานได้
2. ✅ สร้าง Go module ด้วย `go mod init`
3. ✅ เขียนโปรแกรม Hello World
4. ✅ Compile โปรแกรมด้วย `go build`
5. ✅ Format โค้ดด้วย `go fmt`
6. ✅ เรียนรู้เรื่อง semicolon insertion
7. ✅ ตรวจหา code ที่อาจมีปัญหาด้วย `go vet`
8. ✅ ใช้ `Makefile` เพื่อรวม workflow เป็นคำสั่งเดียว

สุดท้าย workflow หลักของเราคือ:

```text
fmt → vet → build
```

นี่เป็น workflow พื้นฐานที่สามารถนำไปใช้กับ Go project ได้แทบทุกขนาด

> *ในตอนต่อไป เราจะเริ่มทำความรู้จักกับ **Predeclared Types and Declarations** เช่น variables, constants และชนิดข้อมูลพื้นฐานของ Go*

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
