+++
title = 'ตอนที่ 9: Three-Way Merges'
date = '2026-08-18T00:00:00+07:00'
draft = false
description = 'สร้างสถานการณ์ที่ history ของ local กับ remote diverge กันจริง แล้วลงมือทำ three-way merge ตั้งแต่ตั้ง upstream branch, แก้ไฟล์ซ้ำก่อน commit จนถึงเขียน merge commit message ใน Vim'
tags = ['programming', 'git', 'tutorial']
+++

---

ตอนที่แล้วเราจบด้วยการที่ `rainbow`, `friend-rainbow` และ `rainbow-remote` กลับมา sync กันครบที่ commit `green` — ใครส่งงานอะไรไปไหน เราตามดูได้ครบตลอดทาง

แต่โลกจริงไม่ได้เนี้ยบขนาดนั้นเสมอไป บ่อยครั้งที่เราเก็บงานของตัวเองไว้เครื่องนึง เพื่อนก็เก็บงานของเพื่อนไว้อีกเครื่อง โดยไม่ได้เช็คกันก่อนว่าใครไปถึงไหนแล้ว พอถึงเวลาต้องรวมงานเข้าด้วยกัน history ของทั้งสองฝั่งอาจแยกออกจากกันไปแล้วจริง ๆ — นี่แหละคือจุดที่ fast-forward merge ที่เราคุ้นเคยจากตอนที่ 5 ใช้ไม่ได้อีกต่อไป ต้องเป็น three-way merge เท่านั้น

บทนี้จะจงใจสร้างสถานการณ์นั้นขึ้นมาให้เห็นของจริง: เราจะ commit งานใน `rainbow` โดยไม่บอกเพื่อน ส่วนเพื่อนก็ commit งานใน `friend-rainbow` โดยไม่รู้เรื่องเรา แล้วดูว่า Git จัดการความชนกันนี้ยังไง ระหว่างทางเราจะได้เจอ upstream branch ตัวจริง เจอ staging area ที่มีพฤติกรรมแปลก ๆ เวลาแก้ไฟล์ซ้ำ และเจอ text editor ตัวแรกที่ Git เปิดให้เห็นหน้าค่าตาโดยตรง — Vim

สิ่งที่จะได้ตอนจบบทนี้:

- ตั้ง upstream branch ให้ local branch ด้วย `git branch -u` แล้วใช้ `git push`/`git pull` แบบไม่ต้องระบุปลายทาง
- สร้างสถานการณ์ที่ history ของสอง branch diverge กันจริง จาก commit คนละฝั่งที่ไม่ได้ sync กันก่อน
- อ่านพฤติกรรมของ staging area เมื่อแก้ไฟล์เดิมซ้ำหลาย commit และรู้ว่าเมื่อไหร่ต้อง `git add` ใหม่
- รับมือกับ `git push` ที่ถูก reject เพราะ remote มีงานที่ local ยังไม่มี
- ทำ three-way merge จริงผ่าน `git fetch` ตามด้วย `git merge` แล้วเขียน merge commit message ใน Vim
- ตรวจ parent สองตัวของ merge commit ด้วย `git log` และ `git cat-file -p`
- ตัดสินใจได้ว่าเมื่อไหร่ควรใช้ `git pull` เปล่า ๆ และเมื่อไหร่ควรแยก fetch ก่อน

{{< mermaid >}}
flowchart LR
  A["rainbow: commit brown<br/>ยังไม่ push"] --> B["ตั้ง upstream<br/>git branch -u แล้ว push"]
  B --> C["friend-rainbow: แก้ไฟล์ซ้ำ<br/>ก่อน commit blue"]
  C --> D["push blue<br/>โดน reject"]
  D --> E["git fetch + git merge<br/>three-way merge ใน Vim"]
  E --> F["ตรวจ parent สองตัว<br/>git log / git cat-file"]
  F --> G["push merge commit<br/>แล้ว rainbow pull กลับมา sync"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 8 โดยสมมติว่า `rainbow`, `friend-rainbow` และ `rainbow-remote` sync กันครบแล้ว — ทั้งสามฝั่งมีแค่ branch `main` และ `main` ทุกฝั่งชี้ไปที่ commit เดียวกัน (commit `green`)

เข้าไปตรวจสถานะฝั่งเราก่อน รันชุดคำสั่งนี้ใน `rainbow`:

```sh
cd ~/rainbow
git status
git log --oneline --decorate --all
```

ผลลัพธ์ควรมีหน้าตาประมาณนี้: hash ในเครื่องเราจะไม่เหมือนตัวอย่าง ขอแค่เห็นว่ามีแค่ `main` และ `main` กับ `origin/main` ชี้ commit เดียวกัน

```text
On branch main
nothing to commit, working tree clean
```

```text
6987cd2 (HEAD -> main, origin/main) green
fc8139c yellow
7acb333 orange
abc1234 red
```

แล้วสลับไปอีกหน้าต่าง terminal ที่เปิด `friend-rainbow` ไว้ รันชุดคำสั่งเดียวกัน:

```sh
cd ~/friend-rainbow
git status
git log --oneline --decorate --all
```

ผลลัพธ์ควรหน้าตาคล้ายกัน:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

```text
6987cd2 (HEAD -> main, origin/main) green
fc8139c yellow
7acb333 orange
abc1234 red
```

สังเกตความต่างเล็ก ๆ ตรงนี้ไว้ก่อน: `friend-rainbow` มีบรรทัด `Your branch is up to date with 'origin/main'` ส่วน `rainbow` ไม่มีบรรทัดนี้เลย เพราะ `main` ใน `rainbow` ยังไม่มี upstream branch — เดี๋ยวเราจะแก้เรื่องนี้กันใน Step 2

เปิดสองหน้าต่าง terminal ค้างไว้ตลอดบทนี้เหมือนตอนที่ 8 หน้าต่างหนึ่งอยู่ที่ `rainbow` อีกหน้าต่างอยู่ที่ `friend-rainbow` และถ้าเปิด `git.autofetch` ของ VS Code ค้างไว้ ให้ปิดชั่วคราวเหมือนเดิม เพราะมันอาจ fetch ให้เองจนสถานะไม่ตรงกับตัวอย่าง

เครื่องหมาย `$` ในตัวอย่างเป็นเพียง command prompt ไม่ต้องพิมพ์ตามไปด้วย

---

## Step 1: สร้าง commit ใหม่ใน rainbow แต่ยังไม่ push

เริ่มจากฝั่งเรา ใน `rainbow` สร้างไฟล์ใหม่ชื่อ `othercolors.txt` ใส่บรรทัดนี้บรรทัดเดียวแล้วเซฟ:

```text
Brown is not a color in the rainbow.
```

จากนั้น add และ commit:

```sh
git add othercolors.txt
git commit -m "brown"
```

output จะมีหน้าตาประมาณนี้: hash ในเครื่องเราจะไม่เหมือนตัวอย่าง

```text
[main a4f21e8] brown
 1 file changed, 1 insertion(+)
 create mode 100644 othercolors.txt
```

ตรวจ commit history อีกครั้ง:

```sh
git log --oneline --decorate --all
```

ควรเห็นแบบนี้:

```text
a4f21e8 (HEAD -> main) brown
6987cd2 (origin/main) green
fc8139c yellow
7acb333 orange
abc1234 red
```

สังเกตว่า `HEAD -> main` ขยับไปอยู่ที่ `brown` แล้ว แต่ `origin/main` ยังชี้ `green` เหมือนเดิม เพราะเรายังไม่ได้ push

จุดนี้สำคัญ: `main` ของเรา **นำหน้า** `origin/main` อยู่ 1 commit แต่ยัง**ไม่ diverge** เพราะไล่ parent link จาก `brown` ย้อนกลับไปก็ยังเจอ `green` ที่ `origin/main` ชี้อยู่พอดี ถ้าเราสั่ง push ตอนนี้เลย ก็ยังจะเป็น fast-forward ธรรมดา

> นำหน้า (ahead) ยังไม่เท่ากับ diverge — diverge จะเกิดก็ต่อเมื่อ**อีกฝั่ง**สร้าง commit ใหม่ต่อจากจุดร่วมเดียวกันด้วยเช่นกัน โดยที่ไม่รู้เรื่องกัน

---

## Step 2: ตั้ง upstream branch แล้ว push ด้วย git branch -u

### upstream branch คืออะไร และทำไม rainbow ยังไม่มี (Why)

ตอนที่ 7 เราเกริ่นไว้ว่า **upstream branch** คือ remote branch ที่ local branch ถูกตั้งให้ track ไว้ ถ้ามี upstream แล้ว `git push`/`git pull` แบบไม่ใส่ argument จะรู้ปลายทางเอง

จำได้ไหมว่า `friend-rainbow` เกิดจาก `git clone` ในตอนที่ 8 — ตอนนั้น `git branch -vv` ของ `main` ใน `friend-rainbow` มีวงเล็บ `[origin/main]` ต่อท้ายทันที เพราะ **clone ตั้ง upstream ให้อัตโนมัติ** ต่างจาก `rainbow` ที่เราสร้างด้วย `git init` เอง จึงไม่มีใครตั้ง upstream ให้ตั้งแต่ต้น เราต้องตั้งเอง

### ใช้อย่างไร? (How)

กลับไปที่หน้าต่าง `rainbow` ตรวจ upstream ปัจจุบันของ `main` ก่อน:

```sh
git branch -vv
```

ควรเห็นว่ายังไม่มี upstream (ไม่มีวงเล็บต่อท้าย):

```text
* main a4f21e8 brown
```

ตั้ง upstream ด้วย `git branch -u` (ย่อมาจาก `--set-upstream-to`) ตามด้วยชื่อ remote-tracking branch ที่ต้องการ track:

```sh
git branch -u origin/main
```

output จะมีหน้าตาประมาณนี้:

```text
branch 'main' set up to track 'origin/main'.
```

ตรวจอีกครั้งด้วย `git branch -vv`:

```sh
git branch -vv
```

คราวนี้ควรเห็นวงเล็บบอกสถานะ:

```text
* main a4f21e8 [origin/main: ahead 1] brown
```

`[origin/main: ahead 1]` แปลว่า `main` ของเรามี upstream เป็น `origin/main` แล้ว และตอนนี้นำหน้าอยู่ 1 commit

มี upstream แล้ว push แบบไม่ต้องระบุปลายทางได้เลย:

```sh
git push
```

output จะมีหน้าตาประมาณนี้:

```text
To https://github.com/your-username/rainbow-remote.git
   6987cd2..a4f21e8  main -> main
```

ตรวจผลด้วย `git log --oneline --decorate --all` อีกครั้ง ตอนนี้ `origin/main` ควรขยับตาม `main` มาอยู่ที่ `brown` แล้ว:

```text
a4f21e8 (HEAD -> main, origin/main) brown
6987cd2 green
fc8139c yellow
7acb333 orange
abc1234 red
```

> `git branch -u <shortname>/<branch>` ตั้ง upstream branch ให้ local branch ปัจจุบัน หลังจากนั้น `git push`/`git pull` แบบไม่ใส่ argument จะรู้ปลายทางเอง

---

## Step 3: แก้ไฟล์เดิมซ้ำก่อน commit — staging area จำเวอร์ชันไหนไว้?

ฝั่งเราส่ง `brown` ขึ้น remote แล้ว แต่เพื่อนใน `friend-rainbow` ยังไม่รู้เรื่อง สลับไปหน้าต่าง `friend-rainbow` แล้วเริ่มงานของเพื่อน

เปิด `rainbowcolors.txt` เพิ่มบรรทัดนี้ต่อท้ายแล้วเซฟ (ตั้งใจพิมพ์ผิดตามนี้ก่อน):

```text
Bloo is the fifth color of the rainbow.
```

ตรวจสถานะ:

```sh
git status
```

ควรเห็นว่าไฟล์ถูกแก้แล้ว:

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
        modified:   rainbowcolors.txt
```

add เข้า staging area:

```sh
git add rainbowcolors.txt
```

ตอนนี้ staging area เก็บ **snapshot** ของไฟล์เวอร์ชันที่มี typo ("Bloo") ไว้แล้ว จำได้ไหมจากตอนที่ 2/3 ว่า staging area ไม่ใช่ pointer ที่คอยอัปเดตตามไฟล์ในเครื่องให้เองทุกครั้ง แต่เป็นพื้นที่ที่เก็บสถานะไฟล์ ณ ตอนที่สั่ง `git add` เท่านั้น

พอเห็นคำผิด ให้เปิดไฟล์แก้ "Bloo" เป็น "Blue" แล้วเซฟ **แต่ยังไม่ต้อง `git add` ซ้ำ** ลอง `git status` ดู:

```sh
git status
```

ควรเห็นไฟล์เดียวกันโผล่มา**สองสถานะพร้อมกัน**:

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
        modified:   rainbowcolors.txt

Changes not staged for commit:
        modified:   rainbowcolors.txt
```

นี่คือจุดสำคัญของ Step นี้: staging area ยังถือเวอร์ชันที่มี typo ("Bloo") อยู่ ส่วน working directory ถือเวอร์ชันที่แก้แล้ว ("Blue") ทั้งสองเวอร์ชันเป็นคนละ snapshot กัน ถ้า commit ตอนนี้เลย เราจะได้ commit ที่มี typo ติดไปด้วย

ต้อง `git add` ซ้ำเพื่อให้ staging area อัปเดตเป็นเวอร์ชันล่าสุด:

```sh
git add rainbowcolors.txt
git status
```

ควรกลับมาเหลือแค่สถานะเดียว:

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
        modified:   rainbowcolors.txt
```

> ถ้า `git status` เคยแสดงไฟล์เดียวกันอยู่ทั้ง "Changes to be committed" และ "Changes not staged" พร้อมกัน นั่นคือสัญญาณเตือนว่าแก้ไฟล์ต่อหลัง `git add` แล้วยังไม่ได้ add ซ้ำ

---

## Step 4: commit "blue" แล้วโดน push ปฏิเสธ

ตอนนี้ staging area พร้อมแล้ว commit ได้เลย:

```sh
git commit -m "blue"
```

output จะมีหน้าตาประมาณนี้:

```text
[main d93c710] blue
 1 file changed, 1 insertion(+)
```

ลอง push ตามปกติ:

```sh
git push
```

รอบนี้ Git จะไม่ยอมให้ push ผ่าน:

```text
To https://github.com/your-username/rainbow-remote.git
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/your-username/rainbow-remote.git'
hint: Updates were rejected because the remote contains work that you do not
hint: have locally. This is usually caused by another repository pushing to
hint: the same ref. If you want to integrate the remote changes, use
hint: 'git pull' before pushing again.
```

อย่าเพิ่งตกใจ ข้อความนี้ไม่ได้แปลว่างานหายหรือพัง แค่ remote มี commit ที่ `friend-rainbow` ยังไม่มี — นั่นคือ `brown` ที่เราเพิ่ง push ไปใน Step 2 นั่นเอง

ลองวาดภาพ history ตอนนี้ดู:

```text
                 a4f21e8 (brown)     main บน rainbow-remote และ rainbow
                /
...  <--  6987cd2 (green)
                \
                 d93c710 (blue)      main บน friend-rainbow (ยังไม่ push)
```

`green` คือ **common ancestor** ของทั้งสองฝั่ง หลังจากนั้น `rainbow` เดินไปทาง `brown` ส่วน `friend-rainbow` เดินไปทาง `blue` โดยที่ไม่มีฝั่งไหนรู้เรื่องอีกฝั่งเลย นี่คือ **divergent history** ตัวจริงตามนิยามจากตอนที่ 5 — ไล่ parent link จาก `blue` ย้อนกลับไปก็ไม่เจอ `brown` และไล่จาก `brown` ย้อนกลับไปก็ไม่เจอ `blue` เช่นกัน

เพราะ history diverge แล้ว `friend-rainbow` จะ push ตรง ๆ ไม่ได้อีกต่อไป ต้องรับงานจาก remote มา integrate ก่อน ซึ่งจะกลายเป็น three-way merge ใน Step ถัดไป

---

## Step 5: ทำ three-way merge จริงด้วย git fetch + git merge (เจอ Vim ครั้งแรก)

### ทำไม Git เปิด text editor ขึ้นมาเฉย ๆ? (Why)

ที่ผ่านมาเรา commit ด้วย `-m "ข้อความ"` มาตลอด เลยไม่เคยเจอสิ่งนี้ แต่ทุกครั้งที่ Git ต้องการ commit message และเราไม่ได้ระบุด้วย `-m` — ไม่ว่าจะเป็น commit ปกติหรือ merge commit — Git จะเปิด text editor บน command line ให้เขียนแทน โดย default ของ Git คือ **Vim**

merge รอบนี้ Git ต้องสร้าง merge commit และเราไม่ได้ใส่ `-m` จึงเจอ Vim เป็นครั้งแรกในซีรีส์นี้

### ใช้อย่างไร? (How)

ยังอยู่ใน `friend-rainbow` เริ่มจาก fetch ก่อนเสมอตามหลักที่เรียนในตอนที่ 8:

```sh
git fetch
```

output จะมีหน้าตาประมาณนี้:

```text
   6987cd2..a4f21e8  main       -> origin/main
```

`origin/main` ใน `friend-rainbow` ขยับไปชี้ `brown` แล้ว แต่ `main` ของเรายังอยู่ที่ `blue` เหมือนเดิม ลอง `git log --all --oneline --decorate` ดูก็จะเห็นทั้งสองปลายทางพร้อมกัน

ต่อด้วย merge:

```sh
git merge origin/main
```

คราวนี้ history diverge แล้วจริง ๆ (`blue` กับ `brown` แยกจาก `green` คนละทาง) Git จึงต้องสร้าง merge commit และเปิด Vim ขึ้นมาพร้อม default message ให้แบบนี้:

```text
Merge remote-tracking branch 'origin/main'
```

เราแค่ต้อง **accept ข้อความนี้แล้วบันทึก** ไม่ต้องพิมพ์อะไรเพิ่ม วิธีออกจาก Vim แบบเซฟข้อความ:

1. กด `Esc` (กันพลาดกรณีอยู่ใน insert mode)
2. พิมพ์ `:wq`
3. กด `Enter`

(`w` ย่อมาจาก write คือบันทึก, `q` ย่อมาจาก quit คือออก)

> ⚠️ ถ้าเผลอพิมพ์อะไรลงไปในหน้า Vim จนงง ให้กด `Esc` ก่อนเสมอ แล้วพิมพ์ `:q!` ตามด้วย `Enter` เพื่อออกโดยไม่บันทึกอะไรเลย Git จะยกเลิก merge commit ที่กำลังจะสร้าง ลอง `git status` ดูว่า merge ยังค้างอยู่ไหม ถ้าค้าง ให้สั่ง `git merge --abort` เพื่อยกเลิกทั้งหมดแล้วเริ่ม `git merge origin/main` ใหม่

หลังบันทึกและออกจาก Vim ผลลัพธ์จะประมาณนี้:

```text
Merge made by the 'ort' strategy.
 othercolors.txt | 1 +
 1 file changed, 1 insertion(+)
 create mode 100644 othercolors.txt
```

จุดที่ต้องสังเกต:

- `Merge made by the 'ort' strategy.` คือหลักฐานว่านี่เป็น **three-way merge** ไม่ใช่ fast-forward (Git เวอร์ชันเก่าอาจขึ้นเป็น `recursive` strategy ก็ถูกเหมือนกัน ทั้งสองชื่อหมายถึงกลไกเดียวกัน)
- diff แสดงแค่ `othercolors.txt` เพราะไฟล์นี้เป็นสิ่งเดียวที่ `brown` มีแต่ `blue` ไม่มี ส่วนบรรทัด `Blue` ใน `rainbowcolors.txt` มีอยู่แล้วใน working directory ของเรา ไม่ใช่การเปลี่ยนแปลงใหม่จาก merge ครั้งนี้
- ไม่มีบรรทัด `Fast-forward` เลย เพราะ Git เลื่อน pointer ตรง ๆ ไม่ได้ ต้องสร้าง commit ใหม่มาผูกสองสายเข้าด้วยกัน

---

## Step 6: ตรวจ parent สองตัวของ merge commit

merge commit ที่เพิ่งสร้างมี parent สองตัว ลองยืนยันด้วยสองวิธี

ดูด้วย `git log -1` (เจาะจงแค่ commit ล่าสุด แบบเต็ม ไม่ย่อด้วย `--oneline`):

```sh
git log -1
```

ผลลัพธ์ควรมีหน้าตาประมาณนี้: hash และรายละเอียด author/date ในเครื่องเราจะไม่เหมือนตัวอย่าง

```text
commit 5b8e04f...
Merge: d93c710 a4f21e8
Author: ...
Date:   ...

    Merge remote-tracking branch 'origin/main'
```

บรรทัด `Merge: d93c710 a4f21e8` คือหลักฐานตรง ๆ ว่า commit นี้มี parent สองตัว: `d93c710` คือ `blue` (ปลายทางของ `main` ก่อน merge) และ `a4f21e8` คือ `brown` (ปลายทางของ `origin/main` ที่เอาเข้ามา)

ถ้าอยากดูลึกกว่านั้นถึงระดับ object ใช้ `git cat-file -p` แบบที่เจอครั้งแรกในตอนที่ 4 แทน `5b8e04f` ด้วย hash จริงในเครื่องเรา:

```sh
git cat-file -p 5b8e04f
```

ผลลัพธ์ควรมีหน้าตาประมาณนี้:

```text
tree 45330906...
parent d93c710...
parent a4f21e8...
author ...
committer ...

Merge remote-tracking branch 'origin/main'
```

เห็นบรรทัด `parent` สองบรรทัดตรง ๆ เลย — นี่คือสิ่งที่ทำให้ merge commit ต่างจาก commit ปกติที่มี parent แค่ตัวเดียว

---

## Step 7: push merge commit แล้วให้ rainbow pull กลับมา sync ครบ

ยังอยู่ใน `friend-rainbow` push merge commit ขึ้น remote ตามปกติ:

```sh
git push
```

รอบนี้ push ผ่านฉลุย ไม่โดน reject เหมือน Step 4 เพราะ merge commit ตัวใหม่มี `brown` เป็นหนึ่งใน parent อยู่แล้ว remote จึงเลื่อน pointer ไปข้างหน้าได้แบบ fast-forward output ประมาณนี้:

```text
To https://github.com/your-username/rainbow-remote.git
   a4f21e8..5b8e04f  main -> main
```

สลับกลับไปหน้าต่าง `rainbow` ของเรา ตอนนี้ `main` ของเรายังอยู่ที่ `brown` (`a4f21e8`) และ `origin/main` ก็ยังชี้ `brown` เหมือนเดิม เพราะเรายังไม่ได้คุยกับ remote อีกเลยตั้งแต่ push ใน Step 2

รอบนี้ใช้ `git pull` แบบเปล่า ๆ ได้เลย ไม่ต้องแยก fetch กับ merge เอง:

```sh
cd ~/rainbow
git pull
```

ทำไมถึงมั่นใจว่าปลอดภัย? เพราะ commit ล่าสุดของเรา (`brown`) เป็น parent ตัวหนึ่งของ merge commit ที่กำลังจะดึงมาพอดี แปลว่า history ของเราไม่ได้ diverge จากปลายทางใหม่เลย การอัปเดตครั้งนี้จึงเป็น fast-forward แน่ ๆ

ผลลัพธ์ควรมีหน้าตาประมาณนี้:

```text
   a4f21e8..5b8e04f  main       -> origin/main
Updating a4f21e8..5b8e04f
Fast-forward
 rainbowcolors.txt | 1 +
 1 file changed, 1 insertion(+)
```

diff เหลือแค่ `rainbowcolors.txt` เพราะ `othercolors.txt` เรามีอยู่แล้วตั้งแต่ commit `brown` ของตัวเอง สิ่งใหม่ที่เราได้จาก merge commit นี้มีแค่บรรทัด `Blue` ที่เพื่อนเพิ่มเข้ามา

ตรวจสถานะสุดท้ายด้วย:

```sh
git status
git log --oneline --decorate --all
```

ควรเห็นว่าไม่มีงานค้าง และ `main` กับ `origin/main` ชี้ commit เดียวกันคือ merge commit `5b8e04f`

ถ้าอยากเห็นภาพรวมทั้งสองสายที่มาบรรจบกันจริง ๆ ลองเพิ่ม `--graph` เข้าไปดู:

```sh
git log --oneline --decorate --all --graph
```

ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
*   5b8e04f (HEAD -> main, origin/main) Merge remote-tracking branch 'origin/main'
|\
| * a4f21e8 brown
* | d93c710 blue
|/
* 6987cd2 green
* fc8139c yellow
* 7acb333 orange
* abc1234 red
```

เห็นรูปข้าวหลามตัดชัดเจน: จาก `green` แตกเป็นสองทาง (`brown` กับ `blue`) แล้วมาบรรจบที่ merge commit ตัวบนสุด — นี่คือหน้าตาจริงของ three-way merge ใน commit history

เปิดหน้าเว็บของ `rainbow-remote` ดูก็ได้ จะเห็น merge commit ตัวเดียวกันนี้อยู่บน remote ด้วย ตอนนี้ `rainbow`, `friend-rainbow` และ `rainbow-remote` sync กันครบอีกครั้ง

---

## Step 8: แล้ว git pull ควรใช้ตอนไหน?

Step 7 เราใช้ `git pull` เปล่า ๆ ได้อย่างสบายใจ เพราะมั่นใจล่วงหน้าว่าจะได้ fast-forward แต่ถ้า history diverge อยู่แบบ Step 4 ล่ะ?

`git pull` คือการรวบ `git fetch` กับการ integrate (`merge` หรือ `rebase`) ไว้ในคำสั่งเดียว พฤติกรรมของมันขึ้นอยู่กับสถานะ history:

| สถานะ history | พฤติกรรมของ `git pull` |
|---|---|
| ไม่ diverge | fast-forward merge ให้อัตโนมัติ |
| diverge | Git เวอร์ชันใหม่ ๆ มักให้เราเลือกเองก่อนว่าจะ integrate ด้วย `--no-rebase` (merge) หรือ `--rebase` ถ้ายังไม่เคยตั้งค่า default ไว้ ไม่งั้นอาจ error เตือนให้เลือก |

เพราะเหตุนี้ ซีรีส์นี้จึงเลือกใช้แนวทางที่ระมัดระวังไว้ก่อน: ใช้ `git pull` เปล่า ๆ เฉพาะตอนมั่นใจว่าจะได้ fast-forward อย่างที่ทำใน Step 7 ถ้าไม่แน่ใจว่า history diverge หรือเปล่า ให้ `git fetch` แยกก่อนเสมอ แล้วดู `git log --all` ประกอบการตัดสินใจว่าจะ merge ยังไง เหมือนที่ทำใน Step 5

ทางเลือก `--rebase` จะเรียนละเอียดในตอนที่ 11 ส่วนอีกทางหนึ่งที่บทนี้ไม่ได้ใช้คือการ merge บน remote ผ่านฟีเจอร์ pull request ของ hosting service แทนการ merge ในเครื่องเอง ซึ่งเป็นอีกวิธีที่ทีมจริงใช้กันบ่อยเช่นกัน

> `git pull` ปลอดภัยที่สุดเมื่อรู้อยู่แล้วว่าจะได้ fast-forward ถ้าไม่แน่ใจ ให้แยก `git fetch` ออกมาก่อนจะได้เห็นงานใหม่ก่อนตัดสินใจ integrate

---

## แบบฝึกหัด

ทำแบบฝึกหัดนี้ใน `rainbow` โดยเริ่มจากสถานะปัจจุบัน (`main` อยู่ที่ merge commit หลัง Step 7) ใช้ branch ทดลองสองตัวแทนการแตะ `main` ตรง ๆ เพื่อไม่กระทบสถานะที่ตอนถัด ๆ ไปจะใช้ต่อ:

1. ตรวจว่า `working tree` clean ด้วย `git status` แล้วสร้าง branch ทดลองสองตัวจาก `main` ปัจจุบัน:

   ```sh
   git switch -c practice-left
   git switch main
   git switch -c practice-right
   ```

   ตรวจด้วย `git log --oneline --decorate --all` ว่าทั้งสอง branch ชี้ commit เดียวกันกับ `main` ตอนนี้

2. อยู่บน `practice-right` สร้างไฟล์ `practice-right.txt` ใส่บรรทัด `This is a practice file for practice-right.` แล้ว commit:

   ```sh
   git add practice-right.txt
   git commit -m "practice-right"
   ```

3. สลับไป `practice-left` สร้างไฟล์ `practice-left.txt` ใส่บรรทัด `This is a practice file for practice-left.` แล้ว commit:

   ```sh
   git switch practice-left
   git add practice-left.txt
   git commit -m "practice-left"
   ```

   ตรวจด้วย `git log --oneline --decorate --all` ว่าตอนนี้ `practice-left` กับ `practice-right` diverge กันแล้ว — ทั้งคู่มี commit เฉพาะตัวต่อจากจุดร่วมเดียวกัน โดยไม่มีฝั่งไหนเป็น `main` เลย

4. ยังอยู่บน `practice-left` สั่ง merge `practice-right` เข้ามา:

   ```sh
   git merge practice-right
   ```

   นี่ควรเป็น three-way merge เพราะสอง branch diverge กันจริง (ไม่ใช่ fast-forward) Git จะเปิด Vim ให้เขียน merge commit message เหมือน Step 5 — กด `Esc` ตามด้วย `:wq` แล้ว `Enter` เพื่อ accept ข้อความ default

5. ตรวจ parent สองตัวของ merge commit ที่เพิ่งได้ ด้วย `git log -1` และ `git cat-file -p <merge_commit_hash>` (แทน `<merge_commit_hash>` ด้วย hash จริงจาก `git log -1`) — ต้องเห็น parent สองตัวตรงกับ commit `practice-left` และ `practice-right` ก่อนหน้า

6. เก็บกวาดให้เรียบร้อย: สลับกลับ `main` แล้วลบ branch ทดลองทั้งสอง เนื่องจากยังมี commit ที่ไม่ได้ merge เข้า `main` เลย ต้องใช้ `-D` (ตัวใหญ่) บังคับลบ:

   ```sh
   git switch main
   git branch -D practice-left practice-right
   ```

   ตรวจด้วย `git branch --all` ว่าเหลือแค่ `main` เหมือนก่อนเริ่มแบบฝึกหัด และ `git status` ยังบอกว่า `working tree` clean

ตรวจตัวเองให้ครบ:

- อธิบายได้ว่าทำไม `practice-left` กับ `practice-right` diverge กัน ทั้งที่ไม่มีฝั่งไหนเป็น `main`
- บอกได้ว่าทำไม merge ใน Step 4 ของแบบฝึกหัดนี้เป็น three-way merge ไม่ใช่ fast-forward
- หา parent ทั้งสองของ merge commit ได้ด้วยทั้ง `git log -1` และ `git cat-file -p`
- เข้าใจว่าทำไมต้องใช้ `git branch -D` แทน `-d` กับ branch ทดลองทั้งสองนี้
- หลังลบ branch ทดลองแล้ว `main` ของ `rainbow` กลับมาอยู่ในสถานะเดียวกับก่อนเริ่มแบบฝึกหัดทุกอย่าง

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คิดว่า staging area อัปเดตตามไฟล์ให้เองหลังแก้ไฟล์ซ้ำ** — ถ้าแก้ไฟล์ต่อหลัง `git add` ต้อง add ซ้ำเสมอ ไม่งั้น commit จะได้เวอร์ชันเก่า (สัญญาณเตือนคือเห็นไฟล์เดียวกันอยู่ทั้ง "Changes to be committed" และ "Changes not staged" พร้อมกัน)
- **เห็น `! [rejected] ... (fetch first)` แล้วตกใจว่าทำอะไรพัง** — ไม่ใช่ error ที่งานหาย แค่ remote มี commit ที่ local ยังไม่มี ต้อง fetch/pull มา integrate ก่อนแล้วค่อย push ใหม่
- **ติดอยู่ใน Vim ออกไม่ได้** — กด `Esc` ก่อนเสมอ แล้วพิมพ์ `:wq` ตามด้วย `Enter` ถ้าพลาดจนไม่แน่ใจ ให้ `:q!` แล้วใช้ `git merge --abort` เพื่อเริ่มใหม่
- **เห็นคำว่า "ort" หรือ "recursive" strategy แล้วคิดว่า merge ผิดพลาด** — ตรงข้าม บรรทัดนี้คือหลักฐานว่าเป็น three-way merge สำเร็จ (fast-forward จะไม่มีบรรทัดนี้เลย)
- **รัน `git pull` ตอน history diverge โดยไม่ระบุ option** — อาจ error หรือให้เลือก `--no-rebase`/`--rebase` ก่อน จึงควรแยก `git fetch` ก่อนถ้าไม่แน่ใจว่า history diverge หรือเปล่า
- **สับสนระหว่าง "ahead" กับ "diverge"** — นำหน้าอย่างเดียวยัง fast-forward ได้ ต้องมีทั้งสองฝั่งสร้าง commit ใหม่ต่อจากจุดร่วมเดียวกันถึงจะ diverge
- **ลืมตั้ง upstream แล้วงงว่าทำไม `git push`/`git pull` เปล่า ๆ ใช้ไม่ได้** — ต้อง `git branch -u <shortname>/<branch>` ก่อน (หรือใช้ clone ซึ่งตั้งให้อัตโนมัติ)
- **ลบ branch ทดลองที่ยังไม่ได้ merge เข้า main ด้วย `git branch -d` แล้วเจอ error** — ต้องใช้ `git branch -D` (ตัวใหญ่) เพื่อบังคับลบ branch ที่มี commit ยังไม่ได้เข้า main

---

## สรุป

1. Three-way merge เกิดเมื่อ history ของสอง branch diverge กันจริง — ทั้งสองฝั่งมี commit ใหม่ต่อจากจุดร่วมเดียวกัน (common ancestor)
2. Git สร้าง merge commit ที่มี parent สองตัวมาผูก history สองสายเข้าด้วยกัน ต่างจาก fast-forward ที่ไม่สร้าง commit ใหม่
3. `git branch -u <shortname>/<branch>` ตั้ง upstream branch ให้ local branch ปัจจุบัน ทำให้ `git push`/`git pull` เปล่า ๆ รู้ปลายทางเอง — clone ตั้งให้อัตโนมัติ แต่ init เองต้องตั้งเอง
4. Staging area เก็บ snapshot ของไฟล์ตอนสั่ง `git add` เท่านั้น ถ้าแก้ไฟล์ต่อหลัง add ต้อง add ซ้ำ ไม่งั้น commit จะได้เวอร์ชันเก่า
5. `git push` ที่โดน `[rejected] (fetch first)` แปลว่า remote มีงานที่ local ยังไม่มี ต้อง fetch/pull มา integrate ก่อนจึง push ได้อีกครั้ง
6. เมื่อต้องสร้าง merge commit และไม่ได้ระบุ message ด้วย `-m` Git จะเปิด text editor ให้เขียน (ค่าเริ่มต้นคือ Vim) — ออกจาก Vim ด้วย `Esc` ตามด้วย `:wq` แล้ว `Enter`
7. `Merge made by the 'ort' strategy.` ในผลลัพธ์คือสัญญาณว่า merge ครั้งนี้เป็น three-way merge สำเร็จ
8. ตรวจ parent ทั้งสองของ merge commit ได้ด้วย `git log -1` (ดูบรรทัด `Merge: <p1> <p2>`) หรือ `git cat-file -p <hash>` (ดูสองบรรทัด `parent`)
9. `git pull` ปลอดภัยเมื่อมั่นใจว่าจะได้ fast-forward ถ้า history diverge หรือไม่แน่ใจ ให้แยก `git fetch` ก่อนเสมอ
10. `git branch -D` (ตัวใหญ่) บังคับลบ branch ที่มี commit ยังไม่ได้ merge เข้าที่ไหน ต่างจาก `-d` ที่จะปฏิเสธถ้ายังไม่ merge

ตอนนี้ `rainbow`, `friend-rainbow` และ `rainbow-remote` กลับมา sync กันครบอีกครั้ง โดยมี merge commit เก็บร่องรอยไว้ว่างานสองฝั่งเคยแยกกันเดินแล้วมาบรรจบ history หน้าตาอาจดูรกกว่าเส้นตรงเดียว แต่ก็เก็บบริบทของทั้งสองฝั่งไว้ครบ ไม่มีอะไรหายไปเลย

บางคนไม่ชอบ merge commit เพราะทำให้ history ดูยุ่ง ถ้าอยากเลี่ยงก็มีอีกทางคือ rebase ซึ่งจะเรียนในตอนที่ 11

> *ตอนถัดไปเราจะเจอสถานการณ์ที่ history diverge เหมือนกัน แต่ครั้งนี้สอง branch แก้ไฟล์ส่วนเดียวกันชนกันจริง ต้องเรียนรู้วิธีแก้ merge conflict*

---

## Glossary

- **Upstream branch** — remote branch ที่ local branch ถูกตั้งให้ track ไว้ ตั้งด้วย `git branch -u <shortname>/<branch>`
- **`git branch -u`** — คำสั่งตั้ง upstream branch ให้ local branch ปัจจุบัน (ย่อมาจาก `--set-upstream-to`)
- **Diverge / Divergent history** — สภาพที่สอง branch ต่างมี commit เฉพาะตัวต่อจากจุดร่วมเดียวกัน ทำให้ fast-forward merge ทำไม่ได้
- **Three-way merge** — merge ที่ Git ใช้เมื่อ history diverge โดยพิจารณาปลายสายทั้งสองฝั่งกับ common ancestor แล้วสร้าง merge commit
- **Merge commit** — commit ที่มี parent มากกว่าหนึ่งตัว เกิดจาก three-way merge
- **Vim** — text editor บน command line ที่ Git ใช้เป็นค่าเริ่มต้นสำหรับเขียน commit message เมื่อไม่ได้ระบุ `-m`
- **`Esc` → `:wq` → `Enter`** — ลำดับคีย์มาตรฐานสำหรับบันทึกและออกจาก Vim
- **`'ort' strategy`** — merge strategy ค่าเริ่มต้นของ Git ยุคใหม่ ปรากฏใน output เมื่อทำ three-way merge สำเร็จ
- **`git cat-file -p`** — คำสั่งดูเนื้อหาดิบของ object ใน Git ใช้ยืนยัน parent ของ merge commit ได้
- **`git pull`** — คำสั่งที่รวม `git fetch` กับการ integrate (`merge` หรือ `rebase`) ไว้ในคำสั่งเดียว
- **`git branch -D`** — คำสั่งบังคับลบ local branch แม้ยังมี commit ที่ไม่ได้ merge เข้าที่ไหน

---

## Related

- [ตอนที่ 4: Branches](/git/04-branches/) — `git cat-file -p` ที่ใช้ยืนยัน parent ของ commit เป็นครั้งแรก
- [ตอนที่ 5: Merging](/git/05-merging/) — นิยาม source/target branch และความต่างระหว่าง fast-forward กับ three-way merge
- [ตอนที่ 7: Creating and Pushing to a Remote Repository](/git/07-creating-and-pushing-to-a-remote-repository/) — นิยาม upstream branch ที่บทนี้เอามาใช้จริง และแยก remote branch กับ remote-tracking branch
- [ตอนที่ 8: Cloning and Fetching](/git/08-cloning-and-fetching/) — กระบวนการสองก้าว `fetch` แล้ว `merge` และ `friend-rainbow` ที่บทนี้นำมาต่อยอด
- [ตอนที่ 10: Merge Conflicts](/git/10-merge-conflicts/) — three-way merge ที่มี merge conflict จริง และวิธีแก้
- [ตอนที่ 11: Rebasing](/git/11-rebasing/) — อีกทางเลือกในการ integrate การเปลี่ยนแปลงโดยไม่ต้องสร้าง merge commit
