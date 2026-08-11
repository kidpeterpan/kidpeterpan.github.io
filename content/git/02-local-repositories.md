+++
title = 'ตอนที่ 2: Local Repositories'
date = '2026-08-09T00:00:00+07:00'
draft = false
description = 'เปลี่ยนโฟลเดอร์ rainbow ให้เป็น Git repository ด้วย git init และเข้าใจ working directory, staging area, commit history และ .git'
tags = ['programming', 'git', 'tutorial','verified']
+++

---

ในตอนที่แล้วเราเตรียมสนามซ้อมชื่อ `rainbow` ไว้แล้ว ทั้งติดตั้ง Git ตั้งค่า `user.name` และ `user.email` และรู้จัก command line กันพอหอมปากหอมคอ

ตอนนี้ถึงเวลาทำให้โฟลเดอร์ธรรมดา ๆ กลายเป็นโปรเจกต์ที่ Git ดูแลได้

สิ่งที่จะได้ตอนจบบทนี้:

- สร้าง local repository ด้วย `git init -b main`
- รู้ว่าโฟลเดอร์ `.git` มีหน้าที่อะไร และทำไมไม่ควรแก้ไฟล์ข้างในเอง
- แยก working directory, staging area, commit history และ local repository ออกจากกัน
- เข้าใจว่า `git add` และ `git commit` ย้ายข้อมูลระหว่างพื้นที่ไหน
- สร้างไฟล์ `rainbowcolors.txt` และตรวจว่าไฟล์นั้นเป็น untracked file อย่างไร
- แยกความต่างระหว่าง “ไฟล์อยู่ในโฟลเดอร์โปรเจกต์” กับ “Git ติดตามไฟล์แล้ว”

{{< mermaid >}}
flowchart LR
  WD["Working directory<br/>ไฟล์ที่เราแก้จริง"] -->|"git add"| SA["Staging area<br/>รายการที่จะบันทึก"]
  SA -->|"git commit"| CH["Commit history<br/>snapshot ที่บันทึกแล้ว"]
  LR["Local repository<br/>.git"] --- SA
  LR --- CH
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

เปิด Terminal, Git Bash หรือ integrated terminal แล้วเข้าไปในโฟลเดอร์ `rainbow` ที่สร้างไว้จากบทก่อนหน้า

```sh
cd ~/rainbow
pwd
```

ถ้าคุณสร้าง `rainbow` ไว้บน Desktop แทน ให้ใช้คำสั่งนี้:

```sh
cd ~/Desktop/rainbow
pwd
```

ตัวอย่างในบทนี้ใช้ macOS, Linux หรือ Git Bash เป็นหลัก เครื่องหมาย `$` เป็นเพียง command prompt ไม่ต้องพิมพ์ตามไปด้วย

เราจะสร้าง repository แต่ยังไม่สร้าง commit แรก เพราะเรื่อง `git add` และ `git commit` จะลงมือเต็ม ๆ ในตอนถัดไป บทนี้ขอวางแผนที่ให้แม่นก่อน จะได้ไม่รู้สึกว่า Git มีเวทมนตร์ซ่อนอยู่เต็มไปหมด

---

## Step 1: Repository คืออะไร?

**Repository** หรือเรียกสั้น ๆ ว่า **repo** คือโปรเจกต์ที่ Git ใช้ติดตามการเปลี่ยนแปลง

นึกภาพว่าโฟลเดอร์ `rainbow` เป็นบ้านของโปรเจกต์ ส่วน Git เป็นสมุดบันทึกที่อยู่ในบ้านนี้ คอยจำว่าไฟล์ต่าง ๆ เคยมีหน้าตาอย่างไรในแต่ละช่วงเวลา

Repository มีสองแบบที่เราจะเจอบ่อย:

| ชนิด | อยู่ที่ไหน | ใช้ทำอะไร |
|---|---|---|
| Local repository | อยู่บนเครื่องของเรา | ทำงาน แก้ไฟล์ และบันทึกประวัติแบบออฟไลน์ |
| Remote repository | อยู่บนบริการอย่าง GitHub, GitLab หรือ Bitbucket | สำรองงานและแชร์งานกับคนอื่น |

บทนี้และบทถัด ๆ ไปในช่วงแรกจะทำงานกับ **local repository** ก่อน ยังไม่ต้องรีบเชื่อม GitHub เพราะการเข้าใจพื้นที่บนเครื่องตัวเองให้ชัดจะช่วยให้ใช้ remote ได้ง่ายขึ้นมาก

### ทำไมต้องเริ่มจาก local repository? (Why)

เพราะทุกครั้งที่เราเขียนโค้ดหรือแก้ไฟล์ การเปลี่ยนแปลงเริ่มต้นที่เครื่องของเราก่อนเสมอ ถ้าไม่เข้าใจว่า Git บนเครื่องกำลังเก็บอะไรอยู่ เวลาเจอคำว่า branch, push หรือ pull เราจะเหมือนส่งพัสดุโดยไม่รู้ว่าของอยู่ในกล่องไหน

### ใช้อย่างไร? (How)

เริ่มจากนำโฟลเดอร์โปรเจกต์ไป initialize ให้ Git รู้จักด้วย `git init` ใน Step ถัดไป

> GitHub ไม่ใช่ Git และ repository บน GitHub ไม่ใช่จุดเริ่มต้นของทุกอย่าง เราสร้างและตรวจงานใน local repository ได้ก่อนเสมอ

---

## Step 2: เปลี่ยน `rainbow` ให้เป็น Git repository

ตอนนี้ `rainbow` ยังเป็นแค่โฟลเดอร์ธรรมดา ถึงจะมีไฟล์อยู่ข้างใน Git ก็ยังไม่รู้ว่าต้องติดตามอะไร จนกว่าเราจะ initialize repository

รันคำสั่งนี้:

```sh
git init -b main
```

ผลลัพธ์จะหน้าตาประมาณนี้:

```text
Initialized empty Git repository in /Users/your-name/rainbow/.git/
```

path ที่แสดงบนเครื่องคุณอาจไม่เหมือนตัวอย่าง แต่ส่วนท้ายควรลงท้ายด้วย `rainbow/.git/`

คำสั่งนี้แยกได้เป็นสามส่วน:

| ส่วน | ความหมาย |
|---|---|
| `git` | เรียกโปรแกรม Git |
| `init` | initialize หรือเตรียม repository ใหม่ |
| `-b main` | ตั้งชื่อ initial branch เป็น `main` |

ตั้งแต่ Git 2.28 เป็นต้นมา เราสามารถกำหนดชื่อ initial branch ได้ตั้งแต่ตอนสร้าง repository `-b` เป็นรูปย่อของ `--initial-branch`

### ตรวจว่าเราสร้างสำเร็จหรือยัง

ใช้ `git status`:

```sh
git status
```

repository ที่เพิ่งสร้างและยังไม่มี commit อาจแสดงประมาณนี้:

```text
On branch main

No commits yet

nothing to commit (create/copy files and use "git add" to track)
```

ตรวจชื่อ branch ปัจจุบันได้อีกทาง:

```sh
git branch --show-current
```

ควรเห็น:

```text
main
```

ถ้าขึ้นข้อความว่า `not a git repository` ให้เช็ก `pwd` ก่อนว่าอยู่ในโฟลเดอร์ `rainbow` จริงหรือไม่

### ตั้งค่าให้ทุก repo ใช้ `main` เป็นค่าเริ่มต้น

ถ้าไม่อยากพิมพ์ `-b main` ทุกครั้ง ตั้งค่า global config ได้ครั้งเดียว:

```sh
git config --global init.defaultBranch main
```

หลังจากนั้นการรัน `git init` ใน repository ใหม่จะเลือก `main` ให้อัตโนมัติ การตั้งค่านี้มีผลกับ repository ที่จะสร้างใหม่เท่านั้น ไม่ได้เปลี่ยนชื่อ branch ของ repo ที่มีอยู่แล้ว

> `git init` สร้างสมุดบันทึกให้โปรเจกต์ แต่ยังไม่ได้บันทึกไฟล์ใดลงในประวัติ นี่เป็นแค่การเปิดระบบติดตามก่อนเริ่มงานจริง

---

## Step 3: ทำความรู้จัก `.git`

หลังรัน `git init` ให้ดู hidden files ในโฟลเดอร์ปัจจุบัน:

```sh
ls -la
```

คุณควรเห็นโฟลเดอร์ชื่อ `.git` เพิ่มขึ้นมา รายละเอียดข้างในอาจต่างกันเล็กน้อยตามเวอร์ชัน Git แต่ลองดูได้ด้วย:

```sh
ls -la .git
```

โดยทั่วไปจะพบสิ่งที่หน้าตาคล้ายแบบนี้:

```text
HEAD
config
description
hooks
info
objects
refs
```

`.git` คือ local repository ที่เก็บข้อมูลภายในของ Git เช่น branch, staging information และ commit history ส่วนไฟล์ที่เราสร้างหรือแก้ใน `rainbow` อยู่คนละฝั่ง นั่นคือ working directory

### ทำไมต้องระวัง `.git`? (Why)

`.git` เปรียบเหมือนห้องเก็บสมุดบันทึกและชิ้นส่วนความจำของ Git ถ้าเราเปิดดูเพื่อเรียนรู้ไม่เป็นไร แต่ไม่ควรแก้ ลบ หรือย้ายไฟล์ข้างในเอง เพราะอาจทำให้ repository อ่านประวัติไม่ออก

ถ้าอยากเลิกใช้ Git กับโฟลเดอร์นี้จริง ๆ การลบ `.git` จะทำให้ประวัติ Git ของโฟลเดอร์หายไปทั้งหมด ควรทำเฉพาะเมื่อเข้าใจผลกระทบและแน่ใจว่ามีสำเนาไฟล์ที่ต้องการแล้ว

### ใช้อย่างไร? (How)

เวลาทำงานปกติ ให้ใช้คำสั่ง Git เช่น `git status`, `git add` และ `git commit` จัดการ repository แทนการเข้าไปแก้ `.git` โดยตรง

---

## Step 4: 4 พื้นที่ที่ Git ใช้ทำงาน

หัวใจของบทนี้คือการแยกพื้นที่ 4 อย่างให้ออกจากกัน ถ้าจำได้ว่าตอนนี้ไฟล์อยู่ที่ไหน คำสั่ง Git จะเข้าใจง่ายขึ้นทันที

### 1. Working directory: โต๊ะทำงาน

**Working directory** คือไฟล์และโฟลเดอร์ที่เราเห็นและแก้ไขจริงใน `rainbow`

สร้างไฟล์ใหม่ แก้ข้อความในไฟล์ เปลี่ยนชื่อไฟล์ หรือลบไฟล์ ทุกอย่างเกิดขึ้นที่นี่ก่อน

ตอนนี้เราอาจมีโฟลเดอร์แบบนี้:

```text
rainbow/
└── rainbowcolors.txt
```

ไฟล์ `rainbowcolors.txt` อยู่ใน working directory แล้ว แต่ยังไม่ได้แปลว่า Git บันทึกไฟล์นั้นไว้ในประวัติ

### 2. Staging area: พื้นที่เตรียมของ

**Staging area** คือรายการไฟล์ที่เราเลือกแล้วว่าจะรวมไว้ใน commit ถัดไป

ลองนึกถึงการวางของที่จะส่งแยกไว้บนโต๊ะสักโต๊ะ เราอาจมีของอยู่เต็มห้อง แต่ก่อนเรียกคนมารับ เราจะเลือกเฉพาะของที่พร้อมส่งมาวางรวมกันในจุดหนึ่งก่อน staging area ก็ทำหน้าที่คล้ายกัน

คำสั่ง `git add` ใช้ส่งการเปลี่ยนแปลงจาก working directory เข้า staging area 

```sh
git add rainbowcolors.txt
```

ในบทนี้เราจะยังไม่รันคำสั่งนี้จริง เพื่อเก็บขั้นตอนการ add และ commit ไว้ทำต่อในตอนที่ 3 แต่ควรจำทิศทางไว้ก่อน:

```text
working directory --git add--> staging area
```

ในระดับไฟล์จริง staging area ถูกแทนด้วยไฟล์ชื่อ `.git/index` ไฟล์นี้อาจยังไม่ปรากฏทันทีหลัง `git init` และมักจะถูกสร้างเมื่อเรา add ไฟล์แรกเข้าไป

### 3. Commit history: คลัง snapshot

**Commit history** คือประวัติของ commit ทั้งหมดที่เราเคยบันทึก

commit แต่ละตัวคือ snapshot หรือภาพสถานะของโปรเจกต์ ณ จุดเวลาหนึ่ง เช่น:

- ตอนที่มีสีแดงสีเดียว
- ตอนที่เพิ่มสีส้ม
- ตอนที่แก้คำอธิบายของสีแดง

ทุก commit จะมี commit hash ซึ่งเป็นรหัสยาวที่ระบุ commit แบบไม่ซ้ำกัน ตัวอย่างเช่น:

```text
51dc6ecb327578cca503abba4a56e8c18f3835e1
```

เวลาอ้างอิงทั่วไปมักใช้แค่ 7 ตัวแรกได้ ถ้าค่า 7 ตัวนั้นไม่ชนกับ commit อื่นใน repository:

```text
51dc6ec
```

แต่ hash ในโปรเจกต์ของคุณจะไม่เหมือนตัวอย่าง เพราะมันขึ้นอยู่กับข้อมูลและเวลาที่ commit ถูกสร้าง

คำสั่ง `git commit` ใช้ส่งสิ่งที่อยู่ใน staging area เข้า commit history:

```text
staging area --git commit--> commit history
```

commit history ถูกเก็บไว้ภายใน `.git` โดยข้อมูลสำคัญส่วนหนึ่งอยู่ในโฟลเดอร์ `.git/objects` เราไม่จำเป็นต้องเปิดไฟล์ข้างในเอง ใช้คำสั่ง Git อ่านประวัติให้จะปลอดภัยกว่า

### 4. Local repository: กล่องใหญ่ของ Git

**Local repository** ในความหมายที่ละเอียดคือข้อมูล Git ทั้งชุดภายใน `.git` ซึ่งรวม staging area และ commit history เอาไว้

เวลาคนพูดว่า “เปิด repository” เขาอาจหมายถึงทั้งโฟลเดอร์โปรเจกต์ `rainbow` แต่ถ้าพูดให้แม่น:

- project directory คือโฟลเดอร์ `rainbow` ทั้งก้อน
- working directory คือไฟล์งานที่เรากำลังแก้
- local repository คือ `.git` ที่เก็บข้อมูลของ Git

สองคำนี้ถูกใช้ปนกันในชีวิตจริงบ่อย ๆ ไม่ต้องกังวล ขอแค่รู้ว่าไฟล์งานกับข้อมูลภายในของ Git อยู่คนละส่วนกัน

### สรุปภาพรวมของ 4 พื้นที่

| พื้นที่ | เปรียบเทียบ | ของจริงที่เกี่ยวข้อง |
|---|---|---|
| Working directory | โต๊ะที่เราแก้ไฟล์ | ไฟล์ใน `rainbow` |
| Staging area | จุดเตรียมสิ่งที่จะบันทึก | `.git/index` |
| Commit history | ชั้นเก็บ snapshot | ข้อมูลใน `.git/objects` |
| Local repository | ห้อง Git ทั้งห้อง | โฟลเดอร์ `.git` |

> Git ไม่ได้กระโดดจากไฟล์ในโฟลเดอร์ไปเป็นประวัติทันที แต่ไฟล์จะผ่าน staging area ก่อน นี่คือเหตุผลที่ `git add` เป็นขั้นตอนสำคัญ

---

## Step 5: สร้างไฟล์แรกใน `rainbow`

เราจะใช้ไฟล์รายชื่อสีของรุ้งเป็นโปรเจกต์ฝึกตลอดซีรีส์ ให้เปิด `rainbow` ด้วย text editor แล้วสร้างไฟล์ชื่อ `rainbowcolors.txt`

ใส่ข้อความนี้ลงในบรรทัดแรก:

```text
Red is the first color of the rainbow.
```

บันทึกไฟล์แล้วกลับมาที่ terminal จากนั้นตรวจสถานะ:

```sh
git status
```

ผลลัพธ์จะมีส่วนประมาณนี้:

```text
Untracked files:
  (use "git add <file>..." to include in what will be committed)

        rainbowcolors.txt
```

หรือถ้าอยากดูแบบสั้น:

```sh
git status --short
```

ควรเห็น:

```text
?? rainbowcolors.txt
```

เครื่องหมาย `??` หมายถึงไฟล์นี้ยังเป็น **untracked file** หรือไฟล์ที่ Git ยังไม่ติดตาม

### ไฟล์อยู่ในโฟลเดอร์แล้ว ทำไมยัง untracked?

เพราะการสร้างไฟล์ใน working directory ไม่ได้เป็นการขอให้ Git บันทึกไฟล์โดยอัตโนมัติ Git ตั้งใจให้เราระบุเองว่าไฟล์ไหนควรเข้า version control เพื่อไม่ให้ไฟล์ชั่วคราว เช่น log, password หรือไฟล์ build หลุดเข้าไปในประวัติแบบไม่รู้ตัว

ตอนนี้สถานะของเราคือ:

```text
rainbowcolors.txt
└── อยู่ใน working directory
    └── ยังไม่อยู่ใน staging area
        └── ยังไม่อยู่ใน commit history
```

### แล้ว tracked file คืออะไร?

ทันทีที่รัน `git add` Git จะรู้จักไฟล์นั้นใน staging area และไฟล์จะไม่แสดงเป็น untracked อีกต่อไป เมื่อรัน `git commit` ต่อ ไฟล์ก็จะมีประวัติถาวรใน local repository ด้วย สำหรับ flow ที่เราจะใช้ในซีรีส์นี้จึงจำเป็นต้องทำสองขั้นต่อกัน:

ภาพรวมคือ:

```text
สร้างไฟล์
  ↓
untracked file ใน working directory
  ↓ git add
ไฟล์ใน staging area
  ↓ git commit
tracked file ใน commit history
```

คำว่า tracked ไม่ได้หมายความว่าไฟล์จะถูกส่งขึ้น GitHub แล้ว มันหมายความว่า local repository ของเครื่องนี้มีข้อมูลสำหรับติดตามไฟล์นั้นแล้ว ส่วน remote repository เป็นอีกขั้นหนึ่งที่เราจะเรียนภายหลัง

> สร้างไฟล์ = ทำให้ไฟล์มีตัวตน, `git add` = เลือกไฟล์เข้าร่าง, `git commit` = บันทึก snapshot จริง ๆ

---

## Step 6: ทดลองอ่านสถานะโดยไม่ต้องเปิด `.git`

เราสามารถเข้าใจการทำงานของ Git ได้โดยไม่ต้องแกะไฟล์ภายใน `.git` เอง คำสั่งต่อไปนี้มีประโยชน์มาก:

```sh
git status
git branch --show-current
git rev-parse --show-toplevel
```

แต่ละคำสั่งตอบคำถามคนละแบบ:

| คำสั่ง | คำถามที่ตอบ |
|---|---|
| `git status` | ตอนนี้มีไฟล์ไหนเปลี่ยนแปลงหรือยังไม่ได้ติดตาม? |
| `git branch --show-current` | ตอนนี้เราอยู่บน branch อะไร? |
| `git rev-parse --show-toplevel` | รากของ repository นี้อยู่ที่ไหน? |

ลองเข้าไปในโฟลเดอร์ย่อยแล้วรัน `git status` อีกครั้งก็ได้ Git จะไล่หา `.git` จากตำแหน่งปัจจุบันขึ้นไปให้เอง ตราบใดที่ยังอยู่ภายใน repository เดิม

```sh
mkdir notes
cd notes
git status
cd ..
```

`notes` เป็น working directory ส่วนหนึ่งของ repository เดิม ไม่ได้กลายเป็น repository ใหม่เพียงเพราะเราเข้าไปอยู่ข้างใน

ถ้าอยากสร้าง repository ซ้อนกันจริง ๆ ต้องรัน `git init` ในโฟลเดอร์ย่อย ซึ่งเป็นเรื่องที่ควรเลี่ยงในช่วงเริ่มต้น เพราะจะทำให้สับสนว่า Git กำลังอ่าน `.git` ของโฟลเดอร์ไหน

---

## แบบฝึกหัด

ลองทำโดยไม่เปิดเฉลยก่อน:

1. เข้าไปใน `rainbow` แล้วรัน `git init -b main` จากนั้นใช้ `git status` ตรวจว่า repository ยังไม่มี commit
2. ใช้ `ls -la` ยืนยันว่ามี `.git` เพิ่มขึ้นมา แต่ยังไม่ต้องเปิดหรือแก้ไฟล์ใด ๆ ภายในนั้น
3. รัน `git branch --show-current` และตรวจว่าชื่อ branch เริ่มต้นเป็น `main`
4. สร้าง `rainbowcolors.txt` ด้วย text editor แล้วใส่ข้อความ `Red is the first color of the rainbow.`
5. รัน `git status --short` แล้วอธิบายว่า `?? rainbowcolors.txt` หมายถึงอะไร
6. วาดลูกศร 2 เส้นให้ครบ: `working directory → staging area → commit history` พร้อมเขียนชื่อคำสั่งบนลูกศร
7. ตอบด้วยคำของตัวเองว่า `.git` ต่างจาก `rainbow` ทั้งโฟลเดอร์อย่างไร

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **รัน `git init` ผิดโฟลเดอร์** — ใช้ `pwd` และ `git rev-parse --show-toplevel` ตรวจตำแหน่งก่อนเริ่มงาน
- **คิดว่าไฟล์ที่อยู่ใน `rainbow` ถูก Git ติดตามแล้ว** — ไฟล์ใหม่ยังเป็น untracked จนกว่าจะ `git add`; ถ้าต้องการให้มีประวัติใน repository ต้อง `git commit` ต่อ
- **ลบ `.git` เพื่อแก้ปัญหาแบบเดาสุ่ม** — การลบจะทำให้ประวัติ local หาย ให้หยุดก่อนและตรวจด้วย `git status` หรือขอความช่วยเหลือ
- **คาดหวังว่าจะเห็น `.git/index` ทันทีหลัง `git init`** — staging area อาจยังไม่มีไฟล์ `index` จนกว่าจะ add ไฟล์แรก
- **สับสนระหว่าง local repository กับ remote repository** — local อยู่บนเครื่อง ส่วน remote อยู่บนบริการโฮสต์และยังไม่เกี่ยวกับบทนี้
- **ใช้ `git add .` โดยไม่ดูว่าในโฟลเดอร์มีอะไร** — ตอนเริ่มต้นควรตรวจ `git status` และเลือกไฟล์ให้รู้ว่ากำลังจะ stage อะไร
- **สร้าง repository ซ้อนในโฟลเดอร์ย่อยโดยไม่ตั้งใจ** — ถ้า `git status` ให้ผลแปลก ๆ ให้ตรวจว่ามี `.git` มากกว่าหนึ่งระดับหรือไม่
- **คิดว่า commit hash ของทุกคนต้องเหมือนกัน** — hash ขึ้นอยู่กับข้อมูลใน commit ของแต่ละ repository จึงไม่เหมือนกันเป็นเรื่องปกติ

---

## สรุป

1. `git init -b main` เปลี่ยนโฟลเดอร์ธรรมดาให้กลายเป็น local Git repository
2. `.git` คือพื้นที่เก็บข้อมูลภายในของ Git อย่าแก้หรือลบไฟล์ข้างในโดยไม่จำเป็น
3. Working directory คือที่ที่เราแก้ไฟล์จริง
4. Staging area คือจุดเตรียมรายการที่จะเข้า commit ถัดไป
5. Commit history คือคลัง snapshot ที่บันทึกแล้ว
6. Local repository คือข้อมูล Git ทั้งชุดที่อยู่ใน `.git`
7. `git add` ย้ายการเปลี่ยนแปลงจาก working directory ไป staging area
8. `git commit` ย้ายสิ่งที่เลือกไว้จาก staging area ไป commit history
9. ไฟล์ที่เพิ่งสร้างอย่าง `rainbowcolors.txt` ยังเป็น untracked file จนกว่าจะถูก `git add` และจะมีประวัติถาวรหลัง `git commit`
10. `git status` คือคำสั่งหลักที่ช่วยบอกว่าไฟล์ตอนนี้อยู่ในสถานะไหน

ตอนนี้เราเปิดบ้านให้ Git เข้ามาจัดการแล้ว แต่ยังไม่ได้เก็บภาพแรกของบ้านไว้ในอัลบั้ม บทถัดไปเราจะเลือกไฟล์เข้า staging area และสร้าง commit แรกจริง ๆ

> *ตอนถัดไป: `git add` และ `git commit` จะทำให้ `rainbowcolors.txt` เปลี่ยนจากไฟล์ที่ Git ยังไม่รู้จัก กลายเป็นส่วนหนึ่งของประวัติโปรเจกต์*

---

## Glossary

- **Repository (repo)** — โปรเจกต์ที่ Git ใช้ติดตามการเปลี่ยนแปลง
- **Local repository** — ข้อมูล Git ที่เก็บอยู่บนเครื่องของเรา
- **Remote repository** — repository ที่เก็บอยู่บนบริการโฮสต์ เช่น GitHub หรือ GitLab
- **Initialize** — การเตรียมโฟลเดอร์ให้ Git เริ่มจัดการได้ด้วย `git init`
- **Working directory** — พื้นที่ที่เราแก้ไข สร้าง และลบไฟล์จริง
- **Staging area** — พื้นที่เตรียมรายการไฟล์สำหรับ commit ถัดไป
- **Commit** — snapshot หนึ่งของโปรเจกต์ที่บันทึกไว้ในประวัติ
- **Commit history** — ประวัติของ commit ทั้งหมดใน repository
- **Commit hash** — รหัสที่ระบุ commit แต่ละตัวแบบไม่ซ้ำกัน
- **Tracked file** — ไฟล์ที่ Git รู้จักและติดตามแล้ว โดยไฟล์ใหม่จะพ้นสถานะ untracked หลัง `git add`
- **Untracked file** — ไฟล์ที่อยู่ใน working directory แต่ Git ยังไม่ได้ติดตาม
- **Initial branch** — branch แรกที่ถูกสร้างตอน initialize repository
- **Hidden file/directory** — ไฟล์หรือโฟลเดอร์ที่ปกติไม่แสดงในรายการทั่วไป เช่น `.git`

---

## Related

- [ตอนที่ 1: Git and the Command Line](/git/01-git-and-the-command-line/) — เตรียม command line, ติดตั้ง Git และสร้างโฟลเดอร์ `rainbow`
- [ตอนที่ 3: Making a Commit](/git/03-making-a-commit/) — ลงมือใช้ `git add` และ `git commit` เพื่อสร้าง commit แรก
