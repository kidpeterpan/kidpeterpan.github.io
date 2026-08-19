+++
title = 'ตอนที่ 13: The Standard Library'
date = '2026-08-19T00:00:00+07:00'
draft = false
description = 'ต่อท่อข้อมูลด้วย io ใช้ time และ JSON จนสร้าง HTTP server พร้อม middleware และ structured logging ได้ด้วย standard library ของ Go'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราเรียน concurrency ไปถึง goroutine, channel และ context แบบพื้นฐานแล้ว ตอนนี้เราจะขยับมาดูชุดเครื่องมือที่ติดมากับ Go ตั้งแต่วันแรก นั่นคือ **standard library**
ถ้าเปรียบ Go เป็นกล่องเครื่องมือ standard library ก็คือชุดประแจที่ทีมภาษาเตรียมไว้ให้แล้ว ไม่ต้องเริ่มจากการลง package เพิ่มทุกครั้งที่อยากอ่านไฟล์ จัดการเวลา แปลง JSON หรือเปิด HTTP server

บทนี้จะไม่ไล่เปิดดูทุก package ใน Go เพราะทำแบบนั้นน่าจะยาวจนอ่านจบแล้วลืมตอนเริ่ม เราจะเลือก package ที่ใช้บ่อยและสะท้อนแนวคิดสำคัญของ Go ได้ดี: ต่อท่อข้อมูลด้วย io, แยกช่วงเวลากับจุดเวลาด้วย time, คุยกับ JSON ด้วย encoding/json, สร้าง HTTP client/server ด้วย net/http และปิดท้ายด้วย middleware กับ log/slog

สิ่งที่จะได้ตอนจบบทนี้:

- รับส่งข้อมูลผ่าน io.Reader และ io.Writer โดย reuse buffer และจัดการ io.EOF ถูกต้อง
- ต่อ reader/writer หลายชั้นด้วย io.Copy, io.MultiReader และ io.MultiWriter
- แยก time.Duration ออกจาก time.Time และ format เวลาแบบ RFC 3339
- ใช้ time.NewTicker อย่างถูกวิธีโดยไม่ทิ้ง ticker ค้างไว้
- แปลง struct เป็น JSON ด้วย struct tag, omitempty, json.Encoder และ json.Decoder
- อ่าน JSON stream ทีละ object จนถึง io.EOF โดยไม่ต้องโหลดทั้งก้อนเข้า memory
- สร้าง HTTP server ด้วย http.Server และ http.NewServeMux พร้อม timeout ที่เหมาะสม
- เลือกตอบกลับเป็น text หรือ JSON จาก Accept header
- เขียน middleware สำหรับจับเวลาและบันทึก IP ของ request
- ใช้ log/slog ทำ structured logging และรู้จัก http.ResponseController ในฐานะ pattern สำหรับ evolve API

{{< mermaid >}}
flowchart TD
  A["Step 1: io.Reader / io.Writer"] --> B["Step 2: time"]
  B --> C["Step 3: encoding/json"]
  C --> D["Step 4: net/http client / server"]
  D --> E["Step 5: middleware + log/slog"]
  E --> F["Step 6: ประกอบเป็น service เล็ก ๆ"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ go-standard-library เพื่อทดลองโค้ดในบทนี้ แนะนำ Go 1.22 ขึ้นไป เพราะตัวอย่าง routing แบบ GET /time ใช้ syntax ที่เพิ่มเข้ามาใน Go 1.22 เปิด terminal แล้วรัน:

~~~sh
mkdir go-standard-library
cd go-standard-library
go mod init go-standard-library
touch main.go
~~~

ชื่อ go-standard-library ในบทนี้เป็นชื่อสำหรับทดลองบนเครื่องตัวเอง จึงต้องใช้ชื่อนี้ให้ตรงกันในคำสั่ง mkdir, cd และ go mod init

ในแต่ละ Step ให้แทนที่ main.go ด้วยตัวอย่างของ Step นั้น แล้วรัน:

~~~sh
go run .
~~~

ตัวอย่างที่เกี่ยวกับเวลาจะมีค่าที่เปลี่ยนไปตามเวลาจริง ส่วน output ของ server ให้ลองด้วย curl ตามคำสั่งที่ให้ไว้ใต้ตัวอย่าง จะได้เห็นว่าข้อมูลไหลผ่าน standard library แต่ละชิ้นอย่างไร

เอาล่ะ เริ่มจากรากฐานของเกือบทุก package กันเลย

---

## Step 1: ต่อท่อข้อมูลด้วย io.Reader และ io.Writer

### io.Reader คืออะไร (Why)

เวลาเราอ่านข้อมูลจากไฟล์, network หรือ string เราไม่อยากเขียน function แยกกันสามชุด เพราะแหล่งข้อมูลทั้งสามแบบทำสิ่งเดียวกัน คือ **ปล่อย byte ออกมาให้เราอ่าน**

Go จึงกำหนด interface เล็ก ๆ ชื่อ io.Reader โค้ดด้านล่างเป็นโครงสร้างย่อจาก package `io` เพื่อให้เห็นสัญญาของ interface ไม่ใช่ไฟล์ที่เอาไปรันตรง ๆ:

~~~go
type Reader interface {
	Read(p []byte) (n int, err error)
}
~~~

คนที่เรียก Read เป็นคนเตรียม buffer เอง แล้ว reader จะเติมข้อมูลลงใน buffer พร้อมบอกว่าเติมไปกี่ byte ใน n วิธีนี้ช่วยให้เรา reuse buffer เดิมได้ ไม่ต้องสร้าง []byte ก้อนใหม่ทุกครั้งที่อ่าน

ส่วน io.Writer เป็นท่ออีกฝั่งที่รับ byte เข้าไป นี่ก็เป็นโครงสร้างย่อจาก package `io` เช่นกัน:

~~~go
type Writer interface {
	Write(p []byte) (n int, err error)
}
~~~

แนวคิดนี้เหมือนปลั๊กไฟคนละยี่ห้อที่ใช้หัวต่อมาตรฐานเดียวกัน เราไม่ต้องรู้ว่าปลายท่อเป็นไฟล์หรือ network ขอแค่มีหัวต่อเป็น io.Reader หรือ io.Writer ก็ใช้ function เดียวกันได้

### ทดลองคัดลอกจาก string ไปที่หน้าจอด้วย io.Copy (How)

แทนที่ main.go ด้วยโค้ดนี้แล้วรัน go run .:

~~~go
package main

import (
	"io"
	"os"
	"strings"
)

func main() {
	source := strings.NewReader("ข้อมูลจาก reader\n")
	if _, err := io.Copy(os.Stdout, source); err != nil {
		panic(err)
	}
}
~~~

ผลลัพธ์:

~~~text
ข้อมูลจาก reader
~~~

strings.Reader เป็น io.Reader และ os.Stdout เป็น io.Writer ทั้งคู่จึงต่อเข้ากับ io.Copy ได้ทันที โดยไม่ต้องแปลง type เอง

**Why:** function ที่รับ io.Reader ใช้กับไฟล์, string, request body หรือ response body ได้หมด ทำให้โค้ด reuse ได้มากขึ้น

**How:** ออกแบบ function ให้รับ interface ที่แคบที่สุดเท่าที่ต้องใช้ เช่น ถ้าแค่อ่านให้รับ io.Reader แทนการล็อกไว้ที่ *os.File

### อ่านข้อมูลเองและอย่าพลาด n กับ io.EOF

บางครั้งเราต้องประมวลผล byte เอง เช่น นับจำนวนตัวอักษร ASCII ตัวอย่างนี้ตั้งใจทำ buffer เล็ก ๆ เพื่อให้เห็นว่ามันถูกนำกลับมาใช้ซ้ำ:

~~~go
package main

import (
	"fmt"
	"io"
	"strings"
)

func countLetters(r io.Reader) (int, error) {
	buf := make([]byte, 4)
	count := 0

	for {
		n, err := r.Read(buf)
		for _, b := range buf[:n] {
			if (b >= 'A' && b <= 'Z') || (b >= 'a' && b <= 'z') {
				count++
			}
		}

		// ต้องประมวลผล buf[:n] ก่อนเช็ก err
		if err == io.EOF {
			return count, nil
		}
		if err != nil {
			return 0, err
		}
	}
}

func main() {
	count, err := countLetters(strings.NewReader("Go is fun!"))
	if err != nil {
		panic(err)
	}
	fmt.Println("letters:", count)
}
~~~

ผลลัพธ์:

~~~text
letters: 7
~~~

จุดที่ต้องจำมีสามอย่าง:

- ใช้ n เพื่ออ่านเฉพาะ buf[:n] เพราะ buffer ที่เหลืออาจเป็นข้อมูลจากรอบก่อน
- io.EOF หมายถึงอ่านข้อมูลหมดแล้ว ไม่ได้แปลว่าโปรแกรมทำงานผิด
- reader บางตัวอาจคืนทั้ง n > 0 และ err == io.EOF ในครั้งเดียว จึงต้องใช้ byte ก่อนแล้วค่อย return

ถ้าเจอ EOF ในตำแหน่งที่ควรมีข้อมูลให้ครบ เช่นอ่าน header ที่ยาว 20 byte แต่ได้มาเพียง 8 byte ให้แยกกรณีนี้ด้วย io.ErrUnexpectedEOF ซึ่งหมายถึงจบไม่คาดคิด

### ต่อท่อหลายชั้นด้วย function ของ io

เมื่อเข้าใจ interface แล้ว function ที่มีประโยชน์จะจำง่ายขึ้น:

- io.Copy(dst, src) คัดลอกจาก reader ไป writer
- io.MultiReader(a, b) อ่าน a จนหมดแล้วต่อด้วย b
- io.LimitReader(r, n) จำกัดว่าอ่านจาก r ได้ไม่เกิน n byte
- io.MultiWriter(a, b) เขียนข้อมูลเดียวกันลง writer หลายตัว
- io.ReadAll(r) อ่านทุกอย่างเป็น []byte เหมาะกับข้อมูลเล็ก แต่ไม่ควรใช้กับ stream ใหญ่แบบไม่คิด

ลองต่อ io.MultiReader และ io.MultiWriter ด้วยโปรแกรมนี้:

~~~go
package main

import (
	"bytes"
	"fmt"
	"io"
	"strings"
)

func main() {
	var out bytes.Buffer
	writer := io.MultiWriter(&out, io.Discard)
	reader := io.MultiReader(
		strings.NewReader("first "),
		strings.NewReader("second\n"),
	)

	if _, err := io.Copy(writer, reader); err != nil {
		panic(err)
	}
	fmt.Print(out.String())
}
~~~

ผลลัพธ์:

~~~text
first second
~~~

bytes.Buffer เป็น writer ที่เก็บข้อมูลไว้ใน memory ส่วน io.Discard เป็นปลายทางที่รับข้อมูลแล้วทิ้ง การประกอบแบบนี้คือเหตุผลที่เรียกแนวคิดของ io ว่า composable — เปลี่ยนปลายท่อได้โดยไม่ต้องแก้ logic การคัดลอก

ถ้า resource ต้องปิด เช่น os.File หรือ http.Response.Body ให้จำว่า type เหล่านั้นมักเป็น io.ReadCloser หรือ io.WriteCloser และควร Close ทุกครั้งหลังใช้งานเสร็จ ถ้าเปิดไฟล์ใน loop อย่าเลื่อน defer file.Close() ไปกองไว้ใน function ใหญ่ เพราะทุกไฟล์จะรอปิดจน function จบ

---

## Step 2: จัดการเวลาให้ตรงความหมายด้วย time

### time.Duration กับ time.Time ไม่ใช่สิ่งเดียวกัน (Why)

จำแบบง่าย ๆ:

- time.Duration คือ **ช่วงเวลา** เช่น 500 milliseconds หรือ 2 hours
- time.Time คือ **จุดเวลาหนึ่งจุด** เช่น วันที่ 19 สิงหาคม 2026 เวลา 12:00 UTC

ถ้าใช้สลับกันจะเกิด bug ได้ง่าย เช่นเอาเลข 2 ไปบวกกับเวลาปัจจุบันโดยไม่บอกว่า 2 คือ 2 วินาทีหรือ 2 ชั่วโมง Go จึงทำ Duration เป็น type แยกและมี constant ให้อ่านง่าย:

~~~go
package main

import (
	"fmt"
	"time"
)

func main() {
	d, err := time.ParseDuration("2h45m")
	if err != nil {
		panic(err)
	}

	start := time.Date(2026, time.August, 19, 9, 0, 0, 0, time.UTC)
	deadline := start.Add(d)

	fmt.Println("duration:", d)
	fmt.Println("deadline:", deadline.Format(time.RFC3339))
	fmt.Println("elapsed:", deadline.Sub(start))
}
~~~

ผลลัพธ์:

~~~text
duration: 2h45m0s
deadline: 2026-08-19T11:45:00Z
elapsed: 2h45m0s
~~~

**Why:** การมี unit ชัดเจนช่วยให้ code review เห็นทันทีว่า timeout หรือ deadline ตั้งไว้เท่าไร

**How:** ใช้ time.Second, time.Minute, time.Hour แทนตัวเลขดิบ และใช้ time.ParseDuration เมื่อค่ามาจาก config เช่น "30s" หรือ "2h45m"

### Parse และ format เวลาแบบ RFC 3339

Go มี layout ของตัวเองสำหรับ format เวลา โดย layout มาตรฐานที่ใช้บ่อยมี constant ให้แล้ว เช่น time.RFC3339 ไม่ต้องจำเลข 2006-01-02T15:04:05Z07:00 ทุกครั้ง:

~~~go
package main

import (
	"fmt"
	"time"
)

func main() {
	utc, err := time.Parse(time.RFC3339, "2026-08-19T12:00:00Z")
	if err != nil {
		panic(err)
	}

	ict := utc.In(time.FixedZone("ICT", 7*60*60))
	fmt.Println("same instant:", utc.Equal(ict))
	fmt.Println("UTC:", utc.Format(time.RFC3339))
	fmt.Println("ICT:", ict.Format("02 Jan 2006 15:04 MST"))
}
~~~

ผลลัพธ์:

~~~text
same instant: true
UTC: 2026-08-19T12:00:00Z
ICT: 19 Aug 2026 19:00 ICT
~~~

สังเกตว่า utc กับ ict แสดงคนละ timezone แต่เป็นจุดเวลาเดียวกัน ดังนั้นเวลาเทียบ time.Time ให้ใช้ Equal ไม่ใช่ == เพราะ time.Time อาจเก็บ location และข้อมูลภายในอื่น ๆ มาด้วย

ถ้าต้องการคำนวณเวลาที่ผ่านไปจากเวลาปัจจุบัน ใช้ time.Since(start) หรือ time.Until(deadline) ได้ Go จะใช้ monotonic clock ที่มากับ time.Now() ช่วยวัด elapsed time ให้ไม่รวนเมื่อ wall clock ถูกปรับด้วย NTP หรือการเปลี่ยนเวลาในระบบ

### ทำงานซ้ำด้วย time.NewTicker

time.After เหมาะกับการรอครั้งเดียว ส่วนงานที่ต้องทำซ้ำให้ใช้ time.NewTicker และหยุดด้วย Stop เมื่อเลิกใช้:

~~~go
package main

import (
	"fmt"
	"time"
)

func main() {
	ticker := time.NewTicker(20 * time.Millisecond)
	defer ticker.Stop()

	for i := 1; i <= 3; i++ {
		<-ticker.C
		fmt.Println("tick", i)
	}
}
~~~

ผลลัพธ์:

~~~text
tick 1
tick 2
tick 3
~~~

output จะใช้เวลาประมาณ 60 milliseconds และได้ลำดับคงที่ เพราะ main รอ tick ทีละรอบ

อย่าใช้ time.Tick ใน service จริงแบบไม่จำเป็น เพราะมันคืน channel ที่ไม่มีเมธอด Stop ให้เรา ถ้าต้องการควบคุมอายุของ ticker ให้สร้างด้วย time.NewTicker เสมอ แล้ว defer ticker.Stop() ใน scope ที่เป็นเจ้าของ ticker

time.AfterFunc ก็มีประโยชน์เมื่อต้องการให้ function ทำงานครั้งเดียวในอนาคต แต่ถ้าต้องยกเลิกหรือผูกกับ request ให้ใช้ context ร่วมกับ timer ซึ่งเราจะต่อยอดในบทถัดไป

---

## Step 3: แปลงข้อมูลด้วย encoding/json

### Struct tag คือป้ายชื่อสำหรับโลกภายนอก (Why)

ชื่อ field ใน Go กับชื่อ field ที่ API ต้องการอาจไม่เหมือนกัน เช่น Go ใช้ CustomerID แต่ JSON ใช้ customer_id เรากำหนด mapping ด้วย struct tag:

~~~go
type Order struct {
	ID string `json:"id"`
}
~~~

encoding/json อ่าน tag นี้ผ่าน reflection ตอน runtime แต่ field ที่ต้องการให้ package อื่นเห็นต้องขึ้นต้นด้วยตัวพิมพ์ใหญ่ก่อน ถ้าเขียนเป็น name string จะไม่ถูก marshal ออกไป

### Marshal และ unmarshal struct แบบใช้งานจริง (How)

แทนที่ main.go ด้วยตัวอย่างนี้แล้วรัน:

~~~go
package main

import (
	"encoding/json"
	"fmt"
)

type User struct {
	ID       int      `json:"id"`
	Name     string   `json:"name"`
	Email    string   `json:"email,omitempty"`
	Tags     []string `json:"tags,omitempty"`
	Internal string   `json:"-"`
}

func main() {
	user := User{
		ID:       7,
		Name:     "Mali",
		Internal: "ใช้ภายในเท่านั้น",
	}

	data, err := json.MarshalIndent(user, "", "  ")
	if err != nil {
		panic(err)
	}
	fmt.Println(string(data))

	var decoded User
	if err := json.Unmarshal([]byte("{\"id\":8,\"name\":\"Ton\",\"email\":\"ton@example.com\"}"), &decoded); err != nil {
		panic(err)
	}
	fmt.Printf("decoded: %+v\n", decoded)
}
~~~

ผลลัพธ์:

~~~text
{
  "id": 7,
  "name": "Mali"
}
decoded: {ID:8 Name:Ton Email:ton@example.com Tags:[] Internal:}
~~~

ในตัวอย่างนี้:

- json:"email,omitempty" ตัด email ออกเมื่อเป็น string ว่าง
- json:"tags,omitempty" ตัด slice ที่ว่างออก
- json:"-" บอกให้ JSON ข้าม field นี้เสมอ
- json.Unmarshal ต้องส่ง pointer เช่น &decoded เพื่อให้ function เติมค่าให้ตัวแปรเดิม

omitempty ไม่ได้แปลว่า field ทุกชนิดที่เป็น zero value จะหายไปเหมือนกันทั้งหมด โดยเฉพาะ struct zero value มีรายละเอียดต่างจาก slice หรือ map ที่มีความยาวเป็นศูนย์ ถ้ากฎซับซ้อนให้สร้าง type หรือเขียน custom marshaler แทนการเดาพฤติกรรม

**Why:** struct tag ทำให้ wire format ชัดเจนอยู่ข้าง field และ compiler ยังตรวจ field ที่สะกดผิดใน business code ได้

**How:** ใช้ concrete struct เมื่อรู้ schema แล้ว อย่าใช้ map[string]any เป็น type หลักของระบบ เพียงเพราะเริ่มต้นเร็วกว่า

### ใช้ json.Decoder และ json.Encoder กับ stream

json.Marshal และ json.Unmarshal รับ []byte จึงเหมาะกับข้อมูลก้อนเล็ก แต่ถ้าอ่านจากไฟล์หรือ HTTP response อยู่แล้ว ข้อมูลนั้นเป็น io.Reader ให้ใช้ json.Decoder ตรง ๆ จะไม่ต้องอ่านทั้งก้อนเข้าหน่วยความจำก่อน

ตัวอย่างนี้อ่าน JSON สอง object ที่ต่อกันเป็น stream:

~~~go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
)

type Person struct {
	Name string `json:"name"`
	Age  int    `json:"age"`
}

func main() {
	stream := "{\"name\":\"Mali\",\"age\":7}{\"name\":\"Ton\",\"age\":8}"
	decoder := json.NewDecoder(strings.NewReader(stream))

	for {
		var person Person
		err := decoder.Decode(&person)
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			panic(err)
		}
		fmt.Printf("%s is %d\n", person.Name, person.Age)
	}
}
~~~

ผลลัพธ์:

~~~text
Mali is 7
Ton is 8
~~~

การวน Decode จนเจอ io.EOF ทำให้เรารองรับ stream ที่มีหลาย object ได้ และ pattern นี้เหมือนกับการอ่าน io.Reader ใน Step 1: ใช้ค่าที่อ่านได้ก่อน แล้วค่อยตัดสินว่า EOF คือทางออกตามปกติ

ฝั่งเขียนก็ใช้ json.NewEncoder(writer).Encode(value) ซ้ำใน loop ได้เลย เหมาะกับการเขียน log หรือส่ง object หลายตัวออกไปทีละรายการ

### เมื่อ format JSON ไม่ใช่แบบที่ type ต้องการ

time.Time รองรับ RFC 3339 ให้โดยอัตโนมัติ แต่บาง API อาจส่งวันที่เป็นรูปแบบเฉพาะ เช่น 19/08/2026 เราสร้าง type ที่ implement json.Marshaler และ json.Unmarshaler เพื่อกำหนดกติกาเองได้

หลักที่ควรใช้ในงานจริงคือแยก **wire struct** สำหรับ JSON ออกจาก **business struct** สำหรับ logic ภายใน ถ้า API เปลี่ยนชื่อ field หรือรูปแบบเวลา เราจะไม่ต้องลากรายละเอียดของ API ไปปนกับทั้งระบบ มี duplication บ้างแต่ช่วยลด coupling ได้มาก

ถ้าจะใช้ custom marshaler ให้จำคู่ method นี้:

นี่เป็น signature ย่อเพื่อจำชื่อ method ไม่ใช่ code ที่เอาไป compile เดี่ยว ๆ:

~~~go
MarshalJSON() ([]byte, error)
UnmarshalJSON([]byte) error
~~~

method ที่อ่านค่ามักใช้ value receiver ส่วน method ที่เติมค่าลงตัวแปรต้องใช้ pointer receiver และควรจัดการ null ให้ชัดเจน

---

io, time และ encoding/json มีจุดร่วมเดียวกันคือทุก package รับผิดชอบงานของตัวเอง แต่เชื่อมกันด้วย type/interface มาตรฐาน ต่อไปเราจะเอาท่อเหล่านี้ไปต่อกับ network จริงด้วย net/http

---

## Step 4: เปิด HTTP server และเรียก API ด้วย net/http

### ฝั่ง server หมุนรอบ http.Handler (Why)

HTTP server ใน Go ไม่ได้บังคับให้เราต้องใช้ framework ใหญ่ ๆ แกนหลักมีแค่ interface เดียว:

นี่เป็น signature ย่อจาก package `net/http` เพื่อให้เห็น contract ของ handler ไม่ใช่ไฟล์ที่เอาไปรันตรง ๆ:

~~~go
type Handler interface {
	ServeHTTP(ResponseWriter, *Request)
}
~~~

handler รับ request เข้ามา แล้วเขียน response ออกไปผ่าน ResponseWriter ลำดับที่ควรจำคือ ตั้ง header ก่อน, เขียน status code ถ้าต้องการ status ที่ไม่ใช่ 200 และค่อยเขียน body

### สร้าง endpoint ดูเวลาปัจจุบัน (How)

แทนที่ main.go ด้วย server ตัวนี้:

~~~go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type timeResponse struct {
	DayOfWeek  string `json:"day_of_week"`
	DayOfMonth int    `json:"day_of_month"`
	Month      string `json:"month"`
	Year       int    `json:"year"`
	Hour       int    `json:"hour"`
	Minute     int    `json:"minute"`
	Second     int    `json:"second"`
}

func timeHandler(w http.ResponseWriter, r *http.Request) {
	now := time.Now()

	if strings.Contains(r.Header.Get("Accept"), "application/json") {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		response := timeResponse{
			DayOfWeek:  now.Weekday().String(),
			DayOfMonth: now.Day(),
			Month:      now.Month().String(),
			Year:       now.Year(),
			Hour:       now.Hour(),
			Minute:     now.Minute(),
			Second:     now.Second(),
		}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			fmt.Println("write response:", err)
		}
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintln(w, now.Format(time.RFC3339))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /time", timeHandler)

	server := http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	fmt.Println("listening on http://localhost:8080")
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		panic(err)
	}
}
~~~

เปิด terminal หนึ่งอันรัน server:

~~~sh
go run .
~~~

แล้วเปิดอีกอันลอง request แบบ text:

~~~sh
curl http://localhost:8080/time
~~~

ผลลัพธ์จะเป็นเวลาปัจจุบัน เช่น:

~~~text
2026-08-19T14:30:12+07:00
~~~

เวลาจริงของเครื่องคุณอาจไม่ตรงตัวอย่าง นั่นเป็นเรื่องปกติ

ลองขอ JSON ด้วย Accept header:

~~~sh
curl -H 'Accept: application/json' http://localhost:8080/time
~~~

ผลลัพธ์หน้าตาประมาณนี้:

~~~json
{"day_of_week":"Wednesday","day_of_month":19,"month":"August","year":2026,"hour":14,"minute":30,"second":12}
~~~

ตรงนี้เราใช้ของหลายชิ้นต่อกันใน handler เดียว: time สร้างข้อมูล, struct tag กำหนดชื่อ JSON และ json.Encoder เขียนตรงไปยัง http.ResponseWriter ซึ่งเป็น io.Writer อีกที

**Why:** standard library ให้ HTTP server ที่ใช้ได้จริงพร้อม routing และ timeout โดยไม่ต้องเริ่มจาก dependency หลายตัว

**How:** สร้าง ServeMux ของตัวเอง, ใส่ handler เข้าไป และกำหนด timeout บน http.Server ให้เหมาะกับงาน เพราะค่า default ของ server ไม่มี timeout จึงไม่ควรปล่อยไว้ใน production

### Routing ด้วย ServeMux และการจัดการ method

ตั้งแต่ Go 1.22 เราเขียน pattern แบบ GET /time ได้ และใช้ wildcard เช่น GET /users/{id} แล้วอ่านค่าด้วย r.PathValue("id") ถ้าต้องรองรับ Go รุ่นก่อน ให้ register เป็น /time แล้วตรวจ r.Method เอง

ServeMux เป็น Handler เหมือนกัน จึงเอา mux หนึ่งไปซ้อนในอีก mux ได้ และใช้ http.StripPrefix ตัด path ของ parent ก่อนส่งให้ child handler วิธีนี้ช่วยแยก route เป็นกลุ่มโดยไม่ต้องมี router เพิ่ม

หลีกเลี่ยง http.Handle, http.HandleFunc และ http.ListenAndServe ระดับ package ใน service จริง เพราะทั้งหมดใช้ DefaultServeMux ซึ่งเป็น shared state และตั้ง timeout ของ server ไม่ได้

### ฝั่ง client: ตั้ง timeout และปิด response body

สร้าง http.Client ใช้ร่วมกันทั้งโปรแกรมได้ มันรองรับ request พร้อมกันหลาย goroutine อยู่แล้ว แต่อย่าใช้ DefaultClient โดยไม่ตั้ง timeout:

~~~go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type timeResponse struct {
	DayOfWeek  string `json:"day_of_week"`
	DayOfMonth int    `json:"day_of_month"`
	Month      string `json:"month"`
	Year       int    `json:"year"`
	Hour       int    `json:"hour"`
	Minute     int    `json:"minute"`
	Second     int    `json:"second"`
}

func main() {
	client := &http.Client{Timeout: 3 * time.Second}
	req, err := http.NewRequestWithContext(
		context.Background(),
		http.MethodGet,
		"http://localhost:8080/time",
		nil,
	)
	if err != nil {
		panic(err)
	}
	req.Header.Set("Accept", "application/json")

	res, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		panic(fmt.Sprintf("unexpected status: %s", res.Status))
	}

	var data timeResponse
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		panic(err)
	}
	fmt.Printf("%s %d %s %d:%02d:%02d\n", data.DayOfWeek, data.DayOfMonth, data.Month, data.Hour, data.Minute, data.Second)
}
~~~

รันขณะที่ server ยังเปิดอยู่:

~~~sh
go run client.go
~~~

ผลลัพธ์เป็นเวลาปัจจุบันของ server เช่น:

~~~text
Wednesday 19 August 14:30:12
~~~

ถ้าเป็น POST, PUT หรือ PATCH ให้ส่ง body ที่เป็น io.Reader เข้า http.NewRequestWithContext ได้เลย และถ้าใช้ context ของ request จริง ควรส่ง context ที่มี deadline ของงาน ไม่ใช้ context.Background() ฝังไว้ทุกจุด

จำสามบรรทัดที่สำคัญใน client ให้แม่น: ตั้ง Timeout, ตรวจ StatusCode และ defer res.Body.Close() เพราะ Body เป็น io.ReadCloser ถ้าไม่ปิด connection จะถูกค้างไว้จน resource หมด

---

## Step 5: ครอบทุก request ด้วย middleware และ structured logging

### Middleware คือ function ที่ห่อ Handler (Why)

งานบางอย่างต้องทำกับทุก endpoint เช่น จับเวลา request, ตรวจ authentication, ใส่ request ID หรือบันทึก IP ถ้า copy โค้ดเหล่านี้ไปไว้ในทุก handler เราจะต้องแก้หลายที่และมีโอกาสลืม

ใน Go เราใช้ pattern ธรรมดา ๆ นี้:

นี่เป็น signature ย่อของ middleware เพื่อให้เห็น input และ output ไม่ใช่ code ที่เอาไปรันเดี่ยว ๆ:

~~~go
func(http.Handler) http.Handler
~~~

ก่อนเรียก handler ด้านใน middleware ทำ setup หรือ check ได้ หลัง handler กลับมาก็ทำ cleanup หรือ log ได้ นึกภาพเป็นกระดาษห่อของขวัญที่ห่อ handler เดิมไว้ โดยของข้างในยังเป็น Handler แบบเดิม

### ทำ JSON request log ด้วย log/slog (How)

แทนที่ main.go ด้วยตัวอย่างเต็มนี้:

~~~go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

type timeResponse struct {
	DayOfWeek  string `json:"day_of_week"`
	DayOfMonth int    `json:"day_of_month"`
	Month      string `json:"month"`
	Year       int    `json:"year"`
	Hour       int    `json:"hour"`
	Minute     int    `json:"minute"`
	Second     int    `json:"second"`
}

func timeHandler(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	if strings.Contains(r.Header.Get("Accept"), "application/json") {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		data := timeResponse{
			DayOfWeek:  now.Weekday().String(),
			DayOfMonth: now.Day(),
			Month:      now.Month().String(),
			Year:       now.Year(),
			Hour:       now.Hour(),
			Minute:     now.Minute(),
			Second:     now.Second(),
		}
		_ = json.NewEncoder(w).Encode(data)
		return
	}

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintln(w, now.Format(time.RFC3339))
}

func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func requestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			next.ServeHTTP(w, r)

			logger.LogAttrs(
				r.Context(),
				slog.LevelInfo,
				"http request",
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.String("ip", clientIP(r)),
				slog.Int64("duration_ms", time.Since(start).Milliseconds()),
			)
		})
	}
}
func streamHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	controller := http.NewResponseController(w)

	for i := 1; i <= 3; i++ {
		if _, err := fmt.Fprintf(w, "chunk %d\n", i); err != nil {
			return
		}
		if err := controller.Flush(); err != nil && !errors.Is(err, http.ErrNotSupported) {
			return
		}
		time.Sleep(200 * time.Millisecond)
	}
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	mux := http.NewServeMux()
	mux.HandleFunc("GET /time", timeHandler)
	mux.HandleFunc("GET /stream", streamHandler)

	server := http.Server{
		Addr:         ":8080",
		Handler:      requestLogger(logger)(mux),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	logger.Info("server starting", "addr", server.Addr)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
~~~

เปิด terminal หนึ่งอันรัน server:

~~~sh
go run .
~~~

แล้วเปิดอีกอันเรียก endpoint:

~~~sh
curl -H 'Accept: application/json' http://localhost:8080/time
~~~

log ที่ออกทาง stdout จะมีหน้าตาประมาณนี้:

~~~json
{"time":"2026-08-19T14:30:12+07:00","level":"INFO","msg":"http request","method":"GET","path":"/time","ip":"127.0.0.1","duration_ms":0}
~~~

ค่าของ time, ip และ duration_ms จะเปลี่ยนตามเครื่อง การที่ log มี key ชัดเจนทำให้ระบบ log search หรือโปรแกรมอื่นกรอง path, method และ duration ได้ง่ายกว่าอ่านข้อความยาว ๆ

ในตัวอย่างเราใช้ LogAttrs แทนการส่ง key/value สลับกันใน slog.Info เพราะ LogAttrs สร้าง slog.Attr แบบระบุ type ชัดเจน เช่น String, Int64 และ Time เหมาะกับจุดที่ log บ่อยมาก ถ้าเป็นจุดทั่วไปเขียน slog.Info("user login", "id", userID) ได้ อ่านง่ายกว่าและยังถูกต้อง

### http.ResponseController เป็น pattern สำหรับ evolve API

ResponseWriter เป็น interface ที่เก่าและมีคน implement อยู่ทั่ว ecosystem ถ้าเติม method ใหม่เข้า interface ตรง ๆ โค้ดเดิมจะ compile ไม่ผ่าน Go จึงเพิ่ม concrete wrapper ชื่อ http.ResponseController เพื่อเรียกความสามารถเสริม เช่น Flush โดยไม่ทำลาย implementation เดิม

รูปแบบที่ควรลอกไปใช้กับ API ของเรา:

1. คง interface เดิมไว้เพื่อ compatibility
2. เพิ่ม wrapper type สำหรับความสามารถใหม่
3. คืน error มาตรฐานอย่าง ErrNotSupported ถ้าของข้างในไม่รองรับ
4. ให้ caller ตรวจด้วย errors.Is แทนการเดา type ด้วยตัวเอง

ใน streamHandler เราจึงเรียก controller.Flush() และยอมรับ http.ErrNotSupported ได้ ถ้า server รองรับการ flush client จะเห็นข้อมูลไหลออกทีละ chunk ลองดูด้วย:

~~~sh
curl -N http://localhost:8080/stream
~~~

ผลลัพธ์:

~~~text
chunk 1
chunk 2
chunk 3
~~~

**Why:** middleware แยก cross-cutting concern ออกจาก business handler ส่วน slog ทำให้ log พร้อมให้เครื่องค้นหาและวิเคราะห์ต่อ

**How:** สร้าง middleware เป็น function ที่รับและคืน http.Handler แล้วห่อ mux ทั้งก้อน ถ้าเป็น service ให้สร้าง JSON handler พร้อมกำหนด minimum level และส่ง output ไปยัง writer ที่ต้องการ

---

## Step 6: เลือก package ให้ตรงกับงาน แล้วต่อเป็น service เล็ก ๆ

ถึงตรงนี้เราไม่ได้จำแค่ชื่อ package แต่เห็นทางเดินของข้อมูลแล้ว:

~~~text
source -> io.Reader -> json.Decoder -> Go struct -> business logic
business logic -> Go struct -> json.Encoder -> io.Writer
http request -> Handler -> middleware -> slog JSON
~~~

เวลาจะเริ่ม feature ใหม่ ลองไล่ถามตัวเองตามนี้:

| คำถาม | เครื่องมือที่เริ่มดู |
|---|---|
| ข้อมูลไหลเข้ามาจากไฟล์, string หรือ network ไหม | io.Reader |
| ต้องส่งข้อมูลออกไปยังไฟล์หรือ response ไหม | io.Writer |
| ค่านี้เป็นช่วงเวลาหรือจุดเวลา | time.Duration หรือ time.Time |
| ต้องคุยกับ JSON ก้อนเล็กหรือ stream | json.Marshal หรือ json.Decoder |
| ต้องรับส่ง HTTP | http.Client หรือ http.Server |
| ต้องทำงานรอบทุก request | middleware |
| ต้องให้เครื่องค้นหา log ได้ | log/slog |

หลักการที่ทำให้ standard library ต่อกันได้ดีมีอยู่สามข้อ:

1. รับ interface เล็ก ๆ ที่บอกความสามารถที่ต้องการจริง ไม่รับ concrete type ใหญ่เกินจำเป็น
2. ให้ caller คุม resource และ memory เช่น caller เตรียม buffer, caller ปิด Body และ caller ตั้ง timeout
3. เพิ่มความสามารถใหม่ด้วย wrapper หรือ function แทนการแก้ interface เดิมจนโค้ดเก่าพัง

ก่อนนำ server ไปใช้จริง ให้ตรวจอย่างน้อย:

~~~sh
gofmt -w main.go
go vet ./...
go build ./...
~~~

ถ้ามี test ให้เพิ่ม go test ./... และถ้าเป็นโค้ดที่มี goroutine หรือ shared state ให้รัน go test -race ./... ด้วย ส่วน service ที่ต้อง deploy ควรกำหนด graceful shutdown ด้วย context ในบทถัดไป เพราะ server ตัวอย่างนี้ใช้ Ctrl+C หยุด process แบบง่าย ๆ เท่านั้น

**Why:** การรู้ mental model สำคัญกว่าการจำ function เป็นร้อยตัว เพราะช่วยให้เราเลือก package ได้ถูกตอนเจอปัญหาใหม่

**How:** เริ่มจากรูปแบบข้อมูลและอายุของ resource ก่อน แล้วค่อยเลือก function ใน package ที่ตรงกับ interface นั้น

---

## แบบฝึกหัด

### ข้อ 1: Time server แบบ text

เขียน web server ที่มี endpoint GET /time โดยมีสัญญา:

- input: HTTP GET ที่ path /time และไม่มี body
- return: status 200, Content-Type เป็น text/plain และ body เป็นเวลา RFC 3339 หนึ่งบรรทัด
- error case: method ที่ไม่ใช่ GET ต้องได้ status 405 หรือ response ที่สื่อว่าไม่รองรับ
- cleanup: server ต้องตั้ง ReadTimeout, WriteTimeout และ IdleTimeout

ลองทดสอบด้วย curl และตรวจว่า parse body ได้ด้วย time.Parse(time.RFC3339, value)

### ข้อ 2: Middleware บันทึก IP เป็น JSON

เขียน middleware ชื่อ RequestLogger ที่ครอบทุก route โดยมีสัญญา:

- input: http.Handler ถัดไปและ request ที่มี RemoteAddr
- return: http.Handler ตัวใหม่ที่เรียก handler เดิมหนึ่งครั้งพอดี
- log fields: method, path, ip และ duration_ms
- error case: ถ้า RemoteAddr ไม่มี port ให้เก็บค่าที่อ่านได้แทนการทำให้ request ล้ม
- cleanup: ไม่มี resource ใหม่ที่ต้องปิด แต่ต้อง log หลัง handler return แม้ handler จะเขียน response เสร็จแล้ว

ใช้ slog.NewJSONHandler และ LogAttrs แล้วลองค้นเฉพาะ request ที่ path เป็น /time จาก output

### ข้อ 3: ตอบ JSON เมื่อ client ขอ

เพิ่ม Accept negotiation ให้ endpoint เดิม โดยมีสัญญา:

- input: Accept header เป็น application/json หรือ header ว่าง
- return: ถ้าขอ JSON ให้ตอบ object ที่มี day_of_week, day_of_month, month, year, hour, minute และ second ถ้าไม่ได้ขอให้ตอบ text RFC 3339
- error case: ถ้า encoder เขียนไม่ได้ให้คืนจาก handler และ log error ไว้ อย่า panic ในระหว่าง serve request
- cleanup: ปิด response body เฉพาะฝั่ง client; ฝั่ง server ไม่ต้องปิด ResponseWriter เอง

ลองเขียน client แยกที่ตั้ง timeout แล้ว decode response ด้วย json.Decoder เพื่อพิสูจน์ว่า wire format ตรงกับ struct tag

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **เช็ก error ก่อนใช้ byte ที่ Read คืนมา** — ผิด ต้องประมวลผล buf[:n] ก่อน เพราะ reader อาจคืนทั้งข้อมูลบางส่วนและ io.EOF ในครั้งเดียว
- **ใช้ defer Close ใน loop** — defer จะรันตอน function จบ ทำให้ resource ทุกตัวค้างพร้อมกัน ให้ปิดในแต่ละรอบ หรือแยกงานของแต่ละรอบเป็น function เล็ก ๆ
- **เทียบ time.Time ด้วย ==** — ใช้ Equal เพื่อเทียบว่าเป็น instant เดียวกัน แม้ timezone ต่างกัน
- **ใช้ time.Tick ใน service ที่ต้องหยุดได้** — ใช้ time.NewTicker แล้ว Stop เพื่อควบคุมอายุของ ticker
- **ใช้ http.DefaultClient หรือ http.Get ใน production** — default client ไม่มี timeout สร้าง client ของเราเองพร้อม Timeout
- **ไม่ตั้ง timeout บน http.Server** — client ที่ช้าหรือไม่ส่งข้อมูลต่ออาจถือ connection ค้างไว้ ตั้ง ReadTimeout, WriteTimeout และ IdleTimeout
- **ลืมปิด res.Body** — body เป็น io.ReadCloser ต้อง defer res.Body.Close() หลังตรวจ err จาก client.Do แล้ว
- **ลืมว่า JSON มองเห็นเฉพาะ exported field** — field ที่ขึ้นต้นตัวเล็กจะไม่ถูก marshal/unmarshal จาก package อื่น
- **คิดว่า omitempty คือ zero value ทุกชนิด** — struct, slice และ map มีรายละเอียดต่างกัน ตรวจ output จริงหรือกำหนด custom marshaler
- **เชื่อ X-Forwarded-For แบบสุ่ม ๆ** — header นี้อาจถูกปลอมได้ ถ้าอยู่หลัง proxy ให้กำหนด trusted proxy ก่อนใช้เป็น IP ของ client
- **เพิ่ม method เข้า interface เดิมเพื่อ feature ใหม่** — เสี่ยงทำลาย implementation เก่า ใช้ wrapper แบบ ResponseController แทน

---

## สรุป

standard library ของ Go ไม่ได้เด่นแค่มี package เยอะ แต่เด่นที่ package เหล่านี้พูดภาษาชุดเดียวกันและต่อกันได้:

- io ให้รากฐานของการไหลของ byte ด้วย interface เมธอดเดียว และช่วยให้เรา reuse buffer ได้
- time แยกช่วงเวลาออกจากจุดเวลา ทำให้ timeout, deadline และการวัด elapsed time อ่านความหมายได้ตรง
- encoding/json แปลง struct ด้วย tag และทำงานกับ io.Reader/io.Writer ผ่าน Decoder/Encoder ได้
- net/http ให้ client และ server ที่พร้อมใช้ แต่เราต้องตั้ง timeout และปิด response body เอง
- middleware เป็น function ธรรมดาที่ห่อ Handler เพื่อแยกงานที่ต้องทำกับทุก request
- log/slog ทำให้ log เป็นข้อมูลที่เครื่องค้นหาและวิเคราะห์ต่อได้
- ResponseController สอนวิธีเพิ่มความสามารถให้ API ที่เป็น interface โดยยังรักษา backward compatibility

ถ้าจะจำประโยคเดียวจากบทนี้ ให้จำว่า **เริ่มจาก interface เล็ก ๆ แล้วต่อท่อให้ตรงกับงาน** เมื่อข้อมูลมาจากที่ไหนหรือกำลังจะไปที่ใด ให้มองหาว่ามันเป็น Reader หรือ Writer ก่อน จากนั้นค่อยเลือก package ที่เหมาะสม

บทถัดไปจะเจาะ context ให้เต็มขึ้น ทั้งการส่ง deadline ผ่าน function, การยกเลิกงานที่กำลังรอ และการผูก context เข้ากับ HTTP request

---

## Glossary

- **io.Reader** — interface สำหรับ type ที่อ่าน byte ออกมา โดยรับ buffer จาก caller
- **io.Writer** — interface สำหรับ type ที่รับ byte เข้าไป
- **io.EOF** — ค่าพิเศษที่บอกว่า reader อ่านข้อมูลหมดแล้ว ไม่ใช่ความผิดพลาดของงาน
- **time.Duration** — ช่วงเวลา เช่น 30 seconds หรือ 2 hours
- **time.Time** — จุดเวลาหนึ่งจุดพร้อม timezone และข้อมูลสำหรับคำนวณเวลา
- **Monotonic clock** — นาฬิกาที่นับต่อเนื่อง ใช้วัดเวลาที่ผ่านไปแม้ wall clock ถูกปรับ
- **Struct tag** — metadata ต่อท้าย field ใน struct เช่น json:"user_id" ที่ encoding/json ใช้กำหนด wire format
- **Marshal / Unmarshal** — การแปลงจาก Go value ไปเป็น encoding และแปลงกลับมา
- **Handler** — object ที่รับ HTTP request และเขียน response ผ่าน ServeHTTP
- **Middleware** — function ที่รับ Handler แล้วคืน Handler เพื่อแทรกพฤติกรรมรอบ ๆ งานเดิม
- **Structured log** — log ที่มี field เป็นคู่ key/value หรือ JSON ให้เครื่องค้นหาได้ง่าย
- **ResponseController** — wrapper สำหรับเรียกความสามารถเสริมของ ResponseWriter โดยไม่ขยาย interface เดิม

---

## Related

- [[09_errors]] — sentinel error, errors.Is และการจัดการ error ที่ใช้กับ io.EOF และ http.ErrNotSupported
- [[11_go_tooling]] — gofmt, go vet, go build และเครื่องมือที่ใช้ตรวจ project ก่อนส่งงาน
- [[12_concurrency_in_go]] — goroutine, channel, timer และเหตุผลที่ HTTP client ใช้ร่วมกันข้าม goroutine ได้
- [[14_the_context]] — deadline, cancellation, HTTP request context และ graceful shutdown ที่ต่อยอดจากบทนี้

Learned: none — no correction this session
