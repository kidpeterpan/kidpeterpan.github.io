+++
title = 'ตอนที่ 4: Branches'
date = '2026-08-11T00:00:00+07:00'
draft = false
description = 'แยกสายการทำงานด้วย Git branch เข้าใจ HEAD และ branch pointer พร้อมสร้าง feature branch ที่ทำงานแยกจาก main ได้จริง'
tags = ['programming', 'git', 'tutorial']
+++

---

ตอนที่แล้วเราเก็บภาพ `red` และ `orange` ลงใน commit history ของ `rainbow` แล้ว ตอนนี้ `main` จึงมีประวัติการทำงานที่ย้อนดูได้เรียบร้อย

แต่ถ้าเราอยากลองเพิ่มฟีเจอร์ใหม่โดยไม่เสี่ยงทำให้ `main` มีงานที่ยังไม่เรียบร้อยล่ะ? เราก็แตกสายการทำงานออกมาก่อน นั่นคือการใช้ **branch**

นึกภาพว่า `main` เป็นถนนหลักของโปรเจกต์ ส่วน `feature` เป็นถนนเลียบที่แยกออกไปลองสร้างอะไรใหม่ ๆ เราขับรถไปทำงานบนถนนเลียบได้เต็มที่ โดยยังไม่ต้องเอารถก่อสร้างไปวางขวางถนนหลัก

สิ่งที่จะได้ตอนจบบทนี้:

- อธิบายได้ว่า branch คือสายการพัฒนาและ movable pointer ที่ชี้ไปยัง commit
- ใช้ `git branch` list และสร้าง local branch
- ใช้ `git switch` สลับ branch และตรวจสอบว่าอยู่ branch ไหน
- แยกความหมายของ `HEAD`, `refs/heads/` และ branch pointer ออกจากกัน
- แยกสถานะ tracked file ที่เป็น unmodified กับ modified ได้
- สร้าง commit บน `feature` โดยให้ `main` ค้างอยู่ที่ commit เดิม
- อ่าน parent link ของ commit และดูว่า history สองสายเริ่มแยกจากกันอย่างไร

{{< mermaid >}}
flowchart LR
  A["main ชี้ orange"] -->|"git branch feature"| B["main และ feature ชี้ orange"]
  B -->|"git switch feature"| C["HEAD -> feature"]
  C -->|"commit yellow"| D["feature ชี้ yellow<br/>main ยังชี้ orange"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 3 โดยสมมติว่าใน `rainbow` มี commit อย่างน้อยสองตัวแล้ว และ working tree กลับมา clean หลัง commit `orange`

เข้าไปใน repository ก่อน:

```sh
cd ~/rainbow
pwd
git status
git log --oneline --decorate
```

ผลลัพธ์ควรมีหน้าตาประมาณนี้:

```text
On branch main
nothing to commit, working tree clean

7acb333 (HEAD -> main) orange
abc1234 red
```

hash ในเครื่องของเราจะไม่เหมือนตัวอย่าง ไม่เป็นไร ขอให้เห็นว่า `HEAD -> main` อยู่ที่ commit ล่าสุด และ working tree clean ก็พอ

ถ้าตอนนี้ยังมีไฟล์ modified หรือ staged ค้างอยู่ ให้กลับไปตรวจ `git status` และจัดการให้เรียบร้อยก่อนสลับ branch เพราะ Git ไม่อยากเอางานที่ยังไม่ตัดสินใจไปทับด้วยไฟล์จากอีก branch

เครื่องหมาย `$` ที่เห็นในตัวอย่างเป็นเพียง command prompt ไม่ต้องพิมพ์ตามไปด้วย

---

## Step 1: Branch มีไว้ทำไม?

**Branch** คือสายการพัฒนาแยกสายหนึ่งของโปรเจกต์ แต่ละสายมีจุดที่เราทำงานและบันทึก commit ของตัวเองได้

### ทำไมต้องใช้ branch? (Why)

เหตุผลหลักมีสองอย่าง:

1. ลองทำงานหลายแนวทางในโปรเจกต์เดียวกัน โดยไม่ทำให้สายหลักปนกับงานทดลอง
2. ให้หลายคนทำงานพร้อมกัน แล้วค่อยรวมงานที่ตรวจแล้วกลับเข้ามาในสายหลัก

ใน workflow ที่เจอบ่อย เราจะมีสายหลักถาวรชื่อ `main` แล้วแตก **topic branch** หรือ **feature branch** อายุสั้นออกมาทำงานเฉพาะเรื่อง เช่น:

- `feature/add-yellow-color` สำหรับเพิ่มสีเหลือง
- `fix/incorrect-total` สำหรับแก้ยอดรวมผิด
- `docs/update-readme` สำหรับปรับเอกสาร

พองานใน branch ย่อยเสร็จและผ่านการ review แล้ว ค่อยรวมกลับเข้า `main` ด้วยการทำ **merge** หรือ **rebase** ซึ่งเราจะลงรายละเอียดในตอนถัด ๆ ไป

### ใช้อย่างไร? (How)

workflow พื้นฐานของบทนี้มีหน้าตาแบบนี้:

```text
อยู่บน main
   ↓ git branch feature
สร้าง feature แต่ยังอยู่บน main
   ↓ git switch feature
ย้ายไปทำงานบน feature
   ↓ git add และ git commit
feature เดินหน้า แต่ main อยู่ที่เดิม
```

จุดที่ต้องจำให้แม่นคือ `git branch <name>` สร้าง branch แต่ **ไม่ได้สลับเราไป branch นั้นให้อัตโนมัติ**

> Branch ไม่ใช่การก๊อปปี้ไฟล์ทั้งโปรเจกต์ แต่เป็นการสร้างป้ายชื่ออีกใบไว้ชี้ที่ commit หนึ่ง

---

## Step 2: Branch ใน Git เป็นแค่ pointer ที่เลื่อนได้

คำว่า branch ฟังดูเหมือนถนนอีกเส้นที่ต้องสร้างไฟล์โปรเจกต์ขึ้นมาใหม่ทั้งก้อน แต่เบื้องหลัง Git ทำอะไรเบากว่านั้นมาก

ในทางเทคนิค branch คือ **movable pointer** หรือ pointer ที่เลื่อนได้ ซึ่งชี้ไปยัง commit หนึ่ง ๆ

ลองดูข้อมูล branch ที่มีอยู่ตอนนี้:

```sh
git log --oneline --decorate
```

ตัวอย่าง output:

```text
7acb333 (HEAD -> main) orange
abc1234 red
```

ข้อความ `(HEAD -> main)` บอกว่า:

- `main` ชี้ไปที่ commit `orange`
- `HEAD` กำลังชี้ไปที่ branch `main`
- ตอนนี้เราจึงกำลังทำงานบน `main`

ถ้า branch เป็นป้ายชื่อที่วางอยู่บน commit เราก็ขยับป้ายชื่อนั้นไปข้างหน้าได้เมื่อทำ commit ใหม่ โดยไม่ต้องก๊อปปี้ไฟล์ทั้งหมด

### ลูกศรสองแบบที่ห้ามสับสน

เวลาอ่านไดอะแกรมของ Git ให้แยกลูกศรสองแบบนี้ออกจากกัน:

| สิ่งที่ชี้ | ความหมาย | ขยับได้ไหม? |
|---|---|---|
| Branch pointer | `main` หรือ `feature` ชี้ไปยัง commit ล่าสุดของสายตัวเอง | ขยับตาม commit ใหม่ |
| Parent link | commit ลูกชี้กลับไปยัง commit แม่ก่อนหน้า | ไม่ขยับ เพราะเป็นประวัติที่บันทึกไปแล้ว |

ในไดอะแกรมของบทนี้ ลูกศรเส้นประจากชื่อ branch ไปยัง commit คือ branch pointer ส่วนความสัมพันธ์จาก commit ใหม่ย้อนกลับไป commit เก่าคือ parent link

```text
feature  ───────► yellow commit
                    │
                    │ parent link
                    ▼
main     ───────► orange commit
                    │
                    │ parent link
                    ▼
                 red commit
```

`feature` และ `main` จึงชี้คนละ commit ได้ แต่ commit `yellow` ยังรู้ว่า `orange` เป็น parent ของตัวเองอยู่เสมอ

### ส่อง commit ที่ branch ชี้อยู่

ใช้คำสั่งนี้เพื่อถาม Git ตรง ๆ ว่า branch แต่ละตัวชี้ hash ไหน:

```sh
git rev-parse main
git rev-parse HEAD
```

ก่อนสร้าง `feature` ทั้งสองบรรทัดควรคืนค่า hash เดียวกัน เพราะตอนนี้ `HEAD` อยู่บน `main` และ `main` ชี้ commit ล่าสุดเดียวกัน

```text
7acb333f08e12020efb5c6b563b285040c9dba93
7acb333f08e12020efb5c6b563b285040c9dba93
```

hash ในตัวอย่างเป็นเพียงตัวอย่าง จุดสำคัญคือผลลัพธ์สองบรรทัดเท่ากัน

### `main` กับ `master` ต่างกันไหม?

ในทางเทคนิค `main` ไม่ได้มีพลังพิเศษอะไร มันเป็นเพียงชื่อ branch ที่ชุมชนใช้เป็นค่าเริ่มต้นกันมากขึ้น ส่วน `master` คือชื่อ default แบบเก่าที่เรายังเห็นในบทเรียนหรือ repository รุ่นก่อน

เราตั้งชื่อ branch แรกเป็นอะไรก็ได้ เช่น `git init -b main` ที่ใช้มาตั้งแต่ตอนที่ 2 เป็นการเลือกชื่อ `main` ให้ชัดเจนและสอดคล้องกับ convention ปัจจุบัน

---

## Step 3: สร้าง branch ใหม่ด้วย `git branch`

ตอนนี้เรายังอยู่บน `main` และมี commit `orange` เป็นจุดล่าสุด มาสร้าง branch สำหรับลองเพิ่มสี `yellow` กัน

เริ่มจาก list branch ที่มีอยู่:

```sh
git branch
```

ควรเห็น:

```text
* main
```

เครื่องหมาย `*` คือสัญลักษณ์ที่บอกว่าเรากำลังอยู่บน branch ไหน

สร้าง branch ชื่อ `feature`:

```sh
git branch feature
```

จากนั้น list อีกรอบ:

```sh
git branch
```

ผลลัพธ์ควรเป็น:

```text
  feature
* main
```

เราสร้าง `feature` สำเร็จแล้ว แต่ยังอยู่บน `main` เหมือนเดิม นี่เป็นจุดที่คนเพิ่งเริ่มใช้ Git พลาดกันบ่อยมาก

ตรวจด้วย `git log` จะเห็นว่า branch สองตัวชี้ commit เดียวกัน:

```sh
git log --oneline --decorate
```

```text
7acb333 (HEAD -> main, feature) orange
abc1234 red
```

ข้อความ `(HEAD -> main, feature)` หมายถึง `HEAD` อยู่บน `main` และทั้ง `main` กับ `feature` ต่างก็ชี้ไปที่ `orange`

### สรุปคำสั่งใน Step นี้

| คำสั่ง | ทำอะไร | หลังรันคำสั่งเราอยู่ที่ไหน? |
|---|---|---|
| `git branch` | list local branch | อยู่ที่เดิม |
| `git branch feature` | สร้าง branch ชื่อ `feature` | ยังอยู่ที่เดิม คือ `main` |
| `git branch <name>` | สร้าง branch ตามชื่อที่กำหนด | ยังไม่สลับ branch |

ชื่อ branch ห้ามมีช่องว่าง ถ้าเป็นโปรเจกต์จริงควรตั้งชื่อให้บอกเรื่องที่กำลังทำ ไม่ใช้ชื่อกว้าง ๆ จนเปิดมาอีกทีแล้วจำไม่ได้ว่า branch นี้มีไว้ทำอะไร

> สร้าง branch เป็นแค่การวางป้ายชื่อใหม่ ยังไม่ได้เดินไปยืนบนถนนเส้นใหม่

---

## Step 4: สลับ branch ด้วย `git switch`

เราสร้าง `feature` แล้ว ถึงเวลาย้ายไปทำงานบน branch นี้:

```sh
git switch feature
```

Git ควรตอบกลับว่า:

```text
Switched to branch 'feature'
```

ตรวจว่าเราย้ายสำเร็จหรือยัง:

```sh
git branch
git status
git log --oneline --decorate
```

ผลลัพธ์สำคัญจะเป็นแบบนี้:

```text
  main
* feature
```

```text
On branch feature
nothing to commit, working tree clean
```

```text
7acb333 (HEAD -> feature, main) orange
abc1234 red
```

ตอนนี้ `HEAD` เปลี่ยนจาก `main` มาชี้ `feature` แล้ว แต่ commit ที่เรากำลังดูยังเป็น `orange` เพราะ `main` และ `feature` ยังชี้ commit เดียวกันอยู่

### `HEAD` คืออะไร?

`HEAD` เป็น pointer ที่บอกว่า **ตอนนี้เราอยู่บน branch ไหน** ตัวพิมพ์ใหญ่เป็น convention ของ Git ไม่ใช่ acronym ที่ต้องแปลเป็นคำย่ออะไร

ถ้าอยากดูด้วยคำสั่ง:

```sh
git symbolic-ref --short HEAD
```

ควรได้:

```text
feature
```

หรือเปิดไฟล์ `.git/HEAD` ดูก็ได้:

```sh
cat .git/HEAD
```

ผลลัพธ์:

```text
ref: refs/heads/feature
```

อ่านได้ว่า `HEAD` อ้างอิงไปยังไฟล์ของ branch `feature` ในโฟลเดอร์ `refs/heads/`

อย่าสับสนสองคำนี้:

- `HEAD` — pointer พิเศษที่บอกว่าเราอยู่ branch ไหน
- `heads/` — โฟลเดอร์ที่เก็บข้อมูลของ local branch แต่ละตัว

### `git switch` ทำอะไรบ้าง?

การสลับ branch ไม่ได้มีแค่เปลี่ยนข้อความใน prompt แต่ Git จะทำงานหลัก ๆ สามอย่าง:

1. เปลี่ยน `HEAD` ให้ชี้ไปยัง branch ใหม่
2. เตรียม staging area ให้ตรงกับ snapshot ของ commit ที่ branch ใหม่ชี้อยู่
3. นำเนื้อหาจาก staging area มาแสดงใน working directory

ในตัวอย่างนี้สอง branch ชี้ commit เดียวกัน จึงเห็นความเปลี่ยนแปลงชัด ๆ แค่ข้อแรก ถ้าสอง branch ชี้คนละ commit ไฟล์ใน working directory ก็อาจเปลี่ยนตามไปด้วย

สำหรับ Git รุ่นเก่ากว่า 2.23 ที่ยังไม่มี `git switch` ใช้คำสั่งนี้แทนได้:

```sh
git checkout feature
```

`git checkout` ทำได้มากกว่าการสลับ branch ส่วน `git switch` ถูกออกแบบมาให้สื่อความหมายเรื่องสลับ branch โดยตรง จึงเหมาะกับการเรียนและลดโอกาสสั่งผิดงาน

---

## Step 5: ทำงานแยกบน `feature`

ตอนนี้เราอยู่บน `feature` แล้ว ลองเพิ่มสี `yellow` โดยไม่แตะ commit ล่าสุดของ `main`

เปิด `rainbowcolors.txt` ด้วย text editor แล้วเพิ่มบรรทัดนี้ต่อท้าย จากนั้น **เซฟไฟล์**:

```text
Yellow is the third color of the rainbow.
```

กลับมาที่ terminal แล้วตรวจสถานะ:

```sh
git status --short
```

ผลลัพธ์ควรเป็น:

```text
 M rainbowcolors.txt
```

ช่องว่างทางซ้ายกับ `M` ทางขวาหมายความว่าไฟล์ที่ Git ติดตามอยู่ถูกแก้ใน working directory แต่การแก้ยังไม่ได้เข้า staging area

ถ้าไม่เห็น `M` ให้เช็กสองเรื่อง:

1. เพิ่มบรรทัดตามตัวอย่างแล้วหรือยัง
2. กด save ใน text editor แล้วหรือยัง

Git จะเห็นการแก้ไขเมื่อไฟล์ถูกบันทึกลงดิสก์แล้ว ถ้าแก้ข้อความค้างอยู่ใน editor แต่ยังไม่เซฟ Git ก็ยังมองไฟล์เป็น unmodified

### ไฟล์ tracked มีสองสถานะที่ควรรู้

หลังไฟล์เคยอยู่ใน commit แล้ว Git จะติดตามไฟล์นั้นต่อไป ใน working directory เราจะเจอสถานะสำคัญสองแบบ:

| สถานะ | ความหมาย | แสดงใน `git status` ไหม? |
|---|---|---|
| Unmodified | ยังไม่แก้ตั้งแต่ commit ล่าสุด | ไม่แสดงเป็นรายการไฟล์ |
| Modified | แก้และเซฟแล้ว แต่ยังไม่ commit | แสดงเป็นรายการไฟล์ |

นี่เป็นเหตุผลที่ตอน repository clean เราเห็นแค่:

```text
nothing to commit, working tree clean
```

`git status` ไม่ได้พิมพ์รายชื่อไฟล์ทุกไฟล์ในโปรเจกต์ มันเน้นรายงานไฟล์ที่มีความเปลี่ยนแปลงหรือยังไม่ถูกติดตาม

### Stage และ commit บน `feature`

เริ่มจากดู diff ของ working directory ก่อน:

```sh
git diff
```

ถ้าเห็นเฉพาะบรรทัดที่ตั้งใจเพิ่ม ให้ stage แล้วตรวจ staging area:

```sh
git add rainbowcolors.txt
git status
```

ก่อน commit `git status` ควรมีข้อความประมาณนี้:

```text
Changes to be committed:
        modified:   rainbowcolors.txt
```

ถ้า status ถูกต้อง ค่อยสร้าง commit:

```sh
git commit -m "yellow"
```

output จะหน้าตาประมาณนี้:

```text
[feature fc8139c] yellow
 1 file changed, 1 insertion(+)
```

hash `fc8139c` เป็นตัวอย่างของเครื่องเราอาจได้ค่าอื่น แต่ชื่อ `[feature ...]` จะช่วยยืนยันว่า commit นี้เกิดบน `feature`

ตรวจ history หลัง commit:

```sh
git log --oneline --decorate
```

ควรเห็น:

```text
fc8139c (HEAD -> feature) yellow
7acb333 (main) orange
abc1234 red
```

สิ่งที่เกิดขึ้นคือ:

- `feature` เลื่อนไปชี้ commit `yellow`
- `HEAD` ยังชี้ `feature`
- `main` ยังชี้ commit `orange` ที่เดิม
- `yellow` มี parent link ย้อนกลับไป `orange`

นี่คือเหตุผลที่ branch มีประโยชน์ เราเพิ่มงานบน `feature` ได้โดยยังไม่ทำให้สายหลักเดินตามไปด้วย

> ตอน commit branch ที่ `HEAD` ชี้อยู่เท่านั้นจะเลื่อนไป commit ใหม่ `main` ไม่ได้เลื่อนตามเพียงเพราะเราทำงานใน repository เดียวกัน

---

## Step 6: ดูสองสายและเบื้องหลังของ pointer

หลังทำ commit `yellow` เราสามารถสลับไปดู `main` ได้ เพราะตอนนี้ working tree ควร clean แล้ว:

```sh
git switch main
git status
git log --oneline --decorate
```

ผลลัพธ์:

```text
Switched to branch 'main'
```

```text
On branch main
nothing to commit, working tree clean
```

```text
7acb333 (HEAD -> main) orange
abc1234 red
```

ถ้าเปิด `rainbowcolors.txt` ตอนอยู่บน `main` จะยังไม่เห็นบรรทัด `Yellow is the third color of the rainbow.` เพราะ `main` ยังชี้ snapshot ของ `orange` อยู่

สลับกลับไป `feature`:

```sh
git switch feature
git log --oneline --decorate
```

```text
fc8139c (HEAD -> feature) yellow
7acb333 (main) orange
abc1234 red
```

ตอนนี้เปิดไฟล์อีกครั้งจะเห็นบรรทัด `yellow` กลับมา นี่ไม่ใช่ Git ลบงานของเราแล้วเอาคืนให้เล่น ๆ แต่เป็นผลจากการที่แต่ละ branch ชี้ไปยัง snapshot คนละตัว

### ตรวจ pointer ด้วยคำสั่ง Git

ใช้คำสั่งเหล่านี้ดู commit ที่แต่ละ branch ชี้อยู่:

```sh
git rev-parse main
git rev-parse feature
git symbolic-ref --short HEAD
```

คาดหวังความสัมพันธ์ประมาณนี้:

```text
<hash ของ orange>
<hash ของ yellow>
feature
```

ผลลัพธ์บรรทัดแรกกับบรรทัดที่สองต่างกัน เพราะ branch สองตัวแยกกันแล้ว ส่วนบรรทัดสุดท้ายยืนยันว่า `HEAD` อยู่บน `feature`

### เปิดไฟล์ที่ Git ใช้เก็บ branch

ถ้าอยากเห็นภาพเบื้องหลังแบบตรง ๆ ให้ลองอ่านไฟล์เหล่านี้ โดย **อ่านได้ แต่อย่าแก้เอง**:

```sh
cat .git/HEAD
cat .git/refs/heads/main
cat .git/refs/heads/feature
```

ผลลัพธ์จะมีลักษณะดังนี้:

```text
ref: refs/heads/feature
7acb333f08e12020efb5c6b563b285040c9dba93
fc8139cbf8442cdbb5e469285abaac6de919ace6
```

ไฟล์ `main` และ `feature` แต่ละไฟล์เก็บ commit hash ล่าสุดของ branch นั้น ส่วน `.git/HEAD` เก็บ reference ว่าตอนนี้เรายืนอยู่บน branch ไหน

มองภาพง่าย ๆ ได้แบบนี้:

```text
.git/HEAD                  -> refs/heads/feature
.git/refs/heads/main       -> orange commit
.git/refs/heads/feature    -> yellow commit
```

### ตรวจ parent link ของ commit

ทุก commit ยกเว้น commit แรกสุดจะมี parent commit อย่างน้อยหนึ่งตัว เราดูข้อมูลของ commit ปัจจุบันได้ด้วย:

```sh
git cat-file -p HEAD
```

output จะมีหน้าตาประมาณนี้:

```text
tree 407fe6a858cd7f157405e013a088fdc1c61f0a40
parent 7acb333f08e12020efb5c6b563b285040c9dba93
author Your Name <you@example.com> 1780000000 +0700
committer Your Name <you@example.com> 1780000000 +0700

yellow
```

บรรทัด `parent` ยืนยันว่า `yellow` ย้อนกลับไปหา `orange` ได้ ส่วน branch pointer เป็นแค่ป้ายที่ชี้ไปยัง commit ล่าสุดและขยับได้ในอนาคต

คำสั่ง `git cat-file -p` มีไว้ช่วยเรียนรู้โครงสร้างภายในมากกว่างานประจำวันที่เราใช้ `git log` เป็นหลัก

---

## แบบฝึกหัด

ทำโจทย์ต่อไปนี้ใน `rainbow` โดยเริ่มจากสถานะที่มี `main` อยู่ที่ `orange` และ `feature` อยู่ที่ `yellow`:

1. รัน `git branch` และ `git status` แล้วตอบว่า `*` อยู่หน้า branch ไหน และ `HEAD` อยู่ที่ branch ไหน
2. รัน `git log --oneline --decorate` แล้วชี้ให้ได้ว่า commit ไหนมี `main` ชี้อยู่ และ commit ไหนมี `feature` ชี้อยู่
3. ใช้ `git switch main` เปิด `rainbowcolors.txt` แล้วตรวจว่าบรรทัด `Yellow is the third color of the rainbow.` ไม่อยู่ใน snapshot ของ `main` จากนั้นใช้ `git switch feature` แล้วตรวจว่าบรรทัดนั้นกลับมา
4. สร้าง branch ใหม่ชื่อ `practice` จาก `feature` ด้วย `git branch practice` แล้วตรวจด้วย `git branch` ว่า branch ถูกสร้างจริงแต่ยังไม่ได้สลับไป
5. สลับไป `practice` ด้วย `git switch practice` เพิ่มบรรทัด `Green is the fourth color of the rainbow.` แล้วเซฟไฟล์
6. รัน `git status --short` และอธิบายว่า ` M rainbowcolors.txt` ต่างจาก `?? rainbowcolors.txt` ที่เห็นในตอนที่ 2 และ 3 อย่างไร
7. ทำ `git add rainbowcolors.txt` และ `git commit -m "green"` จากนั้นใช้ `git log --oneline --decorate` ยืนยันว่า `practice` เลื่อนไป commit ใหม่ แต่ `feature` ยังอยู่ที่ `yellow`
8. รัน `git cat-file -p HEAD` และหา `parent` ให้เจอ จากนั้นอธิบายด้วยคำของตัวเองว่า parent link ต่างจาก branch pointer อย่างไร

ตรวจตัวเองให้ครบ:

- `main` ยังไม่เห็นสี `yellow` และ `green`
- `feature` เห็นสี `yellow` แต่ยังไม่มีสี `green`
- `practice` เห็นทั้ง `yellow` และ `green`
- commit `green` เกิดบน `practice` ไม่ใช่ `main`
- หลัง commit แล้ว `git status` บอกว่า working tree clean

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คิดว่า `git branch feature` จะย้ายไป `feature` ให้เลย** — คำสั่งนี้สร้าง branch อย่างเดียว ต้องใช้ `git switch feature` ต่อ
- **ลืมเช็ก branch ก่อน commit** — รัน `git branch` หรือ `git status` ก่อน commit เพื่อให้แน่ใจว่าอยู่สายที่ตั้งใจ
- **คิดว่า branch คือการก๊อปปี้ไฟล์ทั้งโปรเจกต์** — branch เป็น pointer ที่ชี้ไป commit หนึ่ง การสร้าง branch จึงเบากว่าการก๊อปปี้โฟลเดอร์ทั้งก้อน
- **สับสน `HEAD` กับ `heads/`** — `HEAD` บอกว่าเราอยู่ branch ไหน ส่วน `refs/heads/` เก็บ reference ของ local branch แต่ละตัว
- **แยก branch pointer กับ parent link ไม่ออก** — branch pointer ขยับตาม commit ใหม่ แต่ parent link ของ commit ที่สร้างแล้วไม่ขยับ
- **แก้ไฟล์แล้วไม่เซฟ** — Git จะยังมองไฟล์เป็น unmodified จนกว่าการแก้จะถูกบันทึกลงดิสก์
- **คิดว่า `git status` จะแสดงไฟล์ unmodified ทุกไฟล์** — คำสั่งนี้เน้นแสดงไฟล์ที่ modified, staged หรือ untracked
- **สลับ branch ทั้งที่มีงานค้างแล้วถูก Git ปฏิเสธ** — commit หรือ stash งานก่อน หากการสลับอาจทับการแก้ไขที่ยังไม่พร้อม
- **แก้ไฟล์ใน `.git` เอง** — เปิดอ่านเพื่อเรียนรู้ได้ แต่ใช้คำสั่ง Git จัดการ repository แทนการแก้ไฟล์ภายในโดยตรง
- **คิดว่า `main` พิเศษกว่า branch อื่นในเชิงกลไก** — `main` เป็นชื่อ convention ที่นิยมใช้ ชื่อ branch อื่นก็ทำงานด้วยกติกาเดียวกัน

---

## สรุป

1. Branch คือสายการพัฒนาแยกสายที่ช่วยให้เราทำงานหลายแนวทางหรือหลายคนพร้อมกันได้
2. ในทางเทคนิค branch คือ movable pointer ที่ชี้ไปยัง commit หนึ่ง ไม่ใช่สำเนาโปรเจกต์ทั้งก้อน
3. `git branch` ใช้ list branch เมื่อไม่ใส่ชื่อ และใช้สร้าง branch เมื่อใส่ชื่อใหม่
4. `git branch <name>` สร้าง branch แต่ไม่สลับเราไป branch นั้น
5. `git switch <name>` เปลี่ยน `HEAD` ให้ไปชี้ branch ที่เลือก และอาจเปลี่ยนไฟล์ใน working directory ตาม commit ใหม่
6. `HEAD` เป็น pointer ที่บอกว่าเรากำลังยืนอยู่บน branch ไหน ไม่ใช่ branch อีกตัวหนึ่ง
7. tracked file ที่ยังไม่ถูกแก้คือ unmodified ส่วนไฟล์ที่แก้และเซฟแล้วแต่ยังไม่ commit คือ modified
8. เมื่อ commit บน branch ที่ `HEAD` ชี้อยู่ branch นั้นจะเลื่อนไป commit ใหม่ ส่วน branch อื่นยังอยู่ที่เดิม
9. commit ใหม่มี parent link ย้อนกลับไป commit ก่อนหน้า แต่ parent link ไม่ได้เลื่อนตาม branch pointer
10. `git log --oneline --decorate`, `git branch` และ `git status` เป็นสามคำสั่งที่ช่วยเช็กว่าเรากำลังทำงานบนสายไหน

ตอนนี้ `rainbow` มีสองเส้นทางแล้ว: `main` หยุดอยู่ที่ `orange` ส่วน `feature` เดินหน้าต่อไปถึง `yellow` เราจึงลองของใหม่ได้โดยไม่ต้องเอางานที่ยังไม่ผ่านไปปนกับสายหลัก

นี่แหละพลังของ branch ป้ายเล็ก ๆ แต่ช่วยกันความวุ่นวายได้เยอะมากกกก

> *ตอนถัดไปเราจะพา `main` กับ `feature` ที่แยกกันแล้วกลับมารวมเป็นประวัติเดียวด้วย `git merge`*

---

## Glossary

- **Branch** — สายการพัฒนาแยกสายของโปรเจกต์
- **Movable pointer** — pointer ที่เลื่อนไปชี้ commit ใหม่ได้เมื่อมีการ commit
- **Feature branch / topic branch** — branch ย่อยสำหรับทำงานเฉพาะเรื่อง มักรวมกลับเข้าสายหลักเมื่อเสร็จ
- **`HEAD`** — pointer ที่บอกว่าเราอยู่บน branch ไหน
- **`refs/heads/`** — โฟลเดอร์ที่เก็บ reference ของ local branch แต่ละตัว
- **Branch pointer** — reference ที่ชี้ไปยัง commit ล่าสุดของ branch และขยับตาม commit ใหม่
- **Parent link** — ความสัมพันธ์ที่ commit ใหม่ชี้กลับไปยัง commit ก่อนหน้า
- **Unmodified file** — tracked file ที่ยังไม่ถูกแก้ตั้งแต่ commit ล่าสุด
- **Modified file** — tracked file ที่ถูกแก้และเซฟแล้ว แต่ยังไม่ commit
- **`git branch`** — คำสั่ง list หรือสร้าง local branch
- **`git switch`** — คำสั่งสลับไปทำงานบน branch ที่ระบุ
- **`git log --decorate`** — แสดงประวัติ commit พร้อมชื่อ branch และ `HEAD` ที่ชี้อยู่
- **Detached HEAD state** — ภาวะที่ `HEAD` ชี้ commit โดยไม่มี branch ชี้อยู่
- **`git cat-file -p`** — คำสั่งอ่านข้อมูลภายใน Git object เช่น parent ของ commit

---

## Related

- [ตอนที่ 1: Git and the Command Line](/git/01-git-and-the-command-line/) — เตรียม command line, ติดตั้ง Git และสร้างโฟลเดอร์ `rainbow`
- [ตอนที่ 2: Local Repositories](/git/02-local-repositories/) — เปลี่ยน `rainbow` ให้เป็น local repository และรู้จักพื้นที่ทำงานของ Git
- [ตอนที่ 3: Making a Commit](/git/03-making-a-commit/) — ใช้ `git add`, `git commit` และ `git log` สร้างประวัติที่บทนี้นำมาแตก branch
- [ตอนที่ 5: Merging](/git/05-merging/) — รวม `main` กับ `feature` หลังจากสองสายพัฒนาแยกกันแล้ว
