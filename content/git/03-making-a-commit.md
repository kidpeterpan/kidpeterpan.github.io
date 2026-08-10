+++
title = 'ตอนที่ 3: Making a Commit'
date = '2026-08-10T00:00:00+07:00'
draft = false
description = 'ทำ commit แรกใน Git แบบเข้าใจจริง: ใช้ git status, git add, git commit และ git log พร้อมแยก working directory กับ staging area'
tags = ['programming', 'git', 'tutorial']
+++

---

ตอนที่แล้วเราเปลี่ยนโฟลเดอร์ `rainbow` ให้กลายเป็น **local repository** แล้ว และรู้จักพื้นที่สำคัญของ Git ไปแล้ว 4 จุด:

- working directory — ที่ที่เราแก้ไฟล์จริง
- staging area — จุดเตรียมไฟล์ว่าจะบันทึกอะไร
- commit history — ประวัติ snapshot ที่บันทึกแล้ว
- local repository — กล่องใหญ่ใน `.git` ที่เก็บข้อมูลของ Git

บทนี้ถึงเวลาถ่ายรูปแรกของบ้าน `rainbow` ลงอัลบั้มกันแล้ว นั่นก็คือการทำ **commit**

แต่ Git มีจังหวะที่ต้องจำให้ขึ้นใจอยู่หนึ่งอย่าง: เราไม่สามารถกระโดดจากไฟล์บนโต๊ะไป commit history ได้ทันที ต้องผ่าน staging area ก่อนเสมอ

สิ่งที่จะได้ตอนจบบทนี้:

- ใช้ `git status` ตรวจสถานะโดยไม่เปลี่ยนแปลง repository
- ใช้ `git add` เลือกไฟล์เข้า staging area
- เข้าใจว่า `git add` คัดลอกข้อมูล ไม่ได้ย้ายไฟล์ออกจาก working directory
- ใช้ `git commit -m` สร้าง snapshot พร้อม commit message
- ใช้ `git log` ดูประวัติและรายละเอียดของ commit
- แยกไฟล์ที่พร้อมบันทึกออกจากไฟล์ที่ยังทำไม่เสร็จ
- ทำ commit เล็ก ๆ ที่ย้อนดูและเข้าใจได้ง่าย

{{< mermaid >}}
graph LR
  WD["Working directory<br/>rainbowcolors.txt<br/>untracked"] -->|"git add"| SA["Staging area<br/>รายการที่จะบันทึก"]
  SA -->|"git commit -m"| CH["Commit history<br/>snapshot ที่บันทึกแล้ว"]
  WD -.->|"git status"| ST["ดูสถานะ"]
  CH -.->|"git log"| LG["ดูประวัติ"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 2 โดยสมมติว่าเราอยู่ใน `rainbow` ที่มี `.git` แล้ว และมีไฟล์ `rainbowcolors.txt` ที่ยังไม่ถูก track:

```sh
cd ~/rainbow
pwd
```

ถ้าสร้าง `rainbow` ไว้บน Desktop ให้ใช้ path ตามเครื่องตัวเอง เช่น:

```sh
cd ~/Desktop/rainbow
pwd
```

ในบทนี้ใช้ macOS, Linux หรือ Git Bash เป็นหลัก เครื่องหมาย `$` ใน output เป็นเพียง command prompt ไม่ต้องพิมพ์ตามไปด้วย

ถ้าทำตามตอนที่ 2 มาแล้ว ไฟล์ควรมีข้อความบรรทัดนี้:

```text
Red is the first color of the rainbow.
```

ถ้ายังไม่มี ให้เปิดไฟล์ `rainbowcolors.txt` ด้วย text editor แล้วใส่ข้อความนี้ก่อน

---

## Step 1: ดูสถานะก่อนทำอะไรด้วย `git status`

ก่อนสั่งให้ Git เปลี่ยนแปลงอะไร เราควรดูก่อนว่าตอนนี้ repository อยู่ในสถานะไหน:

```sh
git status
```

ถ้ายังไม่มี commit และไฟล์ยังเป็น untracked output จะมีหน้าตาประมาณนี้:

```text
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        rainbowcolors.txt

nothing added to commit but untracked files present
```

สิ่งที่ต้องอ่านจาก output นี้มีสามอย่าง:

- `On branch main` — ตอนนี้เราอยู่บน branch ชื่อ `main`
- `No commits yet` — commit history ยังว่าง
- `rainbowcolors.txt` ใต้ `Untracked files` — ไฟล์อยู่ใน working directory แต่ Git ยังไม่ติดตาม

`git status` เป็นคำสั่งแบบ read-only หรือคำสั่งที่อ่านสถานะอย่างเดียว มันไม่สร้าง commit ไม่ add ไฟล์ และไม่แก้ repository ใช้เรียกได้บ่อยเท่าที่ต้องการเลย

ถ้าอยากได้ output สั้นลง ใช้:

```sh
git status --short
```

ผลลัพธ์จะประมาณนี้:

```text
?? rainbowcolors.txt
```

เครื่องหมาย `??` แปลว่าไฟล์นี้ยังเป็น **untracked file**

> ก่อน add และก่อน commit ให้ใช้ `git status` เป็นนิสัย เพราะมันช่วยตอบคำถามว่า “ตอนนี้เรากำลังจะบันทึกอะไร?”

---

## Step 2: เลือกไฟล์เข้า staging area ด้วย `git add`

ตอนนี้ Git รู้แล้วว่ามีไฟล์ใหม่ แต่ยังไม่ได้บอกว่าเราต้องการเก็บไฟล์นี้ไว้ใน commit ถัดไป ให้ add ไฟล์:

```sh
git add rainbowcolors.txt
```

จากนั้นตรวจสถานะอีกครั้ง:

```sh
git status
```

คราวนี้ควรเห็น:

```text
On branch main

No commits yet

Changes to be committed:
  (use "git rm --cached <file>..." to unstage)
        new file:   rainbowcolors.txt
```

สถานะเปลี่ยนจาก `Untracked files` เป็น `Changes to be committed` แปลว่าไฟล์ถูกเลือกเข้า staging area แล้ว และพร้อมเป็นส่วนหนึ่งของ commit ถัดไป

### `git add` ไม่ได้ย้ายไฟล์

คำว่า `add` ทำให้หลายคนคิดว่าไฟล์ถูกย้ายออกจาก working directory แต่จริง ๆ แล้ว Git คัดลอกข้อมูลของไฟล์เข้า staging area ไฟล์ต้นฉบับยังอยู่ใน `rainbow` เหมือนเดิม:

```text
working directory  --git add-->  staging area
rainbowcolors.txt                 rainbowcolors.txt
```

มอง staging area เป็นถาดเตรียมของก็ได้ ของยังอยู่ในบ้าน แต่เราวางสำเนารายการที่จะส่งไว้ในถาดก่อน

### Add ทีละไฟล์หรือ add ทั้งหมด?

ถ้ารู้แน่ ๆ ว่าไฟล์ไหนพร้อม ให้ระบุชื่อไฟล์ตรง ๆ:

```sh
git add rainbowcolors.txt
```

ถ้ามีหลายไฟล์ที่เกี่ยวข้องกันและพร้อมบันทึกทั้งหมด จะระบุหลายชื่อก็ได้:

```sh
git add rainbowcolors.txt README.md
```

หรือใช้ `-A` เพื่อ add การเปลี่ยนแปลงทั้งหมดใน working directory:

```sh
git add -A
```

`git add -A` สะดวก แต่ต้องใช้ด้วยความระวัง เพราะมันอาจหยิบไฟล์ที่เราไม่ได้ตั้งใจรวมเข้ามาด้วย โดยเฉพาะไฟล์ config, log หรือไฟล์ทดลองที่ยังไม่พร้อม

> `git add` คือจุดที่เรา curate commit หรือคัดเลือกสิ่งที่จะบันทึก ไม่ใช่ปุ่ม “เอาทุกอย่างไปเลย” เสมอไป

---

## Step 3: ตรวจสิ่งที่จะ commit ก่อนปิดผนึก

หลัง add แล้ว อย่าเพิ่งรีบ commit แบบหลับตากด เราตรวจรายละเอียดของสิ่งที่อยู่ใน staging area ได้ด้วย:

```sh
git diff --cached
```

ถ้าเป็นไฟล์ใหม่ Git จะแสดงเนื้อหาที่กำลังจะเข้า commit พร้อมเครื่องหมาย `+` หน้าบรรทัดที่เพิ่มขึ้น:

```diff
diff --cached --git a/rainbowcolors.txt b/rainbowcolors.txt
new file mode 100644
--- /dev/null
+++ b/rainbowcolors.txt
@@ -0,0 +1 @@
+Red is the first color of the rainbow.
```

สิ่งที่ควรตรวจ:

- ไฟล์ที่กำลังจะ commit ใช่ไฟล์ที่เราตั้งใจหรือไม่
- เนื้อหาที่กำลังจะบันทึกครบหรือมี secret หลุดมาหรือไม่
- มีไฟล์ชั่วคราวหรือไฟล์ build ปนมาหรือไม่
- การเปลี่ยนแปลงทั้งหมดเกี่ยวข้องกับ commit เดียวกันหรือเปล่า

ถ้าดูแล้วพบว่า add ผิดไฟล์ เรายกไฟล์ออกจาก staging area ได้โดยไม่ลบไฟล์จริง:

```sh
git restore --staged rainbowcolors.txt
```

จากนั้น `rainbowcolors.txt` จะกลับไปเป็น untracked แต่ไฟล์ยังอยู่ในโฟลเดอร์ `rainbow` ไม่ได้หายไปไหน

คำสั่งนี้เป็นเหตุผลหนึ่งที่ staging area มีประโยชน์มาก เราแก้ไฟล์ได้หลายอย่าง แต่เลือกส่งขึ้น commit แค่ส่วนที่พร้อมก่อน

---

## Step 4: สร้าง commit ด้วย `git commit -m`

เมื่อ `git status` และ `git diff --cached` ดูถูกต้องแล้ว จึงสร้าง commit:

```sh
git commit -m "red"
```

`-m` ย่อมาจาก `message` ใช้ส่งข้อความอธิบาย commit ในตัวอย่างนี้ใช้ชื่อสี `red` เพื่อให้ตรงกับโปรเจกต์ฝึก

output จะมีหน้าตาประมาณนี้:

```text
[main abc1234] red
 1 file changed, 1 insertion(+)
 create mode 100644 rainbowcolors.txt
```

ค่า `abc1234` เป็นตัวอย่างของ commit hash ของคุณจะไม่เหมือนกัน เพราะ hash ขึ้นกับข้อมูลและเวลาที่ commit ถูกสร้าง

หลัง commit ไฟล์ `rainbowcolors.txt` จะเปลี่ยนจาก untracked file เป็น **tracked file** และ snapshot ของมันจะถูกเก็บไว้ใน commit history

ตรวจสถานะอีกครั้ง:

```sh
git status
```

ถ้าไม่มีไฟล์ใหม่หรือการแก้ไขค้างอยู่ จะเห็นข้อความประมาณนี้:

```text
On branch main
nothing to commit, working tree clean
```

นี่คือสถานะที่เราต้องการหลังทำ commit สำเร็จ: โต๊ะทำงานไม่มีการเปลี่ยนแปลงที่ยังไม่ได้ตัดสินใจ

### ทำไม commit ถึงเป็นสองขั้น?

เพราะ Git ตั้งใจให้เราแยก “กำลังแก้อะไรอยู่” ออกจาก “อะไรพร้อมบันทึกแล้ว”:

```text
working directory --git add--> staging area --git commit--> commit history
```

ถ้ามีไฟล์ 10 ไฟล์ แต่พร้อมบันทึกแค่ 2 ไฟล์ เราก็ add เฉพาะ 2 ไฟล์ได้ ไม่ต้องรอให้งานทั้งก้อนเสร็จพร้อมกัน

---

## Step 5: ดูประวัติด้วย `git log`

หลังจากสร้าง commit แล้ว ใช้ `git log` ดูประวัติ:

```sh
git log
```

output จะคล้ายแบบนี้:

```text
commit abc1234567890abcdef1234567890abcdef123456 (HEAD -> main)
Author: Your Name <you@example.com>
Date:   Mon Aug 10 10:00:00 2026 +0700

    red
```

ในแต่ละ commit เราจะเห็นข้อมูลหลัก ๆ 4 อย่าง:

| ข้อมูล | ความหมาย |
|---|---|
| Commit hash | รหัสยาวที่ระบุ commit แบบไม่ซ้ำ |
| Author | ชื่อและอีเมลจาก Git config |
| Date | วันเวลาที่สร้าง commit |
| Commit message | ข้อความอธิบายการเปลี่ยนแปลง |

ถ้าอยากดูแบบสั้น เหมาะกับการเช็กเร็ว ๆ ใช้:

```sh
git log --oneline
```

ตัวอย่าง output:

```text
abc1234 red
```

commit hash แบบ 7 ตัวแรกมักเพียงพอสำหรับอ้างอิงในงานประจำวัน ถ้าใน repository มี commit เยอะมากและ prefix ชนกัน Git จะต้องการตัวอักษรเพิ่มเอง

### ออกจากหน้าจอ `git log` อย่างไร?

ถ้า `git log` มี output ยาว Git จะเปิด **pager** หรือหน้าจอเลื่อนข้อความให้ ใช้ปุ่มเหล่านี้:

- กด Enter หรือปุ่มลูกศรลง เพื่อเลื่อนลง
- กดลูกศรขึ้น เพื่อเลื่อนกลับ
- กด `Q` เพื่อออกจาก pager

อย่าตกใจถ้าพิมพ์คำสั่งแล้วเหมือน terminal ค้างอยู่ มันกำลังรอให้เราอ่าน output และกด `Q` กลับออกมา

---

## Step 6: แก้ไฟล์แล้ว commit รอบถัดไป

หนึ่ง commit ไม่ได้แปลว่าโปรเจกต์จบแล้ว เราทำงานต่อ แก้ไฟล์ แล้วสร้าง snapshot ใหม่ได้เรื่อย ๆ

เปิด `rainbowcolors.txt` แล้วเพิ่มบรรทัดนี้:

```text
Orange is the second color of the rainbow.
```

บันทึกไฟล์แล้วตรวจสถานะ:

```sh
git status --short
```

ควรเห็น:

```text
 M rainbowcolors.txt
```

ช่องว่างทางซ้ายและ `M` ทางขวาหมายถึงไฟล์ถูกแก้ใน working directory แต่ยังไม่ได้ add เข้า staging area

ทำสองขั้นตอนเดิมอีกครั้ง:

```sh
git add rainbowcolors.txt
git commit -m "orange"
git log --oneline
```

คราวนี้ควรเห็น commit ใหม่อยู่ด้านบน:

```text
def5678 orange
abc1234 red
```

hash และวันที่เป็นตัวอย่าง คุณจะได้ค่าคนละชุด แต่ลำดับใหม่สุดอยู่บนสุดเหมือนกัน เพราะ `git log` แสดงแบบ reverse chronological order

> **Commit early, commit often:** ในช่วงเริ่มต้นมี commit เล็ก ๆ หลายตัวดีกว่าทำงานก้อนใหญ่แล้วไม่มีจุดให้ย้อนกลับ

---

## Step 7: เขียน commit message ให้คนอ่านรู้เรื่อง

commit message ไม่ใช่ที่เก็บความรู้สึกทั้งหมดของวันนั้น แต่ควรตอบให้ได้ว่า commit นี้เปลี่ยนอะไร

ตัวอย่าง message ที่พอใช้ได้:

```text
red
orange
add validation for email
fix incorrect total
update README setup steps
```

ตัวอย่างที่อ่านแล้วไม่ค่อยช่วยอะไร:

```text
update
fix
changes
asdf
งานวันนี้
```

ถ้าทำงานคนเดียว เรามีอิสระมากขึ้น แต่ถ้าทำงานเป็นทีมควรดู convention ของทีมก่อน บางทีมใช้รูปแบบอย่าง `feat:`, `fix:` หรือกำหนดให้ message ขึ้นต้นด้วย issue key

หลักง่าย ๆ คือ:

- สั้นพอให้ `git log --oneline` อ่านได้ในบรรทัดเดียว
- บอกผลลัพธ์หรือสิ่งที่เปลี่ยน ไม่ใช่บอกแค่ว่า “แก้แล้ว”
- หนึ่ง commit ควรมีเรื่องหลักเรื่องเดียว
- อย่าใส่ secret, password หรือข้อมูลส่วนตัวใน message

---

## แบบฝึกหัด

ทำโจทย์ต่อไปนี้ใน `rainbow`:

1. รัน `git status` ก่อนและหลัง `git add rainbowcolors.txt` แล้วจดว่า heading ใน output เปลี่ยนจากอะไรเป็นอะไร
2. ใช้ `git diff --cached` ตรวจเนื้อหาที่กำลังจะ commit ก่อนสร้าง commit ใหม่ ห้ามกด commit จนกว่าจะเห็นเฉพาะการเปลี่ยนแปลงที่ตั้งใจ
3. สร้างไฟล์ `draft.txt` ที่มีข้อความสั้น ๆ แต่ยังไม่พร้อมบันทึก จากนั้นแก้ `rainbowcolors.txt` แล้วใช้ `git add rainbowcolors.txt` ให้ commit มีเฉพาะไฟล์สี ไม่รวม `draft.txt`
4. สร้าง commit ให้กับไฟล์สี แล้วใช้ `git log` และ `git log --oneline` เปรียบเทียบความละเอียดของ output พร้อมกด `Q` ออกจาก pager
5. เพิ่มสีใหม่อีกหนึ่งบรรทัด ทำ commit ด้วย message ที่สื่อความหมาย แล้วใช้ `git status` ยืนยันว่า working tree กลับมา clean

ตรวจตัวเองให้ครบ:

- มี commit อย่างน้อย 2 ตัว
- `git log --oneline` แสดง commit ใหม่สุดอยู่ด้านบน
- `git status` บอกว่าไม่มีงานค้าง
- ไฟล์ที่ยังไม่พร้อมไม่ได้หลุดเข้า commit

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คิดว่า `git add` ย้ายไฟล์** — จริง ๆ มันคัดลอกข้อมูลเข้า staging area ไฟล์ต้นฉบับยังอยู่ใน working directory
- **ข้าม `git status` ก่อน commit** — อาจเผลอ commit ไฟล์ที่ไม่ตั้งใจหรือพลาดไฟล์ที่แก้แล้ว
- **คิดว่า `git add` แล้วไฟล์ถูกบันทึกถาวร** — add แค่เตรียมของ ส่วน `git commit` ต่างหากที่สร้าง snapshot ใน history
- **ใช้ `git add -A` แบบไม่ดูไฟล์** — อาจรวม log, draft, secret หรือไฟล์ทดลองเข้า commit ควรตรวจ status และ diff ก่อน
- **แก้ไฟล์หลัง add แล้วคิดว่า commit จะรวมการแก้ล่าสุดทั้งหมด** — หลัง add ถ้าแก้ไฟล์ซ้ำ ต้อง add ใหม่ก่อน commit
- **ใช้ `git commit` โดยไม่ใส่ message** — Git จะเปิด editor ให้กรอก message ถ้าไม่คุ้นให้ใช้ `git commit -m "message"`
- **คิดว่า commit hash ต้องเหมือนตัวอย่าง** — hash ของแต่ละ repository และแต่ละ commit ต่างกันเป็นเรื่องปกติ
- **คิดว่า `git log` ค้าง** — จริง ๆ อยู่ใน pager กด `Q` เพื่อออก
- **รวมหลายเรื่องไว้ใน commit เดียว** — ทำให้ย้อนดูและ review ยาก ควรจัดกลุ่มการเปลี่ยนแปลงที่เกี่ยวข้องกัน
- **ใส่ข้อมูลลับใน commit message หรือไฟล์ที่ add** — commit history จำข้อมูลไว้ ควรตรวจด้วย `git diff --cached` ก่อนเสมอ

---

## สรุป

1. `git status` ใช้ดูสถานะของ working directory และ staging area โดยไม่เปลี่ยน repository
2. การทำ commit มีสองขั้นหลัก: `git add` แล้วตามด้วย `git commit -m`
3. `git add` คัดลอกการเปลี่ยนแปลงเข้า staging area ไม่ได้ย้ายไฟล์ออกจาก working directory
4. staging area ทำให้เราเลือกได้ว่าไฟล์ไหนพร้อมเข้า commit ถัดไป
5. `git diff --cached` ใช้ review สิ่งที่กำลังจะ commit ก่อนปิดผนึก
6. `git commit -m "message"` สร้าง snapshot ใหม่และผูก commit message ไว้ด้วย
7. หลังไฟล์ถูก add และ commit แล้ว สถานะจาก untracked จะกลายเป็น tracked
8. `git log` แสดง hash, author, date และ message ของ commit ในลำดับใหม่สุดก่อน
9. `git log --oneline` เหมาะกับการดูประวัติแบบสั้น และกด `Q` เพื่อออกจาก pager
10. commit เล็กและเกี่ยวข้องกันเป็นกลุ่มช่วยให้ย้อนดู, review และแก้ปัญหาได้ง่ายขึ้น

ตอนนี้ `rainbow` มีภาพแรกในอัลบั้มแล้ว และเรารู้ด้วยว่าภาพนั้นถ่ายเมื่อไหร่ ใครเป็นคนถ่าย และกำลังถ่ายอะไรไว้

Git เริ่มมีประโยชน์จริง ๆ ตอนที่เรากล้าบันทึกงานเป็นจุดเล็ก ๆ ไม่ใช่รอให้ทุกอย่างสมบูรณ์แบบแล้วค่อยกดปุ่มเดียวตูมเดียว

> *ตอนถัดไปเราจะคุยเรื่อง branches — วิธีแยกเส้นทางการทำงานออกจาก `main` โดยไม่ทำให้โปรเจกต์หลักเละ*

---

## Glossary

- **Commit** — snapshot หรือเวอร์ชันหนึ่งของโปรเจกต์ที่บันทึกใน Git
- **Working directory** — พื้นที่ที่เราแก้ไขไฟล์จริง
- **Staging area** — พื้นที่เตรียมรายการไฟล์สำหรับ commit ถัดไป
- **Commit history** — ประวัติของ commit ทั้งหมดใน repository
- **`git status`** — คำสั่งดูสถานะของ working directory และ staging area
- **`git add`** — คัดลอกการเปลี่ยนแปลงเข้า staging area
- **`git commit -m`** — สร้าง commit พร้อม commit message
- **Commit message** — ข้อความสั้น ๆ ที่อธิบายการเปลี่ยนแปลงใน commit
- **Commit hash** — รหัสที่ระบุ commit แบบไม่ซ้ำกัน
- **Tracked file** — ไฟล์ที่ Git รู้จักและติดตามแล้ว
- **Untracked file** — ไฟล์ใน working directory ที่ Git ยังไม่ติดตาม
- **`git log`** — คำสั่งดูรายการ commit ย้อนหลัง
- **Pager** — หน้าจอเลื่อน output ยาว ๆ ที่ออกด้วย `Q` ได้
- **Root commit** — commit แรกของ repository ที่ยังไม่มี parent commit

---

## Related

- [ตอนที่ 1: Git and the Command Line](/git/01-git-and-the-command-line/) — เตรียม command line, ติดตั้ง Git และตั้งค่า user
- [ตอนที่ 2: Local Repositories](/git/02-local-repositories/) — วาง Git Diagram และสร้าง `rainbow` ให้เป็น local repository
- [ตอนที่ 4: Branches](/git/04-branches/) — บทถัดไป แยกเส้นทางการทำงานด้วย branch และเข้าใจ `main`/`HEAD`
