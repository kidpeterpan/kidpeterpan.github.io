+++
title = 'ตอนที่ 5: Merging'
date = '2026-08-12T00:00:00+07:00'
draft = false
description = 'รวมงานจาก feature เข้า main ด้วย git merge พร้อมทำความเข้าใจ source branch, target branch, fast-forward merge และ detached HEAD แบบลงมือทำจริง'
tags = ['programming', 'git', 'tutorial', 'verified']
+++

---

ตอนที่แล้วเราแยก `rainbow` ออกเป็นสองสายแล้ว: `main` ยังอยู่ที่ commit `orange` ส่วน `feature` เดินหน้าต่อไปถึง `yellow`

ตอนนี้งานบน `feature` พร้อมจะกลับมารวมกับ `main` แล้ว คำถามคือ Git จะรวมสองสายนี้อย่างไร และทำไมบางครั้งแค่เลื่อน pointer ก็จบ แต่บางครั้งต้องสร้าง commit ใหม่ขึ้นมา?

บทนี้จะตอบคำถามนั้นด้วยการลงมือ merge จริง โดยเริ่มจากกรณีที่ง่ายที่สุดก่อน นั่นคือ **fast-forward merge** แล้วค่อยดูภาพของ **three-way merge** ที่จะเจอเมื่อสองสายพัฒนาไปคนละทาง

สิ่งที่จะได้ตอนจบบทนี้:

- แยกได้ว่า branch ไหนคือ source และ branch ไหนคือ target ก่อนสั่ง merge
- ทำนายได้ว่า merge จะเป็น fast-forward หรือ three-way จาก commit history
- สลับไป target branch อย่างปลอดภัยและรู้ว่า Git จะหยุดเมื่อใด
- ใช้ `git merge feature` รวมงาน `feature` เข้า `main`
- ใช้ `git log --all` ดู commit ของทุก branch ใน local repository
- ใช้ `git checkout <commit_hash>` ดูสถานะโปรเจกต์ใน commit เก่าโดยเข้าใจ detached HEAD
- ใช้ `git switch -c` สร้าง branch ใหม่และสลับไปในคำสั่งเดียว

{{< mermaid >}}
flowchart LR
  A["feature = source<br/>main = target"] --> B{"สองสาย diverge ไหม?"}
  B -->|"ไม่ diverge"| C["Fast-forward<br/>เลื่อน target pointer"]
  B -->|"diverge แล้ว"| D["Three-way<br/>สร้าง merge commit"]
  C --> E["git log --all<br/>ดูทุก branch"]
  D --> E
  E --> F["ดู commit เก่า<br/>detached HEAD"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 4 โดยสมมติว่าใน `rainbow` มีสถานะแบบนี้:

- `main` ชี้ไปที่ commit `orange`
- `feature` ชี้ไปที่ commit `yellow`
- ตอนนี้เราอยู่บน `feature`
- working tree clean ไม่มีงานที่แก้ค้างอยู่

เข้าไปใน repository และตรวจสถานะก่อน:

```sh
cd ~/rainbow
git status
git log --oneline --decorate --all
```

ผลลัพธ์ควรมีหน้าตาประมาณนี้:

```text
On branch feature
nothing to commit, working tree clean

fc8139c (HEAD -> feature) yellow
7acb333 (main) orange
abc1234 red
```

hash ในเครื่องของเราจะไม่เหมือนตัวอย่าง ไม่เป็นไร ขอแค่เห็นว่า `feature` อยู่ข้างหน้า `main` และ working tree clean ก็พอ

ถ้าตอนนี้อยู่บน `main` ให้รัน `git switch feature` ก่อนทำตามบท หรือถ้ายังไม่มี commit `yellow` ก็กลับไปทำตอนที่ 4 ให้ครบก่อน

เครื่องหมาย `$` ในตัวอย่างเป็นเพียง command prompt ไม่ต้องพิมพ์ตามไปด้วย

---

## Step 1: Merge คืออะไร และใครเป็นคนถูกแก้?

**Merge** คือการนำการเปลี่ยนแปลงจาก branch หนึ่งเข้าไปในอีก branch หนึ่ง แต่ก่อนสั่ง ต้องแยกบทบาทของ branch ให้ชัด เพราะมีเพียง branch ฝั่งรับเท่านั้นที่ถูกเปลี่ยนจาก operation นี้

| บทบาท | ความหมาย | ถูกเปลี่ยนไหม? |
|---|---|---|
| Source branch | branch ที่มีงานซึ่งเราจะนำเข้าไป | ไม่ถูกเปลี่ยน |
| Target branch | branch ที่จะรับงานจาก source | ถูกเปลี่ยน |

ในบทนี้เราจะใช้:

- `feature` เป็น **source** เพราะมี commit `yellow` ที่ต้องการนำเข้า
- `main` เป็น **target** เพราะเราต้องการให้สายหลักมีงานของ `yellow`

### ทำไมต้องแยกบทบาทของ source กับ target? (Why)

คำสั่งนี้:

```sh
git merge feature
```

ไม่ได้แปลว่า “ย้ายตัวเราไป `feature` แล้วรวมงาน” แต่แปลว่า “ขณะที่เราอยู่บน branch ปัจจุบัน ให้นำงานจาก `feature` เข้ามา”

ดังนั้นถ้าเรารันคำสั่งนี้ตอนอยู่บน `main` ผลลัพธ์คือรวม `feature` เข้า `main` แต่ถ้ารันตอนอยู่บน `feature` เรากำลังขอให้ `feature` รับงานจาก `feature` เอง ซึ่งไม่ใช่สิ่งที่ต้องการ

### ใช้อย่างไร? (How)

จำลำดับของ merge ไว้สองขั้น:

```text
1. git switch <target>  # ไปอยู่ branch ที่จะรับงาน
2. git merge <source>   # นำงานจากอีก branch เข้ามา
```

สำหรับตัวอย่างนี้คือ:

```sh
git switch main
git merge feature
```

เรายังไม่รัน `git merge` ทันที จะขอดู commit history ก่อนว่า Git น่าจะเลือก merge แบบไหน

> Merge เปลี่ยน target branch ไม่ได้เปลี่ยน source branch — จำประโยคนี้ไว้ก่อน แล้วตอนสั่ง merge จะสับสนน้อยลงเยอะ

---

## Step 2: ดูว่า merge จะเป็นแบบไหน

Git มี merge ที่เราต้องรู้จักในบทนี้สองแบบ:

1. **Fast-forward merge** — สองสายยังต่อกันเป็นเส้นเดียว Git จึงเลื่อน pointer ของ target ไปข้างหน้าได้
2. **Three-way merge** — สองสายแยกออกจากกันแล้ว Git จึงต้องสร้าง merge commit เพื่อผูกสองสายกลับเข้าด้วยกัน

ตัวตัดสินไม่ใช่จำนวน commit แต่คือความสัมพันธ์ของ commit history

### Fast-forward merge: target อยู่ข้างหลัง source

สถานะของ `rainbow` ตอนนี้มีหน้าตาแบบนี้:

```text
red  <--  orange  <--  yellow
          ^            ^
        main         feature
```

ถ้าไล่ parent link จาก `yellow` ย้อนกลับ จะเจอ `orange` แล้วจึงเจอ `red` อีกที แปลว่า commit ที่ `main` ชี้อยู่ยังอยู่ในเส้นทางของ `feature`

ในกรณีนี้สองสายยัง **ไม่ diverge** กัน Git ไม่ต้องสร้าง commit ใหม่ แค่เลื่อน pointer ของ `main` จาก `orange` ไปชี้ `yellow`:

```text
red  <--  orange  <--  yellow
                         ^
                    main, feature
```

นี่คือ **fast-forward merge** เพราะ pointer ของ target เดินหน้าไปตามเส้นทางเดิมได้เลย

### Three-way merge: สองสายไปคนละทาง

ลองเปลี่ยนสถานการณ์ให้ `main` มีงานใหม่ของตัวเองด้วย:

```text
                    H  <--  I  <--  J  (feature)
                  /
...  <--  F  <--  G
                  \
                    K  <--  L          (main)
```

คราวนี้ `G` คือ **common ancestor** หรือ commit บรรพบุรุษร่วมของสองสาย หลังจาก `G` แล้ว `feature` เดินไปทาง `H-I-J` ส่วน `main` เดินไปทาง `K-L`

ถ้าไล่ parent link จาก `J` ย้อนกลับ จะไม่เจอ `L` ที่ `main` ชี้อยู่ สอง history จึง **diverge** หรือแยกออกจากกันแล้ว การเลื่อน pointer ของ `main` ไปที่ `J` อย่างเดียวจะทำให้มองไม่เห็นงาน `K-L`

Git จึงสร้าง commit ใหม่ เช่น `M` ให้มี parent สองตัว:

```text
                    H  <--  I  <--  J  --\
                  /                       \
...  <--  F  <--  G                         M  (main)
                  \                       /
                    K  <--  L  ---------/
                                      (feature ยังชี้ J)
```

commit `M` นี้เรียกว่า **merge commit** เพราะมันมี parent มากกว่าหนึ่งตัว โดย three-way merge ต้องพิจารณา commit สามจุด:

- ปลายสายของ `feature` คือ `J`
- ปลายสายของ `main` คือ `L`
- บรรพบุรุษร่วมของทั้งคู่คือ `G`

ตารางนี้สรุปความต่างให้เห็นชัด:

| | Fast-forward merge | Three-way merge |
|---|---|---|
| เงื่อนไข | histories ยังไม่ diverge | histories diverge กันแล้ว |
| สิ่งที่ Git ทำ | เลื่อน target pointer ไปข้างหน้า | สร้าง merge commit แล้วเลื่อน target ไปชี้ commit ใหม่ |
| มี commit ใหม่ไหม? | ไม่มี | มี merge commit ที่มี 2 parents |
| มีโอกาสเจอ conflict ไหม? | ไม่มีจากการ merge รูปแบบนี้ | มี ถ้าการเปลี่ยนแปลงชนกัน |

three-way merge เป็นจุดที่อาจเกิด **merge conflict** ได้ เช่นสอง branch แก้ส่วนเดียวกันของไฟล์เดียวกันคนละแบบ หรือ branch หนึ่งลบไฟล์ในขณะที่อีก branch แก้ไฟล์นั้นอยู่ รายละเอียดของ three-way merge และการแก้ merge conflict จะอธิบายให้ละเอียดในตอนถัด ๆ ไป

> ถ้าไล่ parent link จาก source แล้วย้อนกลับไปเจอ commit ที่ target ชี้อยู่ ให้คาดไว้ก่อนว่าเป็น fast-forward; ถ้าไม่เจอ ให้เตรียมรับมือกับ three-way merge

---

## Step 3: ตรวจงานค้างก่อนสลับไป target

ก่อนจะไปอยู่บน `main` เราต้องตรวจว่าไม่มีการแก้ไฟล์ที่ยังไม่ได้ commit ค้างอยู่:

```sh
git status
```

ถ้าพร้อม ผลลัพธ์ควรเป็น:

```text
On branch feature
nothing to commit, working tree clean
```

ถ้า Git พบว่าไฟล์ที่เราแก้ไว้จะถูกทับเมื่อสลับ branch มันจะหยุดคำสั่งไว้ ไม่ปล่อยให้การสลับทำลายงานที่เซฟแล้ว

### ลองดูกรณีที่ Git ป้องกันงานให้

ส่วนนี้เป็นการทดลองที่แก้ไฟล์ใน `rainbow` จริง ถ้าจะทำตาม ให้เปิด `rainbowcolors.txt` ตอนอยู่บน `feature` เพิ่มบรรทัดนี้ต่อท้าย แล้ว **เซฟไฟล์**:

```text
Green is the fourth color of the rainbow.
```

จากนั้นตรวจสถานะ:

```sh
git status
```

ควรเห็นว่าไฟล์ถูกแก้แล้ว:

```text
On branch feature
Changes not staged for commit:
        modified:   rainbowcolors.txt
```

ลองสลับไป `main`:

```sh
git switch main
```

Git ควรหยุดพร้อมข้อความประมาณนี้:

```text
error: Your local changes to the following files would be overwritten by checkout:
        rainbowcolors.txt
Please commit your changes or stash them before you switch branches.
Aborting
```

สาเหตุคือ `main` มี `rainbowcolors.txt` คนละ snapshot กับ `feature` ถ้า Git ยอมสลับ ไฟล์ที่มีบรรทัด `Green` อาจถูกแทนด้วยเวอร์ชันของ `main` ที่ยังไม่มีบรรทัดนี้

เราไม่ได้ตั้งใจ commit `Green` ในบทนี้ ให้เปิดไฟล์แล้วลบบรรทัดดังกล่าวออก จากนั้นเซฟและตรวจซ้ำ:

```sh
git status
```

ผลลัพธ์ควรกลับมาเป็น:

```text
On branch feature
nothing to commit, working tree clean
```

> Git จะเห็นเฉพาะการแก้ไขที่ถูกเซฟลงดิสก์แล้ว ถ้าแก้ข้อความค้างไว้ใน editor แต่ยังไม่กด save Git อาจมองไฟล์เป็น unmodified และไม่สามารถปกป้องข้อความใน editor ให้เราได้

Git ไม่ได้หยุดทุกครั้งที่มี uncommitted changes ถ้าการสลับ branch ไม่ทำให้ไฟล์ที่แก้ถูกทับ มันอาจสลับให้และพาการแก้ค้างนั้นไปต่อได้ ดังนั้นทางที่ง่ายที่สุดก่อนสลับคือทำให้ working tree clean

---

## Step 4: สลับ branch แล้วดูไฟล์เปลี่ยนตาม snapshot

ตอนนี้ working tree clean แล้ว จึงสลับไป target branch ด้วย:

```sh
git switch main
git status
git log --oneline --decorate
```

ผลลัพธ์ควรเป็น:

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

สังเกตว่า `git log` ตอนอยู่บน `main` เห็น `orange` กับ `red` แต่ยังไม่เห็น `yellow` เพราะ `yellow` อยู่ข้างหน้าสายที่ `main` ชี้อยู่ ไล่ parent link ย้อนกลับจาก `orange` ไปไม่ถึง

ลองอ่านไฟล์ใน working directory:

```sh
cat rainbowcolors.txt
```

ตอนนี้ควรเห็น:

```text
Red is the first color of the rainbow.
Orange is the second color of the rainbow.
```

บรรทัด `Yellow is the third color of the rainbow.` หายจาก working directory เพราะการสลับไป `main` ทำให้ Git นำ snapshot ของ commit `orange` มาแสดงแทน snapshot ของ `yellow`

สิ่งที่เกิดขึ้นไม่ได้มีแค่การเปลี่ยนข้อความว่าเราอยู่ branch ไหน Git ยังทำงานหลัก ๆ สามอย่าง:

1. เปลี่ยน `HEAD` ให้ชี้ไปที่ `main`
2. จัด staging area ให้ตรงกับ commit ที่ `main` ชี้อยู่
3. นำเนื้อหาจาก staging area มาใส่ใน working directory

นี่เป็นเหตุผลว่าทำไมต้องตรวจงานค้างก่อนสลับ branch การสลับอาจเปลี่ยนไฟล์ที่เราเปิดอยู่จริง ๆ

> เปลี่ยน branch = เปลี่ยน snapshot ที่ working directory กำลังแสดงอยู่ ไม่ใช่แค่เปลี่ยนป้ายชื่อใน terminal

---

## Step 5: ดู commit ของทุก branch ด้วย `git log --all`

เมื่ออยู่บน `main` แล้ว ลองใช้คำสั่งเดิมอีกครั้ง:

```sh
git log --oneline --decorate
```

ผลลัพธ์ยังมองเห็นเฉพาะสายของ `main`:

```text
7acb333 (HEAD -> main) orange
abc1234 red
```

ถ้าต้องการดู commit จากทุก branch ที่ยังมี pointer อ้างถึง ให้เติม `--all`:

```sh
git log --oneline --decorate --all
```

ตัวอย่าง output:

```text
fc8139c (feature) yellow
7acb333 (HEAD -> main) orange
abc1234 red
```

`--all` ช่วยให้เราเห็น `yellow` แม้ตอนนี้ `HEAD` จะอยู่บน `main` และ `main` ยังไล่ parent link ไปไม่ถึง commit นั้น

ถ้าอยากได้ชื่อคำสั่งแบบสั้นตามที่มักเห็นในเอกสาร ก็ใช้ได้เช่นกัน:

```sh
git log --all
```

แบบนี้จะเห็นรายละเอียดเต็มของ commit และถ้า output ยาว Git อาจเปิด pager ให้ กด `Q` เพื่อออกเหมือนที่เราเรียนในตอนที่ 3

---

## Step 6: รวม `feature` เข้า `main` ด้วย `git merge`

ตอนนี้เราอยู่บน target ถูกตัวแล้ว คือ `main` และจาก history เรารู้ว่า `main` เป็นบรรพบุรุษของ `feature` ดังนั้น merge ครั้งนี้ควรเป็น fast-forward

สั่ง merge โดยระบุ source branch:

```sh
git merge feature
```

ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
Updating 7acb333..fc8139c
Fast-forward
 rainbowcolors.txt | 1 +
 1 file changed, 1 insertion(+)
```

hash และจำนวนบรรทัดอาจต่างจากตัวอย่างตามสถานะในเครื่อง จุดที่ต้องสังเกตคือ:

- `Updating ...` บอกว่า pointer ของ `main` กำลังเลื่อนจาก commit เดิมไป commit ของ `feature`
- `Fast-forward` ยืนยันว่า Git ไม่ต้องสร้าง merge commit
- `rainbowcolors.txt` ใน working directory ถูกปรับเป็น snapshot ของ `yellow`

ตรวจผลลัพธ์ด้วย:

```sh
git status
git log --oneline --decorate
cat rainbowcolors.txt
```

ควรเห็นประมาณนี้:

```text
On branch main
nothing to commit, working tree clean
```

```text
fc8139c (HEAD -> main, feature) yellow
7acb333 orange
abc1234 red
```

```text
Red is the first color of the rainbow.
Orange is the second color of the rainbow.
Yellow is the third color of the rainbow.
```

สิ่งที่เกิดขึ้นมีสามข้อ:

1. `main` เลื่อนจาก `orange` ไปชี้ `yellow`
2. `feature` ยังอยู่ ไม่ได้ถูกลบ และยังชี้ `yellow` เช่นเดิม
3. ไม่มี commit ใหม่ เพราะประวัติของ `feature` ต่อจาก `main` เป็นเส้นตรงอยู่แล้ว

ถ้าใช้ `git log --all` ตอนนี้จะเห็น `main` กับ `feature` ชี้ commit เดียวกัน นี่ไม่ได้แปลว่า merge ลบ `feature` แต่แปลว่าสอง branch มาถึงจุดเดียวกันแล้ว

> `git merge` ไม่ได้ลบ source branch อัตโนมัติ ถ้า branch ไม่จำเป็นแล้ว ค่อยลบอย่างชัดเจนในภายหลัง

---

## Step 7: ดู commit เก่าด้วย `git checkout`

หลัง merge ตอนนี้ทั้ง `main` และ `feature` ชี้ `yellow` แล้ว แต่บางครั้งเราอยากเปิดดูว่าโปรเจกต์หน้าตาเป็นอย่างไรใน commit เก่า เช่นอยากตรวจ snapshot ของ `orange`

ถ้าไม่มี branch ไหนชี้ `orange` อยู่โดยตรง เราสลับด้วยชื่อ branch ไม่ได้ ต้องใช้ commit hash:

เริ่มจากหา hash ของ `orange`:

```sh
git log --oneline --decorate --all
```

จากนั้นนำ hash ของบรรทัด `orange` ไปใช้แทน `<commit_hash>` ในคำสั่งนี้:

```sh
git checkout <commit_hash>
```

ตัวอย่าง ถ้า hash ของ `orange` คือ `7acb333` ก็รัน:

```sh
git checkout 7acb333
```

Git จะแจ้งเตือนประมาณนี้:

```text
Note: switching to '7acb333'.

You are in 'detached HEAD' state. You can look around, make experimental changes and commit them, and you can discard any commits you make in this state without impacting any branches by switching back to a branch.
...
HEAD is now at 7acb333 orange
```

ตรวจสถานะ:

```sh
git status
git log --oneline --decorate --all
cat rainbowcolors.txt
```

ควรเห็นข้อความสำคัญประมาณนี้:

```text
HEAD detached at 7acb333
nothing to commit, working tree clean
```

```text
Orange is the second color of the rainbow.
```

ตอนนี้ `HEAD` ชี้ไปที่ commit `orange` **ตรง ๆ** ไม่ได้ชี้ไปที่ `main` หรือ `feature` ภาวะนี้เรียกว่า **detached HEAD state**

### ทำไมไม่ควรทำงานต่อใน detached HEAD?

เรายังเปิดดูไฟล์และสร้าง commit ได้ แต่ commit ที่สร้างจะไม่มี branch คอยชี้จำไว้ ถ้าสลับไป branch อื่นในภายหลัง เราอาจหา commit นั้นยากและไม่รู้ว่าควรกลับไปทางไหน

ถ้าตั้งใจจะเริ่มงานใหม่จาก commit เก่า ให้สร้าง branch ที่มีชื่อไว้ก่อน:

```sh
git switch -c experiment-from-orange
```

คำสั่งนี้จะสร้าง branch ใหม่จาก commit ที่ `HEAD` กำลังชี้อยู่ แล้วสลับไป branch นั้นทันที เราจะคุยเรื่องการทำงานจาก branch ใหม่ละเอียดขึ้นในตอนต่อ ๆ ไป

ถ้าแค่ต้องการดู commit เก่า เสร็จแล้วให้กลับไป branch หลัก:

```sh
git switch main
```

ผลลัพธ์:

```text
Previous HEAD position was 7acb333 orange
Switched to branch 'main'
```

เปิด `rainbowcolors.txt` อีกครั้งจะกลับมาเห็นบรรทัด `Yellow` เพราะ `main` ยังชี้ snapshot ของ `yellow` อยู่

ไม่มี commit หาย การสลับไปดู commit อื่นแค่เปลี่ยน snapshot ที่ working directory แสดงอยู่เท่านั้น

---

## Step 8: สร้าง branch และสลับไปพร้อมกันด้วย `git switch -c`

ตอนที่ 4 เราใช้สองคำสั่งเพื่อสร้าง branch และสลับไปทำงาน:

```sh
git branch experiment-two-steps
git switch experiment-two-steps
```

ถ้ารู้ตั้งแต่แรกว่าต้องการสร้างแล้วไปทำงานบน branch ใหม่ทันที ใช้คำสั่งเดียวได้:

```sh
git switch -c experiment-one-step
```

`-c` ย่อมาจาก `create` คำสั่งนี้สร้าง branch จาก commit ปัจจุบัน แล้วเปลี่ยน `HEAD` ให้ชี้ branch นั้น

ตรวจสอบได้ด้วย:

```sh
git branch
git status
```

ผลลัพธ์ควรมีหน้าตาประมาณนี้:

```text
* experiment-one-step
  experiment-two-steps
  feature
  main
```

```text
On branch experiment-one-step
nothing to commit, working tree clean
```

ถ้าใช้ `git checkout` แบบเดิม คำสั่งที่เทียบเท่าคือ:

```sh
git checkout -b another-experiment
```

`git checkout` ยังใช้ได้ แต่ทำได้หลายหน้าที่ ทั้งสลับ branch และ check out commit ส่วน `git switch` ชื่อและหน้าที่ชัดกว่า จึงเหมาะกับการสลับ branch ในบทเรียนนี้

ถ้าสร้าง branch เพื่อทดลองคำสั่งใน Step นี้เสร็จแล้ว ให้กลับไป `main` ก่อน:

```sh
git switch main
```

branch ใหม่จะยังอยู่ แต่เราไม่ได้ใช้ต่อในบทนี้

---

## แบบฝึกหัด

ทำโจทย์ต่อไปนี้ใน `rainbow` โดยเริ่มจากสถานะที่ `main` และ `feature` ชี้ commit `yellow` เดียวกัน และ working tree clean:

1. ใช้ `git log --oneline --decorate --all` ตรวจว่า `main` กับ `feature` ชี้ commit เดียวกัน และใช้ `git status` ยืนยันว่าไม่มีงานค้าง
2. หา hash ของ `orange` จาก `git log --all --oneline` แล้วใช้ `git checkout <orange_hash>` เปิด `rainbowcolors.txt` ตรวจว่ามี `red` กับ `orange` แต่ยังไม่มี `yellow`
3. ขณะอยู่ใน detached HEAD ให้รัน `git status` และอธิบายจาก output ว่า `HEAD` ชี้อะไรอยู่ จากนั้น **อย่าแก้ไฟล์และอย่าสร้าง commit** ในสถานะนี้
4. รัน `git switch main` เพื่อกลับออกจาก detached HEAD แล้วเปิดไฟล์เดิมตรวจว่า `yellow` กลับมา จากนั้นใช้ `git status` ยืนยันว่า working tree ยัง clean
5. สร้าง branch ใหม่จาก `main` ด้วย `git switch -c merge-practice` แล้วใช้ `git branch` และ `git status` ตรวจว่า `*` กับ `HEAD` อยู่บน `merge-practice`
6. สลับกลับ `main` แล้วใช้ `git log --oneline --decorate --all` อธิบายว่า branch `merge-practice` ยังอยู่ แม้เราไม่ได้ทำ commit ใหม่บนมัน

### ทดลองสถานการณ์ที่ Git หยุดป้องกันงาน

ทำส่วนนี้ก่อน merge ในครั้งถัดไป หรือสร้าง repository ใหม่สำหรับฝึก ถ้าไม่อยากยุ่งกับสถานะหลักของ `rainbow`:

1. ให้ `main` ชี้ `orange` และ `feature` ชี้ `yellow` โดยอยู่บน `feature`
2. เพิ่มบรรทัด `Green is the fourth color of the rainbow.` ใน `rainbowcolors.txt` แล้วเซฟ แต่ยังไม่ต้อง `git add` หรือ `git commit`
3. รัน `git status` แล้วลอง `git switch main` ผลลัพธ์ควรหยุดพร้อม error ว่า local changes จะถูกทับ
4. ลบบรรทัด `Green` ออก เซฟไฟล์ และรัน `git status` จนกลับมา `nothing to commit, working tree clean`

ตรวจตัวเองให้ครบ:

- อธิบายได้ว่า branch ไหนคือ source และ branch ไหนคือ target ใน `git merge feature`
- บอกได้ว่าทำไมการ merge `feature` เข้า `main` ในบทนี้เป็น fast-forward
- หลัง fast-forward แล้ว `main` และ `feature` ชี้ `yellow` แต่ไม่มี merge commit ใหม่
- เคยเห็น `HEAD detached at ...` และกลับไป `main` ได้โดยไม่สร้าง commit
- สร้างและสลับ branch ใหม่ด้วย `git switch -c` ได้

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **อยู่บน source แล้วสั่ง merge ผิดทิศ** — ก่อนใช้ `git merge <source>` ให้รัน `git switch <target>` และตรวจ `git status` ก่อน
- **คิดว่า merge สร้าง commit ใหม่ทุกครั้ง** — fast-forward merge แค่เลื่อน target pointer จึงไม่มี commit ใหม่
- **คิดว่า `git switch` เปลี่ยนแค่ชื่อ branch** — ถ้า branch ชี้คนละ commit เนื้อหาใน staging area และ working directory ก็อาจเปลี่ยนตาม
- **สลับ branch ทั้งที่มีงานที่เซฟแล้วค้างอยู่** — ถ้าการสลับอาจทับไฟล์ Git จะหยุดและให้ commit หรือ stash ก่อน
- **คิดว่า Git ปกป้องข้อความที่ยังไม่เซฟใน editor** — Git เห็นเฉพาะไฟล์ที่เซฟลงดิสก์แล้ว กด save ก่อนสลับ branch
- **นึกว่า `git log` แสดงทุก commit ใน local repository** — มันเริ่มจาก commit ปัจจุบันและไล่ตาม parent link ถ้าต้องการดูทุก branch ใช้ `git log --all`
- **คิดว่า merge แล้ว `feature` หายไป** — merge ไม่ลบ source branch อัตโนมัติ หลัง merge branch ทั้งสองอาจชี้ commit เดียวกัน
- **แก้ไฟล์ต่อใน detached HEAD โดยไม่สร้าง branch** — ถ้าจะทำงานต่อ ให้ใช้ `git switch -c <new_branch_name>` ก่อนสร้าง commit
- **ใช้ commit hash เต็มจากตัวอย่าง** — hash ของแต่ละเครื่องไม่เหมือนกัน ให้หา hash ของ commit ใน repository ตัวเองและใช้ prefix ที่ไม่ซ้ำกัน

---

## สรุป

1. Merge คือการนำการเปลี่ยนแปลงจาก source branch เข้า target branch และ target เป็น branch ที่ถูกเปลี่ยน
2. ลำดับพื้นฐานคือ `git switch <target>` แล้วตามด้วย `git merge <source>`
3. ถ้าไล่ parent link จาก source แล้วย้อนกลับไปเจอ commit ที่ target ชี้อยู่ histories ยังไม่ diverge และ merge มักเป็น fast-forward
4. Fast-forward merge แค่เลื่อน target pointer ไปข้างหน้า จึงไม่สร้าง commit ใหม่
5. ถ้าสองสาย diverge กัน Git ต้องใช้ three-way merge และสร้าง merge commit ที่มี parent มากกว่าหนึ่งตัว
6. ตรวจ `git status` ก่อนสลับ branch เพื่อไม่ให้ไฟล์ที่แก้และเซฟแล้วถูกทับ
7. การสลับ branch อาจเปลี่ยนเนื้อหาใน staging area และ working directory ให้ตรงกับ snapshot ของ branch ใหม่
8. `git log` มองประวัติจากจุดที่เราอยู่ ส่วน `git log --all` ช่วยแสดง commit จากทุก branch ใน local repository
9. `git checkout <commit_hash>` ใช้เปิดดู commit เก่าได้ แต่จะทำให้เข้าสู่ detached HEAD state
10. ถ้าจะเริ่มงานจากจุดปัจจุบัน ให้ใช้ `git switch -c <new_branch_name>` เพื่อสร้าง branch และสลับไปพร้อมกัน

ตอนนี้ `main` กับ `feature` กลับมาชี้ `yellow` commit เดียวกันแล้ว งานจากสายทดลองจึงเข้ามาอยู่ในสายหลักโดยไม่ต้องสร้าง merge commit เพิ่ม

คำสั่ง merge มีแค่บรรทัดเดียว แต่ก่อนรันต้องรู้ว่าเรายืนอยู่บน target และเข้าใจว่า history สองสายกำลังต่อกันหรือแยกออกจากกัน แค่นี้ก็ลดการ merge ผิดทิศไปได้เยอะมากกกก

> *ตอนถัดไปเราจะเริ่มออกจาก local repository ไปรู้จัก remote repository, hosting service และการยืนยันตัวตนสำหรับทำงานร่วมกับคนอื่น*

---

## Glossary

- **Merge** — การนำการเปลี่ยนแปลงจาก branch หนึ่งเข้าอีก branch หนึ่ง
- **Source branch** — branch ที่มีการเปลี่ยนแปลงและถูกนำเข้าไป โดยตัวมันเองไม่ถูกแก้จาก merge นั้น
- **Target branch** — branch ที่รับการเปลี่ยนแปลงและเป็น branch ที่ถูกเลื่อนหรือสร้าง merge commit
- **Fast-forward merge** — merge ที่ target อยู่บนเส้นทาง parent ของ source จึงเลื่อน target pointer ไปข้างหน้าได้โดยไม่สร้าง commit ใหม่
- **Three-way merge** — merge ที่ใช้ปลายสายสองฝั่งกับ common ancestor เพื่อสร้าง merge commit เมื่อ histories diverge
- **Diverge** — สอง development history แยกออกจากกันจนปลายสายของ target ไม่อยู่ในเส้นทาง parent ของ source
- **Merge commit** — commit ที่มี parent มากกว่าหนึ่งตัวและใช้ผูกสองสายเข้าด้วยกัน
- **Common ancestor** — commit บรรพบุรุษร่วมของ development history สองสาย
- **Parent link** — ความสัมพันธ์ที่ commit ใหม่ชี้ย้อนกลับไปยัง commit ก่อนหน้า
- **`git merge`** — คำสั่งนำการเปลี่ยนแปลงจาก source branch เข้า branch ปัจจุบัน
- **`git log --all`** — คำสั่งแสดง commit ที่เข้าถึงได้จากทุก reference ของ local repository
- **Detached HEAD state** — สภาวะที่ `HEAD` ชี้ไปยัง commit ตรง ๆ แทนการชี้ผ่าน branch
- **`git checkout <commit_hash>`** — คำสั่งนำ working directory ไปแสดง snapshot ของ commit ที่ระบุ
- **`git switch -c`** — คำสั่งสร้าง branch ใหม่จากจุดปัจจุบันแล้วสลับไป branch นั้นทันที

---

## Related

- [ตอนที่ 1: Git and the Command Line](/git/01-git-and-the-command-line/) — เตรียม command line, ติดตั้ง Git และสร้างโฟลเดอร์ `rainbow`
- [ตอนที่ 2: Local Repositories](/git/02-local-repositories/) — เปลี่ยน `rainbow` ให้เป็น local repository และรู้จักพื้นที่ทำงานของ Git
- [ตอนที่ 3: Making a Commit](/git/03-making-a-commit/) — ใช้ `git add`, `git commit` และ `git log` สร้างประวัติที่เราเอามาแตก branch
- [ตอนที่ 4: Branches](/git/04-branches/) — แยกสายการทำงานด้วย branch และสร้าง `feature` ที่บทนี้นำกลับมารวม
- [ตอนที่ 6: Hosting Services and Authentication](/git/06-hosting-services-and-authentication/) — เริ่มเชื่อม local repository เข้ากับ remote repository
- [ตอนที่ 9: Three-Way Merges](/git/09-three-way-merges/) — ลงมือทำ three-way merge แบบละเอียด
- [ตอนที่ 10: Merge Conflicts](/git/10-merge-conflicts/) — ทำความเข้าใจและแก้ conflict ที่เกิดจากการ merge
- [ตอนที่ 11: Rebasing](/git/11-rebasing/) — อีกวิธีในการ integrate การเปลี่ยนแปลงระหว่าง branch
