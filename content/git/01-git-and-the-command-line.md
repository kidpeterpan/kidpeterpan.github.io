+++
title = 'ตอนที่ 1: Git and the Command Line'
date = '2026-08-08T00:00:00+07:00'
draft = false
description = 'เริ่มต้น Git จากศูนย์: เข้าใจ version control, ใช้ command line เดินโฟลเดอร์, ติดตั้ง Git และตั้งค่า user.name กับ user.email'
tags = ['programming', 'git', 'tutorial']
+++

---

ก่อนจะสั่ง `git commit` หรือแก้ conflict จนอยากปิดฝา laptop หนี เราต้องรู้ก่อนว่า Git กำลังทำงานอยู่บนอะไร

คำตอบคือ **ไฟล์และโฟลเดอร์** นี่แหละ Git ไม่ได้ลอยอยู่ในอากาศ และไม่ได้อ่านใจเราได้ด้วย มันติดตามการเปลี่ยนแปลงของโปรเจกต์ที่อยู่ใน directory หนึ่ง แล้วบันทึกประวัติไว้ให้เราย้อนดูภายหลัง

บทแรกจึงยังไม่รีบสร้าง commit แต่จะพาเตรียมสนามซ้อมให้พร้อม ตั้งแต่เปิด command line, เดินเข้าออกโฟลเดอร์, อ่านโครงสร้างคำสั่ง, ติดตั้ง Git และตั้งชื่อที่จะแสดงอยู่ในประวัติการทำงาน

สิ่งที่จะได้ตอนจบบทนี้:

- อธิบายได้ว่า Git และ version control ช่วยอะไรเรา
- แยก GUI กับ command line และรู้ว่าแต่ละแบบเหมาะกับงานไหน
- ใช้ `pwd`, `ls`, `ls -a`, `cd`, `mkdir` และ `clear` เดินสำรวจ filesystem
- อ่าน command anatomy ได้ว่าอะไรคือ command, option และ argument
- ตรวจสอบ Git ด้วย `git version`
- ตั้งค่า `user.name` และ `user.email` ใน Git config
- เตรียม text editor และ integrated terminal สำหรับทำงานกับโปรเจกต์
- สร้างโฟลเดอร์ `rainbow` เป็นโปรเจกต์ฝึกสำหรับบทถัด ๆ ไป

{{< mermaid >}}
graph TD
  A["โฟลเดอร์โปรเจกต์ + ไฟล์"] --> B["Git ติดตามการเปลี่ยนแปลง"]
  B --> C["commit = snapshot"]
  C --> D["ย้อนดูหรือเทียบเวอร์ชัน"]
  C --> E["รวมงานกับคนอื่น"]
  F["command line"] --> G["สั่งงาน Git"]
  G --> B
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เราจะใช้โฟลเดอร์ชื่อ `rainbow` เป็นโปรเจกต์ฝึกตลอดช่วงเริ่มต้นของซีรีส์ เปิด Terminal, Git Bash หรือ integrated terminal ใน editor ที่ใช้ แล้วทำตามทีละ Step

เครื่องหมาย `$` ที่เห็นในตัวอย่างหมายถึง **command prompt** ไม่ต้องพิมพ์ `$` ตามไปด้วย ให้พิมพ์เฉพาะคำสั่งหลังมันแล้วกด Enter หรือ Return

ถ้าใช้ Windows ให้เปิด Git Bash หลังติดตั้ง Git เพราะคำสั่งในบทนี้ใช้รูปแบบเดียวกับ macOS/Linux ได้สะดวกที่สุด ส่วนผู้ใช้ PowerShell อาจใช้ `cls` แทน `clear` ได้

---

## Step 1: Git คืออะไร ทำไมเราต้องใช้?

Git คือ **version control system** หรือระบบที่บันทึกประวัติการเปลี่ยนแปลงของไฟล์ในโปรเจกต์

ลองนึกถึงกล้องถ่ายรูปที่ถ่ายโฟลเดอร์โปรเจกต์ไว้เป็นช่วง ๆ ทุกครั้งที่เราสั่งบันทึก Git จะเก็บภาพสถานะของไฟล์ ณ ตอนนั้นไว้ ภาพแต่ละใบเรียกว่า **commit**

ถ้าวันนี้เราแก้ไฟล์แล้วพรุ่งนี้พบว่าโค้ดพัง เราจะสามารถย้อนดูได้ว่า:

- ก่อนหน้านี้ไฟล์มีหน้าตาอย่างไร
- ใครแก้ไฟล์และแก้เมื่อไหร่
- การเปลี่ยนแปลงชุดไหนทำให้เกิดปัญหา
- เราจะรวมงานของคนหลายคนกลับเข้ามาในโปรเจกต์เดียวกันอย่างไร

Git จึงไม่ได้เป็นแค่ปุ่ม Undo ขนาดใหญ่ แต่เป็นประวัติของโปรเจกต์ที่หลายคนช่วยกันอ่านและต่อยอดได้

### ตรวจสอบว่าเครื่องมี Git หรือยัง

รันคำสั่งนี้:

```sh
git version
```

ถ้าติดตั้งแล้วจะเห็น output ประมาณนี้:

```text
git version 2.45.0
```

ตัวเลข version บนเครื่องของเราอาจไม่เหมือนตัวอย่าง ขอแค่เป็น Git รุ่นใหม่พอใช้งานคำสั่งในบทต่อ ๆ ไปได้ โดยทั่วไปใช้ Git ที่ใหม่กว่า 2.28 จะปลอดภัยกับเนื้อหาซีรีส์นี้

ถ้าขึ้นข้อความว่าไม่พบคำสั่ง `git` ให้ติดตั้งจาก [git-scm.com/downloads](https://git-scm.com/downloads) แล้วเปิด command line ใหม่อีกครั้งก่อนลอง `git version`

> ถ้า command line หา `git` ไม่เจอ ยังไม่ต้องลองคำสั่ง Git อื่นต่อ เพราะทุกคำสั่งจะพังด้วยสาเหตุเดียวกัน

---

## Step 2: GUI กับ command line ต่างกันอย่างไร?

เวลาสั่งงานคอมพิวเตอร์ เรามักมีสองทางเลือก:

| วิธี | หน้าตา | ตัวอย่าง | จุดเด่น |
|---|---|---|---|
| GUI (Graphical User Interface) | ปุ่ม, ไอคอน, หน้าต่าง | Finder, File Explorer, Git client | เริ่มต้นง่าย เห็นภาพทันที |
| Command line / CLI | พิมพ์คำสั่งใน terminal | Terminal, Git Bash | ทำซ้ำได้เร็ว เข้าถึง option ได้ละเอียด |

GUI เหมาะกับการลากไฟล์ เปิดโฟลเดอร์ หรือดูภาพรวม ส่วน command line เหมาะกับงานที่ต้องทำซ้ำและต้องการความชัดเจนว่าเราสั่งอะไรไป

หนังสือและบทเรียน Git ส่วนใหญ่ยังสอน command line เพราะมันช่วยสร้าง **mental model** หรือภาพในหัวว่า Git ทำงานอย่างไร ถ้าเข้าใจ command line แล้วค่อยไปใช้ GitHub Desktop, VS Code หรือ GUI ตัวไหนก็ได้ง่ายขึ้น

ไม่ได้แปลว่า GUI ไม่ดีนะ เราใช้ทั้งสองแบบได้เลย เพียงแต่ไม่ควรให้ GUI กลายเป็นกล่องดำที่กดแล้วไม่รู้ว่าข้างในทำอะไร

---

## Step 3: เปิด command line และดูว่าเราอยู่ที่ไหน

ทุกครั้งที่เปิด terminal เราจะยืนอยู่ใน directory หนึ่งเสมอ เรียกว่า **current directory**

ให้ใช้ `pwd` ซึ่งย่อมาจาก `print working directory` เพื่อดู path เต็มของตำแหน่งปัจจุบัน:

```sh
pwd
```

ตัวอย่าง output บน macOS อาจเป็น:

```text
/Users/your-name
```

บน Windows ที่ใช้ Git Bash อาจเห็นรูปแบบประมาณนี้:

```text
/c/Users/your-name
```

ไม่ต้องตกใจกับ path ที่ต่างกัน แต่ละระบบตั้งชื่อรากของ filesystem ไม่เหมือนกัน จุดสำคัญคือคำสั่งบอกว่า “ตอนนี้เราอยู่ตรงไหน”

### ดูไฟล์ใน directory ด้วย `ls`

```sh
ls
```

`ls` ย่อมาจาก `list` ใช้แสดงไฟล์และโฟลเดอร์ที่มองเห็นได้ ถ้าอยากเห็น hidden files ด้วย ให้เติม option `-a`:

```sh
ls -a
```

ไฟล์ที่ชื่อขึ้นต้นด้วย `.` เช่น `.config` หรือ `.gitconfig` มักเป็นไฟล์ตั้งค่า อย่ารีบแก้หรือลบเพียงเพราะมองเห็นแล้ว ดูให้รู้ว่ามันคืออะไรเสียก่อน

> `pwd` บอกว่าเราอยู่ไหน ส่วน `ls` บอกว่ารอบตัวมีอะไรบ้าง จำสองคำนี้ไว้ก่อน ได้ใช้บ่อยมากกกก

---

## Step 4: อ่านโครงสร้างคำสั่งให้เป็น

คำสั่งหนึ่งบรรทัดมักประกอบด้วยสามส่วน:

```text
command   option   argument
```

ดูตัวอย่างจากคำสั่ง Git ที่เราจะใช้ในบทถัดไป:

```sh
git commit -m "first commit"
```

แยกได้แบบนี้:

| ส่วน | ในตัวอย่าง | หน้าที่ |
|---|---|---|
| Command | `git commit` | บอกว่าจะให้ Git ทำงานอะไร |
| Option | `-m` | เปลี่ยนหรือกำหนดรายละเอียดของ command |
| Argument | `"first commit"` | ค่าที่ส่งให้ option หรือ command ใช้ |

บางคำสั่งไม่มี option หรือ argument ก็ได้ บางคำสั่งมีหลายตัวก็ได้ และ option อาจเขียนด้วย dash เดี่ยว (`-`) หรือ double dash (`--`) เช่น `-m` กับ `--global`

เวลาหนังสือหรือเอกสารเขียนแบบนี้:

```sh
git commit -m "<message>"
```

เครื่องหมาย `<message>` เป็นป้ายบอกให้เราแทนที่ด้วยค่าจริง ไม่ต้องพิมพ์เครื่องหมาย angle brackets เข้าไป เช่น:

```sh
git commit -m "add login page"
```

ถ้าอ่าน command anatomy ออก คำสั่ง Git ยาว ๆ จะไม่ได้น่ากลัวเท่าเดิม เพราะเราค่อย ๆ แยกมันเป็นชิ้น ๆ ได้

---

## Step 5: เดินเข้าออกโฟลเดอร์ด้วย `cd`

`cd` ย่อมาจาก `change directory` ใช้เดินเข้าไปยัง directory ที่ต้องการ:

```sh
cd Desktop
pwd
```

ถ้าโฟลเดอร์ชื่อมีช่องว่าง ให้ครอบชื่อด้วย quote หรือ escape space เช่น:

```sh
cd "My Projects"
```

แต่สำหรับโฟลเดอร์ที่เราจะสร้างเอง แนะนำให้เลี่ยงช่องว่างไปก่อน ชีวิตจะง่ายขึ้นเยอะ

### ถอยกลับด้วย `cd ..`

เครื่องหมาย `..` หมายถึง parent directory หรือโฟลเดอร์ที่อยู่ด้านบนหนึ่งระดับ:

```sh
cd ..
pwd
```

ถ้าอยู่ที่ `/Users/your-name/Desktop` คำสั่ง `cd ..` จะพากลับไป `/Users/your-name`

### กลับบ้านด้วย `cd ~`

เครื่องหมาย `~` หมายถึง home directory ของ user ปัจจุบัน:

```sh
cd ~
```

อันนี้มีประโยชน์เวลาเราหลงอยู่ในโฟลเดอร์ลึก ๆ แล้วอยากกลับไปตั้งหลักใหม่

---

## Step 6: สร้างโปรเจกต์ฝึกชื่อ `rainbow`

ตอนนี้เรารู้วิธีดูตำแหน่งและเดินทางแล้ว มาสร้างสนามซ้อมกัน

ให้กลับไปที่ home directory ก่อน แล้วสร้างโฟลเดอร์ `rainbow`:

```sh
cd ~
mkdir rainbow
cd rainbow
pwd
```

ผลลัพธ์ควรชี้ไปยังโฟลเดอร์ `rainbow` เช่น:

```text
/Users/your-name/rainbow
```

`mkdir` ย่อมาจาก `make directory` และสร้าง directory ใหม่ใน current directory ถ้าขึ้น error ว่าโฟลเดอร์มีอยู่แล้ว ไม่ได้แปลว่า Git พัง แปลว่าเราเคยสร้างสนามซ้อมนี้ไว้ก่อนแล้ว ให้ใช้ `cd rainbow` เข้าไปได้เลย

ลองดูข้างใน:

```sh
ls
ls -a
```

ตอนนี้ `ls` อาจไม่แสดงอะไร เพราะโฟลเดอร์ยังว่าง ส่วน `ls -a` จะเห็น `.` และ `..` ซึ่งเป็น current directory กับ parent directory

### ล้างหน้าจอด้วย `clear`

ถ้าหน้าต่างเริ่มรก ให้ใช้:

```sh
clear
```

บน Windows Command Prompt ใช้ `cls` แทน ส่วน Git Bash ใช้ `clear` ได้

คำสั่งล้างหน้าจอไม่ได้ลบไฟล์ ไม่ได้ย้อนคำสั่ง และไม่ได้ลบประวัติของ Git มันแค่ทำให้หน้าต่างโล่งขึ้นเท่านั้น

---

## Step 7: ติดตั้ง Git ให้พร้อมใช้งาน

ถ้า `git version` ใน Step 1 แสดง version แล้ว ข้ามส่วนนี้ได้เลย

### macOS

วิธีที่สะดวกคือใช้ Homebrew:

```sh
brew install git
```

หรือดาวน์โหลด installer จาก [git-scm.com/downloads](https://git-scm.com/downloads)

### Windows

ดาวน์โหลด Git for Windows จากเว็บไซต์เดียวกัน แล้วติดตั้งตามขั้นตอน ในชุดติดตั้งจะมี Git Bash ให้เปิดใช้ด้วย

### ตรวจซ้ำ

หลังติดตั้งเสร็จ ให้ปิดแล้วเปิด terminal ใหม่ จากนั้นรัน:

```sh
git version
```

ถ้ายังขึ้นว่าไม่พบคำสั่ง ให้เช็กว่าเปิดหน้าต่างใหม่แล้วหรือยัง และระบบมองเห็น Git อยู่ใน `PATH` หรือไม่

---

## Step 8: ตั้งชื่อผู้เขียนใน Git config

ทุก commit จะมีข้อมูลว่าใครเป็นคนบันทึก ดังนั้นก่อนเริ่ม commit จริง เราควรตั้งค่า `user.name` กับ `user.email` ก่อน

เริ่มจากดู config ระดับ global:

```sh
git config --global --list
```

ถ้ายังไม่เคยตั้งค่า อาจเห็น error ประมาณว่าไม่มีไฟล์ `.gitconfig` นั่นไม่ใช่เรื่องน่ากลัว แปลว่ายังไม่มี global config ให้ Git อ่านเท่านั้น

ตั้งชื่อและอีเมลด้วยคำสั่งนี้ โดยเปลี่ยนค่าใน quote เป็นของตัวเอง:

```sh
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

จากนั้นตรวจเฉพาะค่าที่สนใจ:

```sh
git config --global --get user.name
git config --global --get user.email
```

หรือดูทั้งหมดอีกครั้ง:

```sh
git config --global --list
```

### Global กับ local ต่างกันอย่างไร?

- `--global` — ใช้ค่ากับทุก repository ของ user คนนี้บนเครื่อง
- ไม่ใส่ `--global` — ตั้งค่าเฉพาะ repository ปัจจุบัน

ตอนนี้ใช้ `--global` ไปก่อน เพราะเหมาะกับการตั้งค่าหลักของเรา ถ้าวันหนึ่งต้องใช้อีเมลหรือชื่อคนละชุดในโปรเจกต์เฉพาะ ค่อยตั้งค่า local ทับภายใน repository นั้นได้

> อีเมลใน commit อาจถูกคนอื่นมองเห็นได้ ถ้าไม่อยากเปิดเผยอีเมลส่วนตัว ให้ใช้อีเมลแบบ `noreply` ของบริการที่เราใช้แทน

---

## Step 9: เตรียม text editor และ integrated terminal

Git จัดการไฟล์ plain text ได้ทุกชนิด ไม่ว่าจะเป็น `.go`, `.js`, `.md`, `.txt` หรือไฟล์ config

**Text editor** คือโปรแกรมสำหรับแก้ plain text เช่น Visual Studio Code, Zed, Sublime Text หรือ Vim ส่วน **word processor** อย่าง Microsoft Word หรือ Google Docs เก็บ rich text และ metadata เพิ่มเข้ามา จึงไม่เหมาะกับไฟล์ source code

เลือก editor ที่ถนัดได้เลย สิ่งที่ควรมีคือ:

- เปิดโฟลเดอร์โปรเจกต์ทั้งก้อนได้
- แสดงชื่อไฟล์และ directory ชัดเจน
- แก้ plain text โดยไม่เติม formatting แปลก ๆ
- มี syntax highlighting ถ้าใช้เขียนโค้ด

Editor อย่าง VS Code มี **integrated terminal** หรือ terminal ที่ฝังอยู่ในหน้าต่างเดียวกัน ทำให้เปิดไฟล์ด้านหนึ่งและรัน Git อีกด้านหนึ่งได้ ไม่ว่าจะใช้ terminal แยกหรือ integrated terminal ผลของคำสั่งก็เหมือนกัน

ถ้าติดตั้ง VS Code และเปิดคำสั่ง `code` ไว้ใน `PATH` แล้ว สามารถเปิดโฟลเดอร์ `rainbow` ได้ด้วย:

```sh
cd ~/rainbow
code .
```

ถ้าคำสั่ง `code` ใช้ไม่ได้ก็ไม่เป็นไร เปิด editor เองแล้วเลือกโฟลเดอร์ `rainbow` จากเมนู Open Folder ได้

---

## แบบฝึกหัด

ลองทำโดยไม่เปิดเฉลยก่อน:

1. รัน `git version` และจด version ของ Git ในเครื่อง จากนั้นตรวจว่า version ใหม่พอสำหรับบทถัด ๆ ไปหรือไม่
2. ใช้ `pwd`, `ls`, `ls -a`, `cd`, `cd ..` เดินจาก home เข้า `rainbow` แล้วกลับออกมา โดยพิมพ์ `pwd` ยืนยันทุกครั้งว่าอยู่ที่ไหน
3. สร้างโฟลเดอร์ `rainbow-copy` ใน home ด้วย `mkdir` แล้วใช้ `ls` ตรวจว่ามีจริง จากนั้นลบโฟลเดอร์นี้ด้วย GUI ของ filesystem อย่าเพิ่งใช้คำสั่งลบถ้ายังไม่คุ้น
4. ตั้งค่า `user.name` และ `user.email` แล้วใช้ `git config --global --get` ตรวจว่าค่าออกมาตรงกับที่ตั้งไว้
5. เขียนคำสั่ง `git commit -m "first commit"` ลงกระดาษ แล้ววงให้ได้ว่า `git commit` คือ command, `-m` คือ option และข้อความใน quote คือ argument

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **พิมพ์ `$` ตามตัวอย่างลงไปด้วย** — `$` เป็น command prompt ให้พิมพ์เฉพาะคำสั่งหลังมัน
- **สับสน current directory กับหน้าต่าง Finder/File Explorer** — `cd` เปลี่ยนตำแหน่งใน command line ไม่ได้สั่งให้หน้าต่าง filesystem เปลี่ยนตาม
- **ใช้ path ผิดระบบ** — macOS/Linux/Git Bash ใช้ `/` ส่วน Windows บาง shell แสดง drive path ต่างกัน ตรวจด้วย `pwd` แทนการเดา
- **ลืม `cd` หลังเปิด terminal ใหม่** — terminal ใหม่มักเริ่มที่ home directory ต้องกลับเข้า `rainbow` อีกครั้ง
- **ใช้ช่องว่างในชื่อโฟลเดอร์** — ทำให้ต้องครอบชื่อด้วย quote หรือ escape space เลี่ยงได้ก็เลี่ยง
- **ลบ hidden file โดยไม่รู้หน้าที่** — `.gitconfig`, `.ssh` และไฟล์ขึ้นต้นด้วยจุดอาจเป็น config สำคัญ อย่าแตะถ้าไม่แน่ใจ
- **ตั้ง `user.email` เป็นอีเมลที่ไม่อยากเปิดเผย** — ข้อมูลนี้ติดไปกับ commit ที่คนอื่นอาจเห็นได้
- **ใช้ Word แก้ source code** — rich text อาจเติม metadata หรือ formatting ที่ทำให้ไฟล์โปรเจกต์มีปัญหา ใช้ text editor แทน
- **Git มีแล้วแต่ terminal ยังหาไม่เจอ** — ปิดแล้วเปิด terminal ใหม่หลังติดตั้ง และตรวจ `PATH`

---

## สรุป

1. Git คือ version control system ที่เก็บประวัติการเปลี่ยนแปลงของไฟล์ในโปรเจกต์
2. commit คือ snapshot ของโปรเจกต์ ณ เวลาหนึ่ง ใช้ย้อนดูและเทียบเวอร์ชันได้
3. GUI ใช้ง่ายและเห็นภาพ ส่วน command line ทำซ้ำได้และเข้าถึง option ของ Git ได้ละเอียด
4. ทุกครั้งที่เปิด terminal เราจะอยู่ใน current directory หนึ่งเสมอ
5. ใช้ `pwd` ดูตำแหน่ง, `ls` ดูไฟล์, `ls -a` ดู hidden files, `cd` เดินทาง และ `mkdir` สร้างโฟลเดอร์
6. อ่าน command anatomy ให้เป็น: command ทำอะไร, option ปรับอย่างไร, argument คือค่าอะไร
7. ตรวจ Git ด้วย `git version` และใช้ Git รุ่นใหม่กว่า 2.28 เพื่อให้เข้ากับบทถัด ๆ ไป
8. ตั้ง `user.name` กับ `user.email` ด้วย `git config --global` ก่อนเริ่ม commit
9. ใช้ text editor จัดการ plain text และใช้ integrated terminal หรือ terminal แยกตาม workflow ที่ถนัด
10. สร้าง `rainbow` ไว้เป็นสนามซ้อม แล้วบทถัดไปเราจะเปลี่ยนโฟลเดอร์ธรรมดาให้กลายเป็น Git repository

ตอนนี้ยังไม่ได้ทำอะไรหวือหวาเลย แค่เดินดูบ้าน วางโต๊ะ เตรียมกล้อง และติดป้ายชื่อเจ้าของบ้านไว้ก่อน แต่ถ้าขั้นพื้นฐานนี้แน่น บทที่เหลือจะง่ายขึ้นมาก

> *ตอนถัดไปเราจะเปลี่ยน `rainbow` ให้เป็น local Git repository และทำความรู้จัก areas ที่ Git ใช้รับส่งไฟล์ก่อนสร้าง commit แรก*

---

## Glossary

- **Git** — version control system ที่ติดตามประวัติการเปลี่ยนแปลงของโปรเจกต์
- **Version control system** — ระบบบันทึก, ย้อนดู และเทียบเวอร์ชันของไฟล์
- **Commit** — snapshot หรือภาพสถานะหนึ่งของโปรเจกต์ที่บันทึกด้วย Git
- **GUI (Graphical User Interface)** — ส่วนติดต่อแบบปุ่ม, ไอคอน และการชี้คลิก
- **Command line / CLI / terminal / shell** — หน้าต่างสำหรับพิมพ์คำสั่งข้อความ
- **Command prompt** — ข้อความต้นบรรทัดที่บอก current directory และตำแหน่ง cursor
- **Current directory** — directory ที่ command line กำลังทำงานอยู่
- **Directory** — โฟลเดอร์ใน filesystem
- **Option** — ส่วนของคำสั่งที่เปลี่ยนพฤติกรรม มักขึ้นต้นด้วย `-` หรือ `--`
- **Argument** — ค่าที่ส่งให้ command หรือ option ใช้
- **Filesystem** — โครงสร้างที่ใช้จัดเก็บไฟล์และ directory บนเครื่อง
- **Hidden file** — ไฟล์ที่ปกติไม่แสดงในรายการ มักมีชื่อขึ้นต้นด้วยจุด
- **Git config** — ค่าตั้งต้นที่กำหนดพฤติกรรมและข้อมูลผู้ใช้ของ Git
- **Text editor** — โปรแกรมสำหรับแก้ plain text เช่น source code และ Markdown
- **Integrated terminal** — command line ที่ฝังอยู่ใน text editor หรือ IDE

---

## Related

- [ตอนที่ 2: Local Repositories](/git/02-local-repositories/) — บทถัดไป เปลี่ยน `rainbow` ให้เป็น Git repository และรู้จัก areas ของ Git
- [ตอนที่ 3: Making a Commit](/git/03-making-a-commit/) — ขยายความ `git commit -m "<message>"` ที่เราเห็นโครงสร้างไว้ในบทนี้
