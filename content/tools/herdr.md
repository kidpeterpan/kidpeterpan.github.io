+++
title = 'Herdr'
date = '2026-08-29T13:42:47+07:00'
draft = false
description = ''
tags = ['tools']
+++

# Herdr 

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