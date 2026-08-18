+++
title = 'ตอนที่ 10: Merge Conflicts'
date = '2026-08-18T00:00:00+07:00'
draft = false
description = 'สร้างสถานการณ์ที่สอง branch แก้บรรทัดเดียวกันในไฟล์เดียวกันจนเกิด merge conflict จริง แล้วฝึกอ่าน conflict markers, resolve ทีละไฟล์ตามขั้นตอน, และใช้ git merge --abort ถอยกลับเมื่อเปลี่ยนใจ'
tags = ['programming', 'git', 'tutorial']
+++

---

ตอนที่แล้วเราทำ three-way merge จนสำเร็จ แต่เป็น three-way merge แบบ "ราบรื่น" — เพราะ `brown` กับ `blue` แก้กันคนละไฟล์ Git เลยปะติดปะต่อให้เองได้หมดโดยไม่ต้องถามเราเลยสักคำ

แต่ถ้าสองฝั่งดันแก้ **บรรทัดเดียวกันในไฟล์เดียวกัน** ล่ะ? Git จะไม่กล้าเดาแทนเราอีกต่อไป มันจะหยุดกลางทางแล้วโยนปัญหากลับมาให้เราตัดสินใจเอง — สถานการณ์นี้เรียกว่า **merge conflict**

บทนี้จะจงใจสร้างสถานการณ์ชนกันแบบนั้นขึ้นมาให้เจอของจริง: `rainbow` กับ `friend-rainbow` จะแก้ `rainbowcolors.txt` บรรทัดเดียวกันโดยไม่รู้เรื่องกัน จนบังเอิญเติมสีสายรุ้งที่เหลือครบพอดี แล้วเราจะไล่อ่าน conflict markers ที่ Git แทรกเข้ามา ฝึก resolve ตามขั้นตอน และรู้จักทางถอยอย่าง `git merge --abort` ไว้ใช้เวลาที่ยังไม่พร้อม

สิ่งที่จะได้ตอนจบบทนี้:

- อธิบายได้ว่า merge conflict เกิดขึ้นเมื่อไหร่ — แก้ส่วนเดียวกันในไฟล์เดียวกันต่างกัน หรือ branch หนึ่งลบไฟล์ที่อีก branch แก้
- อ่าน conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) และแยกฝั่ง target/source ได้ถูกทุกครั้ง
- resolve conflict ตามขั้นตอนสองขั้น: decide + edit + ลบ markers + save แล้ว `git add` + `git commit`
- อ่าน `git status` ระหว่างมี conflict ได้ครบ ทั้ง `both modified` และ `All conflicts fixed but you are still merging`
- ใช้ `git merge --abort` ถอยกลับสภาพก่อน merge เมื่อเปลี่ยนใจกลางทาง
- อธิบายได้ว่าทำไมการอยู่ sync กับ remote บ่อย ๆ ถึงช่วยลดโอกาสเจอ conflict

{{< mermaid >}}
flowchart LR
  A["rainbow: commit indigo<br/>แล้ว push"] --> B["friend-rainbow: commit violet<br/>บรรทัดเดียวกัน ยังไม่ push"]
  B --> C["fetch แล้วเห็นว่า diverged"]
  C --> D["git merge origin/main<br/>เจอ CONFLICT"]
  D --> E["ลอง git merge --abort<br/>ถอยกลับดูก่อน"]
  E --> F["merge ใหม่ แล้ว resolve จริง<br/>ลบ markers + save"]
  F --> G["git add + git commit<br/>ปิด merge เป็น M2"]
  G --> H["push + rainbow pull<br/>กลับมา sync แบบ fast-forward"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 9 โดยสมมติว่า `rainbow`, `friend-rainbow` และ `rainbow-remote` sync กันครบแล้วที่ merge commit `5b8e04f` — ทั้งสามฝั่งมีแค่ branch `main` และ `main` ทุกฝั่งชี้ไปที่ commit เดียวกัน

เข้าไปตรวจสถานะฝั่งเราก่อน รันชุดคำสั่งนี้ใน `rainbow`:

```sh
cd ~/rainbow
git status
git log --oneline --decorate --all
```

ควรเห็นว่า `working tree` clean และ `main` กับ `origin/main` ชี้ commit เดียวกันคือ `5b8e04f` แล้วสลับไปอีกหน้าต่างที่เปิด `friend-rainbow` ไว้ ตรวจแบบเดียวกัน ควรเห็นผลลัพธ์เหมือนกันทุกอย่าง

เปิดสองหน้าต่าง terminal ค้างไว้ตลอดบทนี้เหมือนเดิม หน้าต่างหนึ่งอยู่ที่ `rainbow` อีกหน้าต่างอยู่ที่ `friend-rainbow` และถ้าเปิด `git.autofetch` ของ VS Code ค้างไว้ ให้ปิดชั่วคราวเหมือนตอนที่แล้ว เพราะมันอาจ fetch ให้เองจนสถานะไม่ตรงกับตัวอย่าง

`rainbowcolors.txt` ตอนนี้มีเนื้อหาสะสมจากบทก่อน ๆ ครบ 5 บรรทัด:

```text
Red is the first color of the rainbow.
Orange is the second color of the rainbow.
Yellow is the third color of the rainbow.
Green is the fourth color of the rainbow.
Blue is the fifth color of the rainbow.
```

สายรุ้งจริงมี 7 สี ยังขาดอีก 2 สี — และนั่นแหละคือจุดที่บทนี้จะใช้สร้างสถานการณ์ชนกัน

เครื่องหมาย `$` ในตัวอย่างเป็นเพียง command prompt ไม่ต้องพิมพ์ตามไปด้วย

---

## Step 1: rainbow เติมสี indigo แล้ว push ก่อน

เริ่มจากฝั่งเรา ใน `rainbow` เปิด `rainbowcolors.txt` เพิ่มบรรทัดที่ 6 ต่อท้ายแล้วเซฟ:

```text
Indigo is the sixth color of the rainbow.
```

add และ commit ตามปกติ:

```sh
git add rainbowcolors.txt
git commit -m "indigo"
git push
```

output จะมีหน้าตาประมาณนี้: hash ในเครื่องเราจะไม่เหมือนตัวอย่าง

```text
[main 9b0a614] indigo
 1 file changed, 1 insertion(+)

To https://github.com/your-username/rainbow-remote.git
   5b8e04f..9b0a614  main -> main
```

ตอนนี้ `rainbow` กับ `rainbow-remote` มี `indigo` แล้ว แต่ `friend-rainbow` ยังไม่รู้เรื่องอะไรเลย เพราะเรายังไม่ได้บอกเพื่อน และเพื่อนก็ยังไม่ได้ fetch

---

## Step 2: friend-rainbow เติมสี violet บรรทัดเดียวกัน โดยไม่รู้เรื่อง indigo

สลับไปหน้าต่าง `friend-rainbow` เพื่อนยังไม่ได้ fetch จึงไม่รู้ว่า `origin/main` ขยับไปแล้ว เปิด `rainbowcolors.txt` ของเพื่อนเอง (ยังมีแค่ 5 บรรทัดเดิม) แล้วเพิ่มบรรทัดที่ 6 — **บรรทัดเดียวกับที่เราเพิ่งแก้ในฝั่งเรา**:

```text
Violet is the seventh color of the rainbow.
```

add และ commit แต่ยังไม่ต้อง push:

```sh
git add rainbowcolors.txt
git commit -m "violet"
```

output จะมีหน้าตาประมาณนี้:

```text
[main 6ad5c15] violet
 1 file changed, 1 insertion(+)
```

สังเกตว่าตอนนี้ทั้งสองฝั่งต่างเพิ่มบรรทัดที่ 6 ของไฟล์เดียวกัน คนละเนื้อหา โดยไม่มีใครรู้เรื่องอีกฝั่งเลย — นี่คือกับดักที่เราตั้งใจวางไว้

> นำหน้า (ahead) ธรรมดายังพอ fast-forward ได้ แต่พอทั้งสองฝั่งแก้ **จุดเดียวกัน** พร้อมกันแบบนี้ ต่อให้ merge สำเร็จก็ยังไม่ได้แปลว่า Git จะรู้ว่าเวอร์ชันไหนถูก

---

## Step 3: fetch แล้วเห็นว่า history diverged จริง

ยังอยู่ใน `friend-rainbow` fetch ก่อนเสมอตามหลักที่เรียนในตอนที่ 8:

```sh
git fetch
```

output จะมีหน้าตาประมาณนี้:

```text
   5b8e04f..9b0a614  main       -> origin/main
```

ลอง `git status` ดูต่อ:

```sh
git status
```

รอบนี้ Git จะไม่บอกแค่ "ahead" หรือ "behind" เฉย ๆ แต่จะบอกตรง ๆ ว่า diverge แล้ว:

```text
On branch main
Your branch and 'origin/main' have diverged,
and have 1 and 1 different commits each, respectively.
  (use "git pull" to merge the remote branch into yours)
```

`1 and 1 different commits each` แปลว่า local `main` มี commit ที่ `origin/main` ไม่มี (`violet`) และ `origin/main` ก็มี commit ที่ local `main` ไม่มี (`indigo`) เหมือนกัน — เข้าเงื่อนไข divergent history ตามนิยามจากตอนที่ 5 ครบถ้วน merge รอบนี้จึงต้องเป็น three-way merge แน่นอน

> `git status` หลัง `git fetch` คือวิธีเช็คว่า local branch diverge จาก remote หรือยัง ถ้าเจอข้อความ "have diverged" ให้เตรียมใจว่าอาจต้องแก้ conflict ด้วย ไม่ใช่แค่ merge เฉย ๆ

---

## Step 4: merge แล้วเจอ conflict ครั้งแรก

### ทำไม Git ถึงหยุดกลางทาง? (Why)

ตอนที่แล้ว `git merge origin/main` ปะติดปะต่อ `brown` กับ `blue` ให้เองได้เพราะสองฝั่งแก้กันคนละไฟล์ Git มั่นใจได้ว่าเก็บทั้งคู่ไว้แล้วไม่มีอะไรขัดกัน

แต่รอบนี้ทั้งสองฝั่งแก้ **บรรทัดที่ 6 ของไฟล์เดียวกัน** คนละเนื้อหา Git ไม่มีทางรู้ว่าเวอร์ชันสุดท้ายควรเป็น `indigo` ก่อน, `violet` ก่อน, หรือเก็บทั้งคู่ มันจึงไม่เดา แต่เลือกหยุด merge ค้างไว้กลางทาง แล้วโยนให้เราตัดสินใจเอง — นี่คือ **merge conflict**

merge conflict ยังเกิดได้อีกแบบด้วย คือตอน branch หนึ่ง **ลบไฟล์** ที่อีก branch **แก้ไข** เพราะ Git ตัดสินใจแทนไม่ได้เหมือนกันว่าควรลบหรือควรเก็บเวอร์ชันที่แก้แล้ว บทนี้จะโฟกัสที่แบบแรกก่อน

### ใช้อย่างไร? (How)

สั่ง merge ตามปกติ:

```sh
git merge origin/main
```

รอบนี้ output จะไม่จบสวยเหมือนตอนที่แล้ว:

```text
Auto-merging rainbowcolors.txt
CONFLICT (content): Merge conflict in rainbowcolors.txt
Automatic merge failed; fix conflicts and then commit the result.
```

อย่าเพิ่งตกใจ ข้อความนี้ไม่ได้แปลว่างานหายหรือพัง แค่ Git เจอจุดที่ตัดสินใจแทนไม่ได้เท่านั้น การเจอ merge conflict เป็นเรื่องปกติมากในการทำงานจริง ไม่ได้แปลว่าใครทำอะไรผิด

ลอง `git status` ดูสถานะระหว่างมี conflict:

```sh
git status
```

output จะมีหน้าตาประมาณนี้:

```text
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
        both modified:   rainbowcolors.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

`both modified` ใต้ `Unmerged paths` คือวิธีที่ `git status` บอกว่าไฟล์นี้ชนกัน — ทั้งสอง branch แก้ไฟล์เดียวกัน

เปิด `rainbowcolors.txt` ดู Git จะแทรก **conflict markers** ลงไปตรงจุดที่ชนกัน:

```text
Red is the first color of the rainbow.
Orange is the second color of the rainbow.
Yellow is the third color of the rainbow.
Green is the fourth color of the rainbow.
Blue is the fifth color of the rainbow.
<<<<<<< HEAD
Violet is the seventh color of the rainbow.
=======
Indigo is the sixth color of the rainbow.
>>>>>>> origin/main
```

อ่าน markers ทีละส่วน:

| Marker | ความหมาย |
| --- | --- |
| `<<<<<<< HEAD` | เปิดฝั่ง **target branch** คือ branch ที่เรายืนอยู่ (`HEAD`) — ในที่นี้คือ `violet` |
| `=======` | เส้นคั่นกลาง แบ่งสองฝั่งออกจากกัน |
| `>>>>>>> origin/main` | ปิดฝั่ง **source branch** คือ branch ที่กำลัง merge เข้ามา — ในที่นี้คือ `origin/main` ที่มี `indigo` |

จำง่าย ๆ ว่าเนื้อหา**เหนือ** `=======` คือของเรา (`HEAD`) เนื้อหา**ใต้**คือของที่กำลังดึงเข้ามา

> ⚠️ merge ยังไม่จบตรงนี้ — ต่อให้ Git แทรก markers ให้แล้ว merge ก็ยัง **ค้างอยู่** จนกว่าเราจะแก้ไฟล์แล้ว commit ปิดมันเอง

---

## Step 5: ลองถอยด้วย git merge --abort ก่อนค่อย resolve จริง

ยังไม่ต้องรีบแก้ไฟล์ทันที ลองรู้จักทางถอยไว้ก่อน เผื่อวันไหนเจอ conflict แล้วยังไม่พร้อม หรือกดอะไรผิดจนงง

```sh
git merge --abort
```

คำสั่งนี้ยกเลิก merge ที่กำลังมี conflict ทั้งหมด แล้วคืนไฟล์กลับสู่สภาพก่อน merge ลอง `git status` ดูยืนยัน:

```sh
git status
```

```text
On branch main
Your branch and 'origin/main' have diverged,
and have 1 and 1 different commits each, respectively.

nothing to commit, working tree clean
```

`working tree` clean แล้ว และเปิด `rainbowcolors.txt` ดูก็จะเห็นแค่เวอร์ชัน `violet` ล้วน ๆ เหมือนก่อน merge ทุกอย่าง — เหมือนไม่มีอะไรเกิดขึ้นเลย history ยังคง diverge อยู่เหมือนเดิม เพราะ `git merge --abort` แค่ยกเลิก merge ที่ค้าง ไม่ได้แก้ปัญหา diverge ให้

> `git merge --abort` ปลอดภัยเสมอตราบใดที่ยังไม่ได้ `git commit` ปิด merge ใช้ได้ทุกครั้งที่เปลี่ยนใจกลางทางโดยไม่ต้องกลัวว่าจะทำอะไรพัง

คราวนี้พร้อมแล้ว สั่ง merge ใหม่อีกครั้งเพื่อกลับเข้าสถานการณ์ conflict แล้วไปแก้กันจริง ๆ ในขั้นถัดไป:

```sh
git merge origin/main
```

ควรเจอ `CONFLICT (content)` เหมือนเดิมทุกอย่าง

---

## Step 6: resolve conflict จริง — decide, edit, ลบ markers, save

resolve conflict มี 2 ขั้นตอนเสมอ: (1) เลือกว่าจะเก็บอะไร แก้เนื้อหา ลบ markers แล้ว save ไฟล์ (2) `git add` แล้ว `git commit` ปิด merge บทนี้ทำขั้นแรกก่อน

เปิด `rainbowcolors.txt` แล้วตัดสินใจ: ในเคสนี้เราอยากเก็บทั้งสองสี แค่จัดลำดับให้ถูกตามสายรุ้งจริง — `indigo` เป็นสีที่ 6 ควรอยู่ก่อน `violet` สีที่ 7

แก้ไฟล์จาก:

```text
<<<<<<< HEAD
Violet is the seventh color of the rainbow.
=======
Indigo is the sixth color of the rainbow.
>>>>>>> origin/main
```

เป็น:

```text
Indigo is the sixth color of the rainbow.
Violet is the seventh color of the rainbow.
```

ลบ markers ทั้งสามบรรทัดออกให้หมด (`<<<<<<<`, `=======`, `>>>>>>>`) เหลือแค่เนื้อหาจริงที่เราเลือกแล้ว save ไฟล์

> ⚠️ ลืมลบ conflict markers คือ pitfall อันดับหนึ่งของการ resolve conflict ถ้า commit ไปทั้งที่ยังมี `<<<<<<<`/`=======`/`>>>>>>>` หลงเหลืออยู่ ข้อความพวกนี้จะกลายเป็นเนื้อหาจริงในไฟล์ ทำให้โค้ดพังหรือ config เสียได้ ตรวจให้ชัวร์ก่อน save ทุกครั้ง

ตรวจไฟล์ทั้งหมดอีกรอบ ตอนนี้ `rainbowcolors.txt` ควรมีครบ 7 บรรทัด — สายรุ้งครบทุกสีพอดี:

```text
Red is the first color of the rainbow.
Orange is the second color of the rainbow.
Yellow is the third color of the rainbow.
Green is the fourth color of the rainbow.
Blue is the fifth color of the rainbow.
Indigo is the sixth color of the rainbow.
Violet is the seventh color of the rainbow.
```

---

## Step 7: git add + git commit ปิด merge

ขั้นที่สองของ resolve คือ `git add` ไฟล์ที่แก้เข้า staging area:

```sh
git add rainbowcolors.txt
git status
```

ควรเห็นว่าสถานะเปลี่ยนไปแล้ว:

```text
On branch main
All conflicts fixed but you are still merging.
  (use "git commit" to conclude merge)

Changes to be committed:
        modified:   rainbowcolors.txt
```

`All conflicts fixed but you are still merging` คือ Git ย้ำชัด ๆ ว่า conflict แก้ครบแล้ว แต่ merge ยัง**ไม่จบ**จนกว่าจะ commit ถ้าโปรเจกต์จริงมีไฟล์ชนหลายไฟล์ ต้อง resolve และ `git add` ให้ครบทุกไฟล์ก่อน ไม่งั้น merge จะยังค้างอยู่แบบนี้

commit ปิด merge:

```sh
git commit
```

เพราะไม่ได้ใส่ `-m` Git จะเปิด Vim ให้แบบที่เรียนในตอนที่แล้ว คราวนี้ default message จะมีรายละเอียดเพิ่มมาด้วย:

```text
Merge remote-tracking branch 'origin/main'

# Conflicts:
#	rainbowcolors.txt
#
# It looks like you may be committing a merge.
# If this is not correct, please remove the file
#	.git/MERGE_HEAD
# and try again.
```

บรรทัดที่ขึ้นต้นด้วย `#` เป็นแค่ comment ที่ Git แสดงไว้เตือน ไม่ได้ถูกบันทึกเป็นส่วนหนึ่งของ commit message เรา accept ข้อความ default นี้ได้เลย แล้วบันทึกด้วยลำดับเดิม: กด `Esc` ตามด้วย `:wq` แล้ว `Enter`

output หลัง commit จะมีหน้าตาประมาณนี้: hash ในเครื่องเราจะไม่เหมือนตัวอย่าง

```text
[main f10f972] Merge remote-tracking branch 'origin/main'
```

ตรวจ parent สองตัวด้วย `git log -1` แบบที่เรียนในตอนที่แล้ว:

```sh
git log -1
```

```text
commit f10f972...
Merge: 6ad5c15 9b0a614
Author: ...
Date:   ...

    Merge remote-tracking branch 'origin/main'
```

`Merge: 6ad5c15 9b0a614` ยืนยันว่า merge commit นี้มี parent สองตัวเหมือนเดิม: `6ad5c15` คือ `violet` (ปลายทางของ `main` ก่อน merge) และ `9b0a614` คือ `indigo` (ปลายทางของ `origin/main` ที่เอาเข้ามา) — สังเกตว่า workflow ตรวจ parent เหมือนกับ three-way merge แบบไม่มี conflict ทุกอย่าง ต่างกันแค่ขั้นตอนก่อนหน้านั้นที่เราต้องแก้ไฟล์เอง

---

## Step 8: push + ให้ rainbow pull กลับมา sync ครบ

ยังอยู่ใน `friend-rainbow` push merge commit ขึ้น remote ตามปกติ:

```sh
git push
```

output จะมีหน้าตาประมาณนี้:

```text
To https://github.com/your-username/rainbow-remote.git
   9b0a614..f10f972  main -> main
```

สลับกลับไปหน้าต่าง `rainbow` ของเรา ตอนนี้ `main` ของเรายังอยู่ที่ `indigo` (`9b0a614`) เพราะเรายังไม่ได้คุยกับ remote อีกเลยตั้งแต่ Step 1

```sh
cd ~/rainbow
git pull
```

ทำไมถึงมั่นใจว่ารอบนี้จะไม่เจอ conflict? เพราะ commit ล่าสุดของเรา (`indigo`) เป็น parent ตัวหนึ่งของ merge commit ที่กำลังจะดึงมาพอดี history ของเราจึงไม่ได้ diverge จากปลายทางใหม่เลย การอัปเดตครั้งนี้เป็น fast-forward ธรรมดา:

```text
   9b0a614..f10f972  main       -> origin/main
Updating 9b0a614..f10f972
Fast-forward
 rainbowcolors.txt | 1 +
 1 file changed, 1 insertion(+)
```

diff เหลือแค่บรรทัด `Violet...` เพราะ `Indigo...` เรามีอยู่แล้วตั้งแต่ commit ของตัวเอง

ตรวจสถานะสุดท้ายด้วย:

```sh
git status
git log --oneline --decorate --all --graph
```

```text
*   f10f972 (HEAD -> main, origin/main) Merge remote-tracking branch 'origin/main'
|\
| * 9b0a614 indigo
* | 6ad5c15 violet
|/
*   5b8e04f Merge remote-tracking branch 'origin/main'
|\
| * a4f21e8 brown
* | d93c710 blue
|/
* 6987cd2 green
* fc8139c yellow
* 7acb333 orange
* abc1234 red
```

เห็นรูปข้าวหลามตัดอีกครั้ง เหมือนตอนที่แล้วทุกอย่าง — สิ่งที่ต่างไปคือครั้งนี้กว่าจะมาบรรจบกันได้ เราต้องหยุดแก้ conflict เองก่อนหนึ่งขั้น `rainbow`, `friend-rainbow` และ `rainbow-remote` sync กันครบอีกครั้ง และสายรุ้งใน `rainbowcolors.txt` ก็ครบ 7 สีพอดี

---

## Step 9: อยู่ sync กับ remote บ่อย ๆ ช่วยลด conflict ได้ยังไง

conflict ในบทนี้มีแค่ไฟล์เดียว บรรทัดเดียว แต่โปรเจกต์จริงอาจชนกันหลายไฟล์พร้อมกันจนแก้ยากกว่านี้มาก หลักปฏิบัติที่ช่วยลดโอกาสเจอ conflict มีสามข้อ:

- เวลาจะสร้าง branch ใหม่ ให้ base จาก**เวอร์ชันล่าสุด**ของ remote branch ที่เกี่ยวข้องเสมอ (มักเป็น `main` หรือ branch หลักของทีม)
- ถ้าทำงานคนเดียวบน branch เดิมต่อเนื่องหลายวัน ให้ update branch ด้วยการ merge การเปลี่ยนแปลงจาก remote branch ที่เกี่ยวข้องอยู่เรื่อย ๆ ไม่ปล่อยค้างนาน
- ถ้าทำงาน**บน branch เดียวกันกับคนอื่น** ต้อง fetch + merge ทุกการเปลี่ยนแปลงจาก remote ก่อนทำงานต่อเสมอ

สาเหตุที่ `rainbow` กับ `friend-rainbow` มาชนกันในบทนี้ก็ตรงตามข้อสุดท้ายเป๊ะ — เพื่อน commit `violet` แล้วก็ยังไม่ได้ fetch เลยไม่รู้ว่า `indigo` มาก่อนแล้ว ถ้าเพื่อน fetch ก่อนเริ่มแก้ไฟล์ ก็จะเห็น `indigo` แล้วเลือกเขียนบรรทัดที่ 7 แทนบรรทัดที่ 6 ไปเลยตั้งแต่ต้น ไม่ต้องมาแก้ conflict ทีหลัง

> อยู่ sync กับ remote บ่อย ๆ ไม่ได้การันตีว่าจะไม่เจอ conflict เลย (บางทีสองคนก็ดันแก้จุดเดียวกันจริง ๆ) แต่ช่วยลดทั้งจำนวนครั้งและความซับซ้อนของ conflict ที่ต้องมาแก้ทีหลังได้มาก

---

## แบบฝึกหัด

ทำแบบฝึกหัดนี้ใน `rainbow` โดยเริ่มจากสถานะปัจจุบัน (`main` อยู่ที่ merge commit หลัง Step 8) ใช้ branch ทดลองสามตัวแทนการแตะ `main` ตรง ๆ เพื่อไม่กระทบสถานะที่ตอนถัด ๆ ไปจะใช้ต่อ:

1. ตรวจว่า `working tree` clean ด้วย `git status` แล้วสร้าง branch ฐานชื่อ `practice-base` จาก `main` ปัจจุบัน สร้างไฟล์ `practice-note.txt` ใส่บรรทัด `This line will conflict soon.` แล้ว commit:

   ```sh
   git switch -c practice-base
   git add practice-note.txt
   git commit -m "practice-base"
   ```

2. สร้าง branch ทดลองสองตัวจาก `practice-base`:

   ```sh
   git switch -c practice-conflict-a
   git switch practice-base
   git switch -c practice-conflict-b
   ```

   ตรวจด้วย `git log --oneline --decorate --all` ว่าทั้งสอง branch ชี้ commit เดียวกันกับ `practice-base`

3. อยู่บน `practice-conflict-b` แก้บรรทัดเดียวของ `practice-note.txt` เป็น `Version B changed this line.` แล้ว commit:

   ```sh
   git add practice-note.txt
   git commit -m "practice-b"
   ```

4. สลับไป `practice-conflict-a` แก้**บรรทัดเดียวกัน**ของ `practice-note.txt` เป็น `Version A changed this line.` แล้ว commit:

   ```sh
   git switch practice-conflict-a
   git add practice-note.txt
   git commit -m "practice-a"
   ```

   ตรวจด้วย `git log --oneline --decorate --all` ว่าตอนนี้ `practice-conflict-a` กับ `practice-conflict-b` diverge กันแล้วจากจุดร่วมเดียวกันคือ `practice-base`

5. ยังอยู่บน `practice-conflict-a` สั่ง merge `practice-conflict-b` เข้ามา ต้องเจอ conflict แน่นอนเพราะทั้งคู่แก้บรรทัดเดียวกัน:

   ```sh
   git merge practice-conflict-b
   ```

   ตรวจด้วย `git status` ว่าเห็น `both modified: practice-note.txt` จริง

6. ทดลองถอยก่อนด้วย `git merge --abort` แล้วตรวจว่าไฟล์กลับไปเป็นเวอร์ชัน `practice-a` ล้วน ๆ และ `working tree` clean จากนั้น merge `practice-conflict-b` เข้ามาใหม่อีกครั้งเพื่อกลับเข้าสถานการณ์ conflict

7. เปิด `practice-note.txt` resolve เอง — จะเก็บบรรทัดไหน รวมทั้งสองบรรทัด หรือเขียนใหม่เองก็ได้ ขอแค่ลบ conflict markers ให้หมดแล้ว save จากนั้น `git add` และ `git commit` ปิด merge (จะพิมพ์ message เองด้วย `-m` หรือปล่อยให้ Git เปิด Vim ให้ก็ได้)

8. ตรวจ parent สองตัวของ merge commit ที่เพิ่งได้ด้วย `git log -1` ต้องเห็น parent ตรงกับ commit `practice-a` และ `practice-b` ก่อนหน้า

9. เก็บกวาดให้เรียบร้อย: สลับกลับ `main` แล้วลบ branch ทดลองทั้งสาม เนื่องจากยังมี commit ที่ไม่ได้ merge เข้า `main` เลย ต้องใช้ `-D` (ตัวใหญ่) บังคับลบ:

   ```sh
   git switch main
   git branch -D practice-base practice-conflict-a practice-conflict-b
   ```

   ตรวจด้วย `git branch --all` ว่าเหลือแค่ `main` เหมือนก่อนเริ่มแบบฝึกหัด และ `git status` ยังบอกว่า `working tree` clean

ตรวจตัวเองให้ครบ:

- อธิบายได้ว่าทำไม `practice-conflict-a` กับ `practice-conflict-b` ต้องเจอ conflict เมื่อ merge กัน ไม่ใช่แค่ diverge เฉย ๆ
- แยกฝั่ง target (`HEAD`) กับ source ในไฟล์ที่ conflict ได้ถูกจากตำแหน่งเหนือ/ใต้ `=======`
- ใช้ `git merge --abort` แล้วยืนยันได้ว่าไฟล์กลับสู่สภาพก่อน merge จริง
- resolve conflict ครบสองขั้นตอน: ลบ markers + save แล้ว `git add` + `git commit`
- หา parent ทั้งสองของ merge commit ได้ด้วย `git log -1`
- หลังลบ branch ทดลองแล้ว `main` ของ `rainbow` กลับมาอยู่ในสถานะเดียวกับก่อนเริ่มแบบฝึกหัดทุกอย่าง

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **ลืมลบ conflict markers ก่อน commit** — เก็บเนื้อหาถูกแล้วแต่ลืมลบ `<<<<<<<`/`=======`/`>>>>>>>` ออก markers จะติดไปกับ commit จริง ทำให้ไฟล์เสียหรือ config พัง เป็น pitfall อันดับหนึ่งของการ resolve conflict
- **`git add` ไม่ครบทุกไฟล์ที่ conflict** — โปรเจกต์จริงมักชนกันหลายไฟล์พร้อมกัน ต้อง resolve และ `git add` ให้ครบทุกไฟล์ก่อน commit ไม่งั้น merge จะยังไม่จบ
- **commit แล้ว push โดยไม่ fetch/pull ก่อน** — พฤติกรรมแบบเพื่อนใน Step 2 (commit `violet` โดยไม่ fetch ดู `indigo` ก่อน) คือสาเหตุหลักที่ทำให้เกิด conflict การอยู่ sync กับ remote บ่อย ๆ ช่วยลดปัญหานี้ได้มาก
- **สลับฝั่ง target กับ source** — จำให้แม่นว่าเนื้อหาเหนือ `=======` คือ `HEAD` (branch ที่เรายืนอยู่) เนื้อหาใต้คือ branch ที่กำลังดึงเข้ามา สลับกันจะเก็บผิดฝั่งได้ง่ายมาก
- **คิดว่า `git status` ที่บอก "All conflicts fixed" แปลว่า merge จบแล้ว** — ข้อความนี้บอกแค่ว่าไฟล์ resolve ครบแล้ว merge ยังค้างอยู่จนกว่าจะสั่ง `git commit` ปิดมันเอง
- **กลัวจนไม่กล้าแตะอะไรเลยเมื่อเจอ conflict ครั้งแรก** — เจอ merge conflict เป็นเรื่องปกติมาก ไม่ได้แปลว่าทำอะไรผิด และ `git merge --abort` พร้อมถอยกลับให้เสมอตราบใดที่ยังไม่ได้ commit

---

## สรุป

1. Merge conflict เกิดเมื่อ Git merge สองสาย history ให้อัตโนมัติไม่ได้ — สาเหตุหลักคือแก้ส่วนเดียวกันในไฟล์เดียวกันต่างกัน หรือ branch หนึ่งลบไฟล์ที่อีก branch แก้
2. Git แทรก conflict markers ลงในไฟล์ที่ชน: `<<<<<<<` เปิดฝั่ง target (`HEAD`), `=======` คั่นกลาง, `>>>>>>>` ปิดฝั่ง source (branch ที่ merge เข้ามา)
3. Resolve conflict มีสองขั้นตอนเสมอ: (1) decide + edit + ลบ markers + save (2) `git add` ไฟล์ที่แก้ทุกไฟล์ + `git commit` ปิด merge
4. `git status` ระหว่างมี conflict จะบอก `both modified` ใต้ `Unmerged paths` และหลัง `git add` ครบจะเปลี่ยนเป็น `All conflicts fixed but you are still merging`
5. Merge ยังไม่จบจนกว่าจะ `git commit` — ต่อให้ resolve ไฟล์ครบแล้วก็ตาม
6. `git merge --abort` ยกเลิก merge ที่มี conflict คืนไฟล์ทั้งหมดกลับสู่สภาพก่อน merge ใช้ได้ตราบใดที่ยังไม่ได้ commit
7. Merge commit ที่เกิดจากการ resolve conflict ก็ยังมี parent สองตัวเหมือน three-way merge ปกติ ตรวจได้ด้วย `git log -1` เหมือนเดิม
8. การอยู่ sync กับ remote branch ที่เกี่ยวข้องบ่อย ๆ — base branch ใหม่จากเวอร์ชันล่าสุดเสมอ, update branch เป็นระยะ, fetch ก่อนทำงานต่อเมื่อใช้ branch ร่วมกับคนอื่น — ช่วยลดทั้งจำนวนและความซับซ้อนของ conflict ที่ต้องมาแก้ทีหลัง

`rainbow`, `friend-rainbow` และ `rainbow-remote` กลับมา sync กันครบอีกครั้ง และบังเอิญว่าสายรุ้งใน `rainbowcolors.txt` ก็ครบ 7 สีพอดี — จาก conflict ที่ดูน่ากลัวตอนแรก จบลงด้วยไฟล์ที่สมบูรณ์กว่าเดิม

merge conflict ไม่ใช่สัญญาณว่ามีอะไรผิดพลาด มันคือ Git ที่ซื่อสัตย์พอจะบอกว่า "ตรงนี้ตัดสินใจแทนไม่ได้ ต้องให้คนเลือกเอง" รู้ workflow สองขั้นและมี `git merge --abort` เป็นทางถอย ก็ไม่มีอะไรต้องกลัวอีกต่อไป

> *ตอนถัดไปเราจะเรียนอีกวิธีในการ integrate การเปลี่ยนแปลง นั่นคือ rebase ซึ่งก็เจอ merge conflict ได้เหมือนกัน แต่ให้ผลลัพธ์ที่ history เรียบกว่าเดิมโดยไม่มี merge commit*

---

## Glossary

- **Merge conflict** — สถานการณ์ที่ Git merge สองสาย history ให้อัตโนมัติไม่ได้ เกิดจากแก้ส่วนเดียวกันในไฟล์เดียวกันต่างกัน หรือ branch หนึ่งลบไฟล์ที่อีก branch แก้
- **Conflict markers** — เครื่องหมายที่ Git แทรกลงในไฟล์ที่ชน: `<<<<<<<`, `=======`, `>>>>>>>` (อย่างละ 7 ตัว)
- **Target branch** — branch ที่เรากำลังยืนอยู่ (`HEAD`) เนื้อหาปรากฏเหนือ `=======` ในไฟล์ที่ conflict
- **Source branch** — branch ที่กำลัง merge เข้ามา เนื้อหาปรากฏใต้ `=======` ในไฟล์ที่ conflict
- **`git merge --abort`** — คำสั่งยกเลิก merge ที่กำลังมี conflict คืนไฟล์ทั้งหมดกลับสู่สภาพก่อน merge
- **Unmerged paths** — หมวดใน `git status` ที่ลิสต์ไฟล์ซึ่งยัง conflict อยู่ แสดงเป็น `both modified`
- **`All conflicts fixed but you are still merging`** — ข้อความจาก `git status` ที่บอกว่า resolve ไฟล์ครบแล้ว แต่ merge ยังไม่จบจนกว่าจะ `git commit`

---

## Related

- [ตอนที่ 5: Merging](/git/05-merging/) — พื้นฐาน `git merge` และ fast-forward merge ที่เป็นรากของบทนี้
- [ตอนที่ 8: Cloning and Fetching](/git/08-cloning-and-fetching/) — หลักการ fetch ก่อนเสมอที่บทนี้ใช้เช็คว่า diverge หรือยัง
- [ตอนที่ 9: Three-Way Merges](/git/09-three-way-merges/) — three-way merge แบบไม่มี conflict บทนี้คือเวอร์ชัน "มี conflict" ของ workflow เดียวกัน
- [ตอนที่ 11: Rebasing](/git/11-rebasing/) — อีกทางเลือกในการ integrate การเปลี่ยนแปลงโดยไม่ต้องสร้าง merge commit ซึ่งก็เจอ conflict ได้เหมือนกัน
