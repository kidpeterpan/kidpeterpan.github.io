+++
title = 'ตอนที่ 7: Creating and Pushing to a Remote Repository'
date = '2026-08-14T00:00:00+07:00'
draft = false
description = 'สร้าง remote repository บน hosting service เชื่อมด้วย git remote add แล้ว push branch ขึ้น remote พร้อมแยก local branch, remote branch และ remote-tracking branch'
tags = ['programming', 'git', 'tutorial']
+++

---

ตอนที่แล้วเราเตรียมสองอย่างให้พร้อม: บัญชีบน hosting service และ authentication ที่ใช้ยืนยันตัวตน ไม่ว่าจะเป็น token สำหรับ HTTPS หรือ SSH key pair

แต่ `rainbow` ยังเป็น local repository ที่อยู่บนเครื่องเราเท่านั้น และมี commit 3 ตัว (red, orange, yellow) โดย `main` กับ `feature` ชี้ไปที่ commit เดียวกัน

บทนี้ถึงเวลาเชื่อม `rainbow` เข้ากับ remote repository กันแล้ว เราจะไล่ตั้งแต่การสร้าง remote บน hosting service, เพิ่ม connection ใน local repository และ push commit ทั้งหมดขึ้นไปเก็บบนคลาวด์

สิ่งที่จะได้ตอนจบบทนี้:

- สร้าง remote repository ว่าง ๆ บน hosting service สำหรับทำแบบฝึกหัด
- เพิ่ม connection จาก local ไป remote ด้วย `git remote add` และตรวจด้วย `git remote -v`
- แยก local branch, remote branch และ remote-tracking branch ออกจากกัน
- push branch ขึ้น remote ด้วย `git push origin <branch>` และเห็นผลด้วย `git branch --all`
- บอกได้ว่า push สร้างหรืออัปเดตเฉพาะ branch ที่ระบุ ไม่ได้ส่งทุก branch ขึ้นไปเอง

{{< mermaid >}}
flowchart LR
  L["rainbow<br/>local repository"] --> S["สร้าง remote repository<br/>บน hosting service"]
  S --> A["git remote add origin URL<br/>เพิ่ม connection ใน local"]
  A --> P["git push origin main<br/>อัปโหลด commits ขึ้น remote"]
  P --> R["remote branch: main<br/>remote-tracking branch: origin/main"]
  R --> N["ตอนที่ 8<br/>เริ่มจาก remote ด้วย git clone"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 6 โดยสมมติว่าเรามีบัญชี hosting service และ authentication พร้อมใช้แล้ว และ `rainbow` ยังอยู่ในสถานะเดิม: มี commit 3 ตัว โดย `main` กับ `feature` ชี้ไปที่ commit เดียวกัน

เข้าไปใน repository แล้วตรวจสถานะพร้อมกัน โดยรันคำสั่งชุดนี้ใน terminal:

```sh
cd ~/rainbow
git status
git log --oneline --decorate -3
git remote -v
```

ถ้าทำตามตอนก่อนหน้าครบ ผลลัพธ์ควรมีหน้าตาประมาณนี้:

```text
On branch main
nothing to commit, working tree clean

fc8139c (HEAD -> main, feature) yellow
7acb333 orange
abc1234 red
```

hash และจำนวน commit ในเครื่องเราอาจต่างจากตัวอย่าง จุดสำคัญคือ `main` กับ `feature` ชี้ไปที่ commit เดียวกัน และ `git status` บอกว่า working tree clean

ส่วน `git remote -v` จะไม่แสดงอะไรเลย เพราะ `rainbow` ยังไม่เคยเชื่อมกับ remote ไหน นี่คือสิ่งที่เราจะเพิ่มในบทนี้

ถ้ายังอยู่บน branch อื่น ให้กลับไป `main` ก่อน:

```sh
git switch main
```

และเตรียม remote repository URL ที่ตรงกับโปรโตคอลที่เลือกไว้ในตอนที่ 6 (HTTPS หรือ SSH) ให้พร้อม เพราะจะใช้ตั้งแต่ Step 2 เป็นต้นไป

---

## Step 1: ทำไมต้องมี remote repository และเริ่มโปรเจกต์ได้สองทาง

ก่อนลงมือสร้าง remote ขอทบทวนว่าเราจะได้อะไรจากการมี repository อยู่นอกเครื่อง:

- **สำรองงาน** — ถ้าเครื่องเราหายหรือฮาร์ดดิสก์พัง งานบนคลาวด์ยังอยู่ครบ
- **เข้าถึงจากหลายเครื่อง** — เปิดโปรเจกต์จากเครื่องทำงานหรือเครื่องอื่นได้ ไม่ต้องติดอยู่กับเครื่องเดียว
- **ทำงานร่วมกับคนอื่น** — แชร์โค้ดให้เพื่อนร่วมทีมดึงไปใช้หรือช่วยกันแก้

### เริ่มโปรเจกต์ได้สองทาง (Why)

การเริ่มทำงานกับโปรเจกต์ Git มีจุดตั้งต้นได้สองทาง ลองเทียบความต่างในตารางนี้:

| | เริ่มจาก local repository | เริ่มจาก remote repository |
|---|---|---|
| ขั้นตอน | `git init` แล้ว commit ก่อน | หา remote ที่มีอยู่หรือสร้างใหม่ แล้วใช้ `git clone` ลงเครื่อง |
| ผลลัพธ์ | local มีข้อมูล ต้อง push ขึ้น remote | ได้ local repository ครบในเครื่องทันที |
| เหมาะกับ | โปรเจกต์เก่าที่ยังไม่ได้ใช้ Git | งานที่อยู่บนคลาวด์แล้ว เช่น ของเพื่อนร่วมทีม |

`rainbow` ใช้เส้นทางแรกมาตลอด: เราใช้ `git init` ตั้งแต่ตอนที่ 2 แล้ว commit ต่อเนื่องจนถึงตอนที่ 5 ส่วนเส้นทางที่สอง (เริ่มจาก remote ด้วยการ clone) จะเรียนในตอนที่ 8

> local repository คือที่ที่เราทำงานประจำวัน ส่วน remote repository คือจุดที่งานชิ้นเดียวกันถูกเก็บไว้ให้แชร์กับคนอื่น ทั้งสองฝั่งแยกจากกัน และการส่งข้อมูลระหว่างกันต้องมีคำสั่งที่ชัดเจนเสมอ

---

## Step 2: สร้าง remote repository บน hosting service

การสร้าง remote repository ทำบนเว็บของ hosting service ขั้นตอนจะแตกต่างกันเล็กน้อยในแต่ละเจ้า ให้เปิด documentation ของ hosting service ที่เลือกไว้ประกอบ

เมื่อสร้างเสร็จ เราจะได้ **project name** และ **remote repository URL** โดย URL มี 2 แบบ คือ HTTPS URL กับ SSH URL ให้เลือกใช้แบบที่ตรงกับโปรโตคอลที่ตั้งค่าไว้ในตอนที่ 6

สำหรับแบบฝึกหัดนี้ ให้ตั้งค่าตามตารางนี้:

| ตัวเลือก | ค่าที่แนะนำ | เหตุผล |
|---|---|---|
| Repository name | `rainbow-remote` | ตั้งชื่อต่างจาก local (`rainbow`) เพื่อให้แยกสองฝั่งออกจากกันได้ง่ายในบทเรียน |
| Public / Private | Private | กำหนดได้ว่าใครมีสิทธิ์เข้าถึง เช่น เชิญเฉพาะเพื่อนร่วมทีมที่ต้องใช้ repository |
| Include files | ไม่เลือกไฟล์ใด ๆ | ต้องการ remote ที่ว่างเปล่า เพราะเราจะ push ข้อมูลขึ้นไปเอง |
| License | ไม่เลือก | เป็นแค่แบบฝึกหัด |
| Default branch name | เว้นว่างหรือ `main` | ไม่มีผลกับแบบฝึกหัด |

หัวใจของตารางนี้คือ remote ต้อง **ว่างเปล่า** — อย่าให้ hosting service สร้าง README หรือ .gitignore ให้ เพราะไฟล์ที่มีอยู่ก่อนอาจทำให้ push ครั้งแรกไม่ผ่าน

ในโลกจริง local กับ remote repository มักตั้งชื่อเดียวกัน แต่ในซีรีส์นี้จงใจใช้ `rainbow` กับ `rainbow-remote` เพื่อให้เห็นชัดว่าใครเป็นใคร ตอนทำงานจริงค่อยตั้งชื่อให้ตรงกันเอง

ทำตามนี้:

1. เข้าสู่ระบบของ hosting service ที่เลือกไว้ในตอนที่ 6
2. สร้าง remote repository ชื่อ `rainbow-remote` ตามตารางด้านบน
3. copy remote repository URL ที่ตรงกับโปรโตคอลที่เตรียมไว้

ตัวอย่าง URL สำหรับ GitHub ถ้า username คือ `your-username`:

```text
https://github.com/your-username/rainbow-remote.git
git@github.com:your-username/rainbow-remote.git
```

บรรทัดแรกเป็น HTTPS URL ส่วนบรรทัดที่สองเป็น SSH URL ให้เลือกใช้แบบที่ตรงกับ authentication ที่เตรียมไว้ และอย่าลืมเปลี่ยน `your-username` เป็นชื่อจริงของเรา

> ⚠️ การสร้าง remote repository ไม่ได้อัปโหลดข้อมูลใด ๆ ขึ้นไปเอง เราจะได้แค่ repository ว่าง ๆ บนคลาวด์ ข้อมูลจะขึ้นไปได้ก็ต่อเมื่อเราสั่ง push ใน Step 5 หรือ Step 6

---

## Step 3: เพิ่ม connection ด้วย `git remote add`

local repository จะสื่อสารกับ remote repository ได้ก็ต่อเมื่อมี **connection** ไปยัง remote นั้นตั้งค่าไว้ใน local ก่อน โดยเราจะเรียก remote นี้ด้วย **shortname** — ชื่อย่อที่ใช้แทน URL ยาว ๆ

`rainbow` ถูกสร้างด้วย `git init` ในเครื่อง เราจึงต้องผูก URL เข้ากับ shortname เองด้วยคำสั่งนี้ (พิมพ์เป็นบรรทัดเดียว):

```sh
git remote add origin https://github.com/your-username/rainbow-remote.git
```

ถ้าใช้ SSH ให้เปลี่ยน URL เป็นแบบ `git@github.com:your-username/rainbow-remote.git` แทน

### ตรวจ connection ที่เพิ่มเข้ามา (How)

ดูรายชื่อ connection ที่ local เก็บไว้ได้ด้วย `git remote`:

```sh
git remote
```

ผลลัพธ์ควรเป็น:

```text
origin
```

และดูพร้อม URL ด้วย `git remote -v` (`-v` ย่อมาจาก verbose):

```sh
git remote -v
```

ผลลัพธ์ควรเป็น:

```text
origin  https://github.com/your-username/rainbow-remote.git (fetch)
origin  https://github.com/your-username/rainbow-remote.git (push)
```

เห็นสองบรรทัดเพราะ Git ใช้ connection นี้ทั้งตอนดึงข้อมูลลงมา (fetch) และตอนส่งข้อมูลขึ้นไป (push)

ถ้าอยากเห็นหลักฐานระดับไฟล์ ให้เปิดไฟล์ `~/rainbow/.git/config` จะเห็น block ใหม่เพิ่มเข้ามา:

```text
[remote "origin"]
    url = https://github.com/your-username/rainbow-remote.git
    fetch = +refs/heads/*:refs/remotes/origin/*
```

### connection ทางเดียว และยังไม่ได้ส่งข้อมูลอะไร

ข้อสำคัญสองข้อที่ต้องจำเกี่ยวกับ connection นี้:

- **ทางเดียว** — local repository รู้จัก remote ที่เชื่อมต่ออยู่ แต่ remote repository ไม่ได้เก็บรายชื่อ local ที่เชื่อมต่อเข้ามา
- **ยังไม่ได้ส่งข้อมูล** — การเพิ่ม connection แค่ผูก URL กับ shortname ไม่ได้อัปโหลด commit ใด ๆ

การอัปโหลดจะเกิดขึ้นก็ต่อเมื่อเราสั่ง push branch ขึ้นไป ซึ่งจะพา commit ทั้งหมดของ branch นั้นตามขึ้นไปด้วย

local repository หนึ่งตัวเก็บ connection ไปหลาย remote ได้ แต่แบบฝึกหัดนี้มีแค่ `origin` ตัวเดียวก็พอ

> **shortname `origin` ไม่ได้มีความหมายพิเศษ** เป็นชื่อที่ Git นิยมใช้ตามธรรมเนียม และ Git จะตั้งให้อัตโนมัติเมื่อเรา clone remote ลงเครื่อง เราจึงใช้ชื่อเดียวกันได้แม้จะ init repository เอง คล้ายกับ `main` ที่มักใช้เป็นชื่อของ default branch

---

## Step 4: รู้จัก remote branch และ remote-tracking branch

ก่อน push ต้องรู้จัก branch เพิ่มอีกสองชนิด ที่ผ่านมาเราเจอแต่ **local branch** ซึ่งเป็น branch ที่อยู่ใน local repository เช่น `main`, `feature`

เมื่อ push local branch ขึ้น remote Git จะสร้างหรืออัปเดต **remote branch** — branch ที่อยู่ใน remote repository และจะไม่อัปเดตอัตโนมัติเมื่อเราสร้าง commit บนเครื่อง ต้อง push ขึ้นไปเอง

และทุก remote branch ที่ local รู้จักจะมีคู่ของมันคือ **remote-tracking branch** — reference ใน local repository ที่ชี้ไปยัง commit ซึ่ง remote branch ชี้อยู่เมื่อเราสื่อสารกับ remote ครั้งล่าสุด ให้คิดว่ามันเป็น bookmark ที่บอกว่า "remote อยู่ตรงไหนตอนที่คุยกันครั้งล่าสุด"

| ชนิด branch | อยู่ที่ไหน | ตัวอย่าง | อัปเดตเมื่อ |
|---|---|---|---|
| Local branch | local repository | `main`, `feature` | เรา commit หรือย้าย pointer เอง |
| Remote branch | remote repository | `main`, `feature` | มีคน push ขึ้นไป |
| Remote-tracking branch | local repository | `origin/main` | push หรือสื่อสารกับ remote สำเร็จ |

จุดที่คนสับสนบ่อยที่สุดคือ `origin/main` — มันไม่ใช่ remote branch จริง ๆ แต่เป็น "ภาพจำล่าสุด" ของ remote branch ที่เก็บไว้ในเครื่องเรา

อีกคำที่ควรรู้คือ **upstream branch**: remote branch ที่ local branch ถูกตั้งให้ track ไว้ ถ้า local branch มี upstream แล้ว `git push` เปล่า ๆ ก็รู้ปลายทางเอง แต่ถ้ายังไม่มี ต้องระบุ remote และ branch ปลายทางตอน push ไม่อย่างนั้นจะ error — ในบทนี้เราจะระบุปลายทางเองทุกครั้ง ส่วนการตั้ง upstream จะเรียนในตอนที่ 9

> `main` กับ `origin/main` ต่างกัน: `main` ขยับทันทีเมื่อเราทำ commit ส่วน `origin/main` ขยับเมื่อเราสื่อสารกับ remote สำเร็จเท่านั้น

---

## Step 5: push branch `main` ขึ้น remote

ถึงเวลาส่งงานขึ้นคลาวด์แล้ว รูปแบบคำสั่งคือ `git push` ตามด้วย shortname และชื่อ branch:

```sh
git push origin main
```

ถ้าใช้ HTTPS และยังไม่ได้ตั้ง `credential helper` ไว้ Git จะถาม `username` กับ `password` ให้กรอก `username` และใส่ `token` หรือ `credential` ที่เตรียมไว้ในช่อง `password` ตามที่อธิบายไว้ในตอนที่ 6 (อย่า paste `token` ต่อท้ายคำสั่งใน `terminal`) ส่วน SSH จะใช้ key ที่เตรียมไว้ยืนยันตัวตนให้โดยอัตโนมัติ

เมื่อ push สำเร็จ จะเห็น output ประมาณนี้:

```text
Enumerating objects: 9, done.
Counting objects: 100% (9/9), done.
...
To https://github.com/your-username/rainbow-remote.git
 * [new branch]      main -> main
```

บรรทัด `* [new branch] main -> main` แปลว่า remote repository เพิ่งได้ branch `main` ใหม่ โดยมี commit ทั้งหมดของ `main` ตามขึ้นไปด้วย

ตัวเลขและ hash ใน output อาจต่างจากตัวอย่างเล็กน้อย ไม่ใช่ปัญหา ขอแค่เห็น `[new branch]` ก็แปลว่าสำเร็จ

การ push ต้องต่ออินเทอร์เน็ต และต้องมีสิทธิ์เข้าถึง repository ตาม authentication ที่เตรียมไว้ ถ้าเจอ `Permission denied` หรือ `Authentication failed` ให้ย้อนกลับไปตรวจตอนที่ 6 ว่า URL ใช้โปรโตคอลถูกต้องหรือไม่ และบัญชีหรือ credential มีสิทธิ์เข้าถึง repository หรือเปล่า

### ตรวจผลด้วย `git branch --all` (How)

หลัง push แล้ว ดู branch ทุกชนิดที่ local รู้จักด้วย:

```sh
git branch --all
```

ผลลัพธ์ควรเป็น:

```text
  feature
* main
  remotes/origin/main
```

`*` อยู่ที่ `main` แปลว่าเรากำลังอยู่บน `main` และ `remotes/origin/main` คือ remote-tracking branch ที่เพิ่งถูกสร้าง — bookmark ที่บอกว่า remote branch `main` อยู่ที่ commit ไหน

เปิดหน้าเว็บของ `rainbow-remote` ดู จะเห็น commit 3 ตัว (red, orange, yellow) อยู่บน remote แล้ว

ถ้าอยากเห็นหลักฐานระดับไฟล์ ให้ดูโฟลเดอร์ refs:

```sh
ls ~/rainbow/.git/refs
```

ก่อน push จะมีแค่ `heads` กับ `tags` หลัง push จะมีโฟลเดอร์ `remotes` เพิ่มมา และจะมี path `remotes/origin/main` อยู่ภายใน ซึ่งก็คือ remote-tracking branch นั่นเอง

> ⚠️ การ push branch หนึ่งจะสร้างหรืออัปเดตเฉพาะ branch นั้นบน remote เท่านั้น — `feature` กับ `main` บังเอิญชี้ไปที่ commit เดียวกัน (yellow) เลยดูเหมือน `feature` ขึ้นไปด้วย แต่จริง ๆ เรายังไม่ได้ push branch `feature` ถ้าไม่ push branch ไหน ชื่อ branch นั้นก็จะยังไม่ถูกสร้างบน remote แม้ commit บางตัวอาจขึ้นไปแล้วผ่าน branch อื่น

---

## Step 6: push branch `feature` และตรวจผลบนเว็บ

ตอนนี้บน remote ยังไม่มี branch `feature` ต่อไปให้ push ขึ้นไปด้วย เริ่มจากสลับไป branch `feature`:

```sh
git switch feature
```

แล้ว push:

```sh
git push origin feature
```

output จะมีหน้าตาแบบเดียวกับตอน push `main`:

```text
Enumerating objects: 3, done.
...
To https://github.com/your-username/rainbow-remote.git
 * [new branch]      feature -> feature
```

แล้วดูภาพรวมทั้งหมดอีกครั้ง:

```sh
git branch --all
```

ผลลัพธ์ควรเป็น:

```text
* feature
  main
  remotes/origin/feature
  remotes/origin/main
```

ตอนนี้ครบทั้งสองฝั่งแล้ว: remote มี remote branch สองตัว (`main`, `feature`) และ local มี remote-tracking branch สองตัว (`origin/main`, `origin/feature`)

บนหน้าเว็บของ hosting service จะเห็น branch ทั้งสองตัวในเมนูให้สลับดู และ commit ในแต่ละ branch ตรงกับที่ local มี

### แก้ remote ตรง ๆ ผ่านเว็บก็ได้ แต่บทนี้เน้น command line

ตอนที่ 6 เคยบอกว่าการแก้ไข remote repository ทำได้สองทาง: ล็อกอินเข้าเว็บแล้วแก้ตรงนั้น หรือแก้ใน local แล้ว push ขึ้นมา บทนี้เป็นทางที่สอง ส่วนการแก้ผ่านหน้าเว็บของ hosting service ก็ทำได้หลายอย่างคล้ายกับ command line เช่น สร้าง commit ตรง ๆ บน remote, สร้าง remote branch หรือเปิด **pull request** เพื่อขอ merge การเปลี่ยนแปลง ซึ่งจะเรียนในตอนที่ 12

ซีรีส์นี้เน้นฝึก Git ผ่าน command line จึงขอไม่ลงรายละเอียด UI แต่รู้ไว้ก็ดีว่ามีทางนี้อยู่ เผื่อเพื่อนร่วมทีมที่ยังไม่ถนัด command line

> **ภาพรวมที่ควรจำ:** `rainbow` กับ `rainbow-remote` เป็น repository คนละตัว อยู่คนละที่ การส่งข้อมูลระหว่างกันต้องเกิดจากคำสั่ง เช่น `push`, `fetch` หรือ `pull` ไม่มีอะไร sync ให้เอง

---

## แบบฝึกหัด

ใช้บัญชีส่วนตัวและ local repository `rainbow` ที่อยู่ในสถานะเดียวกับบทนี้ (มี commit 3 ตัว โดย `main` กับ `feature` ชี้ไปที่ commit เดียวกัน):

1. สร้าง remote repository ชื่อ `rainbow-remote` บน hosting service ที่เลือกในตอนที่ 6 โดยตั้งเป็น Private และไม่เลือกไฟล์เริ่มต้นใด ๆ
2. copy URL ของ remote ที่ตรงกับโปรโตคอลที่เตรียมไว้ ถ้าใช้ HTTPS ต้องได้ URL ขึ้นต้นด้วย `https://` ถ้าใช้ SSH ต้องได้ URL รูปแบบ `git@host:owner/repo.git`
3. รัน `git remote add origin <URL>` แล้วตรวจด้วย `git remote -v` ว่า shortname `origin` ผูกกับ URL ถูกต้อง และไม่มี remote อื่นปนอยู่
4. push branch `main` ด้วย `git push origin main` แล้วเปิดหน้าเว็บ remote ตรวจว่าเห็น commit 3 ตัว
5. push branch `feature` ด้วย `git push origin feature` แล้วรัน `git branch --all` ตรวจว่าเห็น `remotes/origin/main` และ `remotes/origin/feature`
6. รัน `git push origin feature` ซ้ำอีกครั้ง แล้วสังเกต output ว่าต่างจากครั้งแรกอย่างไร

การ push ครั้งที่สองนี้ไม่ควรเห็น `[new branch]` อีก เพราะ remote มี branch `feature` อยู่แล้ว โดย Git จะตอบประมาณ `Everything up-to-date` แปลว่าไม่มีอะไรใหม่ให้ส่ง

ตรวจตัวเองให้ครบ:

- บอกได้ว่าการสร้าง remote repository ไม่ได้อัปโหลดข้อมูลขึ้นไปเอง
- อธิบายได้ว่า `git remote add` เพิ่มอะไรเข้า local repository และทำไม connection ถึงเป็นทางเดียว
- แยก `main`, remote branch `main` และ `origin/main` ออกจากกันได้
- ทำนายได้ว่าหลัง push `main` แล้ว หน้าเว็บ remote จะเห็น commit ตัวไหนบ้าง และทำไมชื่อ branch `feature` ยังไม่ขึ้นบนเว็บ แม้ commit บางตัวจะอยู่บน remote แล้วผ่าน `main`
- บอกได้ว่าต้องรันคำสั่งอะไรเพื่อให้ `feature` อยู่บน remote ด้วย

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คิดว่าสร้าง remote repository แล้วข้อมูลจะขึ้นไปเอง** — การสร้าง remote จะได้แค่ repository ว่าง ๆ ต้อง `git push` ถึงจะมีข้อมูล
- **ใส่ README หรือ .gitignore ตอนสร้าง remote** — ทำให้ remote ไม่ว่างเปล่า และอาจทำให้ push ครั้งแรกไม่ผ่าน ให้สร้าง remote ที่ว่างเปล่า
- **นึกว่า local กับ remote sync กันเอง** — ไม่มีการเชื่อมต่ออัตโนมัติ ต้องสั่ง `push`, `fetch` หรือ `pull` เองเมื่อจะส่งหรือดึงข้อมูล
- **สับสน `main` กับ `origin/main`** — `main` คือ local branch ที่ขยับทันทีเมื่อ commit ส่วน `origin/main` เป็นแค่ bookmark ที่อัปเดตเมื่อสื่อสารกับ remote สำเร็จ
- **คิดว่า push branch เดียวแล้วทุก branch ขึ้นตาม** — `push` สร้างหรืออัปเดตเฉพาะ branch ที่ระบุ ต้อง push แต่ละ branch ที่ต้องการเอง
- **ลืมว่า connection เป็นทางเดียว** — local รู้จัก remote แต่ remote ไม่ได้เก็บรายชื่อ local ที่เชื่อมเข้ามา
- **ใช้ URL ผิดโปรโตคอล** — HTTPS ต้องใช้ URL ขึ้นต้นด้วย `https://` ส่วน SSH ต้องใช้ URL รูปแบบ `git@host:owner/repo.git` ถ้าใช้สลับกัน Git จะเชื่อมต่อไม่สำเร็จ
- **ลืมเปลี่ยน `your-username` ใน URL** — push จะไปผิด repository หรือโดนปฏิเสธ ให้ตรวจ `git remote -v` ก่อน push

---

## สรุป

1. remote repository มีประโยชน์สามอย่าง: สำรองงาน เข้าถึงจากหลายเครื่อง และทำงานร่วมกับคนอื่น
2. เริ่มโปรเจกต์ได้สองทาง: `git init` แล้ว push (เส้นทางของ `rainbow`) หรือ `git clone` จาก remote (ตอนที่ 8)
3. ถ้าเริ่มจาก local แล้วต้องการให้ remote มีข้อมูล มีสามขั้นตอน: สร้าง remote → `git remote add origin <URL>` → `git push origin <branch>`
4. สร้าง remote ให้ว่างเปล่าสำหรับแบบฝึกหัด ไม่ใส่ README หรือ .gitignore
5. `git remote add <shortname> <URL>` เพิ่ม connection ทางเดียวจาก local ไป remote และไม่ได้อัปโหลดข้อมูลใด ๆ
6. `origin` เป็น shortname ตามธรรมเนียม ไม่ใช่คำสั่งพิเศษ
7. `git remote` และ `git remote -v` ใช้ดู connection ที่เก็บใน local
8. branch มีสามชนิด: local branch, remote branch และ remote-tracking branch โดย `origin/main` คือ bookmark ของ remote branch ในเครื่องเรา
9. `git push origin <branch>` สร้างหรืออัปเดตเฉพาะ branch ที่ระบุบน remote และ `git branch --all` ใช้ดูทั้ง local branch กับ remote-tracking branch
10. ไม่มีอะไร sync อัตโนมัติ — ถ้า remote ตามหลัง local แปลว่ายังไม่ได้ push commit ล่าสุดขึ้นไป

ตอนนี้ `rainbow` มี repository อยู่ทั้งในเครื่องและบนคลาวด์แล้ว และเรารู้วิธีส่งงานขึ้น remote ด้วยตัวเอง

บทถัดไปเราจะเริ่มจากฝั่ง remote ด้วยการใช้ `git clone` เพื่อคัดลอก repository ที่มีอยู่แล้วลงเครื่อง

> *ตอนหน้าจะเริ่มจาก remote repository ด้วย `git clone`*

---

## Glossary

- **Push** — การส่ง commit จาก local repository ขึ้น remote repository ด้วย `git push`
- **Remote repository** — repository ที่อยู่บน hosting service ใช้แชร์และรับส่ง commit กับ local repository
- **Remote (connection)** — การตั้งค่า connection ไปยัง remote repository ที่เก็บไว้ใน local repository
- **Shortname** — ชื่อย่อที่ใช้เรียก remote ในคำสั่ง Git แทน URL ยาว ๆ (ค่าที่นิยมใช้คือ `origin`)
- **`origin`** — shortname ที่ Git นิยมตั้งให้ remote ตามธรรมเนียม (Git ตั้งให้อัตโนมัติเมื่อ clone)
- **Remote branch** — branch ที่อยู่ใน remote repository ซึ่งเกิดขึ้นเมื่อ push local branch ขึ้นไป
- **Remote-tracking branch** — reference ใน local (เช่น `origin/main`) ที่บันทึกตำแหน่งของ remote branch ณ ครั้งสุดท้ายที่สื่อสารกับ remote
- **Upstream branch** — remote branch ที่ local branch ถูกตั้งให้ track ไว้ ทำให้ `git push` แบบไม่ใส่ argument ได้
- **Clone** — การคัดลอก remote repository มาสร้าง local repository บนเครื่อง (เรียนในตอนที่ 8)
- **Pull request** — ฟีเจอร์ของ hosting service สำหรับเสนอให้รวมการเปลี่ยนแปลงจาก branch หนึ่งเข้าอีก branch ผ่านหน้าเว็บ (เรียนในตอนที่ 12)

---

## Related

- [ตอนที่ 1: Git and the Command Line](/git/01-git-and-the-command-line/) — เตรียม command line, ติดตั้ง Git และสร้างโฟลเดอร์ `rainbow`
- [ตอนที่ 2: Local Repositories](/git/02-local-repositories/) — เปลี่ยน `rainbow` ให้เป็น local repository และรู้จักพื้นที่ทำงานของ Git
- [ตอนที่ 3: Making a Commit](/git/03-making-a-commit/) — ใช้ `git add`, `git commit` และ `git log` สร้างประวัติที่จะส่งขึ้น remote
- [ตอนที่ 4: Branches](/git/04-branches/) — แยกสายการทำงานด้วย branch และสร้าง `feature` ที่บทนี้ push ขึ้น remote
- [ตอนที่ 5: Merging](/git/05-merging/) — รวม `main` กับ `feature` ให้อยู่ที่ commit เดียวกันก่อน push
- [ตอนที่ 6: Hosting Services and Authentication](/git/06-hosting-services-and-authentication/) — เลือก hosting service และเตรียม credential ที่บทนี้ใช้ push จริง
- [ตอนที่ 8: Cloning and Fetching](/git/08-cloning-and-fetching/) — เริ่มจาก remote repository ด้วยการ clone และดึงข้อมูลลงมา
