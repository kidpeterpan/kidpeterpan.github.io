+++
title = 'Herdr'
date = '2026-08-29T13:42:47+07:00'
draft = false
description = ''
tags = ['tools']
+++

# Herdr 

![Herdr](/images/herdr/herdr.png)

doc: https://herdr.dev/docs/

## Install

```sh
curl -fsSL https://herdr.dev/install.sh | sh
```

---

## What is Herdr?

นิยามสั้นๆ คือ Terminal workspace manager for AI coding ที่ Support mouse-first
คนที่กด shortcut ไม่ค่อยคล่องหรือขี้เกียจจำเวลาใช้ tmux หันมาใช้ herdr ก็จะรู้สึกว่าใช้ง่ายขึ้น

---

## Why Herdr?

- เห็นสถานะ agent ได้ในที่เดียว
- จำ  session ของ terminal 
- ใช้งานง่าย (mouse-first native)
- มี local socket API ทำให้ agent ตัวหนึ่งสั่งงาน agent ตัวอื่นผ่าน herdr ได้
- integrate กับ AI Provider หลายเจ้า e.g. claude, openai และ อื่นๆ
- open source และมีระบบ plugin/marketplace

---

## Concept

### Workspace / Tab / Pane

workspace เป็น top-level project container.
เราสามารถใช้ 1 workspace สำหรับ 1 repo, task หรือการ investigation

ใน 1 workspace จะประกอบด้วย tab (ด้านบน) และ panes (หน้าต่างด้านในของ tab นั้น)
ด้านซ้ายจะแสดง agents ที่เราเปิดใช้งาน และบอกสถานะการทำงาน

### Agent

Agent ที่กำลังทำงานจะแสดงผลอยู่ด้านซ้ายล่างของ workspace 
Herdr detects agents จาก foreground processes
ทำให้เราเห็น state ของ agent ได้แบบ realtime

Agent states:

| State | ความหมาย |
|---|---|
| **blocked** | agent กำลังรอ input, การอนุมัติหรือการตัดสินใจจากคุณ |
| **working** | agent กำลังทำงานอยู่ |
| **done** | agent ทำงานเสร็จแล้ว แต่คุณยังไม่ได้เข้าไปดู |
| **idle** | agent เสร็จงานแล้วหรือกำลังรออยู่ และคุณได้เห็นสถานะนี้แล้ว |
| **unknown** | Herdr ไม่สามารถระบุสถานะได้อย่างมั่นใจ |

### Session

Session ใน herdr ก็คือ "namespace" ของ server ที่รันอยู่เบื้องหลังแบบถาวร เวลาเราพิมพ์คำสั่ง herdr เฉยๆ โดยไม่ระบุอะไรเพิ่ม ระบบจะพาเราไป attach เข้ากับ session เริ่มต้น (default session) โดยอัตโนมัติ
จุดที่น่าสนใจคือ herdr รองรับการสร้าง named session ได้ด้วย ซึ่งแต่ละ session ที่ตั้งชื่อเองนี้จะแยกขาดจากกันโดยสมบูรณ์ ทั้ง pane, socket และ runtime state ที่ถูก persist ไว้ 

ลองดูตัวอย่างคำสั่งกัน:

```sh
herdr session list
herdr session attach work
herdr session attach side-project
```

จะเห็นว่าเราสามารถมีหลาย session พร้อมกันได้ เช่น session ชื่อ work กับ side-project โดยที่ทั้งสองจะไม่ไปยุ่งเกี่ยวหรือแชร์ pane กันเลย

### Mouse UI 

สั่นๆ คือเราใช้เมาส์คลิก menu ได้ 100% 

### Client and server

โดยปกติแล้ว Herdr จะรันเป็น background server พร้อมกับ client ที่ attach เข้ามาหนึ่งตัวหรือมากกว่า
server เป็นเจ้าของ pane และ process state ทั้งหมด ส่วน client คือ terminal UI ที่ attach เข้ากับ server นั้น
detach client ได้ด้วยปุ่ม ctrl+b q โดย server และ agent จะยังทำงานต่อไปตามปกติ
หากต้องการจบ session และหยุด pane ทั้งหมดในนั้น ให้หยุด server ด้วยคำสั่ง

```sh
herdr server stop
```


### Modes

Herdr มีโหมดการทำงาน 3 แบบ คือ 

- terminal mode
- prefix mode
- navigate mode

terminal mode จะส่งปุ่มที่กดไปยัง pane ที่ focus อยู่ prefix mode จะรอ action ของ Herdr หนึ่งคำสั่งหลังจากกด prefix key ส่วน navigate mode คือหน้าจอสำหรับ navigate ไปมาระหว่าง workspace ที่แสดงอยู่ตลอดเวลา
กด prefix key (ค่า default คือ ctrl+b) แล้วตามด้วย action key เช่น c เพื่อสร้าง tab ใหม่ หรือ w เพื่อ navigate ไปยัง workspace อื่น ดูรายละเอียดเพิ่มเติมได้ที่หน้า Keyboard หากยังไม่คุ้นเคยกับแนวคิดเรื่อง prefix

---

## วิธีใช้งาน Herdr 

พื้นฐานที่ต้องเข้าใจก่อนคือ Herdr แยกเป็นสองส่วน: 

- **server** ที่รันอยู่เบื้องหลัง คอย hold pane ทุกอันไว้ให้ทำงานต่อเนื่อง 
- **client** ที่เป็นแค่หน้าต่าง terminal ที่เรา attach เข้าไปดู ปิด client ได้ตลอด และงานด้านในไม่ได้หยุดทำงาน

---

### ทำงานบนเครื่องตัวเอง (Local)

ง่ายสุดครับ แค่ cd เข้าไปที่โปรเจกต์แล้วรัน

```sh
herdr
```

มันจะ start หรือ attach เข้า session ที่มีอยู่ให้อัตโนมัติ ไม่ต้องไปยุ่งกับเรื่อง socket เอง จะรัน shell, server, test, หรือ agent ข้างในแต่ละ pane ก็ทำได้ตามปกติ
กด `ctrl+b q` เพื่อ detach — pane ทุกอันยังรันต่อ กลับมาทีหลังก็แค่พิมพ์ `herdr` ใหม่ ส่วนถ้าอยากปิดทุกอย่างจริงๆ ให้หยุด server ด้วย:

```sh
herdr server stop
```

---

### ทำงานบนเครื่อง remote ผ่าน SSH

SSH ไปที่เครื่องที่มีโค้ดกับ credential แล้วรัน herdr ที่นั่นเลย:

```sh
ssh you@server
herdr
```

พฤติกรรมจะเหมือน terminal multiplexer ทั่วไป คือ shell, server, agent ทุกอย่างรันอยู่บนเครื่อง remote ทั้งหมด กด `ctrl+b q` เพื่อ detach แล้ว disconnect ได้เลย พอกลับมา SSH ใหม่แล้วรัน `herdr` อีกครั้งก็เจอ session เดิม
วิธีนี้เหมาะกับคนที่ปกติอยู่ใน SSH shell อยู่แล้ว, ใช้มือถือ/แท็บเล็ตต่อผ่าน SSH client, หรืออยากได้ setup ที่ง่ายที่สุด

---

### ทำงานจากมือถือ

ไม่ต้องมีแอปหรือ dashboard เฉพาะ แค่ลง SSH client ตัวไหนก็ได้ แล้ว SSH เข้าเครื่องที่ agent รันอยู่:

```sh
ssh you@server
herdr
```

Session เดิมที่เคย persist ไว้จะเปิดขึ้นมาในมือถือทันที ตัว TUI ปรับ layout ให้เข้ากับหน้าจอแคบได้เอง ดู agent, สลับ workspace, เช็ก pane ได้โดยไม่ต้องออกจาก SSH เลย
บน iPhone ใน doc บอกว่าได้ใช้ดีกับแอพ moshi

---

### ทำงาน remote จาก terminal เครื่องตัวเอง

ถ้าไม่อยาก SSH เข้าไปเปิด shell ก่อน ให้ attach ผ่านโหมด thin client แทน:

```sh
herdr --remote workbox
herdr --remote ssh://you@server:2222
```

ตัว Herdr บนเครื่องเราจะทำหน้าที่เป็น client บางๆ ต่อผ่าน SSH ไป start/attach server บน remote แล้ว stream UI กลับมาแสดงในเครื่องเรา
จุดต่างสำคัญคือ วิธีนี้ client รันอยู่บนเครื่อง local จริงๆ เลยเชื่อม feature ของ desktop เราได้ เช่น paste รูปจาก clipboard ส่งไปยัง remote server ได้ด้วย
ต่างจากถ้า SSH เข้าไปรัน herdr บนฝั่ง server ตรงๆ ซึ่งจะอ่าน clipboard ของเครื่องเราไม่ได้เลย
ถ้าต้อง connect เครื่องเดิมบ่อยๆ ใส่ config ไว้ใน SSH config ให้เลย:

```sh
Host workbox
HostName server.example.com
User you
Port 2222
```

แล้วก็ attach สั้นๆ ด้วย:

```sh
herdr --remote workbox
```

---

## Agents

Herdr รู้ได้ยังไงว่า Agent ตัวไหนกำลังรอเราอยู่
ถ้าเปิด coding agent พร้อมกันหลายตัวจนงงว่าตัวไหนทำงานเสร็จ ตัวไหนติดรออนุมัติอยู่
นี่คือ core feature ของ Herdr เลยครับ มันเก็บแต่ละ agent ไว้ใน pane จริงๆ 
แล้วคอย track state ของแต่ละตัว rollup ขึ้นไปที่ tab และ workspace 
ให้เราเห็นได้จาก sidebar โดยไม่ต้องไล่เปิดดูทีละหน้าต่าง

### รู้จัก agent ได้ยังไง

Herdr detect agent ยอดนิยมได้อัตโนมัติ (Claude Code, Codex, Cursor Agent CLI, Copilot CLI, Gemini CLI ฯลฯ) ด้วย 2 วิธี: 
(1) agent ที่มี **lifecycle hooks/plugin** ให้ install เพิ่ม (เช่น Claude, OMP, OpenCode) ซึ่งจะแม่นสุดเพราะรายงาน state ตรงๆ ส่วน agent ที่ไม่มี hook (2)
Herdr จะอ่าน **screen manifest** คือสแกนข้อความที่แสดงอยู่ท้าย buffer ของ pane สด ๆ แล้วเทียบกับ pattern ที่รู้จัก เพื่อตัดสินว่า idle, working หรือ blocked

### Blocked state

ระบบจะ mark ว่า blocked ก็ต่อเมื่อจอตรงกับ UI ขออนุมัติ/คำถามที่รู้จักจริงๆ เท่านั้น ถ้าไม่ตรง rule ไหนเลยจะ fallback เป็น idle ไปก่อน 
(เช็คเหตุผลได้ด้วย `herdr agent explain <target>`) 

### Manifest อัปเดตเองได้

Pattern พวกนี้ (เรียกว่า manifest) ฝังมากับตัว Herdr อยู่แล้ว แต่ก็ดึงอัปเดตจาก herdr.dev มา apply แบบ hot-reload ได้
โดยไม่ต้อง restart ถ้าอยากปรับเอง วาง local override ไว้ที่ `~/.config/herdr/agent-detection/<agent>.toml` ได้เลย 
(local จะ win เสมอ) ส่วนถ้าอยาก force reload ทันทีก็รัน `herdr server update-agent-manifests`

### คำสั่งที่ใช้บ่อย

- ติดตั้ง integration ให้ agent ตัวไหน: `herdr integration install claude` แล้วเช็คด้วย `herdr integration status`
- ตั้งชื่อ agent เอง (ใช้แทน pane ID ยาวๆ): `herdr agent rename w1:p1 reviewer`
- แนบ terminal ปัจจุบันเข้าไปคุยกับ agent ตัวเดียวตรงๆ (ไม่ต้องผ่าน UI เต็ม): `herdr agent attach reviewer` 
— detach ด้วย `ctrl+b q`, ถ้ามีคนอื่น attach อยู่ก่อนใช้ `--takeover` แย่งสิทธิ์ input ได้

### สำหรับ workflow แปลกๆ

ถ้ารัน agent ผ่าน sandbox wrapper (เช่น fence, nono) ที่บัง process จริงไว้ ให้ตั้ง `HERDR_AGENT=<agent>` เพื่อบอก Herdr ว่าใช้ manifest ตัวไหนตรวจ 
ส่วนถ้า Linux runtime บาง sandbox ไม่โชว์ foreground process group ให้เปิด `HERDR_PROCESS_DETECTION=child-groups` ตอน start server (ต้อง restart server เพื่อให้มีผล)

ทั้งหมดนี้ออกแบบมาเพื่อให้ workflow เดียว เปิดหลาย agent พร้อมกัน ปล่อยให้มันทำงาน แล้วดูจาก sidebar ว่าตัวไหนต้องการเราตัดสินใจ ตัวไหนยังรันอยู่ ตัวไหนพร้อมให้ review แล้ว

---