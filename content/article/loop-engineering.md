+++
title = 'Loop Engineering'
date = '2026-06-27T00:00:00+07:00'
draft = false
description = 'แปลจาก Loop Engineering โดย Addy Osmani — ว่าด้วยการออกแบบระบบที่ทำงานแทนตัวเราในการ Prompt AI Agent'
tags = ['ai', 'engineering']
[params]
source = 'https://addyosmani.com/blog/loop-engineering/'
+++

> แปลจาก [Loop Engineering](https://addyosmani.com/blog/loop-engineering/) โดย Addy Osmani

---

## Loop Engineering คืออะไร

> "Loop engineering is replacing yourself as the person who prompts the agent. You design the system that does it instead."

กล่าวคือ Loop Engineering (( _การออกแบบลูปงาน_ )) คือกระบวนทัศน์ใหม่ที่เปลี่ยนมุมมองว่าด้วยการทำงานร่วมกับ AI Agent — แทนที่จะนั่ง Prompt Agent ทีละขั้น วนซ้ำแบบ Manual เราออกแบบ **ระบบ** ที่จัดการ Agent เหล่านั้นแทนตัวเราเอง

ผู้นำในวงการอย่าง Peter Steinberger และ Boris Cherny ต่างชี้ไปในทิศทางเดียวกัน: วิศวกรที่แข็งแกร่งในยุคนี้ไม่ใช่คนที่ Prompt เก่งที่สุด แต่คือคนที่ **ออกแบบ Loop ได้ดีที่สุด**

---

## 5 องค์ประกอบหลักของ Loop

### 1. Automations — ระบบอัตโนมัติสำหรับค้นหางาน

กระบวนการที่ทำงานตามตารางเวลาโดยไม่ต้องมีคนกดเริ่ม เพื่อ:

- ค้นหางานที่ต้องทำผ่านรอบสม่ำเสมอ
- คัดแยกและจัดลำดับความสำคัญ (( _triage - กระบวนการคัดแยกงานตามความสำคัญและความเร่งด่วน_ ))
- นำผลลัพธ์ขึ้นมาให้คนรีวิว โดยไม่ต้องเช็คเองทุกวัน

ตัวอย่างเช่น Automation เช้าที่รันทุกวัน อ่าน CI failures และ open issues ทั้งหมด แล้วสร้าง draft สำหรับแก้ปัญหาในแต่ละเรื่องขึ้นมาอัตโนมัติ

### 2. Worktrees — พื้นที่ทำงานแยกกันสำหรับหลาย Agent

Git worktrees (( _พื้นที่ทำงานแยกกันในโครงสร้าง Git เดียวกัน_ )) ช่วยให้ Agent หลายตัวทำงานพร้อมกันโดยไม่ชนกัน

- แต่ละ Agent มีไดเรกทอรีการทำงานของตัวเอง
- ทำงานบน Branch แยก แต่อยู่ใน Repository ประวัติเดียวกัน
- ขจัดปัญหา File conflict เมื่อ Agent หลายตัวแก้ไขโค้ดพร้อมกัน

### 3. Skills — ความรู้โปรเจกต์ที่จัดเก็บเป็นเอกสาร

ข้อมูลที่เขียนไว้ใน `SKILL.md` หรือไฟล์เอกสารของโปรเจกต์ เพื่อให้ Agent รู้ว่า:

- Convention และรูปแบบโค้ดของโปรเจกต์นี้คืออะไร
- วิธี Build และ Deploy ทำอย่างไร
- ความรู้เฉพาะทางที่ต้องใช้สำหรับโดเมนนี้

การบันทึก Skills ไว้ป้องกันไม่ให้ Agent ต้องเสียเวลา re-derive (( _สร้างความเข้าใจใหม่ทุกครั้ง_ )) context เดิมซ้ำในแต่ละรอบของ Loop

### 4. Plugins and Connectors — จุดเชื่อมต่อกับโลกภายนอก

สร้างบน MCP (( _Model Context Protocol - โปรโตคอลมาตรฐานสำหรับเชื่อมต่อ AI Model กับเครื่องมือและข้อมูลภายนอก_ )) ที่เชื่อม Agent เข้ากับระบบอื่นในชีวิตการทำงานจริง เช่น:

- Issue trackers (Linear, Jira)
- Database
- Slack
- Staging APIs

Connectors ทำให้ Loop สามารถ **ลงมือทำได้จริง** ใน workflow จริง — ไม่ใช่แค่วิเคราะห์หรือแนะนำ

### 5. Sub-agents — Agent เฉพาะทางสำหรับแต่ละบทบาท

แทนที่จะให้ Agent ตัวเดียวทำทุกอย่าง ให้แบ่งบทบาทชัดเจน:

- **Explorer** — ค้นหาและทำความเข้าใจ Context
- **Implementer** — เขียนโค้ดและแก้ปัญหา
- **Reviewer** — ตรวจสอบผลลัพธ์กับมาตรฐานโปรเจกต์

การแยก Agent ที่สร้างโค้ดออกจาก Agent ที่รีวิวโค้ด ป้องกัน overconfidence (( _ความมั่นใจเกินจริงในผลลัพธ์ที่สร้างขึ้นเอง_ )) และทำให้การตรวจสอบมีคุณภาพจริง

---

## State Management — ความทรงจำข้ามรอบ

องค์ประกอบสนับสนุนที่สำคัญคือการจัดเก็บสถานะภายนอก (( _External State Management_ )) ผ่าน:

- Markdown files ที่บันทึกความคืบหน้า
- Linear boards หรือ Issue trackers

เพื่อให้ Loop รู้ว่างานไหนเสร็จแล้ว งานไหนยังค้างอยู่ และสามารถ Continue ได้ต่อเนื่องข้ามหลายรอบ (( _session_ ))

---

## ตัวอย่าง Loop ที่ทำงานได้จริง

```
เช้า → Automation รัน triage
         ↓
       อ่าน CI failures + open issues
         ↓
       สร้าง isolated worktrees สำหรับแต่ละปัญหา
         ↓
       Explorer agent ทำความเข้าใจ context
         ↓
       Implementer agent แก้ไขโค้ด
         ↓
       Reviewer agent ตรวจสอบกับ project standards
         ↓
       Connector เปิด PR + อัปเดต tickets
         ↓
       State file บันทึกความคืบหน้า
```

---

## คำเตือน 3 ข้อที่ต้องจำ

### 1. Verification ยังคงเป็นหน้าที่ของมนุษย์

> "Unattended loops make unattended mistakes."

Loop ที่ดีขึ้นไม่ได้หมายความว่าถูกต้องขึ้น Sub-agent สำหรับ verify ช่วยได้ แต่การยืนยันขั้นสุดท้ายยังต้องมาจากมนุษย์

### 2. Knowledge Decay — หนี้แห่งความเข้าใจ

ยิ่ง Loop ทำงานเร็ว ยิ่งมีโค้ดถูก Ship ออกไปมากขึ้น — แต่ช่องว่างระหว่างสิ่งที่ระบบทำกับสิ่งที่วิศวกรเข้าใจก็ยิ่งกว้างขึ้น

บทความเรียกสิ่งนี้ว่า **"Comprehension Debt"** (( _หนี้ความเข้าใจ - สถานะที่โค้ดถูก deploy ออกไปแต่คนในทีมไม่เข้าใจว่ามันทำงานอย่างไร_ ))

### 3. Cognitive Surrender — การยอมจำนนทางความคิด

ความสะดวกของ Automation ล่อให้วิศวกรทิ้ง judgement ของตัวเองไป เปลี่ยนเครื่องมือเพิ่ม productivity ให้กลายเป็น **เครื่องมือหลีกเลี่ยงการคิด**

---

## บทสรุป: Leverage Point ไม่ใช่การหายไปของงาน

Loop Engineering เปลี่ยน **จุดที่ leverage เกิดขึ้น** — ไม่ได้กำจัดงานออกไป

Loop เดียวกันให้ผลลัพธ์ต่างกันโดยสิ้นเชิง ขึ้นอยู่กับระดับการมีส่วนร่วมของวิศวกร:

- วิศวกรที่ยังคิดอยู่ → Loop เป็นตัวขยายพลัง
- วิศวกรที่ยอมจำนน → Loop เป็นตัวสร้างหนี้

> สร้าง Loop ให้ดี แต่ยังคงเป็นวิศวกรที่มีส่วนร่วม — ไม่ใช่แค่คนกดปุ่มให้ Automation วิ่ง
