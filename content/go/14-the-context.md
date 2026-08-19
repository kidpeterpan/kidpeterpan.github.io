+++
title = 'ตอนที่ 14: The Context'
date = '2026-08-19T00:00:00+07:00'
draft = false
description = 'ใช้ `context` ส่ง metadata ผ่าน request ยกเลิกงาน และกำหนด timeout ให้โค้ด Go ทำงานต่อได้อย่างรับผิดชอบ'
tags = ['programming', 'go', 'tutorial']
+++

---

ตอนที่แล้วเราใช้ standard library สร้าง HTTP server และ middleware กันไปแล้ว แต่ยังมีคำถามสำคัญอีกข้อ: ถ้า request ถูกยกเลิก หรือใช้เวลานานเกินกว่าที่เรายอมรับได้ งานข้างในจะรู้ได้อย่างไรว่าควรหยุด?

ถ้าปล่อยให้ goroutine ทำงานต่อทั้งที่ client ปิดหน้าเว็บไปแล้ว server ก็ยังเสียเวลา เสีย memory และอาจถือ connection หรือ resource อื่นค้างไว้แบบไม่จำเป็น

เครื่องมือมาตรฐานที่ Go เตรียมไว้ให้จัดการเรื่องนี้คือ `context` ครับ มันมีหน้าที่หลักอยู่สองอย่าง:

1. พก metadata ของ request เช่น user ID หรือ request ID ผ่าน middleware ที่เปลี่ยน signature ของ API ไม่ได้
2. ส่งสัญญาณ cancellation, timeout และ deadline ลงไปให้ function, goroutine หรือ HTTP call ที่อยู่ลึกกว่า

คิดภาพ `context` เป็นซองที่เดินทางไปพร้อม request แต่ละชั้นสามารถห่อซองเดิมด้วยข้อมูลหรือกติกาเพิ่มได้ ซองเดิมไม่ถูกแก้ และสิ่งที่ห่อเพิ่มจะไหลลงไปหาชั้นข้างในเท่านั้น

สิ่งที่จะได้ตอนจบบทนี้:

- ส่ง `ctx context.Context` เป็น parameter ตัวแรกของ function ใน request path
- เลือกใช้ `context.Background` และ `context.TODO` ให้ถูกสถานการณ์
- ส่ง user ID ผ่าน HTTP middleware ด้วย context key ที่ไม่ชนกับ package อื่น
- ยกเลิก goroutine ด้วย `context.WithCancel` และ `ctx.Done()` โดยไม่ทิ้งงานค้าง
- แยกประเภท error จาก `ctx.Err()` ออกจากสาเหตุจริงด้วย `context.Cause`
- กำหนด timeout และ deadline ให้ operation รวมถึง HTTP request
- ทำให้ loop และงานที่ใช้เวลานานหยุดตาม context ได้

{{< mermaid >}}
flowchart TD
  A["entry point: context.Background"] --> B["ส่ง ctx เป็น parameter แรก"]
  B --> C["WithValue: เพิ่ม metadata"]
  B --> D["WithCancel: ส่งสัญญาณหยุด"]
  D --> E["WithTimeout / WithDeadline"]
  E --> F["worker หรือ HTTP call เช็ก ctx"]
  F --> G["อ่าน Err หรือ Cause"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะสร้าง project ใหม่ชื่อ `go-context` เพื่อทดลองทีละ Step เปิด terminal แล้วรันคำสั่งนี้:

~~~sh
mkdir go-context
cd go-context
go mod init go-context
touch main.go
~~~

ชื่อต้องเป็น `go-context` ให้ตรงกันทั้ง `mkdir`, `cd` และ `go mod init` เพราะ module name ใน `go.mod` จะถูกสร้างจากคำสั่งนี้

ในแต่ละ Step ให้แทนที่ไฟล์ `main.go` ด้วยโค้ดของ Step นั้น แล้วรัน:

~~~sh
go run .
~~~

ตัวอย่าง `WithCancelCause` ในบทนี้ใช้ API ที่มีใน Go 1.20 ขึ้นไป ถ้าเครื่องยังเก่ากว่านั้น ให้ข้าม Step 4 ชั่วคราวหรืออัปเดต Go ก่อน

เอาล่ะ เริ่มจากการทำความเข้าใจว่า `context` เป็นอะไรจริง ๆ กันก่อน

---

## Step 1: context คือ parameter ที่พกไปกับ request

### context ไม่ใช่ keyword พิเศษของ Go (Why)

`context` ไม่ใช่ feature ที่ compiler รู้จักเป็นพิเศษ แต่มันเป็นค่าที่ทำตาม `context.Context` interface ใน package `context` เท่านั้น ดังนั้นเราจึงส่งมันเข้า function เหมือน parameter ตัวอื่นได้

ธรรมเนียมของ Go คือ function ที่ทำงานอยู่ใน request path จะรับ `ctx context.Context` เป็น parameter ตัวแรก และมักใช้ชื่อสั้น ๆ ว่า `ctx`:

โค้ดย่อด้านล่างมีไว้ดูรูปแบบของ function เท่านั้น ไม่ใช่โปรแกรมเต็มที่ต้องนำไปรัน:

~~~go
func process(ctx context.Context, input string) (string, error) {
    // ใช้ ctx เรียก service อื่นหรือเช็ก cancellation ได้
    return input, nil
}
~~~

`parameter` คือช่องที่ประกาศไว้ใน function เช่น `ctx` ส่วนค่าที่ส่งเข้าตอนเรียก function คือ `argument` เช่น `context.Background()` สองคำนี้อยู่คนละจังหวะกันนิดหนึ่ง จำแยกไว้จะอ่าน signature ได้ง่ายขึ้น

### เริ่มต้นด้วย Background และอย่าให้ TODO หลุดไป production (How)

ที่ entry point ซึ่งยังไม่มี context จาก caller ให้ใช้ `context.Background()` เป็นจุดตั้งต้น ส่วน `context.TODO()` ใช้คั่นเวลาเรากำลังพัฒนาและยังตัดสินใจไม่ได้ว่าจะรับ context จากไหนเท่านั้น

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` สังเกตว่า function รับ context เป็น argument แรก และ `Background` กับ `TODO` ต่างก็คืนค่าที่ใช้เป็น `context.Context` ได้:

~~~go
package main

import (
    "context"
    "fmt"
)

func handleRequest(ctx context.Context, name string) string {
    return fmt.Sprintf("received request for %s", name)
}

func main() {
    ctx := context.Background()

    fmt.Println(handleRequest(ctx, "kong"))
    fmt.Println("TODO is a placeholder:", context.TODO() != nil)
}
~~~

ผลลัพธ์:

~~~text
received request for kong
TODO is a placeholder: true
~~~

ตัวอย่างนี้ยังไม่ได้ใช้ `ctx` ทำอะไรจริง ๆ แต่พิสูจน์รูปแบบสำคัญก่อน: เราส่ง context ลงไปกับการเรียก function ไม่ได้เก็บมันไว้ใน global variable หรือซ่อนมันไว้ใน struct field

**Why:** คนอ่าน signature จะรู้ทันทีว่า function นี้อยู่ใน request path และสามารถเคารพ cancellation หรือ deadline จาก caller ได้

**How:** รับ `ctx context.Context` เป็น parameter แรก แล้วส่งตัวเดิมต่อไปยัง function ชั้นลึกที่ต้องใช้

---

## Step 2: ส่ง metadata ผ่าน middleware ด้วย WithValue

### ใช้ context value เมื่อส่ง parameter ตรง ๆ ไม่ได้ (Why)

โดยทั่วไป ถ้า business logic ต้องใช้ user ID เราควรส่ง `userID string` เป็น parameter ให้เห็นชัด ๆ แบบนี้ เพราะ explicit และทดสอบง่ายกว่า:

~~~go
func loadProfile(ctx context.Context, userID string) (string, error) {
    // business logic รู้ตรง ๆ ว่าต้องใช้ userID
    return userID, nil
}
~~~

แต่ HTTP middleware และ handler มี signature ที่ package `net/http` กำหนดไว้แล้ว เราไม่สามารถเติม parameter `userID` เข้าไปใน `ServeHTTP` ได้ตามใจ

กรณีแบบนี้ `context.WithValue` ช่วยพก metadata ที่เป็นของ request ลงไปได้ เช่น user ID จาก cookie, request ID หรือ tracing information แต่ไม่ควรใช้เป็นช่องลักลอบส่ง business data ทุกชนิด

### สร้าง key ที่ไม่ชนกัน

อย่าใช้ string ตรง ๆ เช่น `"user"` เป็น key เพราะ package อื่นอาจใช้ชื่อเดียวกันแล้วเกิด collision ได้ ให้สร้าง type ที่เป็น unexported แยกไว้แทน:

~~~go
type userKey struct{}
~~~

`struct{}` แบบนี้เป็น comparable และ type ที่เป็น unexported จะช่วยไม่ให้โค้ดนอก package สร้าง key ที่ชนกับของเราได้ง่าย ๆ ถ้ามีหลาย key ที่เกี่ยวข้องกัน จะใช้ unexported integer type กับ `iota` ก็ได้ หลักสำคัญคือ key ต้องแยกกันได้และไม่เปิดกว้างเกินจำเป็น

### ทดลองส่ง user ID จาก middleware เข้า handler

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` โค้ดใช้ `httptest` ทำ request ใน memory จึงไม่ต้องเปิด port หรือพึ่ง network จริง ให้สังเกตเส้นทาง `header -> middleware -> context -> handler -> businessLogic`:

~~~go
package main

import (
    "context"
    "fmt"
    "net/http"
    "net/http/httptest"
)

type userKey struct{}

func ContextWithUser(ctx context.Context, user string) context.Context {
    return context.WithValue(ctx, userKey{}, user)
}

func UserFromContext(ctx context.Context) (string, bool) {
    user, ok := ctx.Value(userKey{}).(string)
    return user, ok
}

func userMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        user := r.Header.Get("X-User-ID")
        if user == "" {
            http.Error(w, "missing user", http.StatusUnauthorized)
            return
        }

        ctx := ContextWithUser(r.Context(), user)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func businessLogic(user string) string {
    return "hello, " + user
}

func handler(w http.ResponseWriter, r *http.Request) {
    user, ok := UserFromContext(r.Context())
    if !ok {
        http.Error(w, "user not found", http.StatusInternalServerError)
        return
    }

    fmt.Fprintln(w, businessLogic(user))
}

func main() {
    req := httptest.NewRequest(http.MethodGet, "http://example.test/", nil)
    req.Header.Set("X-User-ID", "kong")

    rec := httptest.NewRecorder()
    userMiddleware(http.HandlerFunc(handler)).ServeHTTP(rec, req)

    fmt.Printf("status=%d body=%q\n", rec.Code, rec.Body.String())
}
~~~

ผลลัพธ์:

~~~text
status=200 body="hello, kong\n"
~~~

middleware สร้าง child context ด้วย `ContextWithUser` แล้วใช้ `r.WithContext(ctx)` สร้าง request ตัวใหม่ให้ handler ถัดไป ส่วน `handler` ดึง user ออกมา แล้วส่งต่อเข้า `businessLogic` แบบ explicit อีกที

นี่คือการแบ่งหน้าที่ที่เราต้องการ: middleware รู้วิธีหา user, handler รู้วิธีเอา user ไปใช้ และ business logic ไม่ต้องรู้เลยว่า user มาจาก header, cookie หรือ JWT

context เป็น immutable หมายความว่า `WithValue` ไม่ได้แก้ parent เดิม แต่มันสร้าง child ที่ห่อ parent เอาไว้ การเขียน `ctx = context.WithValue(ctx, key, value)` จึงเป็นการเปลี่ยนตัวแปรให้ชี้ไปยัง child ตัวใหม่

**Why:** ส่ง metadata ผ่าน API มาตรฐานที่เปลี่ยน signature ไม่ได้ โดยไม่ทำให้ business logic ผูกกับ middleware

**How:** ใช้ unexported key type, ห่อด้วย function ชื่อ `ContextWithX`, อ่านด้วย `XFromContext` และ copy ค่าออกมาเป็น parameter เมื่อ business logic ต้องใช้

---

## Step 3: ยกเลิก goroutine ด้วย WithCancel และ Done

### cancel ไม่ได้ฆ่า goroutine ให้เอง (Why)

`context.WithCancel` คืนค่า 2 อย่าง:

- child context ที่จะรับสัญญาณการยกเลิก
- `CancelFunc` ที่เราเรียกเพื่อ broadcast ว่า "หยุดได้แล้ว"

คำว่า broadcast ในที่นี้หมายถึงทุกคนที่กำลังฟัง `ctx.Done()` จะเห็นสัญญาณเดียวกัน แต่ context ไม่ได้บังคับให้ goroutine หยุดเอง worker ต้องเขียนโค้ดให้เลือกทางออกเมื่อได้รับสัญญาณด้วย

### ให้ worker ฟัง Done ระหว่างรอและระหว่างส่งผล

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` โค้ดจำลอง worker ที่ปล่อยงานทุกช่วงเวลา เราจะอ่านงาน 3 ชิ้น แล้ว cancel จาก `main` สังเกตว่า worker หยุดและ `ticker` ถูก `Stop` ด้วย:

~~~go
package main

import (
    "context"
    "fmt"
    "time"
)

func produce(ctx context.Context, out chan<- string) {
    ticker := time.NewTicker(20 * time.Millisecond)
    defer ticker.Stop()

    for i := 1; ; i++ {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            select {
            case out <- fmt.Sprintf("job %d", i):
            case <-ctx.Done():
                return
            }
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    out := make(chan string)
    done := make(chan struct{})

    go func() {
        defer close(done)
        produce(ctx, out)
    }()

    for i := 0; i < 3; i++ {
        fmt.Println(<-out)
    }

    cancel()
    <-done
    fmt.Println("worker stopped:", ctx.Err())
}
~~~

ผลลัพธ์:

~~~text
job 1
job 2
job 3
worker stopped: context canceled
~~~

มีจุดสำคัญสองชั้น:

1. `select` ชั้นนอกทำให้ worker ออกจากการรอ ticker ได้เมื่อ context ถูก cancel
2. `select` ชั้นในป้องกันไม่ให้ worker ค้างตอนส่งผลเข้า `out` หลังจากฝั่งอ่านหยุดแล้ว

เรายังเรียก `defer cancel()` แม้จะมี `cancel()` ตอนท้าย เพราะ function อาจ return ก่อนถึงบรรทัดนั้นในโค้ดจริง การเรียก cancel ซ้ำปลอดภัยและช่วยให้ทุกเส้นทาง cleanup ครบ

ถ้าเรียก `Done()` จาก `context.Background()` หรือ `context.TODO()` channel ที่ได้อาจเป็น `nil` การอ่านจาก nil channel ตรง ๆ จะ block ไปเรื่อย ๆ ใน `select` case ที่ใช้ channel นี้จะถูกปิดการทำงานไว้ แต่ก็อย่ารอด้วย `<-context.Background().Done()` ตรง ๆ

**Why:** หยุดงานที่ไม่จำเป็นต่อหลัง request ยกเลิก และลดโอกาสเกิด goroutine leak

**How:** ส่ง `ctx` เข้า worker แล้ววาง `case <-ctx.Done(): return` ไว้ในจุดที่ worker อาจกำลังรอหรือส่งข้อมูล

---

## Step 4: รู้สาเหตุจริงด้วย WithCancelCause

### Err บอกประเภท แต่ Cause บอกเหตุผล (Why)

`ctx.Err()` เหมาะกับการตอบคำถามว่า context จบแบบไหน โดยหลัก ๆ จะได้ `context.Canceled` หรือ `context.DeadlineExceeded`

บางครั้งเราต้องรู้รายละเอียดมากกว่านั้น เช่น upstream ตอบ status 500, worker เจอข้อมูลเสีย หรือระบบกำลังปิดปรับปรุง `context.WithCancelCause` ช่วยให้ `CancelFunc` รับ error เข้าไปได้ และ `context.Cause(ctx)` จะคืน error นั้น

### ทดลองให้ cancellation พกเหตุผลไปด้วย

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` สังเกตว่า `Err` กับ `Cause` ตอบคนละคำถาม และการ cancel ครั้งแรกเป็นสาเหตุที่ถูกเก็บไว้:

~~~go
package main

import (
    "context"
    "errors"
    "fmt"
)

var errUpstream = errors.New("upstream returned status 500")

func main() {
    ctx, cancel := context.WithCancelCause(context.Background())
    defer cancel(nil)

    cancel(errUpstream)
    cancel(errors.New("a later error"))

    fmt.Println("Err:", ctx.Err())
    fmt.Println("Cause:", context.Cause(ctx))
    fmt.Println("same cause:", errors.Is(context.Cause(ctx), errUpstream))
}
~~~

ผลลัพธ์:

~~~text
Err: context canceled
Cause: upstream returned status 500
same cause: true
~~~

`Err` ยังเป็น sentinel error มาตรฐานที่บอกว่าโดน cancel แบบ explicit ส่วน `Cause` เก็บ error ที่เราอยากใช้ log หรือวิเคราะห์ต่อ การใช้ `errors.Is` ทำให้เราเทียบชนิดของ error ได้โดยไม่ต้องพึ่งข้อความใน string

**Why:** แยกการตัดสินใจทั่วไปของระบบออกจากรายละเอียดที่ช่วย debug เช่น retry ได้ไหม หรือ upstream ตัวไหนล้ม

**How:** ใช้ `WithCancelCause` เมื่อคนที่สั่ง cancel รู้สาเหตุ แล้วให้ชั้นบนอ่านด้วย `context.Cause(ctx)`

---

## Step 5: จำกัดเวลารอด้วย WithTimeout และ WithDeadline

### server ต้องรู้ performance envelope ของตัวเอง (Why)

server ไม่ควรปล่อยให้ request หนึ่งใช้ resource ไปเรื่อย ๆ จนกว่าจะเสร็จ เพราะระหว่างนั้น request อื่นก็ต้องรอคิวและ process อาจรับ load ใหม่ไม่ไหว

`context.WithTimeout` ใช้เมื่อเราคิดเป็นระยะเวลา เช่น "ให้ operation นี้มีเวลา 30 มิลลิวินาที" ส่วน `context.WithDeadline` ใช้เมื่อเราคิดเป็นจุดเวลาจริง เช่น "ต้องเสร็จก่อนเวลา 10:00:00"

| Function | ค่าที่ส่งเข้า | เหมาะกับการบอก |
|---|---|---|
| `context.WithTimeout` | `time.Duration` | ระยะเวลาที่เหลือให้ทำงาน |
| `context.WithDeadline` | `time.Time` | จุดเวลาที่ต้องหยุด |

ทั้งสอง function คืน child context กับ cancel function เหมือนกัน และควร `defer cancel()` ทันทีหลังสร้าง

### ให้ operation แข่งกับ timeout

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` สังเกตว่า `waitFor` จะคืนก่อนงาน 200 มิลลิวินาที เพราะ context หมดเวลาใน 30 มิลลิวินาที:

~~~go
package main

import (
    "context"
    "errors"
    "fmt"
    "time"
)

func waitFor(ctx context.Context, work time.Duration) error {
    timer := time.NewTimer(work)
    defer timer.Stop()

    select {
    case <-timer.C:
        return nil
    case <-ctx.Done():
        return ctx.Err()
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
    defer cancel()

    deadline, ok := ctx.Deadline()
    fmt.Println("has deadline:", ok, "set:", !deadline.IsZero())

    err := waitFor(ctx, 200*time.Millisecond)
    fmt.Println("result:", err)
    fmt.Println("deadline exceeded:", errors.Is(ctx.Err(), context.DeadlineExceeded))
}
~~~

ผลลัพธ์:

~~~text
has deadline: true set: true
result: context deadline exceeded
deadline exceeded: true
~~~

ถ้าเปลี่ยน `WithTimeout` เป็น `WithDeadline` รูปแบบจะเป็นแบบนี้ โค้ดสั้นนี้เป็น syntax ประกอบ ไม่ต้องนำไปรันแยก:

~~~go
deadline := time.Now().Add(500 * time.Millisecond)
ctx, cancel := context.WithDeadline(parent, deadline)
defer cancel()
~~~

ถ้าส่ง deadline ที่อยู่ในอดีต context จะอยู่ในสถานะ canceled ตั้งแต่สร้าง และ `Deadline()` ใช้ตรวจได้ว่า context มี deadline หรือไม่ โดยคืน `time.Time` คู่กับ `bool`

**Why:** จำกัดเวลารอให้พอดีกับ performance envelope ของ service และคืน error ที่ caller จัดการต่อได้

**How:** สร้าง context ด้วย `WithTimeout` หรือ `WithDeadline` แล้วให้ operation เลือกระหว่างทำงานต่อกับ `<-ctx.Done()` ใน `select`

---

## Step 6: child timeout ยาวขึ้นไม่ได้ และ HTTP ต้องพก context ไปด้วย

### parent เป็นเพดานของ child

context ที่สร้างทีหลังจะเป็น child ของ context ก่อนหน้า ถ้า parent หมดเวลาใน 30 มิลลิวินาที ต่อให้ child ขอเวลา 500 มิลลิวินาที child ก็ต้องหยุดตาม parent อยู่ดี

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` โค้ดจะรอให้ child หยุด สังเกตว่า error ของ child เป็น deadline exceeded แม้ child จะขอเวลานานกว่า:

~~~go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    parent, cancelParent := context.WithTimeout(context.Background(), 30*time.Millisecond)
    defer cancelParent()

    child, cancelChild := context.WithTimeout(parent, 500*time.Millisecond)
    defer cancelChild()

    fmt.Println("parent timeout: 30ms")
    fmt.Println("child requested timeout: 500ms")

    <-child.Done()
    fmt.Println("child stopped with:", child.Err())
}
~~~

ผลลัพธ์:

~~~text
parent timeout: 30ms
child requested timeout: 500ms
child stopped with: context deadline exceeded
~~~

การตั้ง timeout ย่อยเหมาะกับการแบ่งงบเวลา เช่น request ทั้งหมดมีเวลา 2 วินาที แล้ว network call หนึ่งใช้ได้ไม่เกิน 500 มิลลิวินาที แต่ timeout ย่อยไม่สามารถขยายเวลาที่ parent อนุญาตได้

### ส่ง context ไปกับ HTTP request

ตอนเรียก service อื่น อย่าสร้าง request แบบไม่มี context แล้วหวังว่า caller จะหยุด request ให้เอง ให้ใช้ `http.NewRequestWithContext` เพื่อให้ HTTP client รับรู้ deadline และ cancellation จาก request path

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` ตัวอย่างใช้ `httptest.NewServer` จำลอง upstream ที่ช้า 200 มิลลิวินาที แต่ client ยอมรอเพียง 30 มิลลิวินาที ให้สังเกตว่าฝั่ง client และ server ต่างเห็นการยกเลิก:

~~~go
package main

import (
    "context"
    "errors"
    "fmt"
    "net/http"
    "net/http/httptest"
    "time"
)

func main() {
    serverCanceled := make(chan struct{})
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        select {
        case <-time.After(200 * time.Millisecond):
            fmt.Fprintln(w, "slow response")
        case <-r.Context().Done():
            close(serverCanceled)
        }
    }))
    defer server.Close()

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
    defer cancel()

    req, err := http.NewRequestWithContext(ctx, http.MethodGet, server.URL, nil)
    if err != nil {
        panic(err)
    }

    client := &http.Client{}
    _, err = client.Do(req)
    fmt.Println("client canceled:", errors.Is(err, context.DeadlineExceeded))

    select {
    case <-serverCanceled:
        fmt.Println("server noticed cancellation")
    case <-time.After(time.Second):
        fmt.Println("server did not report cancellation")
    }
}
~~~

ผลลัพธ์ที่คาดหวัง:

~~~text
client canceled: true
server noticed cancellation
~~~

`client.Do` อาจคืน error ที่มีรายละเอียดของ URL ครอบอยู่ จึงใช้ `errors.Is` ตรวจว่าเหตุผลข้างในคือ `context.DeadlineExceeded` แทนการเทียบ string ตรง ๆ ส่วน handler ของ `httptest.Server` ใช้ `r.Context()` เพื่อรู้ว่า client ยกเลิก request แล้ว

**Why:** ไม่ให้ HTTP call ที่ไม่มีประโยชน์ทำงานต่อหลัง caller หมดเวลา และทำให้ service ที่เราคุยด้วยมีโอกาสหยุดงานของตัวเองด้วย

**How:** รับ context จาก caller, สร้าง request ด้วย `http.NewRequestWithContext`, แล้วส่ง request เข้า client ที่เราควบคุม

---

## Step 7: ทำให้ loop ของเราเคารพ context

### library บางตัวหยุดให้แล้ว แต่โค้ดของเราต้องเช็กเอง

ถ้า function เรียก HTTP client หรือ database driver ที่รับ context อยู่แล้ว แค่ส่ง `ctx` ต่อไปก็เป็นจุดเริ่มต้นที่ถูกต้อง แต่ loop คำนวณหรือ channel ที่เราเขียนเองต้องมีทางออกของตัวเองด้วย

หลักที่ใช้บ่อยมีสองแบบ:

1. ถ้ากำลังอ่านหรือเขียน channel ให้ใส่ `case <-ctx.Done()` ใน `select`
2. ถ้าเป็นงานคำนวณที่วนอยู่นาน ให้เช็ก `ctx` เป็นระยะ แล้วคืน partial result หรือ error ตามที่เหมาะกับงาน

### ทดลองหยุด long-running computation พร้อม cause

แทนที่ `main.go` ด้วยโค้ดนี้แล้วรัน `go run .` จำนวนรอบอาจต่างกันตามเครื่อง จึงพิมพ์เฉพาะสิ่งที่ควรคงที่: งานหยุดจริงและหยุดด้วยเหตุผลที่เรากำหนด:

~~~go
package main

import (
    "context"
    "errors"
    "fmt"
    "time"
)

func longRunningComputation(ctx context.Context) (int, error) {
    iterations := 0

    for {
        select {
        case <-ctx.Done():
            return iterations, context.Cause(ctx)
        default:
            iterations++
            time.Sleep(time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancelCause(context.Background())
    defer cancel(nil)

    stopTimer := time.AfterFunc(10*time.Millisecond, func() {
        cancel(errors.New("maintenance window"))
    })
    defer stopTimer.Stop()

    iterations, err := longRunningComputation(ctx)
    fmt.Println("stopped:", err != nil)
    fmt.Println("reason:", err)
    fmt.Println("did some work:", iterations > 0)
}
~~~

ผลลัพธ์:

~~~text
stopped: true
reason: maintenance window
did some work: true
~~~

โค้ดนี้ไม่ได้พยายามรู้จำนวนรอบล่วงหน้า เพราะเวลาจริงของ scheduler ทำให้จำนวนรอบเปลี่ยนได้ สิ่งที่สำคัญกว่าคือ loop มีจุดเช็ก cancellation และคืนสาเหตุให้ caller ไม่หมุนต่อแบบไม่มีวันจบ

ถ้างานหนึ่งรอบใช้เวลานานมาก ให้แบ่งงานเป็นช่วงย่อยเพื่อแทรกจุดเช็กได้บ่อยขึ้น เพราะการเช็ก context จะช่วยได้ก็ต่อเมื่อโค้ดเดินทางมาถึงจุดเช็กนั้นแล้ว

**Why:** ปิดทางออกให้ computation, worker และ loop ที่เราเขียนเอง ไม่ปล่อยให้มันรันต่อหลัง request จบ

**How:** เช็ก `ctx.Done()` หรือ `context.Cause(ctx)` ในจุดที่เหมาะสม และคืน error/partial result อย่างชัดเจน

---

## แบบฝึกหัด

### ข้อ 1: สร้าง timeout middleware

เขียน function ชื่อ `TimeoutMiddleware` ที่รับ `timeoutMS int` แล้วคืนค่าเป็น `func(http.Handler) http.Handler` โดยมีสัญญา:

- input: `timeoutMS` ที่เป็นจำนวน millisecond มากกว่า 0 และ `http.Handler` ตัวถัดไป
- return: middleware ที่สร้าง child context ด้วย `context.WithTimeout` จาก `r.Context()` แล้วเรียก handler ถัดไปด้วย request ที่พก context ใหม่นี้
- error case: ถ้า handler ถัดไปอ่าน `ctx.Err()` หลังหมดเวลา ต้องเห็น `context.DeadlineExceeded` ไม่ใช่ context ที่ยัง active
- cleanup: เรียก `cancel` ด้วย `defer` ใน middleware ทุกครั้ง แม้ handler จะ return ด้วย error หรือ panic

ลองสร้าง handler จำลองที่รอด้วย `select` ระหว่าง `time.After` กับ `r.Context().Done()` แล้วทดสอบทั้งกรณีที่ทำงานเสร็จทันและไม่ทัน timeout

### ข้อ 2: รวมเลขสุ่มจนกว่าจะเจอเป้าหมายหรือหมดเวลา

เขียนโปรแกรมที่สุ่มเลขในช่วง `[0, 100000000)` แล้วบวกเข้าผลรวมไปเรื่อย ๆ โดยมีสัญญา:

- input: ไม่มี input จากผู้ใช้; ใช้ `context.WithTimeout` กำหนดเวลา 2 วินาที และเป้าหมายคือเลข `1234`
- return: พิมพ์ผลรวมสุดท้าย, จำนวนรอบที่ทำ และเหตุผลที่จบว่าเจอ `1234` หรือ `context deadline exceeded`
- error case: ถ้าหมดเวลา ให้ถือว่าเป็นผลลัพธ์ที่จัดการได้ ไม่ต้อง `panic` และต้องรายงาน `ctx.Err()` หรือ `context.Cause(ctx)` ให้ชัด
- cleanup: เรียก `cancel` ด้วย `defer` และอย่าสร้าง goroutine ที่รอผลค้างหลังโปรแกรมจบ

จุดฝึกอยู่ที่การเลือกว่าจะเช็ก context ก่อนสุ่ม, หลังสุ่ม หรือทั้งสองจุด เพื่อไม่ให้โปรแกรมทำงานเกินเวลามากเกินไป

### ข้อ 3: เก็บ log level ใน context

นิยาม `type Level string` พร้อม constant `Debug` และ `Info` แล้วสร้างระบบเล็ก ๆ ตามสัญญานี้:

- input: HTTP request ที่อาจมี query parameter `log_level=debug` หรือ `log_level=info`
- return: middleware ต้องเก็บ level ลง context และเรียก handler ถัดไปหนึ่งครั้ง ส่วน `Log(ctx, message)` ต้องอ่าน level จาก context แล้วพิมพ์ level คู่กับ message
- error case: ถ้า query parameter หายไปหรือเป็นค่าอื่น ให้ใช้ `Info` เป็นค่าเริ่มต้น และไม่ทำให้ request ล้ม
- cleanup: ไม่มี resource ใหม่ที่ต้องปิด แต่ต้องสร้าง request ใหม่ด้วย `r.WithContext(ctx)` ไม่แก้ context เดิม

ลองพิสูจน์ว่า business logic รับ `ctx` แล้วเรียก `Log` ได้โดยไม่ต้องรู้ว่า level ถูกอ่านมาจาก query parameter ที่ middleware

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ไม่เรียก cancel function** — context ที่สร้างจาก `WithCancel`, `WithCancelCause`, `WithTimeout` หรือ `WithDeadline` ควรมี `defer cancel()` ทันทีหลังสร้าง เพื่อคืน timer และ resource ที่เกี่ยวข้อง แม้งานจะจบด้วย error หรือ timeout เอง
- **คิดว่า cancel จะฆ่า goroutine ให้เอง** — context แค่ส่งสัญญาณ โค้ดใน goroutine ต้องฟัง `ctx.Done()` หรือเช็ก `context.Cause(ctx)` แล้ว return เอง
- **อ่าน `Done()` ของ context ที่ cancel ไม่ได้ตรง ๆ** — `Background` และ `TODO` อาจคืน nil channel ซึ่งอ่านแล้ว block ตลอด ให้ใช้ context ที่มี cancellation หรือวาง channel ไว้ใน `select` อย่างถูกต้อง
- **ใช้ string เป็น context key** — package หลายตัวอาจใช้ชื่อเดียวกันจนค่าชนกัน ให้ใช้ unexported type เป็น key
- **เก็บ business data ไว้ใน context ทั้งหมด** — ค่า context เหมาะกับ metadata ของ request และข้อมูลสำหรับ system maintenance ส่วนข้อมูลที่ business logic ต้องใช้ควรดึงออกมาเป็น explicit parameter
- **ยัดค่าไว้ใน context เยอะเกินไป** — การค้นหาผ่าน context chain เป็น linear search ถ้าต้องเก็บค่ามากมายอาจเป็นสัญญาณว่า API ควร refactor
- **ตั้ง child timeout แล้วยืดอายุ request ได้** — child จะหยุดตาม parent เมื่อ parent หมดเวลาก่อน ต่อให้ child ขอเวลานานกว่า
- **ปล่อย `context.TODO` หลุดไป production** — ใช้เป็น placeholder ตอน development แล้วค่อยเปลี่ยนเป็น context ที่มาจาก caller หรือ `context.Background` ที่ entry point

---

## สรุป

1. `context` เป็นค่าที่ทำตาม `context.Context` interface ไม่ใช่ keyword พิเศษ และตามธรรมเนียมให้ส่งเป็น parameter ตัวแรกชื่อ `ctx`
2. เริ่มต้นจาก `context.Background()` ที่ entry point ส่วน `context.TODO()` เหมาะกับ placeholder ตอน development
3. `context.WithValue` สร้าง child context เพื่อพก metadata ลงไป ใช้ key แบบ unexported และดึง business data ออกมาเป็น parameter เมื่อถึงชั้นที่ต้องใช้
4. `context.WithCancel` กับ `ctx.Done()` ทำให้ goroutine รู้ว่าควรหยุด แต่ worker ต้องเขียนทางออกไว้เอง
5. `ctx.Err()` บอกประเภทการจบ ส่วน `context.Cause(ctx)` บอก error จริงเมื่อใช้ `WithCancelCause`
6. `WithTimeout` รับระยะเวลา, `WithDeadline` รับจุดเวลา และ child context ไม่สามารถขยายเพดานเวลาของ parent
7. ส่ง context ต่อไปยัง HTTP client และเช็ก context ใน loop ของเรา เพื่อไม่ทำงานเกินอายุของ request

ถ้าจะจำประโยคเดียวจากบทนี้ ให้จำว่า **context ไม่ได้ทำงานแทนเรา มันแค่พกข้อมูลและส่งสัญญาณ เราต้องส่งมันต่อและเปิดทางให้โค้ดหยุดเอง**

บทถัดไปจะพาไปเขียน tests เพื่อจับบั๊กและวัดพฤติกรรมของโค้ด Go ให้มั่นใจขึ้น

แค่นี้แล ลองเอา `context` ไปเสียบกับ function ที่กำลังทำงานในโปรเจกต์จริงดูจ้า

---

## Glossary

- **Context** — ค่าที่ทำตาม `context.Context` interface ใช้พก metadata และสัญญาณ cancellation ผ่านชั้นต่าง ๆ ของโปรแกรม
- **`context.Context`** — interface ที่กำหนด method สำหรับดู deadline, ฟังการ cancel, อ่าน error และอ่าน value
- **Cancellation** — สัญญาณที่บอก operation หรือ goroutine ว่าควรหยุดทำงาน
- **`CancelFunc`** — function ที่เรียกเพื่อ cancel context และทำให้ channel จาก `Done()` พร้อมอ่าน
- **Deadline** — จุดเวลาที่ context ต้องหยุดทำงาน
- **Timeout** — ระยะเวลาสูงสุดที่อนุญาตให้ operation ทำงาน
- **Context value** — metadata แบบ key-value ที่ห่ออยู่ใน context chain
- **Sentinel error** — error ค่ามาตรฐานที่ใช้แทนประเภทของเหตุการณ์ เช่น `context.Canceled` และ `context.DeadlineExceeded`
- **Cause** — error รายละเอียดที่ผู้เรียกแนบมากับ cancellation ผ่าน `WithCancelCause`
- **Middleware** — function ที่รับ `http.Handler` แล้วคืน `http.Handler` เพื่อแทรกงานรอบ request เดิม
- **Immutable** — เปลี่ยนค่าตัวเดิมไม่ได้; การเพิ่มข้อมูลใน context จะสร้าง child ตัวใหม่แทน

---

## Related

- [[13_the_standard_library]] — บทก่อนหน้า; `net/http`, `http.Request` และ middleware ที่บทนี้นำมาใช้ต่อ
- [[12_concurrency_in_go]] — goroutine, channel และ `select` ที่เป็นพื้นฐานของการฟัง `ctx.Done()`
- [[07_types_methods_and_interfaces]] — interface และ dependency injection ที่ช่วยแยก middleware ออกจาก business logic
- [[15_writing_tests]] — บทถัดไป; เขียน tests เพื่อหาบั๊กและวัด performance ของโค้ด Go

Learned: none — no correction this session
