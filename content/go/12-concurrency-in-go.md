+++
title = 'ตอนที่ 12: Concurrency in Go'
date = '2026-08-18T00:00:00+07:00'
draft = false
description = 'ใช้ goroutine, channel และ select จัดโครงงานที่ทำพร้อมกันได้ พร้อมกัน goroutine leak ด้วย context, รอหลาย goroutine ด้วย WaitGroup และรู้ว่าเมื่อไหร่ควรเปลี่ยนไปใช้ mutex'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราเก็บเครื่องมือรอบ ๆ ภาษา Go ครบมือ ตั้งแต่ `go run`, `go vet` ไปจนถึง cross-compile — พร้อมส่งโปรแกรมออกไปทำงานจริงแล้ว

ตอนนี้ถึงคิวของสิ่งที่คนมักได้ยินชื่อก่อนจะได้ยินอย่างอื่นเกี่ยวกับ Go เลย นั่นคือ **concurrency** และ goroutine ที่ว่ากันว่าสร้างทีเป็นหมื่นตัวยังไหว

แต่ก่อนจะไปถึงตรงนั้น ต้องเคลียร์เรื่องหนึ่งก่อน เพราะเป็นความเข้าใจผิดที่ทำให้โค้ด concurrent ของมือใหม่พังบ่อยที่สุด:

**concurrency ไม่ได้แปลว่าเร็วขึ้น**

หนังสือ *Learning Go* เล่าเส้นทางที่คนเขียน Go มือใหม่มักเดินซ้ำกันไว้แบบขำ ๆ ว่าเป็น "5 ขั้นของความผิดหวัง" — เริ่มจากยัด `go` ใส่ทุกที่ที่ยัดได้ → ปรากฏว่าไม่เร็วขึ้น → เติม buffer เข้าไปให้ channel → ติด deadlock → เปลี่ยนไปใช้ mutex ทั้งหมด → ยอมแพ้ กลับไปเขียนแบบเดิม

บทนี้เลยไม่เริ่มจาก syntax แต่เริ่มจากคำถามว่า *เมื่อไหร่ควรใช้* ก่อน แล้วค่อยไล่เครื่องมือทั้งสามตัว (goroutine, channel, select) ไปจนถึง pattern ที่ใช้จริงและจุดที่ควรหันไปใช้ mutex แทน

สิ่งที่จะได้ตอนจบบทนี้:

- ตัดสินใจได้ว่างานแบบไหนคุ้มที่จะทำ concurrent และแบบไหนเขียนแบบ serial ดีกว่า
- launch goroutine ด้วย keyword `go` และห่อ business logic ไว้ใน closure ให้ function เดิมไม่รู้เรื่อง concurrency
- ส่งค่าระหว่าง goroutine ด้วย channel และระบุทิศทางด้วย `<-chan` / `chan<-` ให้ compiler ช่วยตรวจ
- อ่าน channel ด้วย `for-range` และแยก zero value จริงออกจาก channel ที่ปิดแล้วด้วย comma ok idiom
- อ่านตาราง behavior ของ channel ครบทุก state จนเลี่ยง panic ที่เกิดจาก `close` ซ้ำได้
- เลือกทำงานกับ channel หลายตัวด้วย `select` และเขียน for-select loop ที่มีทางออกเสมอ
- กัน goroutine leak ด้วย `context.WithCancel` และตั้งเวลาให้งานด้วย `context.WithTimeout`
- รอ goroutine หลายตัวจบด้วย `sync.WaitGroup` แล้วปิด channel ที่หลายตัวเขียนให้ถูกครั้งเดียว
- รัน initialization ที่ช้าเพียงครั้งเดียวด้วย `sync.OnceValue`
- เลือกได้ว่าเคสไหนควรใช้ `sync.Mutex`/`sync.RWMutex` แทน channel
- จับ concurrency bug ด้วย race detector (`-race`)

{{< mermaid >}}
flowchart TD
  A["Step 1: เมื่อไหร่ควรใช้ concurrency"] --> B["Step 2-4: goroutine + channel<br/>close / comma ok"]
  B --> C["Step 5: select + for-select loop"]
  C --> D["Step 6: context กัน goroutine leak"]
  D --> E["Step 7: buffered channel + backpressure"]
  E --> F["Step 8-10: WaitGroup / timeout / OnceValue"]
  F --> G["Step 11: mutex เมื่อ channel ไม่ใช่คำตอบ"]
  G --> H["Step 12: ประกอบเข้าด้วยกัน"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-concurrency` เพื่อทดลองโค้ดในบทนี้ โดยใช้ Go 1.22 ขึ้นไป (บท Step 3 มีจุดที่พฤติกรรมต่างกันระหว่าง Go 1.21 กับ 1.22 และเราจะลองทั้งสองแบบ) เปิด terminal แล้วรัน:

```sh
mkdir go-concurrency
cd go-concurrency
go mod init go-concurrency
touch main.go
```

ชื่อ `go-concurrency` ในบทนี้เป็นชื่อสำหรับทดลองบนเครื่องตัวเอง จึงต้องใช้ชื่อนี้ให้ตรงกันในทุกคำสั่งที่มี `mkdir`, `cd` และ `go mod init`

ในแต่ละ Step ให้แทนที่ `main.go` ด้วยตัวอย่างของ Step นั้น แล้วรันด้วย:

```sh
go run .
```

มีเรื่องสำคัญที่ต้องรู้ก่อนเริ่ม และจะย้ำอีกหลายรอบตลอดบทนี้:

> ⚠️ **ลำดับ output ของโปรแกรม concurrent ไม่ได้คงที่** ตัวอย่างไหนที่ลำดับขึ้นกับจังหวะการทำงานของ goroutine จะบอกไว้ชัดเจนว่า "ลำดับเปลี่ยนได้ทุกครั้งที่รัน" ถ้ารันแล้วได้ลำดับไม่เหมือนในบท ไม่ได้แปลว่าเราทำผิด — ให้ดูว่า *ค่า* ครบและถูกต้องหรือไม่แทน

ตัวอย่างที่ตั้งใจให้ crash เพื่อดู error เช่น deadlock หรือ panic จะบอกไว้ก่อนทุกครั้ง อย่าตกใจตอนเห็น `fatal error` เพราะนั่นคือผลลัพธ์ที่เราต้องการดู

เอาล่ะ เริ่มกันเลย

---

## Step 1: เมื่อไหร่ควรใช้ concurrency (และเมื่อไหร่ไม่ควร)

### concurrency กับ parallelism ไม่ใช่คำเดียวกัน (Why)

สองคำนี้ถูกใช้สลับกันบ่อยจนคนคิดว่าเหมือนกัน แต่คนละเรื่องกันเลย:

| คำ | ความหมาย | ใครกำหนด |
|---|---|---|
| **Concurrency** | การ *ออกแบบ* โปรแกรมให้แยกเป็นส่วนที่ทำงานอิสระต่อกันได้ และกำหนดวิธีแชร์ข้อมูลอย่างปลอดภัย | เราซึ่งเป็นคนเขียนโค้ด |
| **Parallelism** | การที่งานหลายชิ้น *รันจริงพร้อมกัน* ในเวลาเดียวกัน | hardware และ runtime |

พูดอีกแบบคือ concurrency เป็นวิธีจัดโครงปัญหา ส่วนจะได้รันขนานกันจริงแค่ไหนขึ้นกับว่าเครื่องมีกี่ core และ algorithm ของเราแบ่งงานได้จริงหรือเปล่า (เรื่องนี้มีสูตรอธิบายอยู่แล้วคือ Amdahl's law ที่ Gene Amdahl เสนอไว้ตั้งแต่ปี 1967)

เพราะฉะนั้นการใส่ `go` เพิ่มเข้าไปจึงไม่ได้แปลว่าโปรแกรมจะเร็วขึ้นเอง บางทีช้าลงด้วย เพราะการส่งค่าผ่าน channel มีต้นทุนของมัน

### แล้วเคสไหนคุ้ม? (How)

โปรแกรมทุกตัวทำสามขั้นเหมือนกัน: รับข้อมูล → แปลง → ส่งผลออก จุดที่ concurrency ช่วยได้คือเมื่อขั้นตอนกลางมีงานที่ **ทำอิสระต่อกันได้** และ **กินเวลานานพอ**

| เคส | เหมาะไหม | เพราะอะไร |
|---|---|---|
| เรียก API สามตัวที่ไม่ต้องรอผลกันแล้วเอาผลมารวม | เหมาะมาก | เป็นงาน I/O ที่รอได้พร้อมกัน แต่ละตัวช้าพอให้คุ้ม |
| อ่านหลายไฟล์จาก disk แล้วสรุปผลรวม | เหมาะ | I/O เหมือนกัน และแยกงานได้ตามไฟล์ |
| บวกเลข 100 ตัวใน slice | ไม่เหมาะ | เร็วอยู่แล้ว overhead ของ channel จะกลบเวลาที่ประหยัด |
| sort slice ขนาดกลางใน memory | มักไม่เหมาะ | งาน in-memory เร็วกว่า I/O เป็นพันเท่า |

หลักที่ใช้ได้จริงคือ งาน I/O (อ่าน/เขียน disk หรือคุยกับ network) ช้ากว่างานใน memory หลายอันดับ การปล่อยให้มันรอไปพร้อม ๆ กันจึงคุ้ม ส่วนงานที่คำนวณเสร็จในไม่กี่ไมโครวินาที การส่งค่าข้าม goroutine มักไม่คุ้ม

**Why:** concurrency มีต้นทุน ทั้งเวลาที่ใช้ส่งค่าผ่าน channel และความซับซ้อนของโค้ดที่คนอื่นต้องอ่านต่อ

**How:** ถ้าไม่แน่ใจ ให้เขียนแบบ serial ให้ทำงานถูกก่อน แล้ววัดด้วย benchmark เทียบกับเวอร์ชัน concurrent ค่อยตัดสินจากตัวเลข ไม่ใช่จากความรู้สึก

> concurrency คือเครื่องมือจัดโครงสร้างปัญหา ไม่ใช่ปุ่มเร่งความเร็ว ถ้าตอบไม่ได้ว่างานไหนในโปรแกรมรอพร้อมกันได้ ก็ยังไม่ถึงเวลาใส่ `go`

---

## Step 2: goroutine — สั่งงานให้ไปทำพร้อมกันด้วย `go`

### process, thread และ goroutine ต่างกันตรงไหน

สามคำนี้ซ้อนกันอยู่เป็นชั้น ๆ แยกให้ชัดก่อนจะได้ไม่สับสนตอนอ่าน error:

- **process** — instance ของโปรแกรมที่ OS กำลังรันอยู่ มี resource เช่น memory ของตัวเอง
- **thread** — หน่วยการทำงานที่ OS จัดเวลาให้รัน thread ที่อยู่ใน process เดียวกันแชร์ resource กันได้
- **goroutine** — หน่วยการทำงานที่จัดการโดย **Go runtime** ไม่ใช่ OS โดย runtime จะเอา goroutine ไปวางลงบน thread ที่มันเตรียมไว้เอง

การมี scheduler ของ Go ซ้อนอยู่อีกชั้นทำให้ได้ข้อดีหลายอย่าง: สร้าง goroutine เร็วกว่าสร้าง thread เพราะไม่ต้องขอ resource จาก OS, stack เริ่มต้นเล็กกว่าและโตได้ตามต้องการ, และการสลับระหว่าง goroutine เกิดภายใน process จึงเร็วกว่าการสลับ thread

ผลคือโปรแกรม Go มี goroutine อยู่พร้อมกันหลักพันถึงหลักหมื่นตัวได้สบาย ในขณะที่ภาษาที่ผูกกับ native thread ตรง ๆ จะเริ่มอืดตั้งแต่หลักพัน

### launch goroutine แล้วเจอกับดักแรกทันที

วางโค้ดนี้ใน `main.go` แล้วเดาผลลัพธ์ก่อนรัน:

```go
package main

import "fmt"

func main() {
	go fmt.Println("จาก goroutine")
	fmt.Println("จาก main")
}
```

รัน:

```sh
go run .
```

ผลลัพธ์ที่ได้เกือบทุกครั้งคือ:

```text
จาก main
```

บรรทัด `จาก goroutine` หายไปเฉย ๆ

เหตุผลคือ `main` เองก็รันอยู่บน goroutine ตัวหนึ่ง (runtime launch ให้ตอนโปรแกรมเริ่ม) พอ `main` return โปรแกรมจบทันที และ goroutine ที่เหลือถูก kill ไปพร้อมกัน โดยไม่มีใครรอให้มันทำงานเสร็จ

แต่ถ้ารันหลาย ๆ ครั้งจะเจอว่า **บางครั้งมันก็โผล่มาทั้งสองบรรทัด** ลองรันสัก 20 รอบดูได้ — บนเครื่องที่เขียนบทนี้ รัน 200 รอบแล้วเจอ `จาก goroutine` โผล่มาด้วย 3 รอบ ถ้าเจอแบบนั้นไม่ได้แปลว่าเราพิมพ์โค้ดผิด

และนั่นแหละคือไอเดียเดียวที่ตัวอย่างนี้ต้องการสอน: **launch goroutine แล้วไม่มีอะไรรับประกันว่ามันจะได้รันหรือไม่ได้รัน** ผลลัพธ์ขึ้นกับจังหวะที่ scheduler จัดให้ ซึ่งเปลี่ยนได้ทุกครั้ง เราจึงต้องมีวิธีบอกให้ `main` รออย่างชัดเจน ไม่ใช่หวังว่ามันจะทันเอง — ซึ่งจะได้เจอใน Step ถัดไป

อยากเห็นผลแบบคงที่ ลองบังคับให้ Go ใช้ CPU เดียวดู แล้วบรรทัดที่สองจะไม่โผล่เลย:

```sh
GOMAXPROCS=1 go run .
```

### ธรรมเนียม: ห่อ business logic ไว้ใน closure

ใน Go ไม่มีการประกาศ `async` แบบบางภาษา function ธรรมดาตัวไหนก็ถูก launch เป็น goroutine ได้ ทำให้ Go ไม่เจอปัญหาที่เรียกว่า function coloring ที่ภาษาแบบ async/await ต้องรับมือ (คำนี้มาจากบล็อกชื่อ "What Color Is Your Function?" ของ Bob Nystrom)

ธรรมเนียมที่นิยมคือ launch goroutine ด้วย closure ที่ห่อ function หลักไว้ ให้ closure รับผิดชอบเรื่อง channel และการ synchronize ส่วน function ที่ทำงานจริงไม่ต้องรู้เลยว่าตัวเองถูกรันใน goroutine:

```go
// process ไม่รู้เรื่อง concurrency เลย — test แยกได้ตามปกติ
func process(val int) int {
	return val * 2
}

// closure เป็นคนจัดการ channel ให้
go func() {
	for val := range in {
		out <- process(val)
	}
}()
```

**Why:** แยกเรื่อง concurrency ออกจาก business logic ทำให้ test `process` ได้ตรง ๆ และเปลี่ยนวิธีรันข้างในได้โดยไม่ต้องแก้ signature

**How:** เขียน function ที่ทำงานจริงให้เป็น function ปกติก่อน แล้วค่อยห่อด้วย `go func() { ... }()` ตอนต้องการให้มันทำงานพร้อมกันหลายตัว

---

## Step 3: channel — ท่อส่งค่าระหว่าง goroutine

### สร้าง อ่าน และเขียน

**channel** เป็น built-in type เหมือน slice และ map สร้างด้วย `make`:

```go
ch := make(chan int)
```

channel เป็น reference type เหมือน map — ส่งเข้า function คือส่ง reference ไป และ zero value ของมันคือ `nil`

การคุยกับ channel ใช้ operator `<-` ตัวเดียว ตำแหน่งของลูกศรเป็นตัวบอกว่าอ่านหรือเขียน จำแบบนี้ง่ายที่สุด: **ลูกศรชี้ออกจาก channel คืออ่าน ชี้เข้า channel คือเขียน**

| Syntax | ความหมาย |
|---|---|
| `a := <-ch` | อ่านค่าจาก `ch` มาใส่ `a` (ลูกศรอยู่ซ้าย ชี้ออกจาก channel) |
| `ch <- b` | เขียนค่า `b` ลง `ch` (ลูกศรอยู่ขวา ชี้เข้า channel) |

ค่าแต่ละค่าที่เขียนลง channel จะถูกอ่านได้ **ครั้งเดียว** ถ้ามีหลาย goroutine อ่าน channel เดียวกัน ค่าหนึ่งค่าจะไปถึงแค่ตัวใดตัวหนึ่งเท่านั้น ไม่ได้กระจายให้ทุกตัว

### แก้ปัญหาจาก Step 2 ด้วย unbuffered channel

โดย default channel เป็นแบบ **unbuffered** ซึ่งมีพฤติกรรมสำคัญคือ การเขียนจะหยุดรอจนมีคนมาอ่าน และการอ่านก็หยุดรอจนมีคนมาเขียน เหมือนส่งไม้ผลัดในการวิ่งผลัด คนส่งต้องยืนถือไม้รอจนคนรับมาคว้าไปจากมือจริง ๆ

พฤติกรรมนี้ใช้แก้ปัญหาจาก Step 2 ได้พอดี แทนที่ `main.go` ด้วย:

```go
package main

import "fmt"

func main() {
	done := make(chan string)
	go func() {
		done <- "จาก goroutine"
	}()
	msg := <-done
	fmt.Println(msg)
	fmt.Println("จาก main")
}
```

รัน `go run .` จะได้:

```text
จาก goroutine
จาก main
```

รอบนี้ลำดับคงที่ทุกครั้ง เพราะ `main` ไปต่อไม่ได้จนกว่าจะอ่านค่าจาก `done` ได้ และ `done` จะมีค่าก็ต่อเมื่อ goroutine เขียนลงไปแล้ว การอ่าน channel จึงทำหน้าที่เป็นจุดนัดพบระหว่างสอง goroutine ไปด้วยในตัว

ข้อสังเกตที่ตามมาคือ unbuffered channel ใช้ได้ก็ต่อเมื่อมี goroutine อย่างน้อยสองตัวทำงานอยู่ ถ้าเขียนลง unbuffered channel ใน goroutine เดียวโดยไม่มีใครอ่าน โปรแกรมจะค้างทันที

### buffered channel และการระบุทิศทาง

**buffered channel** เก็บค่าไว้ได้จำนวนจำกัดโดยไม่ต้องรอคนอ่าน ระบุ capacity ตอนสร้าง:

```go
ch := make(chan int, 10)
```

ถ้า buffer เต็มแล้ว การเขียนครั้งถัดไปจะหยุดรอ และถ้า buffer ว่าง การอ่านก็หยุดรอเหมือนเดิม ดู buffer ได้ด้วย `len` (จำนวนค่าที่อยู่ตอนนี้) และ `cap` (ขนาดสูงสุด ซึ่งเปลี่ยนไม่ได้):

```go
package main

import "fmt"

func main() {
	unbuffered := make(chan int)
	buffered := make(chan int, 3)
	buffered <- 1
	buffered <- 2
	fmt.Println("unbuffered:", len(unbuffered), cap(unbuffered))
	fmt.Println("buffered:", len(buffered), cap(buffered))
}
```

ผลลัพธ์:

```text
unbuffered: 0 0
buffered: 2 3
```

สังเกตว่าเขียนสองค่าลง `buffered` ได้เลยโดยไม่ต้องมี goroutine อื่นมารออ่าน ส่วน `unbuffered` ได้ `0 0` ทั้งคู่ ซึ่งสมเหตุสมผลเพราะตามนิยามมันไม่มี buffer ให้นับ

อีกเรื่องที่ควรทำตั้งแต่ต้นคือ **ระบุทิศทาง** ตอนส่ง channel เข้า function เพื่อให้ compiler ช่วยจับความผิดพลาด:

| Syntax | ความหมาย |
|---|---|
| `ch <-chan int` | function นี้ **อ่านได้อย่างเดียว** (ลูกศรอยู่ก่อน `chan`) |
| `ch chan<- int` | function นี้ **เขียนได้อย่างเดียว** (ลูกศรอยู่หลัง `chan`) |

ถ้าเผลอเขียนลง channel ที่ประกาศเป็น `<-chan` compiler จะฟ้องตอน build ไม่ต้องรอให้พังตอนรัน

> ส่วนใหญ่ให้เริ่มจาก unbuffered channel ไว้ก่อน เพราะเข้าใจง่ายกว่าและบังคับให้สองฝั่งนัดพบกันชัดเจน ส่วนกรณีที่ buffered คุ้มจริงจะอยู่ใน Step 7

### ระวัง closure ที่ capture ตัวแปรของ for loop

ตรงนี้เป็นกับดักคลาสสิกที่ต้องรู้ เพราะโค้ดเก่าที่เจอตาม internet ยังเขียนแบบเดิมอยู่เยอะ ลองโค้ดนี้:

```go
package main

import "fmt"

func main() {
	a := []int{2, 4, 6, 8, 10}
	ch := make(chan int, len(a))
	for _, v := range a {
		go func() {
			ch <- v * 2
		}()
	}
	for i := 0; i < len(a); i++ {
		fmt.Println(<-ch)
	}
}
```

บน Go 1.22 ขึ้นไปจะได้ค่า `4`, `8`, `12`, `16`, `20` ครบทั้งห้าตัว แต่ **ลำดับเปลี่ยนได้ทุกครั้งที่รัน** เพราะ goroutine ตัวไหนเขียนลง channel ก่อนก็ไปถึงก่อน เช่นสองรอบที่ต่างกันบนเครื่องเดียว:

```text
20 8 4 12 16
8 20 12 16 4
```

ทีนี้ลองเปลี่ยนบรรทัด `go` ใน `go.mod` ให้เป็น `go 1.21` แล้วรันอีกครั้ง:

```text
20
20
20
20
20
```

ได้ `20` ห้าครั้ง เพราะก่อน Go 1.22 ตัวแปร `v` ของ for loop ถูก **reuse ตัวเดียว** ทุก iteration closure ทั้งห้าตัวจึงอ้างถึงตัวแปรเดียวกัน และกว่า goroutine จะได้รัน loop ก็วนจบไปแล้ว ค่าใน `v` เหลืออยู่แค่ `10` ตัวสุดท้าย

Go 1.22 เปลี่ยนให้ for loop สร้างตัวแปรใหม่ทุก iteration ปัญหานี้จึงหมดไปเอง แต่ถ้าต้องดูแลโค้ดที่ยัง pin version เก่า แก้ได้สองทาง:

```go
// 1) shadow ค่าไว้ใน loop
for _, v := range a {
	v := v
	go func() {
		ch <- v * 2
	}()
}

// 2) ส่งเป็น parameter เข้า goroutine — data flow ชัดกว่า
for _, v := range a {
	go func(val int) {
		ch <- val * 2
	}(v)
}
```

จำไว้ว่าอย่าลืมเปลี่ยน `go.mod` กลับเป็น `go 1.22` ก่อนไป Step ถัดไป

> แม้ Go 1.22 จะแก้เคส for loop ให้แล้ว แต่ตัวแปรอื่นที่ closure capture ไว้และค่าอาจเปลี่ยนระหว่างนั้นก็ยังต้องระวังเหมือนเดิม ถ้าไม่มั่นใจ ให้ส่งสำเนาค่าปัจจุบันเข้าไปเป็น parameter

---

## Step 4: `for-range`, `close` และตาราง behavior ที่ต้องจำ

### อ่านจนหมดด้วย `for-range` แล้วปิดด้วย `close`

อ่าน channel ด้วย `for-range` ได้ ต่างจาก `for-range` ที่ใช้กับ slice หรือ map ตรงที่ประกาศตัวแปรตัวเดียว คือ value:

```go
for v := range ch {
	fmt.Println(v)
}
```

loop นี้จะวนไปเรื่อย ๆ ถ้าไม่มีค่าให้อ่านก็หยุดรอ และจะออกจาก loop เมื่อ channel ถูก **ปิด** ด้วย built-in `close` (หรือเจอ `break`/`return`)

ประกอบทั้งสองอย่างเข้าด้วยกัน แทนที่ `main.go` ด้วย:

```go
package main

import "fmt"

func main() {
	ch := make(chan int)
	go func() {
		defer close(ch)
		for i := 1; i <= 3; i++ {
			ch <- i
		}
	}()
	for v := range ch {
		fmt.Println(v)
	}
	v, ok := <-ch
	fmt.Println(v, ok)
}
```

ผลลัพธ์คงที่ทุกครั้ง เพราะมี goroutine เขียนอยู่ตัวเดียว:

```text
1
2
3
0 false
```

สามบรรทัดแรกมาจาก `for-range` ตามลำดับที่เขียนลงไป แต่บรรทัดสุดท้ายคือหัวใจของ Step นี้

### อ่านจาก channel ที่ปิดแล้ว "สำเร็จเสมอ"

พฤติกรรมที่ทำให้คนสะดุดคือ การอ่านจาก channel ที่ปิดแล้ว **ไม่ error และไม่ค้าง** — มันคืน zero value ของ type นั้นให้ทันที ในตัวอย่างข้างบนเราจึงได้ `0` ออกมา ไม่ใช่ error

นี่สร้างปัญหาแบบเดียวกับที่เจอตอนใช้ map: จะแยกยังไงระหว่าง `0` ที่มีคนเขียนลงไปจริง ๆ กับ `0` ที่ได้เพราะ channel ปิดแล้ว? คำตอบคือ **comma ok idiom** ตัวเดิม:

```go
v, ok := <-ch
```

ถ้า `ok` เป็น `true` แปลว่า channel ยังเปิดและ `v` เป็นค่าจริง ถ้าเป็น `false` แปลว่า channel ปิดแล้วและ `v` เป็นเพียง zero value — ตรงกับ `0 false` ที่เราเห็น

ส่วนความรับผิดชอบในการปิด channel เป็นของ goroutine ที่ **เขียน** เพราะมีแค่ฝั่งเขียนที่รู้ว่าไม่มีอะไรจะส่งต่อแล้ว และการปิดก็จำเป็นเฉพาะเมื่อมีคนรอให้ channel ปิด (เช่นตัวที่อ่านด้วย `for-range`) ไม่ต้องปิดทุกอันเพราะ channel เป็นตัวแปรธรรมดา ถ้าไม่มีใครอ้างถึงแล้ว garbage collector เก็บให้เอง

### ตาราง behavior ครบทุก state

channel มีหลาย state และแต่ละ state ตอบสนองต่อ read/write/close ต่างกัน ตารางนี้คุ้มที่จะจำ เพราะ panic ที่เจอบ่อยเกิดจากช่องในตารางนี้ทั้งนั้น:

| Operation | Unbuffered, open | Unbuffered, closed | Buffered, open | Buffered, closed | Nil |
|---|---|---|---|---|---|
| **Read** | หยุดรอจนมีคนเขียน | คืน zero value (ใช้ comma ok เช็ก) | หยุดรอถ้า buffer ว่าง | คืนค่าที่เหลือใน buffer จนหมด แล้วคืน zero value | ค้างตลอดไป |
| **Write** | หยุดรอจนมีคนอ่าน | **panic** | หยุดรอถ้า buffer เต็ม | **panic** | ค้างตลอดไป |
| **Close** | สำเร็จ | **panic** | สำเร็จ ค่าที่เหลือยังอ่านได้ | **panic** | **panic** |

ข้อความ panic ที่จะเจอจริงมีสามแบบ อยากลองก็เขียนโปรแกรมสั้น ๆ ให้มันพังดูได้:

```text
panic: send on closed channel
panic: close of closed channel
panic: close of nil channel
```

สังเกตว่าช่อง "Buffered, closed" ในแถว Read บอกว่าอ่านค่าที่เหลือได้จนหมดก่อน นี่แปลว่า `close` ไม่ได้ทิ้งค่าที่ค้างใน buffer — มันแค่บอกว่าจะไม่มีค่าใหม่เข้ามาอีกแล้ว

> ⚠️ pattern มาตรฐานที่กันช่อง panic ทั้งสามช่องได้คือ ให้ goroutine ที่เขียนเป็นคนปิด channel เมื่อไม่มีอะไรจะเขียนแล้ว เรื่องจะยุ่งขึ้นเมื่อมีหลาย goroutine เขียน channel เดียวกัน เพราะ `close` ซ้ำสองครั้งคือ panic ซึ่งจะแก้ด้วย `sync.WaitGroup` ใน Step 8

ช่อง Nil ที่บอกว่า "ค้างตลอดไป" ดูเหมือนมีแต่โทษ แต่กลับมีประโยชน์อยู่เคสหนึ่ง ซึ่งจะได้ใช้ใน Step ถัดไป

---

## Step 5: `select` — เลือกทำงานกับ channel หลายตัว

### ทำไมต้องมี `select` (Why)

`select` คือ control structure ของ concurrency ใน Go มันตอบคำถามคลาสสิกว่า ถ้าตอนนี้ทำได้สองอย่างพร้อมกัน จะทำอันไหนก่อน?

ถ้าเราเขียนโค้ดให้เลือกอันแรกเสมอ อันหลังอาจไม่ได้ทำงานเลยเมื่ออันแรกมีงานเข้ามาตลอด อาการนี้เรียกว่า **starvation**

`select` แก้ด้วยวิธีที่ตรงไปตรงมามาก: ถ้ามีหลาย case ที่พร้อมทำงาน มันจะ **เลือกแบบสุ่ม** ทำให้ไม่มี case ไหนถูกให้สิทธิ์เหนือกว่าตัวอื่นถาวร ต่างจาก `switch` ที่เลือก case แรกที่เงื่อนไขเป็นจริงเสมอ

การสุ่มนี้ยังช่วยกัน deadlock อีกทาง เพราะสาเหตุของ deadlock ที่พบบ่อยที่สุดคือการเข้าถึง resource หลายตัวโดย **เรียงลำดับไม่ตรงกัน** ระหว่าง goroutine

### ลองทำให้ deadlock จริงก่อน

ตัวอย่างนี้ **ตั้งใจให้พัง** เพื่อดู error แทนที่ `main.go` ด้วย:

```go
package main

import "fmt"

func main() {
	ch1 := make(chan int)
	ch2 := make(chan int)
	go func() {
		inGoroutine := 1
		ch1 <- inGoroutine
		fromMain := <-ch2
		fmt.Println("goroutine:", inGoroutine, fromMain)
	}()
	inMain := 2
	ch2 <- inMain
	fromGoroutine := <-ch1
	fmt.Println("main:", inMain, fromGoroutine)
}
```

รัน `go run .` แล้วจะได้:

```text
fatal error: all goroutines are asleep - deadlock!
```

(ตามด้วย stack trace ยาว ๆ ที่บอกว่าแต่ละ goroutine ค้างอยู่ตรงไหน)

ไล่ดูว่าทำไม: goroutine ที่เรา launch ไปติดอยู่ที่ `ch1 <- inGoroutine` เพราะ `ch1` เป็น unbuffered จึงต้องรอให้มีคนอ่านก่อน ส่วน `main` ก็ติดอยู่ที่ `ch2 <- inMain` รอคนอ่าน `ch2` เหมือนกัน — แต่คนที่จะอ่าน `ch2` คือ goroutine ที่ยังค้างอยู่บรรทัดก่อนหน้า ต่างฝ่ายต่างรอกันจนไม่มีใครไปต่อได้

ข้อดีคือกรณีที่ **ทุก** goroutine ในโปรแกรมค้างพร้อมกันแบบนี้ Go runtime ตรวจจับได้และ kill โปรแกรมพร้อมบอกเราตรง ๆ (ถ้าค้างแค่บาง goroutine runtime จะไม่ฟ้อง ซึ่งเป็นเรื่องที่ Step 6 ต้องจัดการ)

### แก้ด้วย `select`

เปลี่ยนแค่ส่วนของ `main` ให้ห่อการอ่านและเขียนไว้ใน `select`:

```go
package main

import "fmt"

func main() {
	ch1 := make(chan int)
	ch2 := make(chan int)
	go func() {
		inGoroutine := 1
		ch1 <- inGoroutine
		fromMain := <-ch2
		fmt.Println("goroutine:", inGoroutine, fromMain)
	}()
	inMain := 2
	var fromGoroutine int
	select {
	case ch2 <- inMain:
	case fromGoroutine = <-ch1:
	}
	fmt.Println("main:", inMain, fromGoroutine)
}
```

ผลลัพธ์:

```text
main: 2 1
```

deadlock หายไปเพราะ `select` ไม่ยึดติดว่าต้องทำอะไรก่อน มันดูว่า case ไหนไปต่อได้ตอนนี้ ในจังหวะนั้น goroutine กำลังรอเขียน `ch1` อยู่แล้ว case ที่อ่าน `ch1` จึงพร้อม ส่วน case ที่เขียน `ch2` ยังไม่มีคนอ่าน `select` เลยเลือก case แรกที่ทำได้

แต่ต้องซื่อสัตย์ว่าโปรแกรมนี้ยัง **ไม่เรียบร้อยดี** — บรรทัด `fmt.Println` ใน goroutine ไม่เคยทำงาน เพราะหลังเขียน `ch1` สำเร็จมันไปค้างรออ่าน `ch2` ต่อ แล้ว `main` ก็จบไปก่อน โปรแกรมจึงปิดพร้อม kill goroutine นั้นทิ้ง วิธีทำให้ goroutine จบอย่างถูกต้องคือเนื้อหาของ Step 6

### for-select loop และ `default`

เพราะ `select` มักต้องคอยรับส่งหลาย channel ซ้ำ ๆ มันจึงมักถูกวางไว้ใน `for` loop รูปแบบนี้เรียกรวมกันว่า **for-select loop**:

```go
for {
	select {
	case <-done:
		return
	case v := <-ch:
		fmt.Println(v)
	}
}
```

สิ่งที่ต้องมีคือ **ทางออกจาก loop** เสมอ ในตัวอย่างนี้คือ case ที่อ่าน `done` แล้ว `return`

`select` มี `default` ได้เหมือน `switch` โดย `default` จะทำงานเมื่อไม่มี case ไหนพร้อมเลย ใช้ทำ nonblocking read/write ได้:

```go
select {
case v := <-ch:
	fmt.Println("อ่านได้:", v)
default:
	fmt.Println("ยังไม่มีค่าใน ch")
}
```

> ⚠️ อย่าใส่ `default` ใน for-select loop เกือบทุกครั้งที่ทำแบบนั้นจะได้ loop ที่วนรัว ๆ กิน CPU เต็มที่ เพราะทุกรอบที่ยังไม่มีค่าให้อ่าน `default` จะถูกเลือกทันทีแล้ววนใหม่ทันที ถ้าอยากรอ ให้ปล่อยให้ `select` บล็อกไปตามปกติ

### ปิด case ใน `select` ด้วย nil channel

จำช่อง Nil ในตาราง Step 4 ได้ไหม ที่บอกว่าอ่าน nil channel จะค้างตลอดไป? ตรงนี้คือที่ที่มันมีประโยชน์

เวลารวมข้อมูลจากหลาย channel ด้วย `select` เราจะเจอปัญหาว่า case ที่อ่าน channel ที่ปิดแล้วจะ "สำเร็จ" ทุกครั้ง (คืน zero value) และเพราะ `select` สุ่มเลือก มันจะเสียเวลาไปอ่าน channel ที่ปิดแล้วเรื่อย ๆ

เทคนิคคือเมื่อตรวจพบว่า channel ปิดแล้ว ให้ตั้งตัวแปร channel นั้นเป็น `nil` เพราะ case ที่อ่าน nil channel จะไม่พร้อมอีกเลย เท่ากับปิด case นั้นทิ้ง:

```go
package main

import "fmt"

func main() {
	in := make(chan int)
	in2 := make(chan int)
	go func() {
		defer close(in)
		for i := 1; i <= 2; i++ {
			in <- i
		}
	}()
	go func() {
		defer close(in2)
		for i := 10; i <= 11; i++ {
			in2 <- i
		}
	}()
	for count := 0; count < 2; {
		select {
		case v, ok := <-in:
			if !ok {
				in = nil // case นี้จะไม่พร้อมอีกแล้ว
				count++
				continue
			}
			fmt.Println("in:", v)
		case v, ok := <-in2:
			if !ok {
				in2 = nil // case นี้จะไม่พร้อมอีกแล้ว
				count++
				continue
			}
			fmt.Println("in2:", v)
		}
	}
	fmt.Println("อ่านครบทั้งสอง channel")
}
```

ค่าที่ได้จะครบทั้งสี่ตัว แต่ **ลำดับการสลับกันระหว่าง `in` กับ `in2` เปลี่ยนได้ทุกครั้งที่รัน** เพราะ `select` สุ่มเลือกจาก case ที่พร้อม หนึ่งในผลลัพธ์ที่เป็นไปได้:

```text
in2: 10
in: 1
in2: 11
in: 2
อ่านครบทั้งสอง channel
```

ตัวนับ `count` ทำหน้าที่รอให้ครบทั้งสอง channel ปิดก่อนจะออกจาก loop ส่วน `continue` ทำให้ข้าม zero value ที่ไม่ต้องการไป

---

## Step 6: กัน goroutine leak ด้วย `context`

### goroutine ที่ไม่จบ คือ memory ที่คืนไม่ได้ (Why)

ตัวแปรที่ไม่มีใครใช้ garbage collector เก็บให้ได้ แต่ goroutine ไม่ใช่แบบนั้น — runtime ไม่มีทางรู้ว่า goroutine ที่กำลังค้างรอ channel อยู่นั้นจะไม่มีใครมาคุยกับมันอีกแล้ว

ผลคือ goroutine ที่ค้างตลอดไปจะกิน memory ทั้งของ stack ตัวเองและของทุกอย่างที่มันอ้างถึงอยู่ เรียกอาการนี้ว่า **goroutine leak** และมันไม่ฟ้อง error ให้เห็นเหมือน deadlock ใน Step 5 ด้วย เพราะโปรแกรมส่วนอื่นยังทำงานได้ปกติ

ลองดูของจริง แทนที่ `main.go` ด้วย generator ที่นับเลขให้:

```go
package main

import "fmt"

func countTo(max int) <-chan int {
	ch := make(chan int)
	go func() {
		for i := 0; i < max; i++ {
			ch <- i
		}
		close(ch)
	}()
	return ch
}

func main() {
	for i := range countTo(10) {
		if i > 5 {
			break
		}
		fmt.Println(i)
	}
	fmt.Println("main จบแล้ว แต่ goroutine ยังค้างรอเขียน channel")
}
```

ผลลัพธ์:

```text
0
1
2
3
4
5
main จบแล้ว แต่ goroutine ยังค้างรอเขียน channel
```

ดูเผิน ๆ เหมือนทำงานถูกต้องดี แต่ปัญหาอยู่ที่ `break` — เราขอเลขแค่ถึง `5` แล้วออกจาก loop ส่วน goroutine ข้างในยังพยายามเขียน `6` ลง channel อยู่ และจะรอคนอ่านไปตลอดกาล ในโปรแกรมสั้น ๆ แบบนี้ไม่เห็นผลเพราะ `main` จบแล้วโปรแกรมปิดทั้งกระบวน แต่ถ้าเป็น server ที่รันค้างและเรียก `countTo` ทุก request มันคือ leak ที่โตขึ้นเรื่อย ๆ

### บอกให้ goroutine หยุดด้วย `context.WithCancel` (How)

วิธีแก้คือให้ goroutine มีช่องทางรับสัญญาณว่า "เลิกแล้ว ไม่ต้องเขียนต่อ" ซึ่งเป็นงานของ `context`:

```go
package main

import (
	"context"
	"fmt"
)

func countTo(ctx context.Context, max int) <-chan int {
	ch := make(chan int)
	go func() {
		defer close(ch)
		for i := 0; i < max; i++ {
			select {
			case <-ctx.Done():
				return
			case ch <- i:
			}
		}
	}()
	return ch
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	for i := range countTo(ctx, 10) {
		if i > 5 {
			break
		}
		fmt.Println(i)
	}
	fmt.Println("main จบแล้ว และ goroutine ออกทาง ctx.Done()")
}
```

ผลลัพธ์:

```text
0
1
2
3
4
5
main จบแล้ว และ goroutine ออกทาง ctx.Done()
```

output หน้าตาเหมือนเดิม แต่ข้างในต่างกันสิ้นเชิง สิ่งที่เปลี่ยนมีสองจุด:

1. loop ใน goroutine กลายเป็น for-select loop ที่มีสอง case — พยายามเขียน `ch` กับคอยฟัง `ctx.Done()` ถ้าฝั่งไหนพร้อมก่อนก็ไปทางนั้น
2. `main` สร้าง context กับ cancel function ด้วย `context.WithCancel` แล้ว `defer cancel()`

พอ `main` จบ `cancel()` ถูกเรียก ซึ่งจะปิด channel ที่ `ctx.Done()` คืนมา และเพราะ "อ่านจาก channel ที่ปิดแล้วสำเร็จเสมอ" ตามตาราง Step 4 case นั้นจึงพร้อมทันที goroutine ก็ `return` ออกไปเรียบร้อย ไม่ leak

> ทุก goroutine ที่ launch ต้องตอบได้ว่ามันจะจบเมื่อไหร่ ถ้าตอบไม่ได้ ให้เตรียม `ctx.Done()` ไว้เป็นทางออกให้มันก่อน (รายละเอียดของ `context` ยังมีมากกว่านี้ และจะได้เจอกันอีกในบทหลัง ๆ)

---

## Step 7: buffered channel ใช้เมื่อไหร่ และ backpressure

### สามเงื่อนไขที่ buffered channel คุ้ม

Step 3 บอกให้เริ่มจาก unbuffered ไว้ก่อน เพราะ buffered channel เพิ่มคำถามที่ต้องตอบสองข้อ: จะเลือกขนาดเท่าไหร่ และจะทำอย่างไรเมื่อ buffer เต็มแล้วคนเขียนถูกบล็อก

เงื่อนไขที่ buffered channel มักคุ้มมีสามข้อ:

1. รู้จำนวน goroutine ที่ launch แน่นอน
2. อยากจำกัดจำนวน goroutine ที่จะ launch
3. อยากจำกัดปริมาณงานที่ค้างอยู่ในคิว

เคสที่ตรงกับข้อ 1 ชัดที่สุดคือการรวมผลกลับจาก goroutine ชุดที่เรา launch เอง แทนที่ `main.go` ด้วย:

```go
package main

import (
	"fmt"
	"sort"
)

func process(v int) int {
	return v * 2
}

func processChannel(in chan int, conc int) []int {
	results := make(chan int, conc)
	for i := 0; i < conc; i++ {
		go func() {
			v := <-in
			results <- process(v)
		}()
	}
	var out []int
	for i := 0; i < conc; i++ {
		out = append(out, <-results)
	}
	return out
}

func main() {
	const conc = 5
	in := make(chan int, conc)
	for i := 1; i <= conc; i++ {
		in <- i
	}
	out := processChannel(in, conc)
	fmt.Println("จำนวนผลลัพธ์:", len(out))
	sort.Ints(out)
	fmt.Println("หลัง sort:", out)
}
```

ผลลัพธ์:

```text
จำนวนผลลัพธ์: 5
หลัง sort: [2 4 6 8 10]
```

จุดที่ต้องสังเกตคือเราต้อง `sort` ก่อนจะพิมพ์ออกมา เพราะ **ลำดับที่ผลลัพธ์ไหลกลับมาไม่คงที่** goroutine ตัวไหนทำเสร็จก่อนก็เขียนลง `results` ก่อน ถ้าโปรแกรมของเราต้องการลำดับที่แน่นอน ต้องจัดเรียงเองทีหลัง หรือออกแบบให้แต่ละผลลัพธ์พก index ของตัวเองมาด้วย

ส่วน `results` เป็น buffered ขนาด `conc` เพื่อให้ goroutine ทุกตัวเขียนผลลัพธ์ทิ้งไว้แล้วจบงานได้ทันที ไม่ต้องยืนรอให้ `main` มาอ่านถึงจะปล่อยตัวได้ ซึ่งก็คือการกัน leak แบบหนึ่ง

### backpressure — จำกัดงานที่ยอมรับ

อีกเทคนิคที่ทำด้วย buffered channel คือ **backpressure** ฟังดูขัดความรู้สึกว่าทำไมต้องจำกัดตัวเอง แต่ระบบมักทำงานดีขึ้นเมื่อแต่ละส่วนยอมรับงานเท่าที่รับได้จริง แล้วปฏิเสธส่วนเกินไปตรง ๆ ดีกว่ารับไว้หมดแล้วช้าลงทั้งระบบ

วิธีทำคือใช้ buffered channel เก็บ "token" จำนวนจำกัด ใครจะทำงานต้องหยิบ token ไปก่อน:

```go
package main

import (
	"errors"
	"fmt"
	"time"
)

type PressureGauge struct {
	ch chan struct{}
}

func New(limit int) *PressureGauge {
	return &PressureGauge{
		ch: make(chan struct{}, limit),
	}
}

func (pg *PressureGauge) Process(f func()) error {
	select {
	case pg.ch <- struct{}{}:
		f()
		<-pg.ch
		return nil
	default:
		return errors.New("no more capacity")
	}
}

func main() {
	pg := New(2)
	const callers = 5

	results := make(chan error, callers)
	for i := 0; i < callers; i++ {
		go func() {
			results <- pg.Process(func() {
				time.Sleep(200 * time.Millisecond)
			})
		}()
	}

	var passed, rejected int
	for i := 0; i < callers; i++ {
		if err := <-results; err == nil {
			passed++
		} else {
			rejected++
		}
	}
	fmt.Printf("limit=2 callers=%d -> ผ่าน %d, ถูกปฏิเสธ %d\n", callers, passed, rejected)
}
```

ผลลัพธ์:

```text
limit=2 callers=5 -> ผ่าน 2, ถูกปฏิเสธ 3
```

ไล่ดูกลไก: `Process` ใช้ `select` พยายามเขียน token ลง channel ถ้าเขียนได้ก็รัน `f()` แล้วอ่าน token ออกเพื่อคืนที่ให้คนถัดไป ถ้า buffer เต็ม (มีคนทำงานอยู่ครบ 2 คนแล้ว) case ที่เขียนจะไม่พร้อม `default` จึงทำงานและคืน error ทันทีโดยไม่ต้องรอ

นี่เป็นเคสหายากที่ goroutine เดียวกันทั้งอ่านและเขียน channel เดียวกัน ซึ่งปกติเราไม่ทำ แต่ในบริบทของการนับ token มันตรงไปตรงมากว่าวิธีอื่น

ตัวเลข `ผ่าน 2` คงที่เพราะ `f()` ใช้เวลา 200 มิลลิวินาที ซึ่งนานพอให้ทั้ง 5 goroutine มาถึงจุดตรวจก่อนที่คนแรกจะปล่อย token แต่ถ้าลดเวลานั้นลงเหลือระดับไมโครวินาที ตัวเลขจะเริ่มไม่แน่นอน เพราะ token อาจถูกคืนทันก่อนคนหลังมาถึง

**Why:** ปฏิเสธงานส่วนเกินอย่างรวดเร็วและชัดเจน ดีกว่ารับไว้ทั้งหมดจนทุก request ช้าลงพร้อมกัน

**How:** สร้าง buffered channel ขนาดเท่า limit ที่รับได้ แล้วใช้ `select` กับ `default` เป็นตัวตัดสินว่ารับหรือปฏิเสธ

---

## Step 8: รอ goroutine หลายตัวด้วย `sync.WaitGroup`

Step 6 ใช้ context บอก goroutine ตัวเดียวให้หยุด แต่ถ้าต้อง **รอหลายตัว** ให้ทำงานเสร็จก่อนจะไปต่อ เครื่องมือที่ตรงงานคือ `sync.WaitGroup`

`sync.WaitGroup` ไม่ต้อง initialize แค่ประกาศก็ใช้ได้เลย (zero value พร้อมใช้) และมีสาม method:

| Method | หน้าที่ |
|---|---|
| `Add(n)` | เพิ่มตัวนับตามจำนวน goroutine ที่จะรอ |
| `Done()` | ลดตัวนับลงหนึ่ง เรียกด้วย `defer` เพื่อให้ถูกเรียกแม้ goroutine จะ panic |
| `Wait()` | หยุด goroutine ที่เรียก จนตัวนับเป็นศูนย์ |

โครงพื้นฐานหน้าตาแบบนี้:

```go
var wg sync.WaitGroup
wg.Add(3)
go func() {
	defer wg.Done()
	doThing1()
}()
go func() {
	defer wg.Done()
	doThing2()
}()
go func() {
	defer wg.Done()
	doThing3()
}()
wg.Wait()
```

### ใช้ WaitGroup ปิด channel ที่หลายตัวเขียนให้ถูกครั้งเดียว

ประโยชน์ที่ชัดที่สุดของ WaitGroup คือแก้ปัญหาที่ค้างไว้จาก Step 4: เมื่อมีหลาย goroutine เขียน channel เดียวกัน ใครควรเป็นคนปิด? ถ้าให้ทุกตัวปิดก็ panic เพราะ `close` ซ้ำ ถ้าไม่ปิดเลย `for-range` ฝั่งอ่านก็ไม่จบ

คำตอบคือ launch goroutine อีกตัวมาคอยรอทุกตัวจบแล้วปิดให้ครั้งเดียว แทนที่ `main.go` ด้วย:

```go
package main

import (
	"fmt"
	"sort"
	"sync"
)

func processAndGather[T, R any](in <-chan T, processor func(T) R, num int) []R {
	out := make(chan R, num)
	var wg sync.WaitGroup
	wg.Add(num)
	for i := 0; i < num; i++ {
		go func() {
			defer wg.Done()
			for v := range in {
				out <- processor(v)
			}
		}()
	}
	go func() {
		wg.Wait()
		close(out)
	}()
	var result []R
	for v := range out {
		result = append(result, v)
	}
	return result
}

func main() {
	in := make(chan int, 5)
	for i := 1; i <= 5; i++ {
		in <- i
	}
	close(in)
	result := processAndGather(in, func(v int) int { return v * v }, 3)
	sort.Ints(result)
	fmt.Println(result)
}
```

ผลลัพธ์:

```text
[1 4 9 16 25]
```

(ต้อง `sort` ก่อนพิมพ์เหมือน Step 7 เพราะลำดับที่ worker ส่งผลกลับมาไม่คงที่)

โครงนี้ประกอบสิ่งที่เรียนมาหลายอย่างเข้าด้วยกัน worker ทั้ง `num` ตัวอ่านงานจาก `in` ตัวเดียวกัน (ใครหยิบได้ก็ทำ) แล้วเขียนผลลง `out` ส่วน goroutine ที่ไม่ทำงานอะไรเลยนอกจาก `wg.Wait()` แล้ว `close(out)` เป็นตัวประกาศว่า "ไม่มีใครเขียนอีกแล้ว" ซึ่งทำให้ `for-range` ฝั่งอ่านออกจาก loop ได้พอดี

ฟังก์ชันนี้ยังใช้ generics จากตอนที่ 8 ด้วย ทำให้เอาไปใช้กับ type อะไรก็ได้โดยไม่ต้องเขียนซ้ำ

> ไม่ต้องส่ง `sync.WaitGroup` เข้า goroutine เป็น parameter ให้ closure capture ไปเลย ด้วยเหตุผลสองข้อ: ต้องมั่นใจว่าทุกที่ใช้ instance เดียวกัน (ถ้าส่งแบบ value `Done` จะไปลดตัวนับของสำเนา ไม่ใช่ตัวจริง) และเพื่อเก็บเรื่อง concurrency ไว้ในตัว closure ตามธรรมเนียมของ Step 2

WaitGroup สะดวก แต่ไม่ควรเป็นเครื่องมือแรกที่หยิบมาใช้ประสาน goroutine ให้ใช้เมื่อมีอะไรต้องเก็บกวาดหลัง worker ทุกตัวจบ อย่างการปิด channel ในตัวอย่างนี้ ถ้าต้องการกลุ่ม goroutine ที่หยุดกันหมดเมื่อตัวใดตัวหนึ่ง return error แพ็กเกจ `golang.org/x/sync/errgroup` ที่ทีม Go ดูแลอยู่ต่อยอดจาก WaitGroup ให้แล้ว

---

## Step 9: ตั้งเวลาให้งานด้วย `context.WithTimeout`

โปรแกรมที่ต้องตอบผู้ใช้มักมีเพดานเวลาว่ารอได้นานแค่ไหน Go ไม่ได้เพิ่ม feature พิเศษสำหรับเรื่องนี้ แต่ประกอบจากชิ้นส่วนที่เรามีอยู่แล้วคือ goroutine, buffered channel, `select` และ `context`:

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"time"
)

func timeLimit[T any](worker func() T, limit time.Duration) (T, error) {
	out := make(chan T, 1)
	ctx, cancel := context.WithTimeout(context.Background(), limit)
	defer cancel()
	go func() {
		out <- worker()
	}()
	select {
	case result := <-out:
		return result, nil
	case <-ctx.Done():
		var zero T
		return zero, errors.New("work timed out")
	}
}

func slowWork() string {
	time.Sleep(300 * time.Millisecond)
	return "งานเสร็จแล้ว"
}

func main() {
	result, err := timeLimit(slowWork, 50*time.Millisecond)
	fmt.Printf("limit 50ms -> result=%q err=%v\n", result, err)

	result, err = timeLimit(slowWork, time.Second)
	fmt.Printf("limit 1s   -> result=%q err=%v\n", result, err)
}
```

ผลลัพธ์:

```text
limit 50ms -> result="" err=work timed out
limit 1s   -> result="งานเสร็จแล้ว" err=<nil>
```

`context.WithTimeout` สร้าง context ที่จะ cancel ตัวเองเมื่อครบเวลา ทำให้ channel จาก `ctx.Done()` พร้อมให้อ่าน จากนั้น `select` ก็แข่งกันสองทาง: ผลงานมาถึงก่อน หรือเวลาหมดก่อน ใครถึงก่อนได้ไป

มีรายละเอียดหนึ่งที่สำคัญกว่าที่เห็น คือ `out` เป็น buffered channel ขนาด `1` ไม่ใช่ unbuffered ถ้าใช้ unbuffered แล้วเกิด timeout ขึ้นก่อน `timeLimit` จะ return ไปโดยไม่มีใครอ่าน `out` อีกเลย ทำให้ goroutine ค้างอยู่ที่ `out <- worker()` ตลอดไป — leak ตรง ๆ ตามที่เรียนใน Step 6 การมี buffer หนึ่งช่องทำให้มันเขียนทิ้งไว้แล้วจบตัวเองได้ เราแค่ไม่เอาผลนั้นมาใช้

แต่ต้องเข้าใจให้ตรงว่า **timeout แบบนี้ไม่ได้หยุดงานที่กำลังทำอยู่** มันแค่เลิกรอผล ถ้าอยากให้ตัวงานหยุดจริง ๆ ต้องส่ง `ctx` เข้าไปให้ worker แล้วให้ worker คอยเช็ก `ctx.Done()` เองด้วย

**Why:** จำกัดเวลารอโดยไม่ทิ้ง goroutine ค้างไว้ และคืน error ที่ผู้เรียกจัดการต่อได้

**How:** ใช้ `context.WithTimeout` คู่กับ `select` และให้ channel รับผลมี buffer อย่างน้อยหนึ่งช่อง

---

## Step 10: รัน initialization ครั้งเดียวด้วย `sync.OnceValue`

บางครั้งเรามี setup ที่ช้าและอาจไม่ได้ใช้ทุกครั้งที่โปรแกรมรัน การยัดไว้ใน `init` จะทำให้ทุกคนต้องจ่ายค่านั้นเสมอ ทางที่ดีกว่าคือ lazy load — โหลดตอนใช้ครั้งแรก แล้วครั้งต่อ ๆ ไปใช้ของเดิม

เครื่องมือเดิมของงานนี้คือ `sync.Once` ซึ่งรับ closure ไปรันครั้งเดียวเท่านั้น แต่ตั้งแต่ Go 1.21 มี helper ที่เขียนสั้นกว่าและคืนค่าให้เลย คือ `sync.OnceFunc`, `sync.OnceValue` และ `sync.OnceValues` (ต่างกันที่จำนวนค่าที่ function ส่งกลับ: ไม่คืนค่า, คืนหนึ่งค่า และคืนสองค่า)

แทนที่ `main.go` ด้วยตัวอย่างที่ใช้ `sync.OnceValue`:

```go
package main

import (
	"fmt"
	"strings"
	"sync"
)

type Parser struct {
	replacer *strings.Replacer
}

func (p *Parser) Parse(s string) string {
	return p.replacer.Replace(s)
}

func initParser() *Parser {
	fmt.Println("initParser ทำงาน (ควรเห็นบรรทัดนี้ครั้งเดียว)")
	return &Parser{replacer: strings.NewReplacer("go", "Go")}
}

var initParserCached = sync.OnceValue(initParser)

func Parse(s string) string {
	return initParserCached().Parse(s)
}

func main() {
	fmt.Println(Parse("go is fun"))
	fmt.Println(Parse("learning go"))
	fmt.Println(Parse("go go go"))
}
```

ผลลัพธ์:

```text
initParser ทำงาน (ควรเห็นบรรทัดนี้ครั้งเดียว)
Go is fun
learning Go
Go Go Go
```

เรียก `Parse` สามครั้ง แต่ `initParser` ทำงานครั้งเดียว ครั้งที่สองและสามได้ค่าที่ cache ไว้ และเพราะ `sync.OnceValue` จัดการ synchronization ให้แล้ว ถึงจะมีหลาย goroutine เรียกพร้อมกันก็ยังรับประกันว่า `initParser` ทำงานครั้งเดียว

ข้อดีอีกอย่างคือเราไม่ต้องมีตัวแปรระดับ package ไว้เก็บ `parser` แยกอีกตัว ต่างจากการเขียนด้วย `sync.Once` แบบเดิมที่ต้องประกาศทั้งตัว `once` และตัวแปรที่รับผลลัพธ์

> ⚠️ อย่า copy instance ของ `sync.Once` (เช่นเดียวกับ `sync.WaitGroup` และ mutex) เพราะแต่ละสำเนามีสถานะของตัวเองว่าถูกใช้ไปแล้วหรือยัง การประกาศ `sync.Once` ไว้ข้างใน function มักผิดเจตนา เพราะจะได้ instance ใหม่ทุกครั้งที่เรียก แล้วมันก็จะรัน closure ใหม่ทุกครั้งไปด้วย

---

## Step 11: เมื่อไหร่ควรใช้ mutex แทน channel

### mutex บดบัง data flow (Why)

**mutex** ย่อมาจาก mutual exclusion หน้าที่ของมันคือกันไม่ให้โค้ดหรือข้อมูลส่วนหนึ่งถูกเข้าถึงพร้อมกันจากหลาย goroutine ส่วนที่ถูกป้องกันเรียกว่า **critical section**

ปัญหาหลักของ mutex ไม่ใช่เรื่องความถูกต้อง แต่เป็นเรื่องความชัดเจน เวลาค่าไหลจาก goroutine หนึ่งไปอีกตัวผ่าน channel เราอ่านโค้ดแล้วเห็นเลยว่าตอนนี้ใครถือค่าอยู่ แต่เมื่อใช้ mutex ป้องกันค่าไว้ ไม่มีอะไรในโค้ดบอกว่า goroutine ไหน "เป็นเจ้าของ" ค่านั้นในช่วงเวลาใด เพราะทุกตัวมีสิทธิ์เข้าถึงเท่ากันหมด

นี่คือที่มาของสโลแกนที่ community ของ Go พูดกันบ่อย:

> Share memory by communicating; do not communicate by sharing memory.

### แต่บางเคส mutex ก็ตรงกว่า (How)

เคสที่ mutex ชนะชัด ๆ คือเมื่อหลาย goroutine **อ่านและเขียนค่าร่วมกัน แต่ไม่ได้เอาค่านั้นไปแปลงต่อเป็นทอด ๆ** เช่น scoreboard ของเกมที่ผู้เล่นอัปเดตคะแนนของตัวเองเข้ามาเรื่อย ๆ

standard library มีสองตัวให้เลือกใน `sync`:

| Type | Method | พฤติกรรม |
|---|---|---|
| `sync.Mutex` | `Lock` / `Unlock` | goroutine ที่เรียก `Lock` หยุดรอจน critical section ว่าง แล้วจึงเข้าไปได้ทีละตัว |
| `sync.RWMutex` | `Lock`/`Unlock` (ฝั่งเขียน), `RLock`/`RUnlock` (ฝั่งอ่าน) | ฝั่งเขียนเข้าได้ทีละตัว แต่ฝั่งอ่านแชร์กันได้ — หลายตัวอ่านพร้อมกันได้ |

ถ้างานส่วนใหญ่เป็นการอ่าน `sync.RWMutex` มักได้เปรียบกว่า แทนที่ `main.go` ด้วย:

```go
package main

import (
	"fmt"
	"sync"
)

type MutexScoreboardManager struct {
	l          sync.RWMutex
	scoreboard map[string]int
}

func NewMutexScoreboardManager() *MutexScoreboardManager {
	return &MutexScoreboardManager{
		scoreboard: map[string]int{},
	}
}

func (msm *MutexScoreboardManager) Update(name string, val int) {
	msm.l.Lock()
	defer msm.l.Unlock()
	msm.scoreboard[name] = val
}

func (msm *MutexScoreboardManager) Read(name string) (int, bool) {
	msm.l.RLock()
	defer msm.l.RUnlock()
	val, ok := msm.scoreboard[name]
	return val, ok
}

func main() {
	sb := NewMutexScoreboardManager()
	players := map[string]int{"pan": 120, "mint": 95, "ken": 143}

	var wg sync.WaitGroup
	wg.Add(len(players))
	for name, score := range players {
		go func() {
			defer wg.Done()
			sb.Update(name, score)
		}()
	}
	wg.Wait()

	for _, name := range []string{"pan", "mint", "ken", "ghost"} {
		val, ok := sb.Read(name)
		fmt.Printf("%-5s score=%d found=%t\n", name, val, ok)
	}
}
```

ผลลัพธ์คงที่ เพราะแต่ละชื่อถูกเขียนครั้งเดียว และเราอ่านหลัง `wg.Wait()` จบแล้ว:

```text
pan   score=120 found=true
mint  score=95 found=true
ken   score=143 found=true
ghost score=0 found=false
```

สังเกตว่า `Read` ของชื่อที่ไม่มีอยู่คืน `0` กับ `false` — เป็น comma ok idiom ตัวเดิมที่ใช้กับ map ไม่ใช่ error ส่วนการ `defer` เรียก `Unlock`/`RUnlock` ทันทีหลัง `Lock`/`RLock` เป็นนิสัยที่ควรติดตัว เพราะ lock ที่ไม่ถูกปล่อยจะทำให้ทุก goroutine ที่รออยู่ค้างถาวร

### แล้วจะเลือกอย่างไร

หนังสือ *Concurrency in Go* ของ Katherine Cox-Buday ให้แนวตัดสินใจไว้แบบนี้:

| สถานการณ์ | เลือก |
|---|---|
| ต้องประสานจังหวะ goroutine หรือติดตามค่าที่ถูกแปลงผ่าน goroutine หลายตัว | **channel** |
| แชร์การเข้าถึง field ใน struct เฉย ๆ ไม่ได้ส่งค่าต่อเป็นทอด ๆ | **mutex** |
| ใช้ channel แล้วเจอปัญหา performance ที่วิกฤตจริงและหาทางอื่นไม่ได้ | ค่อยเปลี่ยนเป็น **mutex** |

scoreboard เข้าเงื่อนไขข้อสองพอดี เพราะมันเป็น field ใน struct และไม่มีการส่งค่าต่อไปที่ไหน แต่มีข้อแม้เพิ่มคือ ข้อมูลต้องอยู่ **ใน memory** ถ้าข้อมูลจริงอยู่ที่ database หรือ service อื่น อย่าใช้ mutex ในโปรแกรมเราไปป้องกันมัน เพราะ process อื่นก็แก้ข้อมูลนั้นได้อยู่แล้ว mutex ของเราไม่มีผลกับใครนอกจากตัวเอง

### ข้อควรระวังของ mutex

- **mutex ของ Go ไม่ reentrant** ถ้า goroutine ที่ถือ lock อยู่พยายาม `Lock` ตัวเดิมอีกครั้ง มันจะรอตัวเองไปตลอด (ต่างจาก lock ใน Java ที่ reentrant) จึงต้องระวังการถือ lock ค้างไว้ระหว่างเรียก function อื่น โดยเฉพาะ recursion ที่ต้องปล่อย lock ก่อนเรียกตัวเอง
- **ห้าม copy mutex** ต้องส่งผ่าน pointer เสมอ ไม่อย่างนั้นแต่ละสำเนาจะล็อกกันเอง ไม่ได้ล็อกร่วมกัน (เหตุผลเดียวกับ `sync.WaitGroup` และ `sync.Once`)
- **`sync.Map` ไม่ใช่ map ที่เรากำลังมองหา** ใน `sync` มี type ชื่อ `Map` ที่ปลอดภัยต่อ concurrency แต่ด้วย trade-off ในการ implement มันเหมาะกับเคสจำเพาะมาก คือเมื่อ key-value ถูกใส่ครั้งเดียวแล้วอ่านซ้ำเยอะ ๆ หรือเมื่อแต่ละ goroutine ไม่ยุ่งกับ key ของตัวอื่น อีกอย่างมันถูกเพิ่มเข้ามาก่อนที่ Go จะมี generics จึงใช้ `any` เป็น type ของ key/value ทำให้ compiler ช่วยตรวจ type ไม่ได้ เคสทั่วไปที่ต้องแชร์ map ข้าม goroutine ให้ใช้ built-in map คู่กับ `sync.RWMutex` แบบตัวอย่างข้างบนดีกว่า

### แล้ว atomics?

Go ยังมีแพ็กเกจ `sync/atomic` ที่เข้าถึง atomic operation ระดับ CPU ได้ตรง ๆ (add, swap, load, store และ compare-and-swap) บนค่าที่ใส่ลง register เดียวได้ ถ้าถึงจุดที่ต้องรีดทุกหยดของ performance และเชี่ยวชาญ concurrent code แล้ว เราจะดีใจที่ Go มีให้ แต่สำหรับงานส่วนใหญ่ goroutine, channel และ mutex ก็เพียงพอแล้ว

### จับ concurrency bug ด้วย race detector

การเข้าถึงตัวแปรเดียวกันจากหลาย goroutine โดยไม่ป้องกันจะทำให้เกิด **data race** ซึ่งอาการมักแปลกและไม่เกิดซ้ำ ทำให้ debug ยากมาก โชคดีที่ Go มีเครื่องมือให้:

```sh
go run -race .
```

flag `-race` ใส่ได้กับทั้ง `go run`, `go build` และ `go test` มันจะเฝ้าดูการเข้าถึง memory ระหว่างรัน แล้วรายงาน `WARNING: DATA RACE` พร้อมบอกว่า goroutine ไหนอ่านและตัวไหนเขียนตรงบรรทัดใด

ข้อแม้คือมันตรวจได้เฉพาะ race ที่ **เกิดขึ้นจริงในรอบที่รัน** ไม่ใช่การพิสูจน์ว่าโค้ดไม่มี race เลย และโปรแกรมจะทำงานช้าลงกับกิน memory มากขึ้นตอนเปิด flag นี้ จึงเหมาะกับตอน test และ CI มากกว่า production

ลองรัน `go run -race .` กับตัวอย่างใน Step นี้ดูได้ ถ้า mutex ทำงานถูกต้องจะไม่มี warning ออกมา แล้วลองเอา `msm.l.Lock()` กับ `defer msm.l.Unlock()` ใน `Update` ออกดู จะเห็นความต่างทันที

---

## Step 12: ประกอบทุกอย่างเข้าด้วยกัน

ปิดท้ายด้วยเคสที่เกริ่นไว้ตั้งแต่ Step 1: function ที่ต้องเรียก service สามตัว — ส่งข้อมูลไปที่ A และ B พร้อมกัน เอาผลทั้งสองมารวมส่งให้ C แล้วทั้งหมดต้องเสร็จภายในเวลาที่กำหนด ไม่งั้นคืน error

โค้ดชุดนี้ยาวกว่าตัวอย่างอื่น แต่คุ้มที่จะอ่านจนจบ เพราะมันคือ goroutine, buffered channel, `select` และ `context` ทำงานร่วมกันทั้งหมด แทนที่ `main.go` ด้วย:

```go
package main

import (
	"context"
	"fmt"
	"time"
)

type Input struct {
	A string
	B string
}

type aOut struct{ Score int }
type bOut struct{ Label string }
type cIn struct {
	a aOut
	b bOut
}
type COut struct{ Summary string }

// สาม function นี้จำลองการเรียก service ที่ใช้เวลา
func getResultA(ctx context.Context, in string) (aOut, error) {
	time.Sleep(20 * time.Millisecond)
	return aOut{Score: len(in)}, nil
}

func getResultB(ctx context.Context, in string) (bOut, error) {
	time.Sleep(20 * time.Millisecond)
	return bOut{Label: "b:" + in}, nil
}

func getResultC(ctx context.Context, in cIn) (COut, error) {
	time.Sleep(10 * time.Millisecond)
	return COut{Summary: fmt.Sprintf("%s score=%d", in.b.Label, in.a.Score)}, nil
}

type abProcessor struct {
	outA chan aOut
	outB chan bOut
	errs chan error
}

func newABProcessor() *abProcessor {
	return &abProcessor{
		outA: make(chan aOut, 1),
		outB: make(chan bOut, 1),
		errs: make(chan error, 2), // รับ error ได้สูงสุดสองตัว
	}
}

func (p *abProcessor) start(ctx context.Context, data Input) {
	go func() {
		a, err := getResultA(ctx, data.A)
		if err != nil {
			p.errs <- err
			return
		}
		p.outA <- a
	}()
	go func() {
		b, err := getResultB(ctx, data.B)
		if err != nil {
			p.errs <- err
			return
		}
		p.outB <- b
	}()
}

func (p *abProcessor) wait(ctx context.Context) (cIn, error) {
	var cData cIn
	for count := 0; count < 2; count++ {
		select {
		case a := <-p.outA:
			cData.a = a
		case b := <-p.outB:
			cData.b = b
		case err := <-p.errs:
			return cIn{}, err
		case <-ctx.Done():
			return cIn{}, ctx.Err()
		}
	}
	return cData, nil
}

type cProcessor struct {
	outC chan COut
	errs chan error
}

func newCProcessor() *cProcessor {
	return &cProcessor{
		outC: make(chan COut, 1),
		errs: make(chan error, 1),
	}
}

func (p *cProcessor) start(ctx context.Context, in cIn) {
	go func() {
		c, err := getResultC(ctx, in)
		if err != nil {
			p.errs <- err
			return
		}
		p.outC <- c
	}()
}

func (p *cProcessor) wait(ctx context.Context) (COut, error) {
	select {
	case out := <-p.outC:
		return out, nil
	case err := <-p.errs:
		return COut{}, err
	case <-ctx.Done():
		return COut{}, ctx.Err()
	}
}

func GatherAndProcess(ctx context.Context, data Input, limit time.Duration) (COut, error) {
	ctx, cancel := context.WithTimeout(ctx, limit)
	defer cancel()

	ab := newABProcessor()
	ab.start(ctx, data)
	inputC, err := ab.wait(ctx)
	if err != nil {
		return COut{}, err
	}

	c := newCProcessor()
	c.start(ctx, inputC)
	return c.wait(ctx)
}

func main() {
	data := Input{A: "rainbow", B: "gopher"}

	out, err := GatherAndProcess(context.Background(), data, 200*time.Millisecond)
	fmt.Printf("limit 200ms -> out=%+v err=%v\n", out, err)

	out, err = GatherAndProcess(context.Background(), data, 5*time.Millisecond)
	fmt.Printf("limit 5ms   -> out=%+v err=%v\n", out, err)
}
```

ผลลัพธ์:

```text
limit 200ms -> out={Summary:b:gopher score=7} err=<nil>
limit 5ms   -> out={Summary:} err=context deadline exceeded
```

เรียกครั้งแรกด้วยเพดาน 200 มิลลิวินาที: A กับ B ใช้เวลา 20 มิลลิวินาทีโดยรันพร้อมกัน แล้ว C อีก 10 รวมประมาณ 30 จึงเสร็จทัน ครั้งที่สองให้เวลาแค่ 5 มิลลิวินาที ยังไม่ถึงขั้น A กับ B เสร็จเลย `ctx.Done()` จึงพร้อมก่อน และเราได้ `context deadline exceeded` กลับมา

จุดที่ควรสังเกตในโค้ดชุดนี้:

- ตัว `GatherAndProcess` **อ่านเหมือนโค้ดที่ทำงานเรียงลำดับปกติ** ไม่มี `go` หรือ `select` โผล่มาเลย เรื่อง concurrency ถูกซ่อนไว้ใน `abProcessor` กับ `cProcessor` ทั้งหมด — นี่คือหลักจาก Step 2 ที่บอกว่าให้เก็บ concurrency ออกจาก API
- channel ทุกตัวเป็น **buffered** เพื่อให้ goroutine ที่เขียนผลลัพธ์จบตัวเองได้ทันทีแม้ไม่มีใครรออ่าน ซึ่งกัน leak ตามที่เรียนใน Step 6 และ 9
- `errs` มี buffer เท่ากับจำนวน goroutine ที่อาจส่ง error เข้ามา (สองตัวใน `abProcessor`) จึงไม่มีทางที่ goroutine จะค้างตอนรายงาน error
- `wait` ของ `abProcessor` คือส่วนที่ซับซ้อนที่สุด — `for` loop นับถึงสองเพราะต้องได้ผลจากทั้ง A และ B ส่วน `select` ข้างในมีสี่ทาง: ได้ผล A, ได้ผล B, เจอ error แล้วคืนทันที หรือหมดเวลาแล้วคืน `ctx.Err()`
- `ctx` ถูกส่งต่อเข้าไปให้ทุก service function ทำให้ถ้าเขียน service จริง มันจะรู้ว่าเมื่อไหร่ควรเลิกทำงานกลางทาง

ที่สำคัญคือ `GatherAndProcess` รับ `ctx` จากผู้เรียกด้วย แปลว่ามันเคารพทั้ง timeout ที่ตั้งเองและ deadline ที่ถูกตั้งมาจากชั้นบนของ call stack — ถ้าใครข้างบนสั่ง cancel มาก่อน ทุกอย่างข้างในก็หยุดตามกันหมด

> โครงสร้างแบบนี้แยกแต่ละขั้นออกจากกันชัดเจน ปล่อยให้ส่วนที่อิสระต่อกันรันและจบในลำดับใดก็ได้ แล้วส่งข้อมูลต่อกันอย่างเป็นระเบียบ โดยไม่มีส่วนไหนค้าง

---

## แบบฝึกหัด

ลองทำโจทย์ต่อไปนี้ใน project `go-concurrency` โดยไม่เปิดเฉลยก่อน:

1. เขียนโปรแกรมที่มีสาม goroutine สื่อสารกันผ่าน channel — สองตัวแรกเขียนตัวเลขลง channel ตัวละ 10 ค่า (ตัวแรกเขียน 1 ถึง 10 ตัวที่สองเขียน 11 ถึง 20) ตัวที่สามอ่านจนครบทั้ง 20 ค่าแล้วพิมพ์ออกมา จบโปรแกรมโดยไม่มี goroutine ค้าง ให้ปิด channel จากฝั่งที่เขียนและใช้ `for-range` ฝั่งอ่าน แล้วยืนยันด้วย `go run -race .` ว่าไม่มี data race โดยไม่ต้องใช้ `time.Sleep` ช่วยจับจังหวะ
2. เขียนโปรแกรมที่มีสอง goroutine เขียนลง channel คนละตัว แล้วใช้ for-select loop อ่านทั้งคู่พร้อมพิมพ์ว่าค่านั้นมาจาก channel ไหน เมื่อ channel ใดปิดให้ตั้งตัวแปรนั้นเป็น `nil` เพื่อปิด case แล้วออกจาก loop เมื่อปิดครบทั้งสอง ต้องไม่พิมพ์ zero value ที่ได้จาก channel ที่ปิดแล้วออกมาเลย และอธิบายได้ว่าทำไมลำดับ output จึงไม่เหมือนกันทุกครั้งที่รัน
3. เขียน function `SquareRoots() map[int]float64` ที่สร้าง map ของรากที่สองของเลข 0 ถึง 100,000 โดยห่อด้วย `sync.OnceValue` ให้คำนวณครั้งเดียวแม้ถูกเรียกหลายครั้ง จาก `main` ให้เรียกสองครั้งแล้ว lookup ค่าทุก ๆ ตัวที่ 1,000 พิมพ์ผลออกมา ต้องเห็นข้อความที่ยืนยันว่าการคำนวณเกิดขึ้นครั้งเดียว และไม่ต้อง cleanup resource ใด ๆ
4. เขียน function `FetchAll(ctx context.Context, urls []string, workers int) ([]string, error)` ที่รับ list ของ URL แล้วให้ worker จำนวน `workers` ตัวช่วยกันดึงข้อมูล (จำลองด้วย `time.Sleep` แทนการเรียก network จริงก็ได้) คืน slice ของผลลัพธ์คู่กับ `nil` เมื่อสำเร็จทั้งหมด และคืน `nil` คู่กับ error ตัวแรกที่เจอเมื่อมีตัวใดล้มเหลว หรือคืน `ctx.Err()` เมื่อ context ถูก cancel ก่อน ให้ใช้ `sync.WaitGroup` ปิด channel ผลลัพธ์ให้ถูกครั้งเดียว และต้องไม่มี goroutine ค้างในทุกเส้นทาง รวมถึงเส้นทางที่คืน error ก่อนเวลา
5. สร้าง `Counter` struct ที่มี method `Inc()` และ `Value() int` โดยเวอร์ชันแรกเขียนแบบ **ไม่ป้องกันอะไรเลย** แล้วเรียก `Inc()` จาก 100 goroutine พร้อมกัน รัน `go run -race .` แล้วบันทึกว่า race detector รายงานอะไรและค่าที่ได้ตรงกับ 100 หรือไม่ จากนั้นแก้ด้วย `sync.Mutex` ให้ค่าออกมาเป็น 100 ทุกครั้งและไม่มี warning จาก `-race` ห้ามแก้ด้วยการลบ goroutine ออกหรือใส่ `time.Sleep` คั่น

ตรวจโค้ดหลังทำเสร็จ:

```sh
go fmt ./...
go vet ./...
go run -race .
go build ./...
```

สำหรับบทนี้ `go run -race .` สำคัญเป็นพิเศษ เพราะ concurrency bug หลายตัว compile ผ่านและรันผ่านได้สบายในรอบที่โชคดี

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คิดว่าใส่ `go` แล้วโปรแกรมจะเร็วขึ้น** — concurrency คือการจัดโครงสร้าง ไม่ใช่การเร่งความเร็ว ให้ใช้กับงานอิสระที่กินเวลานาน (มักเป็น I/O) แล้ววัดด้วย benchmark เทียบกับเวอร์ชัน serial
- **launch goroutine แล้วปล่อยให้ `main` จบเลย** — โปรแกรมจบพร้อม kill goroutine ที่เหลือ ต้องมีจุดรอ ไม่ว่าจะเป็นการอ่าน channel หรือ `sync.WaitGroup`
- **เขียนหรือปิด channel ที่ปิดแล้ว** — panic ทุกครั้ง ให้ goroutine ที่เขียนเป็นคนปิด และถ้ามีหลายตัวเขียน ใช้ WaitGroup กับ goroutine ตัวเดียวที่ปิดให้
- **อ่าน channel ที่อาจปิดแล้วโดยไม่ใช้ comma ok** — จะได้ zero value ปนเข้ามาโดยไม่รู้ตัว เพราะการอ่านจาก closed channel สำเร็จเสมอ
- **ใส่ `default` ใน for-select loop** — loop จะวนรัว ๆ กิน CPU ถ้าต้องการรอ ให้ปล่อย `select` บล็อกไปตามปกติ
- **ลืมว่า `select` เลือกแบบสุ่ม** — อย่าออกแบบโดยอาศัยว่า case ไหนจะถูกเลือกก่อน และอย่าคาดหวังลำดับ output ที่คงที่
- **คาดหวังลำดับผลลัพธ์จาก worker หลายตัว** — ใครเสร็จก่อนส่งกลับก่อน ถ้าต้องการลำดับ ให้ sort ทีหลังหรือให้ผลลัพธ์พก index มาด้วย
- **goroutine leak จากการ `break` ออกจาก loop ก่อนอ่านครบ** — ฝั่งเขียนจะค้างรอคนอ่านตลอดไป ใช้ `ctx.Done()` เป็นทางออกให้มัน
- **ใช้ unbuffered channel รับผลในฟังก์ชันที่มี timeout** — ถ้า timeout มาก่อนจะไม่มีใครอ่าน goroutine ค้างทันที ให้ใช้ buffer อย่างน้อยหนึ่งช่อง
- **คิดว่า timeout หยุดงานที่กำลังทำอยู่** — มันแค่เลิกรอผล ถ้าอยากให้งานหยุดจริงต้องส่ง `ctx` เข้าไปให้ worker เช็กเอง
- **closure capture ตัวแปร for loop บน Go 1.21 หรือเก่ากว่า** — ทุก goroutine เห็นค่าสุดท้ายเหมือนกันหมด แก้ด้วย `v := v` หรือส่งเป็น parameter
- **copy `sync.WaitGroup`, `sync.Once` หรือ mutex** — แต่ละสำเนามีสถานะของตัวเอง ต้องส่งผ่าน pointer หรือให้ closure capture ไป
- **`Lock` แล้วลืม `Unlock`** — ใช้ `defer` เรียกทันทีหลัง `Lock`/`RLock` ทุกครั้ง
- **เรียก `Lock` ตัวเดิมซ้ำใน goroutine ที่ถืออยู่** — mutex ของ Go ไม่ reentrant มันจะรอตัวเองไปตลอด ระวังเป็นพิเศษกับ recursion
- **หยิบ `sync.Map` มาใช้เป็น map ที่ปลอดภัยทั่วไป** — มันเหมาะกับเคสจำเพาะและไม่มี type safety จาก generics เคสทั่วไปใช้ built-in map คู่กับ `sync.RWMutex`
- **ใช้ mutex ป้องกันข้อมูลที่อยู่นอก process** — mutex คุมได้แค่ในโปรแกรมของเรา ข้อมูลใน database ต้องใช้กลไกของ database เอง
- **เชื่อว่า `-race` ไม่ฟ้องเท่ากับไม่มี race** — มันตรวจได้เฉพาะ race ที่เกิดในรอบที่รันจริง ให้รันกับ test ที่ครอบคลุมหลาย ๆ รอบ

---

## สรุป

1. concurrency คือการออกแบบให้งานแยกส่วนกันได้ ส่วน parallelism คือการได้รันพร้อมกันจริง — คนละเรื่อง และการใส่ `go` ไม่ได้ทำให้เร็วขึ้นเอง
2. ใช้ concurrency เมื่อมีงานอิสระต่อกันที่กินเวลานานพอ (มักเป็น I/O) แล้วต้องรวมผล ถ้าไม่แน่ใจให้เขียน serial ก่อนแล้ว benchmark เทียบ
3. `go` หน้า function invocation คือการ launch goroutine ธรรมเนียมคือห่อ business logic ไว้ใน closure ให้ function เดิมไม่รู้เรื่อง concurrency
4. channel สร้างด้วย `make(chan T)` และคุยด้วย `<-` — ลูกศรชี้ออกจาก channel คืออ่าน ชี้เข้าคือเขียน ระบุทิศทางด้วย `<-chan`/`chan<-` ให้ compiler ช่วยตรวจได้
5. unbuffered channel บังคับให้ฝั่งเขียนกับฝั่งอ่านนัดพบกัน ส่วน buffered channel เก็บค่าไว้ได้ตามขนาดที่ตั้ง ตรวจด้วย `len` กับ `cap`
6. อ่านจาก channel ที่ปิดแล้วสำเร็จเสมอและคืน zero value จึงควรใช้ comma ok idiom (`v, ok := <-ch`) ทุกครั้งที่ channel อาจถูกปิด
7. เขียนหรือปิด channel ที่ปิดแล้วจะ panic และทุก operation บน nil channel จะค้าง — ตาราง behavior ใน Step 4 คุ้มที่จะจำ
8. `select` เลือก case ที่พร้อมแบบสุ่ม จึงกัน starvation และช่วยกัน deadlock จากลำดับการเข้าถึงที่ไม่ตรงกัน มักใช้เป็น for-select loop ที่ต้องมีทางออกเสมอ
9. ตั้งตัวแปร channel เป็น `nil` เพื่อปิด case ใน `select` ที่ไม่ต้องการอีกแล้ว หลังตรวจพบว่า channel ปิดไปแล้ว
10. goroutine ที่ไม่จบคือ goroutine leak ที่ไม่มีใครฟ้องให้ ใช้ `context.WithCancel` คู่กับ for-select loop ที่เช็ก `ctx.Done()` เป็นทางออก
11. buffered channel เหมาะเมื่อรู้จำนวน goroutine แน่นอน อยากจำกัด concurrency หรืออยากทำ backpressure ด้วย `select` กับ `default`
12. `sync.WaitGroup` (คู่กับ `defer wg.Done()`) ใช้รอ goroutine หลายตัว และเหมาะที่สุดกับการปิด channel ที่หลายตัวเขียนให้ถูกครั้งเดียว
13. `context.WithTimeout` คู่กับ `select` ตั้งเพดานเวลาได้ แต่ให้ channel รับผลมี buffer อย่างน้อยหนึ่งช่อง และเข้าใจว่ามันเลิกรอผล ไม่ได้หยุดงาน
14. `sync.OnceValue` ทำ lazy initialization ที่รันครั้งเดียวและ cache ค่าให้ โดยไม่ต้องมีตัวแปรระดับ package แยก
15. เลือก mutex แทน channel เมื่อแชร์ field ใน struct ที่อยู่ใน memory และไม่ได้ส่งค่าต่อเป็นทอด ๆ อย่าลืม `defer Unlock` และห้าม copy
16. `go run -race .` ช่วยจับ data race ที่เกิดขึ้นในรอบที่รัน ควรเปิดใช้ตอน test และ CI

จำประโยคเดียวพอ:

> Share memory by communicating; do not communicate by sharing memory.

goroutine, channel และ `select` ไม่ได้มีไว้ทำให้โปรแกรมเร็วขึ้นโดยอัตโนมัติ มันมีไว้ให้เราเขียนงานที่ต้องรอหลายอย่างพร้อมกันออกมาเป็นโค้ดที่ยังอ่านรู้เรื่อง และตอบได้ว่าค่าแต่ละตัวไหลไปทางไหน ใครถืออยู่ และจะจบเมื่อไหร่

ถ้าตอบสามคำถามนั้นได้ทุก goroutine ที่เขียน ก็ผ่านด่านที่ยากที่สุดของ concurrency ไปแล้ว

> *ตอนถัดไปเราจะไปสำรวจ standard library ของ Go ที่ขึ้นชื่อว่า "batteries included" ตั้งแต่ `io`, `time`, `encoding/json` ไปจนถึง `net/http` ที่เขียน web server ได้โดยไม่ต้องลง framework*

---

## Glossary

- **Concurrency** — การออกแบบโปรแกรมให้แยกเป็นส่วนที่ทำงานอิสระต่อกันได้ พร้อมกำหนดวิธีแชร์ข้อมูลอย่างปลอดภัย
- **Parallelism** — การที่งานหลายชิ้นรันจริงพร้อมกันในเวลาเดียวกัน ซึ่งขึ้นกับ hardware ไม่ใช่โค้ดเพียงอย่างเดียว
- **CSP (Communicating Sequential Processes)** — โมเดล concurrency ที่ Go ใช้ มาจากเปเปอร์ของ Tony Hoare ปี 1978 เน้นให้สื่อสารผ่าน channel แทนการแชร์ตัวแปรร่วม
- **Process** — instance ของโปรแกรมที่ OS รันอยู่ มี resource ของตัวเอง
- **Thread** — หน่วยการทำงานที่ OS จัดเวลาให้รัน thread ใน process เดียวกันแชร์ resource กันได้
- **Goroutine** — หน่วยการทำงานที่ Go runtime จัดการเอง สร้างเร็วและใช้ memory น้อยกว่า thread launch ด้วย keyword `go`
- **Channel** — built-in reference type สำหรับส่งค่าระหว่าง goroutine สร้างด้วย `make(chan T)` และมี zero value เป็น `nil`
- **Unbuffered channel** — channel ที่ไม่มี buffer การเขียนหยุดรอจนมีคนอ่าน และการอ่านหยุดรอจนมีคนเขียน
- **Buffered channel** — channel ที่เก็บค่าไว้ได้ตาม capacity ที่ระบุตอน `make` โดยไม่ต้องรอคนอ่านทันที
- **comma ok idiom** — รูปแบบ `v, ok := <-ch` ที่แยกค่าจริงออกจาก zero value ที่ได้เพราะ channel ปิดแล้ว
- **`select`** — control structure ที่เลือกทำงานกับ channel ตัวใดตัวหนึ่งจากหลายตัว โดยสุ่มเลือกจาก case ที่พร้อม
- **for-select loop** — `select` ที่วางอยู่ใน `for` loop เพื่อรับส่งหลาย channel ซ้ำ ๆ ต้องมีทางออกจาก loop เสมอ
- **Starvation** — ภาวะที่บาง case หรือ goroutine ไม่เคยได้ทำงานเพราะตัวอื่นถูกให้สิทธิ์เสมอ
- **Deadlock** — ภาวะที่หลายฝ่ายต่างรอกันจนไม่มีใครไปต่อได้ ถ้าเกิดกับทุก goroutine Go runtime จะฟ้อง `all goroutines are asleep - deadlock!`
- **Goroutine leak** — goroutine ที่ไม่จบ ทำให้ memory ที่ผูกกับมันถูก garbage collect ไม่ได้
- **`context.WithCancel`** — สร้าง context พร้อม cancel function ที่ใช้บอก goroutine ว่าถึงเวลาหยุด
- **`context.WithTimeout`** — สร้าง context ที่ cancel ตัวเองเมื่อครบเวลาที่กำหนด
- **Backpressure** — เทคนิคจำกัดปริมาณงานที่ component ยอมรับ เพื่อกันไม่ให้ระบบรับงานเกินกำลัง
- **`sync.WaitGroup`** — ตัวนับที่ใช้รอ goroutine หลายตัวจบ ด้วย `Add`, `Done` และ `Wait`
- **`sync.OnceValue`** — helper จาก Go 1.21 ที่ห่อ function ให้รันครั้งเดียวและ cache ค่าที่ได้ไว้
- **Critical section** — ส่วนของโค้ดหรือข้อมูลที่ mutex ป้องกันไม่ให้เข้าถึงพร้อมกัน
- **`sync.Mutex`** — lock ที่ให้ goroutine เข้า critical section ได้ทีละตัวด้วย `Lock`/`Unlock`
- **`sync.RWMutex`** — mutex ที่แยก lock ฝั่งอ่าน (`RLock`/`RUnlock`) ซึ่งแชร์กันได้ ออกจาก lock ฝั่งเขียนที่เข้าได้ทีละตัว
- **Reentrant lock** — lock ที่เจ้าของสามารถ acquire ซ้ำได้โดยไม่ค้าง ซึ่ง mutex ของ Go **ไม่ใช่**
- **Data race** — การเข้าถึงตัวแปรเดียวกันจากหลาย goroutine โดยไม่ป้องกัน ทำให้ผลลัพธ์ไม่แน่นอน
- **Race detector** — เครื่องมือที่เปิดด้วย flag `-race` เพื่อรายงาน data race ที่เกิดขึ้นระหว่างรัน
- **Atomics** — operation ระดับ CPU ใน `sync/atomic` เช่น add, swap, load, store และ compare-and-swap

---

## Related

- [ตอนที่ 11: Go Tooling](/go/11-go-tooling/) — บทก่อนหน้า; `go run`, `go vet` และ `go build` ที่บทนี้เพิ่ม flag `-race` เข้าไปใช้ต่อ
- [ตอนที่ 8: Generics](/go/08-generics/) — `timeLimit[T any]` และ `processAndGather[T, R any]` ในบทนี้อาศัย generics จากบทนั้น
- [ตอนที่ 9: Errors](/go/09-errors/) — การส่ง error กลับผ่าน channel และการคืน `ctx.Err()` ต่อยอดจากการจัดการ error ในบทนั้น
- [ตอนที่ 6: Pointers](/go/06-pointers/) — เหตุผลที่ห้าม copy `sync.WaitGroup`, `sync.Once` และ mutex แต่ต้องส่งผ่าน pointer
- [ตอนที่ 5: Functions](/go/05-functions/) — closure และ `defer` ที่บทนี้ใช้เกือบทุก Step ตั้งแต่ `defer wg.Done()` ถึง `defer cancel()`
- [ตอนที่ 3: Composite Types](/go/03-composite-types/) — map และ slice ที่เป็น reference type เหมือน channel และ comma ok idiom ที่ใช้ร่วมกัน
- [ตอนที่ 13: The Standard Library](/go/13-the-standard-library/) — บทถัดไปว่าด้วย standard library ของ Go
