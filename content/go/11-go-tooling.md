+++
title = 'ตอนที่ 11: Go Tooling'
date = '2026-08-11T00:00:00+07:00'
draft = false
description = 'ใช้เครื่องมือรอบตัว Go ตั้งแต่รันและจัด format โค้ด ตรวจคุณภาพและช่องโหว่ ไปจนถึง embed asset, generate code และ build binary สำหรับหลายแพลตฟอร์ม'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราจัดระเบียบโค้ดด้วย module, package และ import จนโปรเจกต์ไม่ต้องกองทุกอย่างไว้ใน `main.go` แล้ว

แต่พอมีโค้ดที่รันได้ คำถามต่อไปก็มา: เราจะจัด format ให้เหมือนกันทั้งทีมได้อย่างไร? จะตรวจ bug ที่ compiler มองไม่เห็นตรงไหน? แล้วถ้าต้องแจกโปรแกรมเป็น binary ให้เครื่องอื่น เราจะรู้ได้อย่างไรว่า binary นั้นสร้างจาก source และ dependency เวอร์ชันอะไร?

บทนี้จะพาไปรู้จักเครื่องมือรอบ ๆ ภาษา Go ตั้งแต่ `go run`, `go install`, `go fmt`, `go vet` ไปจนถึง linter, security scan, การฝังไฟล์ไว้ใน binary และการสร้าง binary สำหรับ OS อื่น

สิ่งที่จะได้ตอนจบบทนี้:

- ใช้ `go run` ลองโปรแกรม และแยกให้ออกว่าต่างจาก `go build` อย่างไร
- ติดตั้ง `goimports`, `staticcheck` และ developer tool อื่นด้วย `go install`
- จัด format และตรวจ code quality ด้วย `go fmt`, `go vet`, linter และ `go test`
- สแกน dependency ที่มีช่องโหว่ด้วย `govulncheck` แล้วอัปเดตแบบกระทบโค้ดน้อยที่สุด
- ฝังไฟล์หรือ directory เข้าไปใน binary ด้วย `//go:embed`
- ใช้ `go generate` เรียก tool เพื่อสร้าง source code ซ้ำได้อย่างเป็นระบบ
- อ่าน module version และ VCS revision จาก binary ด้วย `go version -m`
- cross-compile โปรแกรมไปยัง OS และ CPU architecture อื่นด้วย `GOOS` กับ `GOARCH`
- ใช้ build tags เลือก source code ตามเงื่อนไข และทดสอบกับ Go เวอร์ชันอื่น

{{< mermaid >}}
flowchart TD
  A["Go source"] --> B["go run"]
  A --> C["go fmt / goimports"]
  C --> D["go test / go vet / linter"]
  A --> E["govulncheck"]
  A --> F["go:embed / go generate"]
  A --> G["go build"]
  G --> H["go version -m"]
  G --> I["GOOS / GOARCH"]
  A --> J["build tags"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-tooling` เพื่อทดลองคำสั่งในบทนี้ โดยใช้ Go 1.21 ขึ้นไป เปิด terminal แล้วรัน:

```sh
mkdir go-tooling
cd go-tooling
go mod init go-tooling
touch main.go
```

ชื่อ `go-tooling` ในบทนี้เป็นชื่อสำหรับทดลองบนเครื่องตัวเอง จึงต้องใช้ชื่อนี้ให้ตรงกันในทุกคำสั่งที่มี `mkdir`, `cd` และ `go mod init`

ในแต่ละ Step ให้แทนที่ไฟล์ที่ระบุด้วยตัวอย่างของ Step นั้น และลบไฟล์ `.go` จาก Step ก่อนหน้าเมื่อมันมี `main` หรือ symbol ชื่อซ้ำกัน คำสั่งหลักที่เราจะใช้คือ:

```sh
go run .
```

ตัวอย่างที่ตั้งใจให้ compile ไม่ผ่าน เช่น โค้ดก่อนรัน `go generate` หรือ fragment ที่แสดง build tag จะบอกไว้ชัดเจน อย่านำไปวางรวมกับโปรแกรมปกติ ไม่อย่างนั้น compiler จะซื่อสัตย์กับเรามาก คือไม่ยอม build ให้เลย

เอาล่ะ เริ่มกันเลย

---

## Step 1: `go run` ลองโค้ดเร็ว แล้ว `go build` เอา binary จริง

### ลองโปรแกรมโดยไม่เก็บ binary ไว้ในโปรเจกต์

วางโค้ดนี้ใน `main.go` แล้วสังเกตว่าเราจะยังไม่ได้สร้างไฟล์ binary ด้วยตัวเอง:

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello from Go tooling")
}
```

รันจาก root ของ `go-tooling`:

```sh
go run .
```

ผลลัพธ์คือ:

```text
Hello from Go tooling
```

`go run` ทำหน้าที่ compile แล้ว execute ให้ในคำสั่งเดียว โดย binary ที่สร้างขึ้นจะถูกเก็บไว้ใน temporary directory แล้วลบทิ้งหลังโปรแกรมจบ จึงเหมาะกับการลองโค้ดเล็ก ๆ หรือเช็ก idea เร็ว ๆ

**Why:** ไม่ต้องตั้งชื่อ output binary และไม่ต้องคอยลบไฟล์ที่สร้างจากการทดลอง

**How:** ใช้ `go run .` เมื่ออยากรันทั้ง module หรือใช้ `go run main.go` เมื่ออยากรันไฟล์ที่ระบุโดยตรง

### เมื่อไหร่ควรใช้ `go build`?

ถ้าต้องส่งโปรแกรมให้คนอื่นหรือเอาไป deploy เราต้องสร้าง binary ที่เก็บไว้จริง วางคำสั่งนี้ต่อจากตัวอย่างเดิม:

```sh
go build -o go-tooling .
./go-tooling
```

คำสั่งแรกจะสร้างไฟล์ `go-tooling` ใน directory ปัจจุบัน ส่วนคำสั่งที่สองจะรัน binary นั้น ผลลัพธ์คือ:

```text
Hello from Go tooling
```

บน Windows ชื่อไฟล์มักเป็น `go-tooling.exe` และคำสั่งรันจะต่างตาม shell ที่ใช้

สรุปความต่างแบบสั้น ๆ:

| คำสั่ง | สิ่งที่ทำ | binary อยู่ที่ไหน |
|---|---|---|
| `go run .` | build แล้วรันทันที | temporary directory แล้วถูกลบ |
| `go build .` | compile แต่ไม่รัน | binary ชื่อ directory ใน current directory ถ้าเป็น `main` package |
| `go build -o go-tooling .` | compile เป็นไฟล์ที่ตั้งชื่อเอง | `go-tooling` ใน directory ปัจจุบัน |

`go run` จึงไม่ได้แปลว่า Go กลายเป็น interpreted language มันยัง compile อยู่ เพียงแค่ Go จัดการ binary ชั่วคราวให้เรา

---

## Step 2: ติดตั้ง tool เพิ่มด้วย `go install`

Go มี tool ที่มากับ toolchain อยู่แล้ว แต่ developer tool หลายตัวแจกเป็น source repository เราติดตั้งได้ด้วย `go install` โดยระบุ package path ตามด้วย `@version` หรือ `@latest` ให้ชัดเจน

### ติดตั้ง `goimports` และ `staticcheck`

รันคำสั่งนี้จาก directory ไหนก็ได้ ไม่จำเป็นต้องเพิ่ม dependency เหล่านี้เข้า `go.mod` ของ `go-tooling` เพราะเรากำลังติดตั้ง command สำหรับใช้บนเครื่อง:

```sh
go install golang.org/x/tools/cmd/goimports@latest
go install honnef.co/go/tools/cmd/staticcheck@latest
```

โดยทั่วไป binary จะถูกวางไว้ใน `$GOBIN` ถ้าตั้งค่าไว้ หรือใน `$GOPATH/bin` ถ้ายังไม่ได้ตั้ง `GOBIN` ตรวจตำแหน่งได้ด้วย:

```sh
go env GOPATH GOBIN
```

ถ้า terminal หา `goimports` หรือ `staticcheck` ไม่เจอ ให้เพิ่ม directory นี้เข้า `PATH` บน macOS/Linux:

```sh
export PATH="$(go env GOPATH)/bin:$PATH"
```

ถ้าใช้ PowerShell ให้ใช้:

```powershell
$env:Path = "$(go env GOPATH)\bin;$env:Path"
```

ปิดแล้วเปิด terminal ใหม่ หรือใส่คำสั่งนี้ไว้ใน shell profile เพื่อไม่ต้องตั้งซ้ำทุกครั้ง

### รู้จัก `go install` แบบไม่สับสน

คำสั่งสองแบบนี้มีเจตนาต่างกัน:

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `go install path/to/tool@latest` | ติดตั้ง command จาก source พร้อมระบุ version |
| `go get path/to/module` | เพิ่มหรือเปลี่ยน dependency ที่โปรเจกต์ import ใช้ |

เวลาติดตั้ง developer tool ให้ใช้ `go install` และระบุ version เช่น `@latest` หรือ version ที่ pin ไว้ ไม่ควรปล่อยให้คำสั่งไปตีความจาก `go.mod` ของ directory ปัจจุบันโดยไม่ตั้งใจ

---

## Step 3: จัด format และตรวจ code quality เป็นลำดับ

เครื่องมือแต่ละตัวตรวจคนละเรื่อง ให้คิดว่า workflow นี้เหมือนด่านตรวจหลายด่าน: formatter จัดรูปแบบ, test เช็ก behavior, `vet` และ linter หา pattern ที่น่าสงสัย ส่วน security scanner ตรวจช่องโหว่ที่มีรายงานแล้ว ผ่านด่านหนึ่งไม่ได้แปลว่าผ่านทุกด่าน

### ให้ `goimports` ช่วยจัด import

แทนที่ `main.go` ด้วยโค้ดนี้ ซึ่งมี import ที่ใช้จริงและจัด indentation แบบตั้งใจให้ไม่เรียบร้อย:

```go
package main

import (
	"fmt"
)

func main() {
	message := fmt.Sprintf("Hello")
	fmt.Println(message)
}
```

จาก root ของ `go-tooling` ให้รัน:

```sh
go fmt ./...
goimports -l -w .
```

`go fmt` ใช้ formatter มาตรฐานของ Go ส่วน `goimports` จัดลำดับ import, ลบ import ที่ไม่ได้ใช้ และพยายามเติม import ที่ขาดให้ด้วย `-w` คำสั่งจะแก้ไฟล์ในที่จริง จึงควรดู diff หลังรันทุกครั้ง

ครั้งแรก `goimports -l -w .` อาจพิมพ์ชื่อไฟล์ที่มันแก้ไขออกมา ถ้ารันซ้ำแล้วไม่มี output แปลว่าไฟล์อยู่ในรูปแบบที่ tool พอใจแล้ว

### ให้ `staticcheck` จับโค้ดที่ compile ผ่านแต่ไม่จำเป็น

โค้ดเดิม compile ผ่าน แต่ `fmt.Sprintf("Hello")` ไม่ได้ใช้ประโยชน์จาก formatting เลย ลองรัน:

```sh
staticcheck ./...
```

เราจะเห็น warning ลักษณะนี้ เลขบรรทัดและคอลัมน์อาจต่างกันถ้าไฟล์มีการแก้ไข:

```text
main.go:6:13: unnecessary use of fmt.Sprintf (S1039)
```

แก้โค้ดให้เป็นแบบนี้แล้วรัน `staticcheck ./...` ซ้ำ:

```go
package main

import "fmt"

func main() {
	message := "Hello"
	fmt.Println(message)
}
```

ถ้าไม่มี output แปลว่า `staticcheck` ไม่พบ issue ตาม rule ที่เปิดใช้ในตัวอย่างนี้ ไม่ได้แปลว่าโปรแกรมถูกต้องทุกมุม เพราะ linter มีทั้ง false positive และ false negative เราควรอ่านคำแนะนำแล้วตัดสินใจตาม context ของโค้ด

### `go vet`, `revive` และ `golangci-lint` ตรวจคนละระดับ

ลองเปลี่ยน `main.go` เป็นตัวอย่างนี้เพื่อดูว่า `go vet` เตือนเรื่อง format string ได้อย่างไร:

```go
package main

import "fmt"

func main() {
	fmt.Printf("count: %d\n", "two")
}
```

โค้ดนี้ compile ได้ แต่ type ของ argument ไม่ตรงกับ `%d` ให้รัน:

```sh
go vet ./...
```

ผลลัพธ์จะมีข้อความประมาณนี้:

```text
./main.go:6:2: fmt.Printf format %d has arg "two" of wrong type string
```

แก้ `"two"` เป็นตัวเลข เช่น `2` แล้วรัน `go vet ./...` ซ้ำจนไม่มี warning จากตัวอย่างนี้

นอกจาก `go vet` ยังมี tool ที่ตรวจ code style และ bug pattern เพิ่มเติม:

| Tool | จุดเด่น | คำสั่งหลัก |
|---|---|---|
| `staticcheck` | มี check จำนวนมากและพยายามลด false positive | `staticcheck ./...` |
| `revive` | ตั้ง rule เรื่อง naming, comment และ style ได้ละเอียด | `revive ./...` |
| `golangci-lint` | รวม linter หลายตัว เช่น `go vet`, `staticcheck` และ `revive` | `golangci-lint run` |

ถ้าจะใช้ `revive` ให้ติดตั้งก่อน:

```sh
go install github.com/mgechev/revive@latest
revive ./...
```

ส่วน `golangci-lint` มักแนะนำให้ติดตั้ง binary ตามเอกสารของ version ที่ทีมเลือก แล้ววางไฟล์ config ไว้ที่ root ของ module จากนั้น commit config เข้า version control อย่าวาง config ไว้ใน home directory เพราะคนอื่นในทีมและ CI อาจใช้ rule คนละชุด

ไม่จำเป็นต้องแก้ทุก warning โดยไม่อ่านเหตุผล ถ้า rule ไหนไม่เหมาะกับ context ให้ปิดหรือ ignore ในจุดนั้น พร้อม comment อธิบายเหตุผล เพื่อให้ reviewer เข้าใจว่าเราเห็น warning แล้ว ไม่ใช่พลาดไปเฉย ๆ

### อย่าลืม `go test`

ถ้าใน module มี test ให้รัน test ทั้ง tree ด้วย:

```sh
go test ./...
```

ถ้า `go-tooling` ยังไม่มีไฟล์ `_test.go` เราอาจเห็น:

```text
?    	go-tooling	[no test files]
```

นี่ไม่ได้เป็น test ที่ผ่าน แต่เป็นการบอกว่า package นี้ยังไม่มี test file เมื่อเพิ่ม test แล้ว command เดิมจะ compile และรัน test ให้ทุก package ใน module

**Why:** ทำให้ format, behavior และ code pattern ถูกตรวจด้วย command ที่ทีมใช้เหมือนกัน

**How:** เริ่มจาก `go fmt ./...`, ตามด้วย `go test ./...`, `go vet ./...` และ linter ที่ทีมเลือก ก่อนค่อย `go build ./...`

---

## Step 4: สแกนช่องโหว่ของ dependency ด้วย `govulncheck`

`go vet` และ linter สนใจคุณภาพของ source code แต่ไม่ได้ตอบว่า dependency ที่เราใช้มีช่องโหว่ที่รู้จักหรือไม่ งานนี้ใช้ `govulncheck` ซึ่งอ้างอิง vulnerability database ที่ Go team ดูแล

### ติดตั้งและรัน scan

ติดตั้ง tool แล้วรันจาก root ของ `go-tooling`:

```sh
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
```

ถ้า source และ dependency ของเราไม่พบรายการที่เกี่ยวข้อง ผลลัพธ์มักเป็น:

```text
No vulnerabilities found.
```

ถ้าพบปัญหา output จะบอก vulnerability ID, module version ที่มีปัญหา, version ที่แก้แล้ว และตัวอย่างเส้นทางที่ source ของเราเรียกโค้ดส่วนนั้น เช่น:

```text
Vulnerability #1: GO-2020-0036
    Found in: example.com/old/module@v1.2.3
    Fixed in: example.com/old/module@v1.2.4
    Example traces found:
      #1: main.go:25:23: main calls vulnerable.Function
```

เลข ID, module และบรรทัดจะเปลี่ยนตาม dependency จริง อย่าคัดลอก output นี้ไปตีความว่าโปรเจกต์ของเรามีช่องโหว่รายการเดียวกัน

ถ้า tool บอกให้ upgrade patch version ให้เริ่มจากการเปลี่ยนแปลงที่เล็กที่สุด:

ในคำสั่งด้านล่าง `example.com/old/module` เป็น placeholder ให้แทนด้วย module path ที่ `govulncheck` รายงานจริงก่อนรัน

```sh
go get -u=patch example.com/old/module
go mod tidy
govulncheck ./...
```

ถ้า module มี vulnerability แต่ `govulncheck` หาเส้นทางที่ source เรียกส่วนที่มีปัญหาไม่เจอ รายงานอาจเป็น warning ที่เบากว่า นั่นไม่ได้แปลว่า dependency ไม่มีประเด็น เพียงแต่ tool ยังไม่พบ call path ที่กระทบกับโปรแกรมของเรา

**Why:** รู้ว่า dependency ที่ deploy ไปมี vulnerability ที่ฐานข้อมูลรู้จักหรือไม่ โดยไม่ต้องไล่เปิด source ของทุก module เอง

**How:** ใส่ `govulncheck ./...` ใน CI และหลังอัปเดต dependency ทุกครั้ง จากนั้นอ่านผลว่ากระทบ call path จริงหรือเป็นเพียง module ที่อยู่ใน graph

---

## Step 5: ฝังไฟล์เข้าไปใน binary ด้วย `//go:embed`

โปรแกรมบางตัวต้องใช้ template, default config หรือ help file ตอนรัน ถ้าแจก binary พร้อม directory ของไฟล์เหล่านี้ ผู้ใช้ก็ต้องจำว่าเอาไฟล์ไปวางตรงไหน

`//go:embed` ช่วยฝังเนื้อหาเข้า binary โดยตรง ทำให้ยังแจกเป็นไฟล์เดียวได้

### ฝังไฟล์เดียวเป็น `string`

ก่อนอื่นสร้างไฟล์ `message.txt` ที่ root ของ `go-tooling` และใส่ข้อความนี้:

```text
Built into the binary.
```

จากนั้นแทนที่ `main.go` ด้วยโค้ดนี้ โดยต้องวาง magic comment ติดกับ variable ที่จะรับไฟล์:

```go
package main

import (
	_ "embed"
	"fmt"
)

//go:embed message.txt
var message string

func main() {
	fmt.Print(message)
}
```

รันและ build:

```sh
go run .
go build -o go-tooling .
```

ทั้งสองคำสั่งจะแสดง:

```text
Built into the binary.
```

ในตัวอย่างนี้เรา import `embed` ด้วย blank import เพราะไม่ได้เรียกชื่อที่ export จาก package โดยตรง การ import นี้บอก compiler ว่าไฟล์มี embedding specification ส่วน variable ที่รับไฟล์ต้องอยู่ระดับ package และเป็น `string`, `[]byte` หรือ `embed.FS`

ถ้าใช้ไฟล์เดียว `string` หรือ `[]byte` เป็นทางเลือกที่ตรงไปตรงมา และควรปฏิบัติกับค่าที่ embed เหมือนข้อมูลที่อ่านได้อย่างเดียว ไม่ควรทำให้มันกลายเป็น state ที่เปลี่ยนไปมา

### ฝังหลายไฟล์เป็น virtual filesystem

ถ้าต้องฝังหลายไฟล์หรือ directory ให้สร้าง `help/start.txt` ด้วยเนื้อหานี้:

```text
Start the program with go run .
```

แล้วแทนที่ `main.go` ด้วยโค้ดนี้:

```go
package main

import (
	"embed"
	"fmt"
	"os"
)

//go:embed help
var helpFS embed.FS

func main() {
	if len(os.Args) != 2 {
		fmt.Println("usage: go run . <file>")
		return
	}

	data, err := helpFS.ReadFile("help/" + os.Args[1])
	if err != nil {
		fmt.Println("error:", err)
		return
	}

	fmt.Print(string(data))
}
```

รันด้วยชื่อไฟล์ที่อยู่ใน embedded filesystem:

```sh
go run . start.txt
```

ผลลัพธ์คือ:

```text
Start the program with go run .
```

ชื่อ directory `help` เป็นส่วนหนึ่งของ filesystem ที่ฝังเข้าไป จึงต้องเติม `help/` ตอนเรียก `ReadFile` แม้ผู้ใช้จะส่งแค่ `start.txt` เข้ามา

ข้อผิดพลาดของ embedding จะถูกตรวจตอน compile เช่น pattern ไม่ match ไฟล์ใด, ใช้ `string` รับหลายไฟล์ หรือใช้ `string` รับ pattern ที่ match หลายไฟล์ ถ้าต้องการรวม hidden file ให้เลือก pattern ให้ตรงกับสิ่งที่ต้องการ:

| Syntax | ไฟล์ hidden ที่รวม |
|---|---|
| `//go:embed help` | ไม่รวม hidden file ใน tree ตาม default |
| `//go:embed help/*` | รวม hidden file ที่อยู่ root ของ `help` |
| `//go:embed all:help` | รวม hidden file ในทุก subdirectory |

**Why:** รวม asset ที่โปรแกรมต้องใช้ไว้กับ executable ทำให้ deploy เป็น single binary ได้ง่ายขึ้น

**How:** ใช้ `string`/`[]byte` กับไฟล์เดียว และใช้ `embed.FS` กับหลายไฟล์หรือ directory จากนั้นเรียกไฟล์ด้วย path ที่อยู่ใน virtual filesystem

---

## Step 6: ใช้ `go generate` เรียก tool สร้าง source code

`go generate` ไม่ได้ generate อะไรด้วยตัวเอง มันแค่ค้นหา comment รูปแบบ `//go:generate` แล้วรัน command ที่เขียนไว้ ความยืดหยุ่นนี้ทำให้ใช้ร่วมกับ `protoc`, `stringer` หรือ generator ที่ทีมเขียนเองได้

### ใช้ `stringer` สร้าง `String()` ให้ enum

ลบไฟล์ `.go` จาก Step ก่อนหน้าให้เหลือชุดใหม่ แล้วติดตั้ง `stringer`:

```sh
go install golang.org/x/tools/cmd/stringer@latest
```

สร้างไฟล์ `direction.go` ด้วยโค้ดนี้:

```go
package main

import "fmt"

//go:generate stringer -type=Direction
type Direction int

const (
	_ Direction = iota
	North
	South
	East
	West
)

func main() {
	fmt.Println(North.String())
}
```

ก่อนรัน `go generate` โค้ดนี้ตั้งใจให้ compile ไม่ผ่าน เพราะ `Direction` ยังไม่มี method `String()` อย่าเพิ่งรัน `go run .` ให้ใช้คำสั่งนี้ก่อน:

```sh
go generate ./...
go run .
```

`go generate` จะเรียก `stringer` และสร้างไฟล์ `direction_string.go` ให้ จากนั้น output คือ:

```text
North
```

สิ่งสำคัญคือ comment ต้องเขียนเป็น `//go:generate` ติดกัน ห้ามใส่ช่องว่างระหว่าง `//` กับ `go:generate` และ command จะทำงานจาก directory ของ package ที่มี comment นั้น

### ควร commit generated code ไหม?

ถ้า generated source สร้างผลลัพธ์เดิมจาก input เดิมเสมอ การ commit ไฟล์ที่ generate แล้วช่วยให้คนเปิด repository เห็น code ที่ถูก compile และไม่ต้องติดตั้ง generator ทุกครั้งที่ build

แต่ถ้า generator ฝัง timestamp จน output เปลี่ยนทุกครั้ง หรือใช้เวลานานจน build ช้า การ commit อาจทำให้ review เต็มไปด้วย diff ที่ไม่เกี่ยวกับ logic ในสองกรณีนี้ควรมีคำสั่งหรือ comment บอกทีมให้ generate ใหม่เมื่อ input เปลี่ยน และอย่าปล่อยให้ขั้นตอนสำคัญขึ้นกับความจำของคนคนเดียว

`go generate` จึงเหมาะกับการประกาศขั้นตอนสร้าง source ไว้ข้าง input ส่วน Makefile หรือ CI อาจเป็นตัว validate ว่า generated code ถูกอัปเดตแล้ว

---

## Step 7: อ่าน build info ที่ฝังอยู่ใน binary

เวลามี binary รันอยู่ใน production เราอยากตอบให้ได้ว่า binary นี้สร้างจาก module version ไหน, commit ไหน และใช้ Go version อะไร Go จะฝัง build information ลงใน binary ที่สร้างด้วย `go build` ให้อัตโนมัติ

ก่อนทำ Step นี้ ให้ใช้โปรแกรมที่ compile ผ่านจาก Step ใดก็ได้ แล้วสร้าง binary พร้อม `-trimpath`:

```sh
go build -trimpath -o go-tooling .
go version -m go-tooling
```

ผลลัพธ์จะมีหน้าตาประมาณนี้ โดยรายละเอียดจริงขึ้นกับ Go version, module และ repository ที่ใช้ build:

```text
go-tooling: go1.25.0
    path    go-tooling
    build   -buildmode=exe
    build   -compiler=gc
    build   GOARCH=arm64
    build   GOOS=darwin
    vcs     git
    vcs.revision    623a65b94fd02ea6f18df53afaaea3510cd1e611
    vcs.modified    false
```

ถ้า directory นี้ไม่ได้อยู่ใน Git หรือ build environment ไม่ได้ส่ง VCS metadata มาด้วย บรรทัด `vcs` อาจไม่มี ส่วน dependency ที่ module ใช้จะปรากฏเป็นรายการ `dep`

`go version -m` อ่านข้อมูลจาก binary โดยตรง ไม่ต้องเดาจากชื่อไฟล์หรือจำว่าครั้งนั้น deploy commit ไหน ส่วน `-trimpath` ช่วยลดการฝัง full path ของเครื่อง build ลงใน binary และข้อมูลประกอบที่อาจถูกนำไปแสดงใน stack trace

**Why:** ทำให้ binary ที่อยู่ไกลจาก source ยังบอก provenance หรือที่มาของตัวเองได้ และช่วยตรวจว่าของที่ deploy ตรงกับสิ่งที่ทีมคิดหรือไม่

**How:** ใช้ `go version -m <binary>` ตอนตรวจ artifact และเก็บ revision ที่อ่านได้ไว้คู่กับ release หรือ deployment record

---

## Step 8: cross-compile ไปยัง OS และ CPU อื่น

Go compile เป็น native code ดังนั้น binary ที่สร้างสำหรับ macOS กับ Linux ไม่ใช่ไฟล์เดียวกัน แต่เราไม่จำเป็นต้องมีเครื่องทุก OS เพื่อสร้าง binary เพราะ `go build` รับค่า target ผ่าน `GOOS` และ `GOARCH`

### ดู target ที่ Go รองรับ

รันคำสั่งนี้เพื่อดูคู่ OS/CPU ที่ใช้ได้:

```sh
go tool dist list
```

ค่าที่เจอบ่อยมีเช่น `darwin/arm64`, `linux/amd64`, `linux/arm64` และ `windows/amd64` โดย `darwin` คือชื่อ kernel ของ macOS และ `amd64` คือ CPU แบบ 64-bit ที่เข้ากันได้กับ Intel/AMD

### สร้าง binary สำหรับ Linux จาก macOS/Linux

จาก root ของ `go-tooling` รัน:

```sh
GOOS=linux GOARCH=amd64 go build -o go-tooling-linux-amd64 .
file go-tooling-linux-amd64
```

ผลลัพธ์จาก `file` ควรบอกว่าเป็น ELF 64-bit สำหรับ x86-64 ลักษณะประมาณนี้:

```text
go-tooling-linux-amd64: ELF 64-bit LSB executable, x86-64, ...
```

บน PowerShell ใช้การตั้งค่า environment แบบนี้แทน:

```powershell
$env:GOOS = "linux"
$env:GOARCH = "amd64"
go build -o go-tooling-linux-amd64 .
```

ถ้าไม่ตั้ง `GOOS` หรือ `GOARCH` Go จะใช้ค่าของเครื่องปัจจุบัน ตรวจค่า default ได้ด้วย:

```sh
go env GOOS GOARCH
```

ตัวอย่างนี้เป็น pure Go จึง cross-compile ได้ตรงไปตรงมา ถ้าโปรเจกต์ใช้ cgo อาจต้องตั้งค่า `CGO_ENABLED` และมี C compiler สำหรับ target เพิ่มด้วย

**Why:** สร้าง artifact ให้ server หรือเครื่องปลายทางได้โดยไม่ต้องเปิดเครื่อง OS นั้นรอ build

**How:** ตั้ง `GOOS` กับ `GOARCH` หน้า `go build` และตั้งชื่อ output ให้บอก target เพื่อลดโอกาสหยิบ binary ผิดตัวไป deploy

---

## Step 9: ใช้ build tags เลือกโค้ดตามเงื่อนไข

บางครั้ง source code ต้องต่างกันตาม OS/CPU หรือเราต้องการเปิด experiment เฉพาะตอนสั่ง build ด้วย flag `-tags` ทำได้สองทาง:

1. ตั้งชื่อไฟล์ให้ลงท้ายด้วย OS หรือ architecture เช่น `config_windows.go` หรือ `config_linux_arm64.go`
2. ใส่ build constraint `//go:build` ไว้ก่อน `package` แล้วใช้ boolean operator อย่าง `&&`, `||` และ `!`

### สร้าง default build และ experimental build

ลบไฟล์ `.go` จาก Step ก่อนหน้าให้เหลือไฟล์ 3 ไฟล์ต่อไปนี้

ไฟล์ `main.go`:

```go
package main

import "fmt"

func main() {
	fmt.Println(message)
}
```

ไฟล์ `feature_default.go` จะถูกใช้เมื่อเราไม่ได้ใส่ tag `demo`:

```go
//go:build !demo

package main

const message = "default build"
```

ไฟล์ `feature_demo.go` จะถูกใช้เมื่อสั่งด้วย `-tags demo`:

```go
//go:build demo

package main

const message = "demo build"
```

ลองรันสองแบบนี้:

```sh
go run .
go run -tags demo .
```

ผลลัพธ์ตามลำดับคือ:

```text
default build
demo build
```

เครื่องหมาย `!demo` ในไฟล์แรกหมายถึงใช้เมื่อไม่ได้เปิด tag ส่วน `demo` ในไฟล์ที่สองหมายถึงใช้เมื่อเปิด tag แล้ว ชื่อ `demo` เป็น custom build tag ที่เราตั้งเอง

ห้ามมีช่องว่างใน `//go:build` และ comment ต้องอยู่ก่อน `package` ถ้าเขียนเป็น `// go:build demo` Go จะไม่ถือว่าเป็น build tag และไฟล์อาจถูก compile ในทุกกรณีโดยไม่เตือนให้รู้ตัว

ถ้ามีไฟล์ทดลองที่ยังไม่อยากให้ compile เลย สามารถใช้ `//go:build ignore` เป็น convention เพื่อข้ามไฟล์นั้นได้

---

## Step 10: ทดสอบกับ Go หลายเวอร์ชัน และให้ `go help` ช่วยค้นต่อ

Go ให้ความสำคัญกับ backward compatibility แต่ release ใหม่ก็ยังอาจมี bug หรือ behavior ที่ต่างจากที่เราเจอใน version เก่า ถ้าต้อง reproduce bug หรือเช็กว่าโปรแกรมรองรับ Go version ไหน เราติดตั้ง secondary environment ได้

### ติดตั้ง Go version เพิ่ม

ตัวอย่างนี้ติดตั้ง Go 1.19.2 ผ่าน wrapper ใน module `golang.org/dl`:

เพื่อให้ตัวอย่างเป็นไฟล์เดี่ยว ก่อนรันให้ใช้ `main.go` จาก Step 1 ที่ไม่ได้อ้างถึงไฟล์ build tag อื่น ถ้า `go.mod` ของ `go-tooling` ระบุ Go ใหม่กว่า 1.19 ให้ปิด module mode ชั่วคราวสำหรับการลองไฟล์เดี่ยว:

```sh
go install golang.org/dl/go1.19.2@latest
go1.19.2 download
GO111MODULE=off go1.19.2 run main.go
```

บรรทัดสุดท้ายใช้ binary ชื่อ `go1.19.2` แทน `go` เพื่อรันไฟล์โดยตรง ถ้าจะ build ทั้ง module ต้องเช็กก่อนว่า `go` directive ใน `go.mod` ของ `go-tooling` รองรับ version นั้นหรือไม่ ถ้า module ต้องการ Go ใหม่กว่า ให้เลือก secondary version ที่ตรงกับข้อกำหนดของ module แทน

หลังทดสอบเสร็จ ถ้าไม่ต้องการเก็บ environment ไว้แล้ว บน macOS/Linux ลบได้ด้วย:

```sh
rm -rf ~/sdk/go1.19.2
rm "$(go env GOPATH)/bin/go1.19.2"
```

คำสั่งลบเป็นตัวอย่างสำหรับ shell แบบ Unix และควรตรวจ path ให้แน่ใจก่อนรัน

### ค้นรายละเอียดจาก toolchain โดยไม่ต้องเปิดเว็บทุกครั้ง

`go help` มี documentation ของคำสั่งและ environment ที่ติดมากับ Go ลองค้นหัวข้อที่เกี่ยวกับบทนี้:

```sh
go help environment
go help buildconstraint
go help importpath
go help module-auth
```

ใช้ `go help <หัวข้อ>` เมื่อจำชื่อ flag ไม่ได้ หรืออยากรู้ว่า environment variable อย่าง `GOPROXY`, `GOSUMDB` และ `GOPRIVATE` มีผลต่อการดาวน์โหลด module อย่างไร

### เช็กลิสต์ก่อนส่งโค้ด

ก่อนเปิด pull request เราสามารถใช้ลำดับนี้เป็นจุดเริ่มต้น แล้วปรับตาม tool ที่ทีมเลือก:

```sh
go fmt ./...
go test ./...
go vet ./...
staticcheck ./...
govulncheck ./...
go build ./...
```

ถ้าใช้ `goimports` หรือ `golangci-lint` ก็ใส่ไว้ใน pipeline ตามกติกาของทีม จุดสำคัญไม่ใช่การรัน command ให้ครบเพื่อให้ดูดี แต่คือทำให้ทุกคนใช้ขั้นตอนตรวจที่ชัดและทำซ้ำได้

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน project `go-tooling` โดยไม่เปิดเฉลยก่อน:

1. สร้างโปรแกรมที่รับ argument เป็นชื่อไฟล์หนึ่งค่า ถ้าได้รับชื่อไฟล์ให้พิมพ์เนื้อหาและคืนสถานะสำเร็จ ถ้าไม่ส่ง argument หรือเปิดไฟล์ไม่ได้ให้พิมพ์ error และจบด้วยสถานะไม่สำเร็จ จากนั้นรัน `go fmt`, `go vet` และ `staticcheck` จนไม่มี warning ที่แก้ได้ โดยไม่ต้อง cleanup ไฟล์ที่โปรแกรมไม่ได้สร้างเอง
2. สร้าง directory `assets/` ที่มี `th.txt` และ `en.txt` แล้วใช้ `//go:embed assets/*` เก็บเป็น `embed.FS` เขียน function `ReadMessage(language string) (string, error)` ให้คืนเนื้อหาคู่กับ `nil` เมื่อภาษาเป็น `th` หรือ `en` และคืน string ว่างคู่กับ error เมื่อไม่รู้จักภาษา โดยไม่อ่านไฟล์จาก disk และไม่ต้องลบ embedded asset
3. สร้าง enum `Status` ที่มี `Pending`, `Running` และ `Done` แล้วใช้ `go generate` กับ `stringer` ให้ `Status.String()` คืนชื่อค่าตาม enum เขียน `ParseStatus(input string) (Status, error)` ให้คืน status คู่กับ `nil` เมื่อรับชื่อที่รู้จัก และคืน zero value คู่กับ error เมื่อรับชื่อที่ไม่รู้จัก จาก `main` ให้พิมพ์ `Running` เมื่อไม่มี argument และพิมพ์ error เมื่อ input ไม่ถูกต้อง โดยไม่ต้อง cleanup resource ใด ๆ
4. สร้างไฟล์สองชุดสำหรับ `default` กับ `demo` ด้วย build tag ให้ function `Mode() string` คืน `"default"` เมื่อรัน `go run .` และคืน `"demo"` เมื่อรัน `go run -tags demo .` จากนั้นลองใช้ tag อื่นและอธิบายว่าทำไม Go จึงยังเลือกไฟล์ default โดยไม่สร้างไฟล์ชั่วคราว
5. build โปรแกรมสำหรับ `linux/amd64` และ `windows/amd64` โดยตั้งชื่อ output ให้มี OS กับ architecture จากนั้นใช้ `go version -m` อ่าน build info ของอย่างน้อยหนึ่ง binary และบันทึก Go version กับ VCS revision ที่พบ ถ้า build ไม่ได้เพราะ cgo ให้บันทึกสาเหตุและห้ามแก้ด้วยการปิด test หรือ security scan

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go test ./...
go vet ./...
go build ./...
```

ถ้าโปรเจกต์มี `go generate` ให้รันก่อนชุดคำสั่งตรวจ และดูว่า generated source เปลี่ยนหรือไม่ก่อน commit

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ติดตั้ง tool ด้วย `go install` โดยไม่ระบุ `@version` หรือ `@latest`** — ใช้ version suffix ให้ชัดเมื่อกำลังติดตั้ง command จาก source
- **ติดตั้ง tool แล้ว terminal หาไม่เจอ** — ตรวจ `$GOBIN` และ `$GOPATH/bin` แล้วเพิ่ม directory ที่ถูกต้องเข้า `PATH`
- **คิดว่า `go run` ไม่ได้ compile** — มัน compile เป็น binary ชั่วคราวแล้วรันทันที เพียงไม่เก็บ binary ไว้ในโปรเจกต์
- **รัน `goimports -w .` แล้วไม่ดู diff** — tool แก้ไฟล์จริง ควรตรวจการเปลี่ยนแปลงก่อน commit
- **บังคับแก้ทุก warning จาก linter** — อ่าน context ก่อน เพราะ linter อาจมี false positive และ false negative; ถ้า ignore ให้บอกเหตุผล
- **คิดว่า `go vet` หรือ linter แทน test ได้** — แต่ละตัวตรวจคนละเรื่อง ให้รัน test และ build ด้วย
- **ใช้ `govulncheck` แล้วคิดว่าไม่พบ call path เท่ากับไม่มีความเสี่ยง** — อ่านทั้งรายการ vulnerability และเส้นทางที่ tool ตรวจพบ
- **อัปเดต dependency กระโดดข้าม version ใหญ่ทันที** — เริ่มจาก patch version ที่แก้ปัญหา แล้วรัน scan และ test ซ้ำ
- **วางช่องว่างใน `//go:embed` หรือ `//go:generate`** — magic comment ต้องเขียนติดกันและอยู่ในตำแหน่งที่ Go กำหนด
- **ใช้ `string` embed หลายไฟล์** — ไฟล์เดียวใช้ `string`/`[]byte`; หลายไฟล์ใช้ `embed.FS`
- **ลืมสร้าง generated code ก่อน compile** — `go generate` ไม่ได้ทำงานอัตโนมัติก่อน `go build` ต้องเรียกเองหรือผูกไว้ใน Makefile/CI
- **commit generated code โดยไม่ดูว่า output deterministic หรือไม่** — timestamp และ generator ที่ช้าอาจทำให้ diff รกหรือ build ช้าลง
- **อ่าน build info แล้วคาดหวัง field เดิมทุกเครื่อง** — VCS metadata และ dependency จะแตกต่างตาม environment ที่ build
- **ใช้ binary cross-compile ผิด target** — ตั้งชื่อ output ให้มี `GOOS`/`GOARCH` และตรวจด้วย `file` หรือ metadata ก่อน deploy
- **มีช่องว่างใน `//go:build`** — Go จะไม่ถือว่าเป็น build constraint และไฟล์อาจถูกเลือกผิดโดยไม่ฟ้องตรง ๆ
- **ใช้ Go secondary version ที่ต่ำกว่า `go` directive ใน module** — เช็กข้อกำหนดของ module ก่อน build ทั้ง tree

---

## สรุป

1. `go run .` compile และรันโปรแกรมผ่าน binary ชั่วคราว ส่วน `go build -o ... .` สร้าง binary ที่เก็บไว้ใช้งานจริง
2. ใช้ `go install path@version` ติดตั้ง developer tool และตรวจให้ binary directory อยู่ใน `PATH`
3. `go fmt` จัด format มาตรฐาน, `goimports` ดูแล import, `go test` ตรวจ behavior และ `go vet` หา programming error ที่น่าสงสัย
4. `staticcheck`, `revive` และ `golangci-lint` ช่วยตรวจ pattern เพิ่มเติม แต่ควรอ่าน warning และตัดสินใจตาม context ไม่ใช่แก้ทุกข้อแบบอัตโนมัติ
5. `govulncheck ./...` สแกน dependency กับ vulnerability database และช่วยชี้ call path ที่อาจได้รับผลกระทบ
6. `//go:embed` ฝังไฟล์เดียวเป็น `string`/`[]byte` หรือฝังหลายไฟล์เป็น `embed.FS` เพื่อคงรูปแบบ single binary
7. `go generate` แค่เรียก command ที่ประกาศด้วย `//go:generate` จึงเหมาะกับการสร้าง source code จาก enum, schema หรือ input อื่น
8. `go version -m <binary>` อ่าน module, Go version และ VCS revision ที่ถูกฝังใน binary ได้ ส่วน `-trimpath` ช่วยลด full path ของเครื่อง build
9. ตั้ง `GOOS` กับ `GOARCH` หน้า `go build` เพื่อ cross-compile ไปยัง target อื่น และตรวจชื่อ output ก่อนนำไป deploy
10. ใช้ชื่อไฟล์หรือ `//go:build` เลือก source code ตาม platform และ custom tag โดยต้องเขียน constraint ให้ถูกตำแหน่ง
11. ติดตั้ง secondary Go environment เพื่อ reproduce bug หรือเช็ก compatibility และใช้ `go help` ค้นรายละเอียดจาก toolchain ได้

จำประโยคเดียวพอ:

> ให้เครื่องมือช่วยตรวจงานซ้ำ ๆ แต่ให้คนอ่านผลลัพธ์และตัดสินใจเรื่อง context เอง

Go ไม่ได้มีแค่ compiler ที่บอกว่าโค้ด compile ผ่านหรือไม่ รอบ ๆ compiler ยังมีเครื่องมือสำหรับจัดรูปแบบ, ตรวจ behavior, ตรวจ dependency และทำให้ binary พร้อมเดินทางไปเครื่องปลายทาง

> *ตอนถัดไปเราจะไปดู concurrency ของ Go — goroutine, channel และวิธีออกแบบงานที่ทำพร้อมกันโดยไม่ปล่อยให้ข้อมูลวิ่งชนกัน*

---

## Glossary

- **`go run`** — คำสั่งที่ compile และ execute โปรแกรมผ่าน binary ชั่วคราว แล้วลบ binary หลังจบ
- **`go build`** — คำสั่ง compile source code เป็น binary โดยไม่รันโปรแกรม
- **`go install`** — ดาวน์โหลด compile และติดตั้ง command จาก source repository โดยระบุ `path@version`
- **`goimports`** — formatter ที่จัด import และช่วยเพิ่มหรือลบ import ให้สอดคล้องกับ source
- **linter** — เครื่องมือวิเคราะห์ source แบบ static เพื่อหา style issue, nonidiomatic code และ bug pattern
- **`staticcheck`** — linter สำหรับ Go ที่มี check ด้าน code quality และ bug pattern จำนวนมาก
- **`revive`** — linter ที่ตั้ง rule เรื่อง naming, comment และรูปแบบการเขียน Go ได้
- **`golangci-lint`** — ตัวรวบรวม linter หลายตัวให้ตั้งค่าและรันผ่าน command เดียว
- **`govulncheck`** — tool ที่สแกน dependency กับฐานข้อมูล vulnerability ของ Go และแสดง call path ที่เกี่ยวข้อง
- **`//go:embed`** — magic comment ที่สั่งให้ compiler ฝังไฟล์หรือ directory เข้า binary
- **`embed.FS`** — type ที่ทำให้ไฟล์ embedded ถูกอ่านผ่าน virtual filesystem
- **`go generate`** — คำสั่งที่ค้นหาและรัน command จาก comment `//go:generate`
- **`stringer`** — tool ที่ generate method `String()` ให้ค่าใน enum ที่ประกาศด้วย integer
- **Build info** — ข้อมูล Go version, module, dependency และ VCS metadata ที่ฝังอยู่ใน binary
- **`go version -m`** — คำสั่งอ่าน build info จาก binary ที่สร้างด้วย Go
- **`GOOS`** — environment variable ที่ระบุ target operating system ตอน build
- **`GOARCH`** — environment variable ที่ระบุ target CPU architecture ตอน build
- **Cross-compilation** — การสร้าง binary สำหรับ OS/CPU อื่นจากเครื่องที่กำลังใช้อยู่
- **Build tag / build constraint** — กติกาที่เลือกว่าจะ compile ไฟล์ใดผ่านชื่อไฟล์หรือ comment `//go:build`
- **`GOBIN`** — environment variable ที่กำหนด directory ปลายทางของ binary ที่ `go install` สร้าง
- **`PATH`** — รายการ directory ที่ shell ใช้ค้นหา command อย่าง `staticcheck` และ `goimports`

---

## Related

- [ตอนที่ 10: Modules, Packages, and Imports](/go/10-modules-packages-and-imports/) — บทก่อนหน้า; `go.mod`, package และ dependency เป็นพื้นฐานของ tooling ในบทนี้
- [ตอนที่ 9: Errors](/go/09-errors/) — `go vet` และ linter ช่วยจับบาง pattern ที่เกี่ยวกับการจัดการ error แต่ยังต้องออกแบบ failure path เอง
- [ตอนที่ 5: Functions](/go/05-functions/) — function และ package ที่จัดโครงสร้างดีจะถูก test, lint และ build เป็นส่วนย่อยได้ง่ายขึ้น
- [ตอนที่ 12: Concurrency in Go](/go/12-concurrency-in-go/) — บทถัดไปว่าด้วย goroutine, channel และ concurrency
