+++
title = 'ตอนที่ 11: Rebasing'
date = '2026-08-18T00:00:00+07:00'
draft = false
description = 'รวมงานอีกแบบที่ไม่สร้าง merge commit — ทำความเข้าใจ 5 ขั้นตอนของ rebase, ใช้ git restore --staged ถอดไฟล์ออกจาก staging area, resolve conflict ระหว่าง rebase ด้วย git rebase --continue และรู้ว่าเมื่อไหร่ห้าม rebase เด็ดขาด'
tags = ['programming', 'git', 'tutorial']
+++

---

ตอนที่แล้วเราเพิ่งผ่านศึก merge conflict ครั้งแรกมาหมาด ๆ อ่าน conflict markers เป็น แก้เสร็จ แล้วปิดงานด้วย merge commit อีกหนึ่งตัว

สังเกตไหมว่าตอนนี้ history ของเรามี merge commit สะสมอยู่สองตัวแล้ว ตั้งแต่ตอนที่ 9 หนึ่งตัวและตอนที่ 10 อีกหนึ่งตัว ทั้งที่งานจริง ๆ ที่เราเขียนมีอยู่ไม่กี่บรรทัด

จนถึงตอนที่แล้วเรารวมงานข้าม branch ด้วยวิธีเดียวมาตลอด นั่นคือ **merge** ไม่ fast-forward ก็ three-way merge ที่สร้าง merge commit ขึ้นมาผูกสองสายเข้าด้วยกัน วิธีนี้ปลอดภัยและเก็บบริบทไว้ครบ แต่แลกมาด้วย history ที่แตกเป็นกิ่งเป็นก้าน พอโปรเจกต์ใหญ่ขึ้น หลายทีมเลยอยากได้ history ที่เป็นเส้นตรงสายเดียว อ่านไล่จากบนลงล่างได้จบ

Rebase คือเครื่องมือสำหรับสิ่งนั้น หลักการของมันคือ **หยิบ commit ของเราออกมา แล้วเอาไปแปะใหม่ทับปลายของอีก branch** ทำให้ดูเหมือนเราเพิ่งแตก branch ออกมาจาก commit ล่าสุดตั้งแต่แรก ผลคือไม่ต้องมี merge commit ให้รก

แต่ของดีมักมีเงื่อนไข rebase **สร้าง commit ใหม่ทั้งชุด** ไม่ได้ย้ายของเดิม แปลว่ามันคือการเปลี่ยน commit history — และนั่นคือเหตุผลที่บทนี้ต้องมี "กฎทอง" ปิดท้าย

สิ่งที่จะได้ตอนจบบทนี้:

- บอกได้ว่าเมื่อไหร่ควรรวมงานด้วย merge และเมื่อไหร่ควรใช้ rebase เพื่อรักษา linear history
- ถอดไฟล์ออกจาก staging area ด้วย `git restore --staged` เพื่อแยกงานที่แก้ค้างไว้ออกเป็นหลาย commit
- สร้างสถานการณ์ที่ history diverge กันจริง แล้ว `git fetch` เตรียมของก่อน rebase
- อธิบาย 5 ขั้นตอนที่ Git ทำให้เบื้องหลังคำสั่ง `git rebase` ได้
- rebase branch ทับ `origin/main` แล้วรับมือกับ merge conflict ที่โผล่มากลางทาง
- ปิดงานหลัง resolve conflict ด้วย `git add` + `git rebase --continue` และถอยด้วย `git rebase --abort`
- ยืนยันด้วย hash ว่า rebase สร้าง commit ใหม่ ไม่ใช่ย้าย commit เดิม
- ตัดสินใจได้ว่า branch ไหน rebase ได้ปลอดภัย branch ไหนห้ามแตะ ตาม golden rule of rebasing

{{< mermaid >}}
flowchart LR
  A["rainbow: commit gray<br/>แล้ว push ขึ้น remote"] --> B["friend-rainbow: แก้สองไฟล์<br/>add ทั้งคู่แล้วถอดออกหนึ่ง"]
  B --> C["commit black + rainbow<br/>history diverge กับ remote"]
  C --> D["git fetch<br/>ดึง gray ลงมาเป็น origin/main"]
  D --> E["git rebase origin/main<br/>ชน conflict กลางทาง"]
  E --> F["resolve + git add<br/>git rebase --continue"]
  F --> G["history เป็นเส้นตรง<br/>push แล้ว rainbow pull แบบ fast-forward"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 10 โดยสมมติว่า `rainbow`, `friend-rainbow` และ `rainbow-remote` sync กันครบแล้วที่ merge commit ตัวที่เพิ่ง resolve conflict ไป — ทั้งสามฝั่งมีแค่ branch `main` และ `main` ทุกฝั่งชี้ commit เดียวกัน

ตอนนี้ `rainbowcolors.txt` ควรมีครบทั้งเจ็ดสี (Red ถึง Violet) ส่วน `othercolors.txt` ยังมีบรรทัดเดียวคือ `Brown is not a color in the rainbow.` เพราะตอนที่ 10 ไม่ได้แตะไฟล์นี้เลย

เปิดสองหน้าต่าง terminal ค้างไว้เหมือนเดิม หน้าต่างหนึ่งอยู่ที่ `rainbow` อีกหน้าต่างอยู่ที่ `friend-rainbow` แล้วตรวจฝั่งเราก่อน:

```sh
cd ~/rainbow
git status
git log --oneline --decorate --all
```

ที่ต้องเห็นคือ working tree สะอาด และ `main` กับ `origin/main` ชี้ commit เดียวกัน:

```text
On branch main
nothing to commit, working tree clean
```

สลับไปหน้าต่าง `friend-rainbow` แล้วรันชุดเดียวกัน:

```sh
cd ~/friend-rainbow
git status
git log --oneline --decorate --all
```

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

ถ้ามีไฟล์ค้างอยู่ใน `git status` ให้ commit หรือเคลียร์ให้เรียบร้อยก่อน ไม่งั้นจะไปสะดุดตอน rebase

อีกสองอย่างเหมือนตอนที่ผ่านมา: ถ้าเปิด `git.autofetch` ของ VS Code ไว้ ให้ปิดชั่วคราว เพราะมันจะแอบ fetch ให้เองจนสถานะไม่ตรงกับตัวอย่าง และเครื่องหมาย `$` ในตัวอย่างเป็นแค่ command prompt ไม่ต้องพิมพ์ตามไปด้วย

> ⚠️ hash ในเครื่องเราจะไม่ตรงกับตัวอย่างในบทนี้ และ `git log` ในเครื่องเราจะมี commit จากตอนก่อน ๆ ต่อท้ายอีกหลายบรรทัด ตัวอย่างในบทนี้ตัดให้เหลือเฉพาะส่วนที่เกี่ยวข้อง แล้วใส่ `...` ไว้แทนส่วนที่เหลือ

---

## Step 1: merge กับ rebase รวมงานต่างกันตรงไหน?

ก่อนลงมือ มาดูภาพรวมกันก่อนว่าสองวิธีนี้ให้ผลลัพธ์ต่างกันยังไง

สมมติเราเขียนหนังสือกับ coauthor คนหนึ่ง ทั้งคู่แตก branch ออกจาก `main` ตอนที่มันชี้อยู่ที่ commit `B` เหมือนกัน เราแตก `chapter_five` ส่วน coauthor แตก `chapter_six`

จากนั้น coauthor เขียน chapter 6 เสร็จเป็น commit `C` merge เข้า `main` แล้ว push ขึ้น remote เรียบร้อย ส่วนเราเขียน chapter 5 เสร็จเป็น commit `D` แต่ยังเก็บไว้ในเครื่องตัวเอง ยังไม่ได้ share ให้ใคร

ตอนนี้งานสองฝั่งแยกสายกันแล้ว เรามีสองทางเลือกในการรวม:

**ทาง merge** (แบบที่ทำมาตั้งแต่ตอนที่ 9) — `fetch` งานล่าสุดของ `main` ลงมา แล้ว three-way merge `chapter_five` เข้า `main` ผลคือได้ merge commit `M` เพิ่มมาหนึ่งตัว history แตกเป็นรูปตัว Y

**ทาง rebase** — `pull` งานลงมาก่อนให้ local `main` เลื่อนไปชี้ commit `C` แล้วสั่ง rebase `chapter_five` ทับ `main` ที่อัปเดตแล้ว Git จะหยิบ commit `D` ซึ่งเป็น commit เดียวที่แยกสายออกมา ไป reapply ทับปลาย `main` สร้างเป็น commit ใหม่ชื่อ `D'`

เครื่องหมาย `'` ที่ต่อท้ายอ่านว่า "prime" ใช้บอกว่านี่คือ **commit ตัวใหม่** ที่มีการเปลี่ยนแปลงเหมือน `D` ทุกอย่าง แต่คนละ commit กัน คนละ hash กัน

พอ rebase เสร็จ `chapter_five` ก็ต่อจากปลาย `main` พอดี merge เข้า `main` ได้ด้วย fast-forward ธรรมดา ไม่มี merge commit เพิ่ม history เป็นเส้นตรงสายเดียว

{{< mermaid >}}
flowchart TD
  A["history แยกสองสาย<br/>(diverged)"] --> B{"รวมงานยังไง?"}
  B -->|merge| C["สร้าง merge commit<br/>history เป็นรูป Y (nonlinear)"]
  B -->|rebase| D["เก็บ commit ของเราไว้ชั่วคราว<br/>เลื่อนฐานไปปลาย main<br/>reapply เป็น commit ใหม่ (D')"]
  D --> E["history เป็นเส้นตรง (linear)<br/>แล้ว fast-forward merge ต่อได้เลย"]
{{< /mermaid >}}

จุดที่มักเข้าใจผิดกันคือคำว่า "ย้าย" — rebase **ไม่ได้ย้าย** commit `D` ไปไหน commit `D` ตัวเดิมยังอยู่ในฐานข้อมูลของ Git ครบถ้วน เพียงแต่ไม่มี branch ไหนชี้ถึงมันแล้ว เลยไม่โผล่ใน `git log` ตามปกติ สิ่งที่ rebase ทำคือ **สร้างของใหม่** ขึ้นมาจากการเปลี่ยนแปลงชุดเดิม

> **จำคำสั่งไว้:** `git rebase <branch_name>` — เอา commit ของ branch ที่เรายืนอยู่ ไป reapply ทับปลายของ `<branch_name>` ต้องยืนอยู่บน branch ที่ต้องการ rebase ก่อนเสมอ

---

## Step 2: สร้าง commit "gray" ใน rainbow แล้ว push

จะฝึก rebase ได้ต้องมี divergent history ก่อน แผนคือ: ฝั่งเราทำ 1 commit แล้ว push ขึ้น remote ส่วนฝั่งเพื่อนจะทำ 2 commit โดยยังไม่ fetch อะไรเลย พอทำเสร็จเพื่อนค่อย fetch แล้วตัดสินใจ rebase

เริ่มที่หน้าต่าง `rainbow` เปิดไฟล์ `othercolors.txt` เพิ่มบรรทัดนี้ต่อท้ายแล้วเซฟ:

```text
Gray is not a color in the rainbow.
```

แล้ว add กับ commit:

```sh
git add othercolors.txt
git commit -m "gray"
```

```text
[main f986d5a] gray
 1 file changed, 1 insertion(+)
```

ส่งขึ้น remote เลย:

```sh
git push
```

```text
To https://github.com/your-username/rainbow-remote.git
   964e5ae..f986d5a  main -> main
```

ตอนนี้ commit `gray` อยู่บน remote `main` เรียบร้อยแล้ว จำไว้ว่าเราเพิ่มบรรทัดนี้ **ต่อท้าย** `othercolors.txt` เพราะเดี๋ยวเพื่อนจะไปเพิ่มบรรทัดต่อท้ายไฟล์เดียวกัน — นั่นแหละคือต้นเหตุของ conflict ที่รออยู่ข้างหน้า

---

## Step 3: staging area เป็นกระดาษร่าง — add เข้าไปแล้วถอดออกได้

สลับไปหน้าต่าง `friend-rainbow` เพื่อนกำลังจะทำ 2 commit แต่ระหว่างทางเราจะแวะเรียนเทคนิคที่ใช้บ่อยมากในชีวิตจริงกันก่อน

สถานการณ์คือแบบนี้: เพื่อนแก้ไฟล์รวดเดียวสองไฟล์ แล้ว `git add` เข้า staging area ทั้งคู่ แต่พอจะ commit ก็เพิ่งนึกได้ว่าสองไฟล์นี้เป็นงานคนละเรื่อง ควรแยกเป็นสอง commit ต่างหาก จะทำยังไงดี

คำตอบคือ **ถอดไฟล์ออกจาก staging area** ได้ ไม่ต้อง commit รวดเดียวทั้งกอง

เรื่องนี้ย้อนกลับไปที่ตัวอย่างจากตอนที่ 3 สมมติเราแก้ `chapter_one.txt`, `chapter_two.txt`, `chapter_three.txt` แล้ว `git add` เข้าไปหมดทั้งสามไฟล์ แต่ก่อนจะ commit เพิ่งรู้ว่ามีแค่ chapter 2 ที่เขียนเสร็จพร้อมให้ editor รีวิว อีกสองบทยังเขียนค้าง ทางออกคือถอด `chapter_one.txt` กับ `chapter_three.txt` ออกจาก staging area ให้เหลือแต่ chapter 2 แล้วค่อย commit

ลองนึกถึงการวางของที่จะส่งแยกไว้บนโต๊ะสักโต๊ะ ของที่วางแล้วก็หยิบกลับได้ ไม่ใช่ว่าวางแล้วต้องส่งทั้งหมด `git add` คือการวางลงโต๊ะ ส่วนคำสั่งที่ใช้หยิบกลับคือ `git restore --staged`

เอาล่ะ กลับมาที่ `friend-rainbow` เปิด `othercolors.txt` เพิ่มบรรทัดนี้ต่อท้ายแล้วเซฟ:

```text
Black is not a color in the rainbow.
```

แล้วเปิด `rainbowcolors.txt` เพิ่มบรรทัดนี้ต่อท้ายแล้วเซฟ:

```text
These are the colors of the rainbow.
```

ตรวจสถานะ:

```sh
git status
```

ทั้งสองไฟล์เป็น modified แต่ยังไม่เข้า staging area:

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   othercolors.txt
	modified:   rainbowcolors.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

ทีนี้ทำท่าเผลอ — `git add` เข้าไปทั้งคู่:

```sh
git add rainbowcolors.txt othercolors.txt
git status
```

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   othercolors.txt
	modified:   rainbowcolors.txt
```

สังเกตบรรทัดที่ Git ใบ้ให้เองเลยว่า `(use "git restore --staged <file>..." to unstage)` — Git บอกทางออกไว้ให้อยู่แล้ว ถอด `rainbowcolors.txt` ออกมา:

```sh
git restore --staged rainbowcolors.txt
git status
```

```text
On branch main
Your branch is up to date with 'origin/main'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   othercolors.txt

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   rainbowcolors.txt
```

`othercolors.txt` ยังอยู่ใน "Changes to be committed" ส่วน `rainbowcolors.txt` ถอยกลับไปอยู่ "Changes not staged for commit" แล้ว การแก้ไขในไฟล์ยังอยู่ครบไม่หายไปไหน แค่ไม่ถูกนับเข้า commit ถัดไปเท่านั้น

> **`git restore --staged <filename>`** — ถอดไฟล์ออกจาก staging area โดยไม่แตะการแก้ไขใน working directory ถ้าใช้ Git เก่ากว่า version 2.23 จะยังไม่มีคำสั่งนี้ ให้ใช้ `git reset HEAD <filename>` แทน

commit เฉพาะ `othercolors.txt` ก่อน:

```sh
git commit -m "black"
```

```text
[main 95acb84] black
 1 file changed, 1 insertion(+)
```

แล้วค่อย add กับ commit อีกไฟล์:

```sh
git add rainbowcolors.txt
git commit -m "rainbow"
```

```text
[main 00b3bbe] rainbow
 1 file changed, 1 insertion(+)
```

ดู history ฝั่งเพื่อน:

```sh
git log --oneline --decorate --all
```

```text
00b3bbe (HEAD -> main) rainbow
95acb84 black
964e5ae (origin/main, origin/HEAD) blue
...
```

ตรงนี้คือจุดสำคัญ: `main` ของเพื่อนเดินหน้าไป 2 commit แล้ว แต่ `origin/main` ในเครื่องเพื่อนยังชี้ commit เก่าอยู่ เพราะเพื่อนยังไม่ได้ fetch commit `gray` ที่เราเพิ่ง push ลงมาเลย

---

## Step 4: fetch ก่อน rebase เสมอ

กฎข้อแรกของการ rebase คือ **ต้องมีงานล่าสุดของ branch ที่จะ rebase ทับอยู่ในเครื่องก่อน** ไม่งั้นเราจะ rebase ทับของเก่า เสียเที่ยวเปล่า

ยังอยู่ใน `friend-rainbow` สั่ง fetch:

```sh
git fetch
```

```text
From https://github.com/your-username/rainbow-remote.git
   964e5ae..f986d5a  main       -> origin/main
```

ดู history อีกรอบ:

```sh
git log --oneline --decorate --all
```

```text
00b3bbe (HEAD -> main) rainbow
95acb84 black
f986d5a (origin/main, origin/HEAD) gray
...
```

`origin/main` เลื่อนไปชี้ commit `gray` แล้ว จำจากตอนที่ 7 ได้ไหมว่า `origin/main` คือ remote-tracking branch ที่ทำหน้าที่เป็นตัวแทน "เวอร์ชันล่าสุดของ remote `main` เท่าที่เราเห็นครั้งสุดท้าย" ตอนนี้มันอัปเดตแล้ว เพื่อนพร้อม rebase

ลองดู `git status` ประกอบ:

```sh
git status
```

```text
On branch main
Your branch and 'origin/main' have diverged,
and have 2 and 1 different commits each, respectively.
  (use "git pull" if you want to integrate the remote branch with yours)

nothing to commit, working tree clean
```

`have diverged, and have 2 and 1 different commits each` คือคำยืนยันจาก Git ว่าสองสายแยกกันจริง ฝั่งเราเกิน 2 commit (`black`, `rainbow`) ฝั่ง remote เกิน 1 commit (`gray`) ถ้ารวมด้วย merge ตอนนี้จะได้ merge commit แน่นอน — แต่บทนี้เราจะไม่ทำแบบนั้น

ก่อนไปต่อ **จด hash ของ `black` กับ `rainbow` ไว้** (ในตัวอย่างคือ `95acb84` กับ `00b3bbe` ในเครื่องเราจะเป็นเลขอื่น) เดี๋ยวเราจะเอามาเทียบกันหลัง rebase

---

## Step 5: เบื้องหลัง git rebase มี 5 ขั้นตอน

คำสั่งที่เราจะพิมพ์มีบรรทัดเดียว แต่ Git ทำงานให้เบื้องหลัง 5 ขั้น รู้ไว้จะช่วยได้มากตอนที่มันหยุดกลางทางแล้วเราต้องเข้าไปแก้เอง

**ขั้นที่ 1 — หา common ancestor** Git มองหา commit ร่วมล่าสุดของสอง branch ที่เกี่ยวข้อง คือ branch ที่เรายืนอยู่ (`main`) กับ branch ที่จะ rebase ทับ (`origin/main`)

**ขั้นที่ 2 — เก็บการเปลี่ยนแปลงไว้ที่พักชั่วคราว** Git เก็บ "การเปลี่ยนแปลงที่แต่ละ commit นำเข้ามา" ของทุก commit บน branch ที่เรายืนอยู่ไว้ในพื้นที่ชั่วคราว พร้อมข้อมูลว่าจะไปแปะทับ branch ไหนตรงตำแหน่งไหน ในตัวอย่างคือเก็บการเปลี่ยนแปลงของ `black` กับ `rainbow` ไว้

**ขั้นที่ 3 — reset HEAD** Git ย้าย `HEAD` ไปชี้ commit เดียวกับ branch ที่เรา rebase ทับ ในตัวอย่างคือย้ายไปที่ commit `gray` ตรงนี้เองที่ฐาน (base) ของเราถูกเลื่อน จนเป็นที่มาของชื่อ rebase

**ขั้นที่ 4 — apply แล้ว commit ทีละอัน** Git เอาการเปลี่ยนแปลงที่เก็บไว้มาแปะทับทีละชุดตามลำดับเดิม แปะเสร็จชุดหนึ่งก็สร้าง commit ใหม่หนึ่งตัว ในตัวอย่างคือแปะ `black` สร้าง commit ใหม่ แล้วแปะ `rainbow` สร้าง commit ใหม่ เขียนแทนด้วย `Bl'` กับ `Ra'`

**ขั้นที่ 5 — สลับไปยัง branch ที่ rebase แล้ว** Git ทำให้ branch ของเราชี้ commit สุดท้ายที่เพิ่งสร้าง แล้ว check out ให้ `HEAD` ชี้ถึง

{{< mermaid >}}
flowchart LR
  S1["1. หา<br/>common ancestor"] --> S2["2. เก็บการเปลี่ยนแปลง<br/>ไว้ที่พักชั่วคราว<br/>(black, rainbow)"]
  S2 --> S3["3. reset HEAD<br/>ไปที่ gray"]
  S3 --> S4["4. apply + commit<br/>ทีละอัน → Bl', Ra'"]
  S4 --> S5["5. สลับไป branch<br/>ที่ rebase แล้ว"]
{{< /mermaid >}}

ทั้ง 5 ขั้น Git ทำเองหมด ครั้งเดียวที่เราต้องเข้าไปยุ่งคือขั้นที่ 4 ถ้าการแปะชุดไหนไปชนกับของเดิม — ซึ่งกำลังจะเกิดขึ้นใน Step ถัดไปพอดี

---

## Step 6: rebase จริง แล้วชน conflict กลางทาง

ยังอยู่บน `main` ใน `friend-rainbow` สั่ง rebase ทับ `origin/main`:

```sh
git rebase origin/main
```

แทนที่จะจบสวย ๆ Git หยุดกลางทาง:

```text
Auto-merging othercolors.txt
CONFLICT (content): Merge conflict in othercolors.txt
error: could not apply 95acb84... black
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
Could not apply 95acb84... # black
```

อ่านบรรทัด `error: could not apply 95acb84... black` เป็นหลัก มันบอกว่า Git แปะการเปลี่ยนแปลงของ commit `black` ไม่สำเร็จเพราะไปชนตรง `othercolors.txt` — สมเหตุสมผล เพราะ commit `gray` (ฝั่งเรา) กับ commit `black` (ฝั่งเพื่อน) ต่างเพิ่มบรรทัดต่อท้ายไฟล์เดียวกันตรงตำแหน่งเดียวกัน Git เลยเลือกให้เองไม่ได้ว่าจะเอาบรรทัดไหนขึ้นก่อน

ระหว่างที่รัน Git อาจขึ้นบรรทัดสถานะแบบ `Rebasing (1/2)` แวบ ๆ ให้เห็นด้วย บอกว่ากำลังทำ commit ตัวที่เท่าไหร่จากทั้งหมดกี่ตัว แต่บรรทัดนี้เขียนทับตัวเองไปเรื่อย ๆ พอจบแล้วมักไม่ค้างอยู่บนจอ ไม่เห็นก็ไม่ต้องตกใจ

ดูสถานะระหว่างที่ rebase ค้างอยู่:

```sh
git status
```

```text
interactive rebase in progress; onto f986d5a
Last command done (1 command done):
   pick 95acb84 # black
Next command to do (1 remaining command):
   pick 00b3bbe # rainbow
  (use "git rebase --edit-todo" to view and edit)
You are currently rebasing branch 'main' on 'f986d5a'.
  (fix conflicts and then run "git rebase --continue")
  (use "git rebase --skip" to skip this patch)
  (use "git rebase --abort" to check out the original branch)

Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   othercolors.txt
```

`git status` ตอนนี้บอกครบเลยว่าเรากำลังอยู่ระหว่าง rebase, ทำอะไรไปแล้ว (`pick 95acb84 # black`), เหลืออะไรอีก (`pick 00b3bbe # rainbow`) และมีไฟล์อะไรต้องแก้ (`both modified: othercolors.txt`) เวลา rebase ค้างแล้วสับสนว่าตัวเองอยู่ตรงไหน คำสั่งแรกที่ควรพิมพ์คือ `git status` เสมอ

> ⚠️ Git รุ่นใหม่ขึ้นข้อความว่า `interactive rebase in progress` แม้เราจะสั่ง `git rebase` เปล่า ๆ ไม่ได้ใส่ `-i` เลย — ไม่ต้องตกใจ เป็นเพราะเบื้องหลังมันใช้กลไกตัวเดียวกัน ไม่ได้แปลว่าเราสั่งผิด

---

## Step 7: resolve conflict แล้ว git rebase --continue

เปิด `othercolors.txt` ขึ้นมาดู จะเจอ conflict markers หน้าตาแบบนี้ (บรรทัดบน ๆ ในเครื่องเราอาจมีมากกว่านี้ ขึ้นกับว่าทำถึงตอนไหนมาแล้ว):

```text
Brown is not a color in the rainbow.
<<<<<<< HEAD
Gray is not a color in the rainbow.
=======
Black is not a color in the rainbow.
>>>>>>> 95acb84 (black)
```

อ่าน markers สามตัวนี้ให้ออก:

- `<<<<<<< HEAD` เปิดฝั่งแรก ทุกบรรทัดใต้มันจนถึง `=======` คือเวอร์ชันของฝั่งหนึ่ง
- `=======` คือเส้นแบ่งกลาง
- `>>>>>>> 95acb84 (black)` ปิดฝั่งที่สอง พร้อมบอก hash และชื่อ commit ที่เป็นเจ้าของ

> ⚠️ **ระหว่าง rebase ฝั่ง `HEAD` ไม่ใช่งานของเรา** ปกติเวลา merge เราชินว่า `HEAD` คือฝั่งที่เรายืนอยู่ แต่ rebase reset `HEAD` ไปที่ commit ของ branch ที่เรา rebase ทับตั้งแต่ขั้นที่ 3 แล้ว ฝั่ง `HEAD` จึงเป็นของ `origin/main` (บรรทัด `Gray`) ส่วนงานของเราไปโผล่อยู่ฝั่งล่างที่มีชื่อ commit กำกับ (`black`) — สลับด้านกับที่คุ้นเคย ให้ดูชื่อ commit ท้าย `>>>>>>>` เป็นหลัก จะไม่หลง

รอบนี้เราอยากเก็บทั้งสองบรรทัด แก้ไฟล์ให้เหลือแบบนี้แล้วเซฟ (ลบ markers ทั้งสามบรรทัดออกให้หมด):

```text
Brown is not a color in the rainbow.
Gray is not a color in the rainbow.
Black is not a color in the rainbow.
```

บอก Git ว่าแก้เสร็จแล้วด้วย `git add`:

```sh
git add othercolors.txt
git status
```

```text
interactive rebase in progress; onto f986d5a
Last command done (1 command done):
   pick 95acb84 # black
Next command to do (1 remaining command):
   pick 00b3bbe # rainbow
  (use "git rebase --edit-todo" to view and edit)
You are currently rebasing branch 'main' on 'f986d5a'.
  (all conflicts fixed: run "git rebase --continue")

Changes to be committed:
	modified:   othercolors.txt
```

บรรทัด `(all conflicts fixed: run "git rebase --continue")` คือไฟเขียว สั่งต่อได้:

```sh
git rebase --continue
```

Git จะเปิด Vim ให้ยืนยัน commit message ของ commit ใหม่ ข้อความ default คือ `black` เหมือนเดิม ไม่ต้องแก้อะไร กด `Esc` แล้วพิมพ์ `:wq` ตามด้วย `Enter` เพื่อยืนยัน

```text
[detached HEAD c6754d8] black
 1 file changed, 1 insertion(+)
Successfully rebased and updated refs/heads/main.
```

commit ตัวที่ 2 (`rainbow`) แปะผ่านฉลุยไม่ชนอะไรเลย เพราะมันแตะแค่ `rainbowcolors.txt` คนละไฟล์กับที่ชนกัน rebase เลยจบในการ resolve ครั้งเดียว

> ⚠️ **ห้าม `git commit` เอง** ระหว่าง rebase หลัง resolve conflict เสร็จ ให้ `git add` แล้ว `git rebase --continue` เท่านั้น Git จะ commit ให้เองเป็นส่วนหนึ่งของกระบวนการ — ต่างจาก three-way merge ที่เรา commit ปิดงานเอง ถ้าอยากถอยทั้งหมดกลับไปสภาพก่อนเริ่ม ใช้ `git rebase --abort` ได้ตลอดขณะที่ rebase ยังค้างอยู่

มาดูผลลัพธ์กัน:

```sh
git log --oneline --decorate --all
```

```text
73f66e9 (HEAD -> main) rainbow
c6754d8 black
f986d5a (origin/main, origin/HEAD) gray
...
```

history เป็นเส้นตรงแล้ว ไม่มีสองสายให้แยก ไม่มี merge commit สักตัว

ทีนี้เอา hash ที่จดไว้ตอน Step 4 มาเทียบ:

| commit | hash เดิม | hash หลัง rebase |
| --- | --- | --- |
| `black` | `95acb84` | `c6754d8` |
| `rainbow` | `00b3bbe` | `73f66e9` |

เปลี่ยนทั้งคู่ นี่คือหลักฐานตรง ๆ ว่า rebase **สร้าง commit ใหม่** ไม่ได้ย้ายของเดิมไปวางที่อื่น เนื้อหาการเปลี่ยนแปลงเหมือนกัน แต่ในสายตา Git มันคนละ commit กันคนละตัว

ส่วน commit เก่ายังอยู่ไหม? ยังอยู่ ลองดูได้:

```sh
git reflog
```

```text
73f66e9 HEAD@{0}: rebase (finish): returning to refs/heads/main
73f66e9 HEAD@{1}: rebase (pick): rainbow
c6754d8 HEAD@{2}: rebase (continue): black
f986d5a HEAD@{3}: rebase (start): checkout origin/main
00b3bbe HEAD@{4}: commit: rainbow
95acb84 HEAD@{5}: commit: black
...
```

hash เก่า `00b3bbe` กับ `95acb84` ยังอยู่ในบันทึกครบ แค่ไม่มี branch ไหนชี้ถึงแล้วเท่านั้น `git reflog` เป็นสมุดบันทึกว่า `HEAD` เคยไปยืนที่ไหนมาบ้าง มีประโยชน์มากเวลา rebase พลาดแล้วอยากย้อนกลับ (รายละเอียดการกู้คืนเก็บไว้เรียนกันวันหลัง แค่รู้ว่ามีตัวช่วยนี้อยู่ก็อุ่นใจขึ้นเยอะ)

---

## Step 8: Golden Rule of Rebasing — กฎข้อเดียวที่ห้ามพลาด

จาก Step ที่แล้วเราเห็นชัดแล้วว่า rebase เปลี่ยน hash ของ commit ซึ่งก็คือการเปลี่ยน commit history และตรงนี้แหละที่จะสร้างปัญหาได้จริงจังเวลาทำงานกับคนอื่น

> ⚠️ **Golden Rule of Rebasing: อย่า rebase branch ที่คนอื่นอาจเอาไปต่องานแล้ว** ถ้า branch นั้น push ขึ้น remote ไปแล้ว ให้ถือว่าเป็น public branch — คนอื่นอาจกำลังทำงานบนมันอยู่ในเครื่องตัวเอง หรืออาจ push งานเข้าไปแล้ว กรณีแบบนี้อย่า rebase

ลองดูว่าถ้าฝ่าฝืนแล้วเกิดอะไรขึ้น ย้อนไปที่ตัวอย่างโปรเจกต์หนังสือใน Step 1 แต่คราวนี้เราเผลอ push `chapter_five` (ที่มี commit `D`) ขึ้น remote ไปก่อน — ตอนนี้มันเป็น public branch แล้ว

1. เรา pull commit `C` ลงมาอัปเดต local `main` แล้ว rebase `chapter_five` ทับ ได้ `D'` มา แต่ยังไม่ push
2. ระหว่างนั้น coauthor เห็น `chapter_five` บน remote (ซึ่งยังเป็นเวอร์ชันเก่าที่มี `D`) เลย pull มาต่องาน เพิ่ม commit `E` กับ `F` แล้ว push กลับขึ้น remote
3. พอเราจะ push `chapter_five` ที่ rebase แล้ว ก็โดนปฏิเสธ:

```text
error: failed to push some refs to '...rainbow-remote.git'
hint: Updates were rejected because the tip of your current branch is
hint: behind its remote counterpart. Integrate the remote changes
hint: (e.g. 'git pull ...') before pushing again.
```

ปัญหาอยู่ตรงนี้: remote `chapter_five` มี commit ชุด `A, B, D, E, F` ส่วน local `chapter_five` ของเรามี `A, B, C, D'` — **สอง branch ไม่มี commit ชุดเดียวกันอีกต่อไป** งานของ coauthor ต่อยอดมาจาก `D` ตัวเก่า ซึ่งในสายของเราไม่มีอยู่แล้ว จะ merge กลับก็ยุ่ง จะทิ้งฝั่งไหนก็มีงานหาย ทางแก้คือต้องนั่งคุยกับ coauthor แล้วแกะกันทีละเปลาะ

สรุปเป็นเกณฑ์ตัดสินใจง่าย ๆ ว่าเมื่อไหร่ rebase ได้ปลอดภัย:

- branch นั้นเป็น local branch ที่ **ยังไม่เคย push** ขึ้น remote เลย — rebase ได้สบายใจ
- branch ที่ push แล้ว แต่ **มั่นใจว่าไม่มีใครเอาไปต่องาน** เช่น feature branch ส่วนตัวที่ push ไว้กัน notebook พัง — rebase ได้ แต่ต้องมั่นใจจริง ๆ
- ถ้ามีความเป็นไปได้ว่าคนอื่นแตะ branch นั้น — **อย่า rebase** ใช้ merge ไปเถอะ merge commit ตัวเดียวไม่ได้ทำให้ใครเดือดร้อน

เทียบกันตรง ๆ ระหว่างสองวิธี:

| ประเด็น | Three-way merge | Rebase |
| --- | --- | --- |
| หน้าตา history | แตกสองสายแล้วบรรจบ (nonlinear) | เส้นตรงสายเดียว (linear) |
| commit ที่เพิ่มมา | merge commit 1 ตัว | ไม่มี แต่ commit เดิมถูกสร้างใหม่หมด |
| hash ของ commit เดิม | ไม่เปลี่ยน | เปลี่ยนทุกตัวที่ถูก reapply |
| conflict โผล่มา | พร้อมกันทีเดียว | ทีละ commit อาจต้อง resolve หลายรอบ |
| ปิดงานหลัง resolve | `git add` แล้ว `git commit` | `git add` แล้ว `git rebase --continue` |
| ยกเลิกกลางทาง | `git merge --abort` | `git rebase --abort` |
| ใช้กับ public branch | ได้ | ห้าม |

---

## Step 9: sync ทั้งสาม repo ให้กลับมาตรงกัน

ปิดท้ายด้วยการส่งงานให้ครบวง ยังอยู่ที่ `friend-rainbow`:

```sh
git push
```

```text
To https://github.com/your-username/rainbow-remote.git
   f986d5a..73f66e9  main -> main
```

รอบนี้ push ผ่านสบาย ๆ ไม่โดน reject เหมือนตอนที่ 9 เพราะ local `main` ของเพื่อนต่อจากปลาย remote `main` พอดีเป๊ะแล้วหลัง rebase

สลับไปหน้าต่าง `rainbow` แล้วดึงงานลงมา:

```sh
git pull
```

```text
From https://github.com/your-username/rainbow-remote.git
   f986d5a..73f66e9  main       -> origin/main
Updating f986d5a..73f66e9
Fast-forward
 othercolors.txt   | 1 +
 rainbowcolors.txt | 1 +
 2 files changed, 2 insertions(+)
```

คำว่า **Fast-forward** ตรงนี้คือรางวัลของการ rebase — ฝั่งเราแค่เลื่อน pointer ตามไป ไม่มี merge commit ไม่มี Vim เด้งขึ้นมาให้เขียนอะไร ถ้าเพื่อนเลือก merge แทน rebase ตรงนี้เราจะได้ merge commit ติดมาด้วยหนึ่งตัว

ตรวจปิดท้าย:

```sh
git log --oneline --decorate --all
```

```text
73f66e9 (HEAD -> main, origin/main, origin/HEAD) rainbow
c6754d8 black
f986d5a gray
...
```

`main`, `origin/main` ชี้ commit เดียวกันหมด ทั้งสาม repo กลับมา sync กันครบ โดยที่ history ยังเป็นเส้นตรงสวย ๆ ไม่มีรอยแตกให้เห็นเลย

เปิด `othercolors.txt` ในฝั่ง `rainbow` ดูก็ได้ จะเห็นว่าบรรทัดที่เพื่อน resolve conflict ไว้ตามลงมาครบ:

```text
Brown is not a color in the rainbow.
Gray is not a color in the rainbow.
Black is not a color in the rainbow.
```

---

## แบบฝึกหัด

ทำแบบฝึกหัดนี้ใน `rainbow` โดยเริ่มจากสถานะปัจจุบัน (หลัง Step 9 — working tree สะอาด และ sync กับ remote แล้ว) เราจะใช้ branch ทดลองสองตัวแทนการแตะ `main` ตรง ๆ เพื่อไม่กระทบสถานะที่ตอนถัด ๆ ไปจะใช้ต่อ และที่สำคัญคือ branch ทดลองทั้งสองจะไม่ถูก push ขึ้น remote เลย จึง rebase ได้โดยไม่ผิด golden rule

1. ตรวจว่า working tree สะอาดด้วย `git status` แล้วสร้าง branch ทดลองสองตัวจาก `main` ปัจจุบัน:

   ```sh
   git switch -c practice-feature
   git switch main
   git switch -c practice-main
   ```

2. อยู่บน `practice-main` สร้างไฟล์ `practice.txt` ใส่บรรทัด `Practice line from practice-main.` แล้ว commit:

   ```sh
   git add practice.txt
   git commit -m "practice-main-1"
   ```

3. สลับไป `practice-feature` สร้างไฟล์ **ชื่อเดียวกัน** `practice.txt` แต่ใส่บรรทัด `Practice line from practice-feature.` แล้ว commit:

   ```sh
   git switch practice-feature
   git add practice.txt
   git commit -m "practice-feature-1"
   ```

   ตรวจด้วย `git log --oneline --decorate --all` ว่าสอง branch diverge กันแล้ว — ทั้งคู่มี commit เฉพาะตัวต่อจากจุดร่วมเดียวกัน จด hash ของ `practice-feature-1` ไว้ด้วย

4. ยังอยู่บน `practice-feature` สั่ง rebase ทับ `practice-main`:

   ```sh
   git rebase practice-main
   ```

   ต้องเจอ `CONFLICT (add/add): Merge conflict in practice.txt` เพราะสอง branch ต่างสร้างไฟล์ชื่อเดียวกันคนละเนื้อหา เปิดไฟล์ดู conflict markers แล้วตอบตัวเองให้ได้ว่าบรรทัดไหนอยู่ฝั่ง `HEAD` และทำไมถึงเป็นบรรทัดนั้น

5. ยังไม่ต้องแก้ ลองถอยกลับก่อนด้วย:

   ```sh
   git rebase --abort
   ```

   ตรวจด้วย `git log --oneline --decorate --all` และ `git status` ว่าทุกอย่างกลับไปเหมือนก่อนสั่ง rebase ทุกประการ hash ของ `practice-feature-1` ต้องเป็นตัวเดิมที่จดไว้

6. คราวนี้ทำจริง สั่ง `git rebase practice-main` อีกครั้ง แล้ว resolve conflict โดยเก็บทั้งสองบรรทัด (บรรทัดของ `practice-main` ขึ้นก่อน) ลบ conflict markers ให้หมดแล้วเซฟ จากนั้น:

   ```sh
   git add practice.txt
   git rebase --continue
   ```

   Vim จะเปิดให้ยืนยัน commit message — กด `Esc` พิมพ์ `:wq` แล้ว `Enter` ตรวจว่า hash ของ `practice-feature-1` เปลี่ยนไปจากที่จดไว้แล้ว

7. พิสูจน์ผลลัพธ์ของ rebase ด้วยการ merge:

   ```sh
   git switch practice-main
   git merge practice-feature
   ```

   ต้องได้ `Fast-forward` เท่านั้น ถ้าได้ merge commit แปลว่ามีอะไรผิดพลาดใน Step ก่อนหน้า

8. เก็บกวาดให้เรียบร้อย สลับกลับ `main` แล้วลบ branch ทดลองทั้งสอง:

   ```sh
   git switch main
   git branch -D practice-main practice-feature
   ```

   ตรวจด้วย `git branch --all` ว่าเหลือแค่ `main` กับ remote branch เหมือนก่อนเริ่มแบบฝึกหัด `git status` ยังบอกว่า working tree สะอาด และ `practice.txt` หายไปจากโฟลเดอร์แล้ว

ตรวจตัวเองให้ครบ:

- อธิบายได้ว่าทำไมบรรทัดฝั่ง `HEAD` ใน conflict ของข้อ 4 ถึงเป็นของ `practice-main` ทั้งที่เรายืนอยู่บน `practice-feature`
- ยืนยันได้ว่า `git rebase --abort` คืนสภาพเดิมได้ครบจริง โดยเทียบ hash ก่อนและหลัง
- บอกได้ว่าทำไม merge ในข้อ 7 ถึงเป็น fast-forward ทั้งที่ก่อน rebase สอง branch นี้ diverge กันอยู่
- อธิบายได้ว่าทำไมแบบฝึกหัดนี้ rebase ได้โดยไม่ผิด golden rule
- หลังลบ branch ทดลองแล้ว `rainbow` กลับมาอยู่ในสถานะเดียวกับก่อนเริ่มแบบฝึกหัดทุกอย่าง

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **rebase branch ที่ push ไปแล้วและมีคนเอาไปต่องาน** — ผิด golden rule ทำให้ history ของแต่ละคนไม่ตรงกันจนแก้ยาก → rebase เฉพาะ branch ที่ยังไม่ push หรือมั่นใจว่าไม่มีใครแตะ
- **ลืม fetch ก่อน rebase** — จะไป rebase ทับเวอร์ชันเก่าที่ค้างอยู่ในเครื่อง เสียเที่ยวเปล่า → `git fetch` ก่อนเสมอ แล้วค่อย `git rebase origin/<branch>`
- **เข้าใจว่า rebase "ย้าย" commit เดิมไปวางที่ใหม่** — จริง ๆ มันสร้าง commit ใหม่ (hash และ timestamp เปลี่ยน) ของเดิมยังอยู่แต่หลุดจาก branch → สำคัญมากตอนต้องกู้คืนด้วย `git reflog`
- **resolve conflict เสร็จแล้วเผลอ `git commit`** — ระหว่าง rebase ให้ `git add` แล้ว `git rebase --continue` เท่านั้น Git commit ให้เอง ต่างจาก three-way merge
- **อ่านฝั่ง `HEAD` ใน conflict ว่าเป็นงานของตัวเอง** — ระหว่าง rebase ฝั่ง `HEAD` คือ branch ที่เรา rebase ทับ ส่วนงานของเราอยู่ฝั่งล่างที่มีชื่อ commit กำกับ → ดูชื่อ commit ท้าย `>>>>>>>` เป็นหลัก
- **เจอ conflict แล้วคิดว่าจบแค่รอบเดียว** — rebase resolve ทีละ commit ถ้ามีหลาย commit ที่ชน จะต้อง resolve แล้ว `--continue` ซ้ำหลายรอบจนครบ
- **ค้าง rebase กลางทางแล้วสับสนว่าตัวเองอยู่ตรงไหน** — พิมพ์ `git status` ก่อนเสมอ มันบอกครบว่าทำอะไรไปแล้วและเหลืออะไร ถ้าอยากถอยใช้ `git rebase --abort`
- **เห็น `interactive rebase in progress` แล้วคิดว่าสั่งผิด** — Git รุ่นใหม่ขึ้นข้อความนี้แม้จะสั่ง `git rebase` เปล่า ๆ ไม่ได้แปลว่าเราเผลอใส่ `-i`
- **ใช้ `git restore <file>` แทน `git restore --staged <file>`** — สองคำสั่งนี้ต่างกันมาก ตัวที่ไม่มี `--staged` จะทิ้งการแก้ไขใน working directory ทิ้งไปเลย ส่วน `--staged` แค่ถอดออกจาก staging area โดยไม่แตะไฟล์

---

## สรุป

1. Git มีสองวิธีหลักในการรวมงานข้าม branch คือ merge (สร้าง merge commit, history แตกสาย) กับ rebase (ไม่มี merge commit, history เป็นเส้นตรง)
2. `git rebase <branch_name>` เอา commit ของ branch ที่เรายืนอยู่ ไป reapply ทับปลายของ `<branch_name>` — ต้องยืนอยู่บน branch ที่ต้องการ rebase ก่อน
3. เบื้องหลัง rebase มี 5 ขั้น: หา common ancestor → เก็บการเปลี่ยนแปลงไว้ที่พักชั่วคราว → reset `HEAD` ไปที่ฐานใหม่ → apply แล้ว commit ทีละอัน → สลับไป branch ที่ rebase แล้ว
4. rebase **สร้าง commit ใหม่** ไม่ได้ย้ายของเดิม — hash และ timestamp เปลี่ยนหมด ของเดิมยังอยู่ในฐานข้อมูลแต่ไม่มี branch ชี้ถึง ตามดูได้ด้วย `git reflog`
5. ต้อง `git fetch` ให้ได้งานล่าสุดของ branch ที่จะ rebase ทับลงมาก่อนเสมอ ไม่งั้นจะ rebase ทับของเก่า
6. `git restore --staged <file>` ถอดไฟล์ออกจาก staging area โดยไม่แตะการแก้ไขใน working directory ใช้แยกงานที่แก้ค้างไว้ออกเป็นหลาย commit ได้
7. เมื่อ rebase ชน conflict: แก้ไฟล์ → `git add <file>` → `git rebase --continue` (ห้าม commit เอง) ทำซ้ำจนครบทุก commit ที่ชน หรือถอยด้วย `git rebase --abort`
8. ระหว่าง rebase ฝั่ง `<<<<<<< HEAD` คือ branch ที่เรา rebase ทับ ส่วนงานของเราอยู่ฝั่ง `>>>>>>>` ที่มีชื่อ commit กำกับ — สลับด้านกับตอน merge ปกติ
9. Golden rule of rebasing: อย่า rebase branch ที่คนอื่นอาจเอาไปต่องาน โดยเฉพาะ public branch ที่ push ขึ้น remote ไปแล้ว
10. หลัง rebase แล้ว การรวมงานเข้า branch ปลายทางจะกลายเป็น fast-forward merge ธรรมดา ไม่มี merge commit เพิ่ม

จะเลือกทางไหนดี? ถ้าเป็น branch ส่วนตัวที่ยังไม่ได้ share ใคร rebase ให้ history สะอาดก่อนส่งงานเป็นนิสัยที่ดีมาก แต่ถ้าเริ่มไม่แน่ใจว่ามีใครแตะ branch นั้นหรือเปล่า merge ไปเลยดีกว่า

merge commit หนึ่งตัวแลกกับการไม่ต้องนั่งแกะ history กับเพื่อนทั้งบ่าย ถือว่าคุ้มมาก

> *ตอนถัดไปเราจะขึ้นไปทำงานบนหน้าเว็บของ hosting service กันบ้าง กับ pull request — เครื่องมือที่ทีมส่วนใหญ่ใช้รีวิวและรวมงานเข้าด้วยกันในโลกจริง*

---

## Glossary

- **Rebase** — การเอา commit ของ branch หนึ่งไป reapply ทับปลายของอีก branch โดยสร้าง commit ใหม่ทั้งชุด
- **Linear history** — commit history ที่เป็นเส้นตรงสายเดียว ไม่มี merge commit แตกสาย
- **Nonlinear history** — commit history ที่แตกเป็นสองสายแล้วบรรจบกันด้วย merge commit
- **`git rebase <branch_name>`** — reapply commit ของ branch ปัจจุบันทับปลายของ `<branch_name>`
- **Rebased commit (`'`)** — commit ที่ถูกสร้างใหม่ระหว่าง rebase เขียนด้วยเครื่องหมาย prime เช่น `D'` เพื่อบอกว่าเป็นคนละตัวกับ `D` เดิม
- **Rewriting history** — การทำให้ commit ที่มีอยู่เปลี่ยน hash หรือหายไปจาก branch ซึ่ง rebase ทำเป็นปกติ
- **Common ancestor** — commit ร่วมล่าสุดของสอง branch ที่เกี่ยวข้องใน rebase หรือ merge
- **Public branch** — branch ที่ push ขึ้น remote แล้ว จึงถือว่าคนอื่นอาจเข้าถึงหรือเอาไปต่องานได้
- **Golden rule of rebasing** — อย่า rebase branch ที่คนอื่นอาจเอาไปต่องาน
- **Unstage** — การถอดไฟล์ออกจาก staging area โดยไม่แตะการแก้ไขใน working directory
- **`git restore --staged <file>`** — คำสั่ง unstage ไฟล์ (Git ก่อน version 2.23 ใช้ `git reset HEAD <file>`)
- **`git rebase --continue`** — สั่งให้ rebase ทำงานต่อหลัง resolve conflict และ `git add` เรียบร้อยแล้ว
- **`git rebase --abort`** — ยกเลิก rebase ที่ค้างอยู่ คืนทุกอย่างกลับสู่สภาพก่อนเริ่ม
- **`git reflog`** — บันทึกว่า `HEAD` เคยชี้ commit ไหนมาบ้าง ใช้ตามหา commit เก่าที่หลุดจาก branch หลัง rebase

---

## Related

- [ตอนที่ 3: Making a Commit](/git/03-making-a-commit/) — staging area และ `git add` ที่บทนี้ต่อยอดด้วยการถอดไฟล์ออก
- [ตอนที่ 5: Merging](/git/05-merging/) — fast-forward merge ที่กลายเป็นผลพลอยได้หลัง rebase เสร็จ
- [ตอนที่ 7: Creating and Pushing to a Remote Repository](/git/07-creating-and-pushing-to-a-remote-repository/) — remote-tracking branch อย่าง `origin/main` ที่บทนี้ใช้เป็นเป้าของ rebase
- [ตอนที่ 9: Three-Way Merges](/git/09-three-way-merges/) — อีกวิธีรวมงานที่ rebase มาเป็นทางเลือกแทน และที่มาของ divergent history
- [ตอนที่ 10: Merge Conflicts](/git/10-merge-conflicts/) — วิธีอ่านและแก้ conflict markers ที่ rebase นำมาใช้ซ้ำ ต่างกันตรงที่ rebase แก้ทีละ commit แล้ว `git rebase --continue`
- [ตอนที่ 12: Pull Requests](/git/12-pull-requests/) — ตอนถัดไป เครื่องมือรวมงานผ่าน hosting service ที่ทีมส่วนใหญ่ใช้จริง
