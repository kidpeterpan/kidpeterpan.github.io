+++
title = 'ตอนที่ 8: Cloning and Fetching'
date = '2026-08-17T00:00:00+07:00'
draft = false
description = 'เริ่มทำงานจาก remote repository ด้วย git clone แล้วใช้ git fetch และ git merge รับการเปลี่ยนแปลงเข้ามาอย่างเป็นขั้นตอน'
tags = ['programming', 'git', 'tutorial']
+++

---

ตอนที่แล้วเราเอา `rainbow` จากเครื่องขึ้นไปไว้บน `rainbow-remote` แล้ว ตอนนี้เรามี local repository กับ remote repository อยู่คนละที่ และส่งงานหากันด้วย `git push`

แต่ถ้ามีเพื่อนเข้ามาช่วยทำงาน เพื่อนจะเอา repository จาก remote ลงเครื่องยังไง? แล้วถ้าเพื่อน push งานใหม่ขึ้นไป เราจะเอางานนั้นกลับมาใน `rainbow` ของเราได้ยังไง?

บทนี้จะจำลองสถานการณ์นั้นด้วยการ clone `rainbow-remote` ลงมาเป็น local repository ตัวที่สองชื่อ `friend-rainbow` แล้วไล่ดูการรับส่งข้อมูลตั้งแต่ต้นจนจบ

สิ่งที่จะได้ตอนจบบทนี้:

- ใช้ `git clone` สร้าง local repository จาก remote repository
- แยก local branch, remote branch และ remote-tracking branch ออกจากกัน
- อธิบายได้ว่า `origin/HEAD` และ upstream branch มีไว้ทำอะไร
- ใช้ `git fetch` ดาวน์โหลดการเปลี่ยนแปลงโดยยังไม่แก้ local branch
- ใช้ `git merge` รวมงานจาก `origin/main` เข้า local `main`
- ลบ branch ให้ครบทั้ง remote, remote-tracking และ local
- ใช้ `git fetch -p` ลบ remote-tracking branch ที่ remote ลบไปแล้ว

{{< mermaid >}}
flowchart LR
  R["rainbow-remote<br/>remote repository"] -->|"git clone"| F["friend-rainbow<br/>local repository"]
  F -->|"commit + git push"| R
  R -->|"git fetch"| L["rainbow<br/>local repository"]
  L -->|"git merge origin/main"| L
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 7 โดยสมมติว่า `rainbow-remote` มี branch `main` และ `feature` อยู่แล้ว และ `rainbow` ของเราผูกกับ remote ชื่อ `origin` เรียบร้อย

เริ่มจากตรวจสถานะของ `rainbow` ก่อน รันคำสั่งชุดนี้ใน terminal: โฟลเดอร์และ hash ในเครื่องเราอาจต่างจากตัวอย่าง แต่ควรเห็น remote `origin` และ branch ทั้งสองตัว

```sh
cd ~/rainbow
git status
git remote -v
git branch --all
```

ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
On branch feature
nothing to commit, working tree clean

origin  https://github.com/your-username/rainbow-remote.git (fetch)
origin  https://github.com/your-username/rainbow-remote.git (push)

* feature
  main
  remotes/origin/feature
  remotes/origin/main
```

ถ้าตอนนี้เราอยู่บน `main` แทน `feature` ก็ไม่เป็นไร จุดสำคัญคือ `rainbow-remote` ต้องมีข้อมูลจากบทที่ 7 และ working tree ควร clean ก่อนเริ่ม

บทนี้ใช้สองโฟลเดอร์เพื่อจำลองเครื่องของเรากับเครื่องของเพื่อน แนะนำให้เปิด terminal แยกสองหน้าต่าง แล้วตั้งชื่อในใจให้ชัดว่าแต่ละหน้าต่างอยู่ใน `rainbow` หรือ `friend-rainbow`

> ⚠️ ถ้าเปิด VS Code setting `git.autofetch` เอาไว้ ให้ปิดชั่วคราวก่อนทำตามบทนี้ เพราะมันอาจ fetch ให้เองจนสถานะไม่ตรงกับตัวอย่าง

---

## Step 1: ใช้ `git clone` เอา remote ลงเครื่อง

### ทำไมต้องใช้? (Why)

ถ้า repository เริ่มต้นอยู่บน hosting service แล้ว เราไม่ต้องใช้ `git init` สร้าง repository ว่างใหม่เอง แต่ใช้ `git clone` เพื่อคัดลอกข้อมูลทั้งหมดจาก remote ลงมาเป็น local repository พร้อมเริ่มทำงาน

คิดง่าย ๆ ว่า `git init` คือการเปิดโปรเจกต์ใหม่จากโฟลเดอร์ในเครื่อง ส่วน `git clone` คือการรับโปรเจกต์ที่มีประวัติอยู่แล้วมาเริ่มทำงานต่อ

### ใช้อย่างไร? (How)

ออกจาก `rainbow` ไปยัง directory แม่ที่ต้องการเก็บ local repository ตัวใหม่ ในตัวอย่างนี้ใช้ home directory แล้ว clone ด้วย URL เดียวกับที่เพิ่มไว้ในบทที่ 7 ถ้าใช้ SSH ให้เปลี่ยน URL เป็น SSH ของเรา

```sh
cd ~
git clone https://github.com/your-username/rainbow-remote.git friend-rainbow
```

คำสั่งนี้จะสร้างโฟลเดอร์ชื่อ `friend-rainbow` ให้เอง และ output จะมีหน้าตาประมาณนี้: hash กับจำนวน object อาจต่างจากตัวอย่าง

```text
Cloning into 'friend-rainbow'...
remote: Enumerating objects: 9, done.
Receiving objects: 100% (9/9), done.
Resolving deltas: 100% (1/1), done.
```

`git clone <URL> <directory_name>` ทำงานหลัก ๆ 4 อย่าง:

1. สร้าง directory ใหม่ตามชื่อที่ระบุ
2. initialize local repository ใน directory นั้น
3. ดาวน์โหลด commit และข้อมูลทั้งหมดจาก remote
4. เพิ่ม connection กลับไปยัง remote โดยตั้ง shortname เป็น `origin`

clone สำเร็จแล้ว แต่ terminal ยังอยู่ที่ directory เดิม ไม่ได้พาเราเข้า `friend-rainbow` ให้อัตโนมัติ ต้องเข้าไปเองแล้วตรวจผล:

```sh
cd ~/friend-rainbow
git status
git remote -v
```

ผลลัพธ์ที่ควรเห็นคือ local repository ใหม่อยู่บน `main` และมี `origin` ผูกกับ URL แล้ว:

```text
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean

origin  https://github.com/your-username/rainbow-remote.git (fetch)
origin  https://github.com/your-username/rainbow-remote.git (push)
```

> clone ไม่ได้สร้างแค่ไฟล์ล่าสุด แต่เอาประวัติ commit และข้อมูล branch ที่ remote รู้จักลงมาด้วย นี่คือเหตุผลที่เพื่อนเริ่มทำงานต่อจากจุดเดียวกับเราได้

---

## Step 2: หลัง clone ทำไมมี local `main` แต่ยังไม่มี local `feature`?

หลัง clone ให้ดู branch ทุกชนิดที่ local repository รู้จักก่อน รันคำสั่งนี้ใน `friend-rainbow`:

```sh
git branch --all
```

ผลลัพธ์จะประมาณนี้:

```text
* main
  remotes/origin/HEAD -> origin/main
  remotes/origin/feature
  remotes/origin/main
```

อ่าน output ทีละบรรทัด:

| สิ่งที่เห็น | ความหมาย |
| --- | --- |
| `main` | local branch ที่ clone สร้างให้ และเป็น branch ที่เราอยู่ |
| `origin/main` | remote-tracking branch ที่บอกตำแหน่งล่าสุดของ remote `main` |
| `origin/feature` | remote-tracking branch ของ remote `feature` |
| `origin/HEAD -> origin/main` | pointer ที่บอกว่า clone เสร็จแล้วให้เริ่มบน branch ไหน |

จุดที่คนเริ่มต้นสับสนบ่อยคือ clone สร้าง remote-tracking branch ให้ครบทุก branch ที่ remote มี แต่สร้าง local branch ให้แค่ branch ที่ `origin/HEAD` ชี้อยู่ ในตัวอย่างนี้จึงมี local `main` แต่ยังไม่มี local `feature`

ถ้าเพื่อนต้องการทำงานบน `feature` ให้สลับไปชื่อ branch นั้นได้เลย:

```sh
git switch feature
```

Git จะสร้าง local `feature` จาก `origin/feature` และตั้ง upstream branch ให้ด้วย output จะประมาณนี้:

```text
branch 'feature' set up to track 'origin/feature'.
Switched to a new branch 'feature'
```

ตรวจความสัมพันธ์ระหว่าง local branch กับ upstream ด้วย `git branch -vv`:

```sh
git branch -vv
```

ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
* feature fc8139c [origin/feature] yellow
  main    fc8139c [origin/main]    yellow
```

`[origin/feature]` คือ upstream ของ local `feature` พอมี upstream แล้ว Git รู้ว่า local branch นี้ควรส่งหรือรับข้อมูลกับ remote branch ไหน จึงใช้ `git push` หรือคำสั่งที่เกี่ยวข้องแบบไม่ต้องพิมพ์ปลายทางซ้ำทุกครั้ง

> `origin/feature` เป็น remote-tracking branch ใน local repository ส่วน `feature` เป็น local branch คนละตัวกัน ชื่อคล้ายกันเพราะมันถูกตั้งให้ track กัน ไม่ได้แปลว่าเป็น branch เดียวกัน

---

## Step 3: ลบ branch ต้องจัดการกี่ตำแหน่ง?

การลบ branch มีเหตุผล เช่น งานถูก merge แล้ว หรือ branch นั้นไม่จำเป็นแล้ว แต่ควรตรวจให้แน่ใจก่อนว่าไม่มีงานสำคัญที่อยู่เฉพาะบน branch นั้น

ในมุมของ Git เราอาจต้องจัดการ branch ชื่อเดียวกันถึงสามตำแหน่ง:

| ตำแหน่ง | คำสั่ง |
| --- | --- |
| remote branch | `git push origin -d feature` |
| remote-tracking branch ในเครื่อง | `git fetch -p` หรือถูกอัปเดตหลังลบ remote |
| local branch | `git branch -d feature` |

ตัวอย่างต่อไปนี้จำลองว่าเพื่อนเป็นคนลบ `feature` ใน `friend-rainbow` ตอนนี้เรายังยืนอยู่บน local `feature` อยู่

> ⚠️ `git push origin -d feature` ลบ branch บน remote จริง ถ้าไม่ต้องการลบ `feature` ใน repository ของตัวเอง ให้ข้าม Step นี้ หรือเปลี่ยนเป็น branch ทดลองที่ไม่ใช่งานจริง

เริ่มจากลบ remote branch แล้วสลับออกจาก branch ที่กำลังยืนอยู่ ก่อนลบ local branch:

```sh
cd ~/friend-rainbow
git push origin -d feature
git switch main
git branch -d feature
```

ผลลัพธ์จะประมาณนี้:

```text
To https://github.com/your-username/rainbow-remote.git
 - [deleted]         feature
Switched to branch 'main'
Deleted branch feature (was fc8139c).
```

คำสั่งสุดท้ายลบ local `feature` ใน `friend-rainbow` ส่วน remote branch ถูกลบไปแล้วจากคำสั่ง `git push origin -d feature` และ remote-tracking branch ที่คู่กันใน `friend-rainbow` ก็ถูกอัปเดตตามการ push ครั้งนั้น

แต่ `rainbow` ของเรายังไม่รู้ว่า remote ลบ `feature` ไปแล้ว เพราะ local repository สองตัวไม่ได้คุยกันตรง ๆ ให้กลับไปดู `rainbow`:

```sh
cd ~/rainbow
git branch --all
```

ตอนนี้ใน `rainbow` ยังอาจเห็น `feature` และ `remotes/origin/feature` อยู่ นี่ไม่ใช่ข้อมูลใหม่ แต่เป็นภาพจำครั้งล่าสุดก่อนที่ `rainbow` จะติดต่อ remote

อีกเรื่องที่ควรรู้: การลบ branch ไม่ได้ลบ commit ทันที commit ยังอยู่ในประวัติ เพียงแต่ไม่มี branch ชี้ไปหาแล้ว และจะเข้าถึงได้ยากขึ้น

---

## Step 4: เพื่อน commit แล้ว push ขึ้น remote

ตอนนี้ `friend-rainbow` อยู่บน `main` แล้ว ให้จำลองว่าเพื่อนแก้ไฟล์ `rainbowcolors.txt` และเพิ่มสีเขียวต่อจากสีเหลือง

เปิดไฟล์ `~/friend-rainbow/rainbowcolors.txt` แล้วเพิ่มบรรทัดนี้ต่อท้าย จากนั้นกด save:

```text
Green is the fourth color of the rainbow.
```

ตรวจสถานะ แล้ว add และ commit ใน `friend-rainbow`:

```sh
git status
git add rainbowcolors.txt
git commit -m "green"
```

output จะมีหน้าตาประมาณนี้: commit hash และจำนวนบรรทัดที่เปลี่ยนขึ้นกับไฟล์ในเครื่องเรา

```text
On branch main
Changes not staged for commit:
  modified:   rainbowcolors.txt

[main 6987cd2] green
 1 file changed, 1 insertion(+)
```

หลัง commit จุดสำคัญคือ local `main` ใน `friend-rainbow` ขยับไปที่ `green` แล้ว แต่ `origin/main` ยังชี้ `yellow` อยู่ เพราะเรายังไม่ได้ push ขึ้น remote

ตรวจด้วย `git branch -vv` และ `git status`:

```sh
git branch -vv
git status
```

ควรเห็นใจความประมาณนี้:

```text
* main 6987cd2 [origin/main: ahead 1] green

On branch main
Your branch is ahead of 'origin/main' by 1 commit.
  (use "git push" to publish your local commits)
```

`ahead 1` แปลว่า local `main` มี commit ใหม่กว่า upstream อยู่ 1 ตัว งานยังอยู่แค่ใน `friend-rainbow` เท่านั้น

เพราะ `friend-rainbow` ถูก clone มาและ `main` มี upstream แล้ว จึง push แบบไม่ต้องใส่ชื่อ remote กับ branch ได้:

```sh
git push
```

output จะประมาณนี้:

```text
To https://github.com/your-username/rainbow-remote.git
   fc8139c..6987cd2  main -> main
```

หลัง push มีสามจุดที่ควรแยกให้ออก:

- remote branch `main` บน `rainbow-remote` ขยับไปที่ `green`
- `origin/main` ใน `friend-rainbow` ขยับตามไปที่ `green`
- `rainbow` ของเรายังไม่เห็น `green` จนกว่าจะ fetch

remote ไม่ได้ส่งข้อมูลกลับเข้า local ทุกเครื่องให้อัตโนมัติ การ push เป็นแค่การอัปเดต remote และ local repository ที่เป็นคน push เท่านั้น

---

## Step 5: ใช้ `git fetch` ดาวน์โหลดงานใหม่โดยยังไม่เปลี่ยน local branch

### ทำไมต้องแยก fetch ออกจาก merge? (Why)

เวลามี commit ใหม่บน remote เรามักต้องทำสองขั้น:

1. ดาวน์โหลดข้อมูลจาก remote มาอัปเดต remote-tracking branch
2. เลือกว่าจะ integrate หรือรวมงานนั้นเข้ากับ local branch อย่างไร

`git fetch` ทำเฉพาะขั้นแรก มันไม่เปลี่ยน local branch และไม่เปลี่ยนไฟล์ใน working directory จึงเหมาะกับการตรวจดูก่อนว่า remote มีอะไรใหม่

### ใช้อย่างไร? (How)

ตอนนี้กลับมาที่ `rainbow` ซึ่งยังไม่มี commit `green` ให้ fetch จาก `origin`:

```sh
cd ~/rainbow
git fetch
```

ถ้าไม่ระบุ shortname Git จะใช้ `origin` เป็นค่าเริ่มต้น output จะประมาณนี้:

```text
From https://github.com/your-username/rainbow-remote.git
   fc8139c..6987cd2  main       -> origin/main
```

บรรทัด `main -> origin/main` บอกว่า remote-tracking branch `origin/main` ขยับไปชี้ commit `green` แล้ว แต่ local `main` ยังอยู่ที่ `yellow`

ลองดู commit ของทุก branch เพื่อเห็นความต่าง:

```sh
git log --all --oneline --decorate
```

ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
6987cd2 (origin/main) green
fc8139c (HEAD -> feature, origin/feature, main) yellow
7acb333 orange
abc1234 red
```

สิ่งที่ต้องอ่านจาก output นี้คือ `origin/main` ไปอยู่ที่ `green` แล้ว แต่ `main` และ `feature` ใน `rainbow` ยังอยู่ที่ `yellow` อยู่เหมือนเดิม

ลองเปิดไฟล์ `rainbowcolors.txt` ดูได้เลย ไฟล์ยังไม่มีบรรทัด `Green...` เพราะ `fetch` ไม่ได้ integrate ข้อมูลเข้ากับ local branch และไม่เปลี่ยน working directory

> `git fetch` คือการอัปเดต bookmark ของ remote ไม่ใช่การเอางานใหม่มาใส่ใน branch ที่เรากำลังทำงานอยู่

ถ้าอยากระบุ remote เองก็ใช้รูปแบบเต็มได้:

```sh
git fetch origin
```

สองคำสั่งนี้ทำงานกับ remote เดียวกันในสถานการณ์ของเรา

---

## Step 6: merge `origin/main` เข้า local `main`

หลัง fetch เรารู้แล้วว่ามี commit `green` รออยู่ที่ `origin/main` ต่อไปคือ integrate เข้า local `main`

กฎเดิมจากตอนที่ 5 ยังใช้เหมือนเดิม: ก่อนสั่ง merge ต้องยืนอยู่บน branch ที่จะถูกแก้ ในที่นี้คือ local `main`

```sh
git switch main
git merge origin/main
```

ผลลัพธ์จะประมาณนี้:

```text
Switched to branch 'main'
Updating fc8139c..6987cd2
Fast-forward
 rainbowcolors.txt | 1 +
 1 file changed, 1 insertion(+)
```

ตอนนี้ local `main` ขยับจาก `yellow` ไปที่ `green` แล้ว และไฟล์ใน working directory ก็มีบรรทัดสีเขียวตาม commit ใหม่

ในตัวอย่างนี้เป็น fast-forward merge เพราะ `origin/main` ต่ออยู่ข้างหน้าของ `main` โดยไม่มีประวัติอีกสายมาแทรก ถ้า history diverge กัน Git อาจต้องทำ three-way merge ซึ่งจะเรียนต่อในบทถัด ๆ ไป

### แล้ว `git pull` เกี่ยวข้องยังไง?

ลำดับ `git fetch` แล้วตามด้วย `git merge origin/main` ก็คือสิ่งที่ `git pull` รวมไว้ให้ในคำสั่งเดียว ถ้าจะระบุปลายทางให้ชัดเจน ใช้รูปแบบนี้ได้:

```sh
git pull origin main
```

บทนี้แยกสองคำสั่งเพื่อให้เห็นว่า remote-tracking branch ขยับก่อน แล้ว local branch ค่อยขยับตาม การแยกขั้นมีประโยชน์เวลาต้องตรวจงานก่อน integrate โดยเฉพาะ repository ที่มีการเปลี่ยนแปลงเยอะ

> `fetch` = ดาวน์โหลด, `merge` = รวมเข้า branch, `pull` = ทำสองอย่างนี้ต่อกัน

---

## Step 7: prune remote-tracking branch ที่ remote ลบไปแล้ว

ตอนนี้ `rainbow` มี local `feature` และ `origin/feature` ค้างอยู่ ทั้งที่เพื่อนลบ remote branch `feature` ไปแล้ว

ให้ fetch พร้อม prune ด้วย option `-p`:

```sh
git fetch -p
```

output จะประมาณนี้:

```text
From https://github.com/your-username/rainbow-remote.git
 - [deleted]         (none)     -> origin/feature
```

`-p` ย่อมาจาก `prune` ทำให้ Git ลบ remote-tracking branch ที่ไม่มี remote branch ตัวจริงรองรับแล้ว

ตรวจ branch อีกครั้ง:

```sh
git branch --all
```

ตอนนี้ควรเหลือประมาณนี้:

```text
* main
  feature
  remotes/origin/main
```

`feature` ที่ยังเห็นอยู่คือ local branch ของเรา ไม่ใช่ remote-tracking branch ถ้าไม่ต้องการใช้ต่อ ให้ลบหลังจากยืนอยู่บน `main` แล้ว:

```sh
git branch -d feature
```

ผลลัพธ์:

```text
Deleted branch feature (was fc8139c).
```

ตรวจครั้งสุดท้าย:

```sh
git branch --all
```

ควรเหลือ local `main` และ remote-tracking branch `origin/main`:

```text
* main
  remotes/origin/main
```

> ถ้าลบ remote branch ผ่านหน้าเว็บของ hosting service แทนการใช้ `git push origin -d feature` ให้รัน `git fetch -p` ใน local ที่ต้องการเก็บให้สะอาด เพราะการลบบนเว็บไม่ได้ลบ remote-tracking branch ในทุกเครื่องให้เอง

---

## แบบฝึกหัด

แบบฝึกหัดนี้ใช้ `rainbow-remote` จริง จึงควรสร้าง branch ทดลองชื่อ `practice` แทนการแก้ `main` โดยตรง:

1. clone `rainbow-remote` เป็น directory ชื่อ `friend-rainbow-practice` แล้วรัน `git remote -v` และ `git branch --all` ตรวจว่า clone ตั้ง `origin` และสร้าง remote-tracking branch ให้แล้ว
2. ใน `friend-rainbow-practice` สร้าง local branch ชื่อ `practice` จาก `main` ด้วย `git switch -c practice`
3. แก้ไฟล์ใดไฟล์หนึ่งที่ไม่สำคัญ เพิ่มข้อความเล็ก ๆ แล้วทำ `git add` และ `git commit -m "practice"`
4. รัน `git branch -vv` ก่อน push แล้วสังเกตว่า branch `practice` ยังไม่มี upstream จากนั้น push ด้วย `git push origin practice`
5. กลับไปที่ `rainbow` แล้วรัน `git fetch` จากนั้นใช้ `git log --all --oneline --decorate` ตรวจว่า `origin/practice` ปรากฏ แต่ local `practice` ยังไม่มี
6. สร้าง local branch จาก remote-tracking branch ด้วย `git switch practice` แล้วตรวจ `git branch -vv` ว่า branch ตั้ง upstream ให้เอง
7. ลบ `practice` บน remote ด้วย `git push origin -d practice` แล้วกลับมา `rainbow` รัน `git fetch -p` ตรวจว่า `origin/practice` หายไป จากนั้นสลับไป `main` ตรวจให้แน่ใจว่าไม่ต้องเก็บ commit ของแบบฝึกหัดแล้ว แล้วลบ local `practice` ด้วย `git branch -D practice` (ลบแบบบังคับเพราะ branch นี้ยังไม่ได้ merge เข้า `main`)

เป้าหมายของแบบฝึกหัดไม่ใช่จำ output ให้เหมือนตัวอย่าง แต่ให้ตอบได้ว่าในแต่ละจังหวะ branch ไหนอยู่ที่ local, branch ไหนอยู่บน remote และ branch ไหนเป็นแค่ remote-tracking branch

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **clone แล้วคิดว่า terminal เข้า directory ใหม่ให้เอง** — ต้อง `cd friend-rainbow` หลัง clone สำเร็จ
- **เห็น `origin/feature` แล้วคิดว่ามี local `feature` แล้ว** — `origin/feature` เป็น remote-tracking branch ถ้าจะทำงานต้อง `git switch feature` เพื่อสร้าง local branch
- **คิดว่า `git fetch` จะเปลี่ยนไฟล์ให้ทันที** — fetch อัปเดต remote-tracking branch เท่านั้น ต้อง `git merge origin/main` หรือใช้ `git pull origin main` ต่อ
- **สับสน `main` กับ `origin/main`** — `main` เป็น local branch ส่วน `origin/main` เป็นตำแหน่งล่าสุดของ remote branch ที่ local รู้จัก
- **ลืมว่า local repository สองตัวไม่ได้ส่ง commit หากันตรง ๆ** — งานจาก `friend-rainbow` ต้อง push ขึ้น remote ก่อน แล้ว `rainbow` จึง fetch ลงมาได้
- **ลบ branch ที่กำลังยืนอยู่** — Git ไม่ให้ลบ ต้อง `git switch main` หรือ branch อื่นก่อน
- **ลบ branch บนเว็บแล้วคิดว่า local สะอาดแล้ว** — remote-tracking branch อาจยังค้าง ต้อง `git fetch -p`
- **ลบ remote branch จริงโดยไม่ตั้งใจ** — `git push origin -d <branch>` มีผลกับ repository ที่คนอื่นใช้งานร่วมกัน ตรวจชื่อ branch และ remote ด้วย `git remote -v` ก่อนรัน
- **คิดว่า commit หายเพราะลบ branch** — การลบ branch ลบ pointer ไม่ได้ลบ commit ทันที แต่ไม่ควรใช้เป็นวิธีเก็บงานถาวร

---

## สรุป

1. `git clone <URL> <directory_name>` สร้าง local repository จาก remote พร้อมดาวน์โหลด commit และตั้ง `origin` ให้
2. หลัง clone Git สร้าง local branch แค่ branch ที่ `origin/HEAD` ชี้อยู่ แต่สร้าง remote-tracking branch ให้ทุก branch ที่ remote รู้จัก
3. `git switch <branch>` สามารถสร้าง local branch จาก remote-tracking branch พร้อมตั้ง upstream ให้โดยอัตโนมัติ
4. การส่งงานจาก local ไป remote ใช้ `git push` ส่วนการรับข้อมูลจาก remote ใช้ `git fetch`
5. `git fetch` ไม่แตะ local branch และไม่เปลี่ยน working directory การเอางานเข้ามาต้อง `git merge` หรือ `git rebase` ต่อ
6. `git fetch origin` ตามด้วย `git merge origin/main` คือแนวคิดเดียวกับ `git pull origin main` แต่แยกขั้นให้ตรวจงานก่อน integrate ได้
7. การลบ branch ให้ครบอาจต้องลบ remote branch, remote-tracking branch และ local branch แยกกัน
8. `git fetch -p` ใช้ prune remote-tracking branch ที่ remote branch ถูกลบไปแล้ว

ตอนนี้เรามีภาพครบแล้วว่าเวลาเพื่อน push งานขึ้น remote งานไม่ได้โผล่ในเครื่องเราเองทันที เราต้อง fetch ก่อน แล้วค่อยเลือกว่าจะ merge เข้า branch ไหน

จำประโยคนี้ไว้ก็พอ:

> push งานขึ้น remote, fetch ข้อมูลลงมา, merge เมื่อพร้อม

> *ตอนถัดไปเราจะเริ่มเจอกรณีที่ history ของสองฝั่งแยกกันคนละทาง และต้องใช้ three-way merge*

---

## Glossary

- **Clone** — การคัดลอก remote repository มาสร้าง local repository ใหม่ด้วย `git clone`
- **`origin`** — shortname ที่ Git ตั้งให้ remote ต้นทางตอน clone
- **`origin/HEAD`** — pointer ที่บอกว่า default branch ของ remote คือ branch ไหน และ clone ควรเริ่มบน branch ใด
- **Remote branch** — branch ที่อยู่ใน remote repository เช่น `main` หรือ `feature`
- **Remote-tracking branch** — reference ใน local repository เช่น `origin/main` ที่บันทึกตำแหน่งล่าสุดของ remote branch
- **Upstream branch** — remote branch ที่ local branch ตั้งให้ track อยู่ ทำให้ Git รู้ปลายทางของการ push หรือการตรวจสถานะ
- **Fetch** — การดาวน์โหลดข้อมูลจาก remote มาอัปเดต remote-tracking branches โดยยังไม่ integrate เข้า local branch
- **Integrate** — การนำงานที่ดาวน์โหลดมาเข้ากับ local branch ด้วย `merge` หรือ `rebase`
- **Prune** — การลบ remote-tracking branch ที่ remote branch ตัวจริงถูกลบไปแล้ว
- **Ahead / behind** — สถานะที่บอกว่า local branch นำหน้าหรือตามหลัง upstream กี่ commit
- **Pull** — คำสั่งที่รวมการ fetch และการ integrate ไว้ด้วยกัน

---

## Related

- [ตอนที่ 4: Branches](/git/04-branches/) — สร้างและสลับ local branch รวมถึงทำความเข้าใจ branch pointer
- [ตอนที่ 5: Merging](/git/05-merging/) — ใช้ `git merge` และเข้าใจ fast-forward merge ที่บทนี้นำมาใช้กับ `origin/main`
- [ตอนที่ 6: Hosting Services and Authentication](/git/06-hosting-services-and-authentication/) — เตรียม hosting service และ authentication ก่อนเชื่อม remote
- [ตอนที่ 7: Creating and Pushing to a Remote Repository](/git/07-creating-and-pushing-to-a-remote-repository/) — สร้าง `rainbow-remote`, เพิ่ม `origin` และ push branch ครั้งแรก
- [ตอนที่ 9: Three-Way Merges](/git/09-three-way-merges/) — รวมงานเมื่อ history ของสอง branch แยกออกจากกันคนละทาง
