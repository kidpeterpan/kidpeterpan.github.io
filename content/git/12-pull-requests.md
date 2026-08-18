+++
title = 'ตอนที่ 12: Pull Requests'
date = '2026-08-18T00:00:00+07:00'
draft = false
description = 'เดินครบ 9 ขั้นของ pull request process ตั้งแต่สร้าง topic branch, push ด้วย trick --set-upstream, เปิด PR บน hosting service, review, merge แบบ non-fast-forward จนถึง cleanup ด้วย git pull -p'
tags = ['programming', 'git', 'tutorial']
+++

---

ถึงตรงนี้เรารวมงานเข้าด้วยกันมาครบทุกท่าแล้ว — fast-forward merge ในตอนที่ 5, three-way merge ในตอนที่ 9, แก้ conflict ในตอนที่ 10 และ rebase ในตอนที่ 11 — แต่สังเกตไหมว่าทุกครั้งที่ผ่านมา **เราเป็นคนกดรวมเองทั้งหมด** พิมพ์คำสั่งในเครื่องตัวเอง แล้ว push ผลลัพธ์ขึ้น remote จบ

ในทีมจริงมันไม่ได้ง่ายแบบนั้น ก่อนงานของเราจะเข้า `main` ที่คนทั้งทีมใช้ร่วมกัน มักต้องมีคนอื่นดูก่อนว่าโค้ดใช้ได้จริง ไม่พังของเดิม และเขียนในแบบที่ทีมอ่านรู้เรื่อง คำถามคือแล้วจะให้เพื่อนดูงานเรายังไง? บอกให้เขา clone แล้ว checkout branch เราเองเหรอ? แล้วเขาจะบอกเราว่า "บรรทัดนี้ผิดนะ" ผ่านช่องทางไหน — แชทส่วนตัว? อีเมล?

**pull request** คือคำตอบของเรื่องนี้ และมันคือสิ่งที่ทีม software ทั่วโลกใช้กันทุกวัน

แต่มีเรื่องที่ต้องเคลียร์ก่อนเลย: pull request **ไม่ใช่ฟีเจอร์ของ Git** มันเป็นฟีเจอร์ของ hosting service อย่าง GitHub, GitLab, Bitbucket ที่สร้างขึ้นมาครอบ Git อีกที ไม่มีคำสั่ง `git pull-request` ให้พิมพ์ และมันก็ **ไม่เกี่ยวกับคำสั่ง `git pull`** ที่เราใช้มาตลอดเลยแม้แต่นิดเดียว บังเอิญชื่อคล้ายกันเฉย ๆ

บทนี้เราจะเดินครบทั้ง process ของจริงในโปรเจกต์ Rainbow — สร้าง branch, push, เปิด PR, review, merge, แล้วเก็บกวาดให้เรียบร้อย

สิ่งที่จะได้ตอนจบบทนี้:

- อธิบายได้ว่า pull request ต่างจาก `git merge` ที่ทำในเครื่องยังไง และทำไมทีมถึงเลือกใช้
- ไล่ทั้ง 9 ขั้นของ pull request process ได้ว่าขั้นไหนเกิดใน local ขั้นไหนเกิดบนเว็บ
- push branch ใหม่ขึ้น remote พร้อมตั้ง upstream branch ในคำสั่งเดียว โดยไม่ต้องจำ syntax
- เปิด pull request โดยระบุ source branch กับ target branch ได้ถูกทาง
- อ่าน diff ของ PR บนหน้าเว็บ และใช้ commenting feature รับ feedback
- บอกได้ว่าทำไม merge ผ่าน PR ถึงได้ merge commit ทั้งที่ history ไม่ diverge
- เก็บกวาดหลัง merge ครบทั้ง remote branch, local branch และ remote-tracking branch ด้วย `git pull -p` กับ `git branch -d`

{{< mermaid >}}
flowchart LR
  A["rainbow: git switch -c topic<br/>แล้ว commit pink"] --> B["git push เปล่า ๆ<br/>copy คำสั่ง --set-upstream"]
  B --> C["เปิด PR บน hosting service<br/>source: topic → target: main"]
  C --> D["review + comment<br/>แล้ว approve"]
  D --> E["merge PR<br/>non-fast-forward → merge commit"]
  E --> F["ลบ remote topic branch"]
  F --> G["git pull -p + git branch -d<br/>sync ทั้ง rainbow และ friend-rainbow"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ใช้ทั้งสาม repository ที่สร้างมาตลอดซีรีส์ คือ local repository สองตัว (`rainbow` กับ `friend-rainbow`) และ remote repository หนึ่งตัว (`rainbow-remote`) โดยสมมติว่าทั้งสามฝั่ง sync กันอยู่ — มีแค่ branch `main` และ `main` ทุกฝั่งชี้ commit เดียวกัน

เข้าไปตรวจสถานะฝั่งเราก่อน:

```sh
cd ~/rainbow
git status
git branch --all
```

ควรเห็นว่าไม่มีงานค้าง และมีแค่ `main` กับ remote-tracking branch ของมัน:

```text
On branch main
nothing to commit, working tree clean
```

```text
* main
  remotes/origin/main
```

บทนี้จะแก้ไฟล์ `othercolors.txt` ที่สร้างไว้ตั้งแต่ตอนที่ 9 ตรวจว่ามันยังอยู่ด้วย:

```sh
cat othercolors.txt
```

ในไฟล์จะมีกี่บรรทัดก็ได้ ขึ้นกับว่าทำมาถึงตอนไหนแล้ว (ถ้าทำครบถึงตอนที่ 11 จะมี Brown, Gray, Black) เพราะบทนี้เราจะ **เพิ่มบรรทัดต่อท้าย** เท่านั้น ไม่ได้แตะของเดิม

> ⚠️ ถ้า `git status` ยังมีงานค้าง หรือสองฝั่ง local ยังไม่ sync กับ remote ให้เคลียร์ให้เรียบร้อยก่อน ไม่งั้นจะไปสะดุดตอนเปิด PR

อีกอย่างที่ต้องมีคือ **สิทธิ์เข้าถึง remote repository บนเว็บ** เพราะครึ่งหนึ่งของบทนี้เกิดในหน้าเว็บของ hosting service ไม่ใช่ใน terminal เปิด browser ค้างไว้ที่หน้า `rainbow-remote` ได้เลย

> ⚠️ ถ้าใช้ account ของบริษัท อาจเจอ policy ที่ตั้งเงื่อนไขเพิ่ม เช่น บังคับว่าต้องมี reviewer กี่คนถึงจะ merge ได้ หรือห้าม merge PR ของตัวเอง ทำให้ทำตามบทนี้ไม่ครบ ตอนที่ 6 ถึงแนะนำให้ใช้ personal account สำหรับซีรีส์นี้ ตัวอย่างทั้งหมดสมมติว่าไม่มีการตั้งค่าพิเศษใด ๆ

---

## Step 1: pull request คืออะไร และ 9 ขั้นของมัน

pull request คือฟีเจอร์ของ hosting service ที่เอาไว้ทำสามอย่างพร้อมกัน:

1. **แชร์งานบน branch** ให้เพื่อนร่วมงานเห็นว่าเราแก้อะไรไปบ้าง
2. **รวบรวม feedback** ผ่านการ comment ลงไปที่บรรทัดในไฟล์ได้ตรง ๆ
3. **รวมงานนั้นเข้า branch ปลายทางบน remote** เมื่อทุกคนพอใจแล้ว

ศัพท์ที่จะได้ยินบ่อยคือ **open** a pull request หมายถึงสร้าง PR ขึ้นมา และ **close** หมายถึงปิดมัน — ซึ่งเกิดได้สองแบบ คือปิดเพราะ merge เสร็จแล้ว หรือปิดทิ้งเพราะตัดสินใจว่าไม่ merge

PR รวมงานได้ทั้งแบบ merge และแบบ rebase (ที่เรียนไปในตอนที่ 11) แต่ default ของ hosting service ส่วนใหญ่คือ merge บทนี้จึงเรียกกระบวนการรวมงานผ่าน PR ว่า "merging a pull request" ตลอดทั้งบท

### 9 ขั้นของ pull request process

จุดที่ทำให้คนสับสนบ่อยที่สุดคือ PR มีทั้งส่วนที่ทำใน terminal และส่วนที่ทำบนเว็บ สลับไปมา ตารางนี้แยกให้เห็นชัดว่าขั้นไหนอยู่ตรงไหน:

| ขั้น | สิ่งที่ทำ | ทำที่ไหน |
|---|---|---|
| 1 | สร้าง branch ใน local repository | terminal |
| 2 | ทำงานแล้ว commit บน branch นั้น | terminal |
| 3 | push branch ขึ้น remote repository | terminal |
| 4 | open pull request | เว็บ |
| 5 | ให้คน review แล้วรับ feedback มาแก้ | เว็บ (+ terminal ถ้าต้องแก้) |
| 6 | ได้รับ approve | เว็บ |
| 7 | merge the pull request | เว็บ |
| 8 | ลบ remote branch (ถ้าเป็น topic branch) | เว็บ |
| 9 | pull เพื่อ sync local แล้วลบ local branch กับ remote-tracking branch | terminal |

ขั้น 1–3 กับขั้น 9 คือสิ่งที่เราทำเป็นอยู่แล้วทั้งหมด ของใหม่จริง ๆ ในบทนี้คือขั้น 4–8 ที่เกิดบนเว็บล้วน ๆ

> **ประเด็นที่ต้องจำ:** ชื่อ "pull request" ไม่ได้เกี่ยวอะไรกับคำสั่ง `git pull` เลย `git pull` คือคำสั่งของ Git ที่ดึงงานจาก remote ลงเครื่อง ส่วน pull request คือฟีเจอร์บนเว็บที่ขอให้คนอื่นรวม branch ของเราเข้าไป คนละเรื่องกันสิ้นเชิง

### ศัพท์และขั้นตอนของแต่ละ hosting service ไม่เหมือนกัน

อันนี้สำคัญ เพราะบทนี้บอก "กดปุ่ม" ไม่ได้แบบตายตัว หน้าตา UI ของแต่ละเจ้าต่างกันและเปลี่ยนบ่อย ตารางนี้เทียบคำที่ใช้เรียกของเดียวกัน:

| เรื่อง | GitHub | GitLab | Bitbucket |
|---|---|---|---|
| ชื่อฟีเจอร์ | Pull request | **Merge request** | Pull request |
| ชื่อย่อที่คนใช้ | PR | MR | PR |
| เมนูที่ไปหา | แท็บ **Pull requests** | เมนู **Code → Merge requests** | เมนู **Pull requests** |
| ปุ่มรวมงาน | Merge pull request | Merge | Merge |

ถ้าเจอ UI ที่ไม่ตรงกับที่เขียนไว้ ให้เปิด documentation ของ hosting service ที่ใช้ประกอบ หลักการทั้ง 9 ขั้นเหมือนกันหมด ต่างแค่ชื่อปุ่มกับที่วางเมนู

### แล้วทำไมต้อง PR ในเมื่อ merge เองก็ได้?

เหตุผลข้อใหญ่สุดคือ **commenting feature** — PR ให้เรากับเพื่อนร่วมงาน comment ลงไปที่บรรทัดเจาะจงในไฟล์ ตอบ comment กันไปมา และเปิดเป็น discussion thread ได้ ทั้งหมดนี้ผูกติดอยู่กับตัวงานโดยตรง ไม่ใช่ลอยอยู่ในแชทที่หาย้อนหลังไม่เจอ

เหตุผลข้อที่คนมักลืมคือ **PR ทำงานทั้งหมดบนเว็บ** แปลว่าคนที่ใช้ Git ไม่เป็นเลยก็ยัง review งานเราได้ ลองนึกถึงคนเขียนหนังสือที่แตก branch `chapter_nine` ไว้เขียนบทที่ 9 แล้วอยากให้ editor ตรวจก่อนรวมเข้า `main` — editor ไม่รู้จัก Git เลยสักนิด ถ้าให้ clone แล้ว checkout branch เองก็จบเห่ แต่ถ้าเปิด PR แล้วส่ง URL ไปให้ editor แค่กดเปิดลิงก์ก็เห็นบรรทัดที่เปลี่ยนทั้งหมด แล้ว comment กลับมาได้เลย

พอ editor comment มา คนเขียนก็แก้ในเครื่องตัวเอง commit เพิ่ม แล้ว push ขึ้น branch เดิม — **PR จะอัปเดตตัวเองอัตโนมัติ** ไม่ต้องปิดแล้วเปิด PR ใหม่ นี่คือจุดที่ทำให้รอบ review หมุนได้เร็ว

---

## Step 2: สร้าง topic branch แล้ว commit งาน

เริ่มขั้น 1 กับ 2 กันเลย ใน `rainbow` สร้าง branch ใหม่ชื่อ `topic` พร้อมกระโดดเข้าไปในคำสั่งเดียวด้วย `git switch -c` (เจอครั้งแรกในตอนที่ 4):

```sh
cd ~/rainbow
git switch -c topic
```

ผลลัพธ์:

```text
Switched to a new branch 'topic'
```

> **ทำไมชื่อ `topic`?** เพราะ branch ที่แตกออกมาทำงานเฉพาะส่วนใดส่วนหนึ่งของโปรเจกต์เรียกว่า **topic branch** (บางทีเรียก feature branch) ในโปรเจกต์จริงเราจะตั้งชื่อให้บอกได้ว่าทำอะไร เช่น `add-login-page` หรือ `fix-payment-bug` ไม่ใช่ `topic` โล้น ๆ แบบนี้ ที่ใช้ชื่อกลาง ๆ ในบทเรียนเพราะอยากให้โฟกัสที่ process ไม่ใช่ที่ชื่อ

ทีนี้ทำงานของเรา เปิด `othercolors.txt` แล้วเพิ่มบรรทัดนี้ **ต่อท้าย** แล้วเซฟ:

```text
Pink is not a color in the rainbow.
```

add แล้ว commit ตามปกติ:

```sh
git add othercolors.txt
git commit -m "pink"
```

ผลลัพธ์จะมีหน้าตาประมาณนี้: hash ในเครื่องเราจะไม่เหมือนตัวอย่าง

```text
[topic 4c35a5c] pink
 1 file changed, 1 insertion(+)
```

ตรวจว่า commit ลงถูก branch:

```sh
git log --oneline --decorate --all
```

```text
4c35a5c (HEAD -> topic) pink
7c09136 (main, origin/main) ...
```

จุดที่ต้องอ่านให้ออกคือ `HEAD` อยู่ที่ `topic` ส่วน `main` กับ `origin/main` ยังค้างอยู่ที่ commit เดิม — งาน `pink` ยังไม่ไปไหนทั้งนั้น อยู่แค่ใน branch `topic` ในเครื่องเรา

ถึงตรงนี้ `topic` เป็น local branch ที่เพิ่งเกิดใหม่และ **ยังไม่มี upstream branch** ซึ่งแปลว่า remote ยังไม่รู้จักมันเลยด้วยซ้ำ (upstream branch คือ remote branch ที่ local branch ตัวหนึ่ง track อยู่ — เจอครั้งแรกในตอนที่ 7 และตั้งค่าด้วย `git branch -u` ในตอนที่ 9)

---

## Step 3: push branch ขึ้น remote ด้วย trick ที่ไม่ต้องจำ syntax

ขั้น 3 คือ push `topic` ขึ้น remote ตรงนี้มี trick ที่คนใช้ Git ทำงานจริงใช้กันแทบทุกคน

ก่อนอื่นดูก่อนว่าตอนนี้ upstream ของแต่ละ branch เป็นยังไง ด้วย `git branch -vv` (`-vv` คือ verbose สองชั้น ให้แสดง upstream branch ในวงเล็บเหลี่ยมด้วย):

```sh
git branch -vv
```

```text
  main  7c09136 [origin/main] ...
* topic 4c35a5c pink
```

บรรทัด `main` มี `[origin/main]` กำกับอยู่ = มี upstream แล้ว ส่วน `topic` ว่างเปล่า = ยังไม่มี ตรงบรรทัด `main` ถ้า hash กับ commit message ในเครื่องเราไม่ตรงกับตัวอย่างก็ไม่ต้องกังวล ขอแค่เห็นว่ามีวงเล็บเหลี่ยมกำกับอยู่ก็พอ

ในตอนที่ 9 เราตั้ง upstream ด้วย `git branch -u origin/main` แต่ความจริงคือคนใช้ Git **ลืมตั้ง upstream กันเป็นประจำ** แล้วก็จำ syntax ไม่ได้อีกต่างหาก

วิธีที่ง่ายกว่ามาก: สั่ง `git push` เปล่า ๆ ไปเลย แล้วให้ Git บอกเอง

```sh
git push
```

Git จะไม่ push ให้ แต่จะพิมพ์คำสั่งที่ถูกต้องมาให้เราแทน:

```text
fatal: The current branch topic has no upstream branch.
To push the current branch and set the remote as upstream, use

    git push --set-upstream origin topic

To have this happen automatically for branches without a tracking
upstream, see 'push.autoSetupRemote' in 'git help config'.
```

เห็นไหมว่า Git เดาให้ครบเลย ทั้ง shortname (`origin`) และชื่อ remote branch ปลายทาง (`topic`) — มันสมมติว่าเราอยากได้ remote branch ชื่อเดียวกับ local branch ซึ่งเป็นสิ่งที่เราอยากได้จริง ๆ ในเกือบทุกกรณี

**copy บรรทัดนั้นมาวางแล้วรันได้เลย**

```sh
git push --set-upstream origin topic
```

ผลลัพธ์จะประมาณนี้:

```text
Enumerating objects: 5, done.
...
To https://github.com/your-username/rainbow-remote.git
 * [new branch]      topic -> topic
branch 'topic' set up to track 'origin/topic'.
```

คำสั่งเดียวได้สองอย่าง: **push branch ขึ้น remote** (`* [new branch]`) และ **ตั้ง upstream branch ให้เรียบร้อย** (`set up to track 'origin/topic'`)

ตรวจซ้ำด้วย `git branch -vv` อีกรอบ:

```sh
git branch -vv
```

```text
  main  7c09136 [origin/main] ...
* topic 4c35a5c [origin/topic] pink
```

คราวนี้ `topic` มี `[origin/topic]` กำกับแล้ว ต่อจากนี้ `git push` กับ `git pull` เปล่า ๆ บน branch นี้จะรู้ปลายทางเองโดยไม่ต้องระบุอะไรอีก

> **จำ pattern นี้ไว้ใช้กับ branch ใหม่ทุกตัว:** อย่าไปนั่งจำ syntax ของ `--set-upstream` เอง แค่พิมพ์ `git push` เปล่า ๆ แล้ว copy คำสั่งที่ Git generate ให้ เร็วกว่าและไม่มีทางพิมพ์ชื่อ branch ผิด

### ของแถมสองอย่างจาก output

**อย่างแรก** ถ้าใช้ GitHub จะเห็นบรรทัดแบบนี้แทรกอยู่ใน output ด้วย:

```text
remote: Create a pull request for 'topic' on GitHub by visiting:
remote:      https://github.com/your-username/rainbow-remote/pull/new/topic
```

remote ใบ้ URL สำหรับเปิด PR มาให้เลย กด (หรือ copy ไปวางใน browser) แล้วข้ามไป Step 4 ได้ทันที GitLab ก็พิมพ์บรรทัดคล้ายกันแต่เป็น merge request

**อย่างที่สอง** บรรทัดสุดท้ายของข้อความเตือนพูดถึง `push.autoSetupRemote` ถ้าตั้งค่านี้ไว้ Git จะตั้ง upstream ให้อัตโนมัติทุกครั้งที่ push branch ใหม่ ไม่ต้อง copy คำสั่งเลย:

```sh
git config --global push.autoSetupRemote true
```

แต่ในบทเรียนนี้แนะนำให้ยังไม่ตั้ง เพราะการเห็นข้อความเตือนแล้ว copy เองสองสามครั้งจะช่วยให้จำได้ว่า upstream branch คืออะไรและตั้งเมื่อไหร่ ค่อยไปเปิดตอนคล่องแล้วก็ยังไม่สาย

> **หมายเหตุ:** trick นี้ตั้งอยู่บนสมมติฐานว่าเราอยากให้ remote branch ชื่อเดียวกับ local branch ถ้าไม่ใช่ ต้องแก้ชื่อในคำสั่งที่ Git ให้มาเองก่อนรัน

---

## Step 4: open pull request บน hosting service

ตอนนี้ remote มี branch `topic` แล้ว ขั้น 4 คือไปสร้าง PR บนเว็บ

สิ่งที่ต้องนิยามให้ถูกมีสองอย่าง และมันคือจุดที่คนพลาดกันบ่อยที่สุด:

| ช่อง | ในตัวอย่างนี้ | ความหมาย |
|---|---|---|
| **source branch** | `topic` | branch ที่มีงานของเรา — ต้นทาง |
| **target branch** | `main` | branch ที่จะรับงานเข้าไป — ปลายทาง |

อ่านทิศทางว่า "รวม `topic` **เข้าไปใน** `main`" ถ้าสลับสองช่องนี้ เท่ากับสั่งรวม `main` เข้า `topic` ซึ่งคือ merge ผิดทางไปคนละเรื่อง

> ⚠️ เช็กสองช่องนี้ทุกครั้งก่อนกดสร้าง โดยเฉพาะเวลาโปรเจกต์มี branch ปลายทางหลายตัว เช่น `main` กับ `develop` — hosting service จะเลือก default branch ให้เป็น target อัตโนมัติ ซึ่งไม่จำเป็นต้องเป็นตัวที่เราต้องการ

ขั้นตอนคร่าว ๆ (ชื่อเมนูดูจากตารางใน Step 1):

1. เปิดหน้า `rainbow-remote` บน hosting service
2. เข้าเมนู pull requests / merge requests แล้วกดสร้างใหม่
3. เลือก source = `topic`, target = `main`
4. ใส่ **title** — ฟิลด์นี้เป็นฟิลด์เดียวที่ hosting service ส่วนใหญ่บังคับ ใส่ว่า `Adding the color pink`
5. ฟิลด์อื่น (description, reviewer, label) ปล่อยว่างไว้ก่อนได้
6. กดสร้าง

> **หมายเหตุ:** hosting service มักเติม title ให้อัตโนมัติด้วย commit message ล่าสุด ซึ่งกรณีนี้คือ `pink` ให้แก้เป็น `Adding the color pink` เพราะ title ของ PR ควรอธิบายภาพรวมของงานทั้งก้อน ไม่ใช่ชื่อ commit สุดท้าย เหมือน commit message และชื่อ branch ถ้าทำงานเป็นทีมควรถามก่อนว่าทีมมี convention ของ title แบบไหน

> **หมายเหตุ:** GitLab กับ Bitbucket มี option ให้ติ๊กตอนสร้าง PR ว่า **ลบ source branch อัตโนมัติหลัง merge** จะติ๊กหรือไม่ก็ได้ ถ้าติ๊กไว้ก็แค่ข้ามขั้น 8 ไปได้เลยเพราะมันลบให้เอง แต่ยังไงก็ต้องไปยืนยันด้วยตาว่า remote branch หายไปจริง

---

## Step 5: review, comment แล้ว approve

ขั้น 5 กับ 6 คือหัวใจของ PR ทั้งหมด

เปิด PR ที่เพิ่งสร้างขึ้นมาดู จะมีแท็บที่แสดง **ไฟล์ที่เปลี่ยน** (GitHub เรียก Files changed, GitLab เรียก Changes) ในนั้นจะเห็น diff ของ `othercolors.txt` แสดงแบบนี้:

| สัญลักษณ์ | สี | ความหมาย |
|---|---|---|
| `-` | แดง | บรรทัดที่ถูกลบออก |
| `+` | เขียว | บรรทัดที่ถูกเพิ่มเข้ามา |

ในเคสของเรา จะเห็นเป็นสีเขียวบรรทัดเดียวคือ `+ Pink is not a color in the rainbow.` เพราะเราแค่เพิ่มบรรทัดใหม่ ไม่ได้ลบอะไรเลย

นี่คือหน้าตาเดียวกับที่ `git diff` แสดงใน terminal เป๊ะ ๆ ต่างแค่ว่า **บนเว็บเรา comment ลงไปที่บรรทัดได้** ซึ่งใน terminal ทำไม่ได้ ลองเอาเมาส์ไปชี้ที่เลขบรรทัดใน diff ดู จะเห็นปุ่มเล็ก ๆ โผล่มาให้กด comment

### รอบของการแก้ feedback

ถ้า reviewer comment มาว่าต้องแก้ ขั้นตอนคือ:

```sh
# แก้ไฟล์ในเครื่อง แล้ว
git add <ไฟล์ที่แก้>
git commit -m "<ข้อความอธิบายการแก้>"
git push
```

`git push` เปล่า ๆ ใช้ได้เลยตรงนี้ เพราะเราตั้ง upstream ไว้แล้วใน Step 3 พอ push เสร็จ **PR จะอัปเดตตัวเองทันที** โดยมี commit ใหม่โผล่เข้าไปในรายการ ไม่ต้องปิด PR แล้วเปิดใหม่ และ comment เก่า ๆ ก็ยังอยู่ครบ

ในทางกลับกัน reviewer เองก็ pull branch นี้ลงเครื่องเขา แก้ commit แล้ว push กลับขึ้นมาได้เหมือนกัน PR ก็อัปเดตตามเช่นกัน

ในบทเรียนนี้เราสมมติว่า reviewer ไม่มี feedback อะไรเพิ่ม จึงข้ามรอบแก้ไปได้เลย

### แล้ว approve ล่ะ?

ตามท้องเรื่อง เราจะบอก "เพื่อน" ให้ไปกด approve ให้ แต่ในความเป็นจริงเราเล่นเป็นสองคนอยู่คนเดียว ซึ่งเจอปัญหาแน่นอน:

> ⚠️ hosting service ส่วนใหญ่ **ไม่ให้ approve PR ของตัวเอง** ปุ่ม approve อาจจะไม่โผล่มาให้กดเลย ไม่ต้องหา ไม่ต้องพยายามหาทางลัด — แค่แกล้งทำเป็นว่าเพื่อน approve แล้ว จบ แล้วไปต่อ Step 6

ในทีมจริงขั้นนี้คือจุดที่ PR อาจค้างอยู่หลายชั่วโมงหรือหลายวันจนกว่าจะมีคนว่าง เป็นเรื่องปกติ

---

## Step 6: merge pull request แล้วเข้าใจว่าทำไมได้ merge commit

ขั้น 7 กลับมาสวมบทบาทตัวเราเอง เข้าไปที่หน้า PR แล้วกดปุ่ม merge (ชื่อปุ่มดูจากตารางใน Step 1)

หลัง merge เสร็จ PR จะเปลี่ยนสถานะเป็น merged/closed แล้วไปดูรายการ commit ของ `main` บน remote จะเห็น commit ตัวใหม่โผล่ขึ้นมาบนสุด หน้าตาประมาณนี้:

```text
Merge pull request #1 from your-username/topic
```

**นี่คือ merge commit** ให้จด hash ของมันไว้ รวมถึง hash ของ parent ทั้งสองตัวที่แสดงอยู่ด้วย เดี๋ยวเราจะเอาไปเทียบใน Step 8

### เอ๊ะ ทำไมถึงมี merge commit?

ตรงนี้แหละคือจุดที่คนงงกันมากที่สุดของทั้งบท

ย้อนกลับไปที่สิ่งที่เรารู้: Git merge มีสองแบบ **fast-forward merge** เกิดเมื่อ history ของ source กับ target ยังไม่ diverge (ตอนที่ 5) และ **three-way merge** เกิดเมื่อ diverge แล้ว ซึ่งจะสร้าง merge commit (ตอนที่ 9)

ทีนี้ลองคิดดู ในเคสของเรา `main` ไม่ได้ขยับไปไหนเลยตั้งแต่เราแตก `topic` ออกมา history **ไม่ diverge** ตามตำราควรได้ fast-forward — แล้วทำไมถึงมี merge commit?

คำตอบคือ hosting service ส่วนใหญ่ตั้งค่า default ของการ merge PR ไว้เป็น option ชื่อ **non-fast-forward** ซึ่งบังคับสร้าง merge commit เสมอ **แม้ history จะไม่ diverge ก็ตาม**

| | merge ในเครื่องด้วย `git merge` | merge PR บนเว็บ (default) |
|---|---|---|
| history ไม่ diverge | fast-forward — ไม่มี commit ใหม่ | **non-fast-forward — สร้าง merge commit** |
| history diverge | three-way merge — มี merge commit | three-way merge — มี merge commit |

> **ทำไมต้องบังคับแบบนั้น?** การ merge แบบ non-fast-forward บางทีเรียกว่า **explicit merge** เพราะมันทิ้งหลักฐานไว้ชัด ๆ ว่า "งานก้อนนี้ถูกรวมเข้ามาตรงนี้ ผ่าน PR ใบนี้" ถ้าเป็น fast-forward เฉย ๆ commit ของ `topic` จะไหลเข้าไปต่อท้าย `main` เหมือนไม่เคยมี branch อยู่เลย พอหกเดือนผ่านไปแล้วอยากรู้ว่าฟีเจอร์นี้เข้ามาเมื่อไหร่ ผ่าน PR ไหน จะตามยากกว่ามาก

เปลี่ยน setting นี้ได้ในหน้า settings ของ hosting service ถ้าทีมอยากได้ history เป็นเส้นตรงสวย ๆ แต่ non-fast-forward เป็นค่าที่พบมากที่สุด ซีรีส์นี้จึงใช้ตามนั้น

หลัง merge เสร็จ ให้สังเกตว่า **ยังไม่มีอะไรถูกลบเลยสักอย่าง**:

- remote `topic` ยังอยู่ใน `rainbow-remote`
- local `topic` ยังอยู่ใน `rainbow`
- remote-tracking branch `origin/topic` ก็ยังอยู่ใน `rainbow`
- และ local `main` ของทั้ง `rainbow` กับ `friend-rainbow` **ยังไม่มี merge commit ตัวใหม่** เพราะยังไม่ได้ pull

สามขั้นสุดท้ายมีไว้เก็บกวาดของพวกนี้ทั้งหมด

---

## Step 7: ลบ remote branch

ขั้น 8 — ถ้า branch ที่เพิ่ง merge เป็น topic branch นิยมลบทิ้งทันที เพราะงานบน branch นั้นเสร็จแล้ว จบแล้ว ไม่มีใครใช้ต่อ งานชิ้นใหม่ก็แตก branch ใหม่แล้ววน process นี้อีกรอบ

ผลคือ remote repository เป็นระเบียบ มีแต่ branch ที่ยังทำงานอยู่จริง ลองนึกถึงโปรเจกต์ที่รันมาสองปีโดยไม่เคยลบ branch เลย — จะมี branch ค้างอยู่หลายร้อยตัวที่ไม่มีใครกล้าแตะเพราะไม่รู้ว่าตัวไหนยังใช้อยู่

วิธีลบ:

- **ถ้าติ๊ก option ลบอัตโนมัติไว้ตอนสร้าง PR** — remote `topic` หายไปแล้ว ข้ามได้เลย
- **ถ้าไม่ได้ติ๊ก** — หลัง merge เสร็จ hosting service มักขึ้นปุ่ม "Delete branch" ให้ตรงหน้า PR นั้นเลย กดได้ทันที หรือจะเข้าหน้ารายการ branch ของ repository แล้วลบจากตรงนั้นก็ได้

ลบเสร็จแล้วเข้าหน้ารายการ branch ของ `rainbow-remote` ตรวจให้แน่ใจว่าเหลือแค่ `main` ตัวเดียว

> ⚠️ ลบ **หลัง** merge เท่านั้น ถ้าลบ remote branch ก่อนที่ PR จะถูก merge งานบน branch นั้นจะไม่ได้เข้า `main` และ PR จะปิดตัวเองไปเฉย ๆ

ตอนนี้ฝั่ง remote เรียบร้อยแล้ว แต่ฝั่ง local ทั้งสองเครื่องยังรกอยู่และยัง out of sync กับ remote อีกต่างหาก

---

## Step 8: sync local แล้ว cleanup ด้วย git pull -p

ขั้น 9 ขั้นสุดท้าย มีสองงานที่ต้องทำในเครื่อง: **ดึง merge commit ลงมา** และ **ลบ branch ที่ไม่ใช้แล้ว**

### เก็บกวาดฝั่ง rainbow

กลับมาที่ terminal ของ `rainbow` สลับกลับไป `main` ก่อน — จะลบ branch `topic` ทั้งทีก็ต้องไม่ยืนอยู่บนมัน

```sh
cd ~/rainbow
git switch main
```

```text
Switched to branch 'main'
Your branch is up to date with 'origin/main'.
```

สังเกตว่า Git บอกว่า "up to date" ทั้งที่ remote มี merge commit ตัวใหม่รออยู่ — ไม่ได้โกหกนะ มันแค่เทียบกับ `origin/main` ในเครื่องเรา ซึ่งเป็นข้อมูลเก่าตั้งแต่ครั้งสุดท้ายที่เราคุยกับ remote

ทีนี้ pull ลงมา แต่รอบนี้ใส่ `-p` ด้วย:

```sh
git pull -p
```

`-p` ย่อมาจาก **prune** ซึ่งเราเจอครั้งแรกกับ `git fetch -p` ในตอนที่ 8 หน้าที่ของมันคือลบ remote-tracking branch ที่ remote branch ต้นทางถูกลบไปแล้ว — ซึ่งตรงกับสถานการณ์ของเราพอดี เพราะเราเพิ่งลบ remote `topic` ไปใน Step 7

ผลลัพธ์:

```text
From https://github.com/your-username/rainbow-remote
 - [deleted]         (none)     -> origin/topic
   7c09136..2f833d6  main       -> origin/main
Updating 7c09136..2f833d6
Fast-forward
 othercolors.txt | 1 +
 1 file changed, 1 insertion(+)
```

อ่านทีละบรรทัด:

- `- [deleted] (none) -> origin/topic` — นี่คือผลของ `-p` remote-tracking branch `origin/topic` ถูกลบทิ้งเพราะต้นทางบน remote ไม่มีแล้ว
- `7c09136..2f833d6 main -> origin/main` — `origin/main` ในเครื่องเราขยับไปที่ merge commit
- `Fast-forward` — **การอัปเดต `main` ในเครื่องเราครั้งนี้เป็น fast-forward** ไม่ได้สร้าง merge commit ใหม่ เพราะเราแค่รับ commit ที่มีอยู่แล้วบน remote ลงมา ไม่ได้รวมงานอะไรใหม่
- `othercolors.txt | 1 +` — ได้บรรทัด `Pink` เพิ่มเข้ามาใน `main` แล้ว

> **จุดที่ควรจำ:** ฝั่งที่กด merge PR ได้ merge commit จาก non-fast-forward ก็จริง แต่ฝั่งที่ pull ตามมาทีหลังเป็น fast-forward ธรรมดา เพราะแค่รับ commit ที่ remote สร้างไว้แล้วมา ไม่ได้รวมงานใหม่ซ้ำอีกรอบ

เหลืองานสุดท้ายคือลบ local `topic`:

```sh
git branch -d topic
```

```text
Deleted branch topic (was 4c35a5c).
```

ใช้ `-d` ตัวเล็กได้เลย ไม่ต้อง `-D` ตัวใหญ่ เพราะงานบน `topic` ถูก merge เข้า `main` ไปแล้ว Git จึงยอมลบให้แต่โดยดี (ต่างจากแบบฝึกหัดตอนที่ 9 ที่ต้องบังคับด้วย `-D` เพราะ commit ยังไม่ได้เข้าที่ไหน) นี่เป็นเหตุผลที่ควรลบ **หลัง** pull เสมอ — ถ้าลบก่อน Git จะยังมองว่า `topic` ยังไม่ได้ merge เข้า `main` ในเครื่องเราแล้วปฏิเสธ

ตรวจว่าเหลืออะไรบ้าง:

```sh
git branch --all
```

```text
* main
  remotes/origin/main
```

สะอาดเหมือนตอนเริ่มบท ทั้ง `topic` และ `origin/topic` หายไปหมดแล้ว

### ตรวจ merge commit ที่ได้มา

ดู log เพื่อยืนยันว่า merge commit ที่ hosting service สร้างให้หน้าตาเป็นยังไง:

```sh
git log
```

```text
commit 2f833d6... (HEAD -> main, origin/main)
Merge: 7c09136 4c35a5c
Author: ...
Date:   ...

    Merge pull request #1 from your-username/topic

    Adding the color pink

commit 4c35a5c...
Author: ...
Date:   ...

    pink
```

มีสามอย่างที่น่าสนใจในนี้:

1. บรรทัด `Merge: 7c09136 4c35a5c` — parent สองตัวของ merge commit ตัวนี้ ตัวแรกคือจุดที่ `main` เคยชี้อยู่ ตัวที่สองคือ commit `pink` ตรวจเทียบกับ hash ที่จดไว้จาก Step 6 ได้เลย
2. commit message `Merge pull request #1 from your-username/topic` — **hosting service generate ให้อัตโนมัติ** ไม่ใช่เราเขียน สังเกตว่ามันใส่เลข PR มาให้ด้วย ทำให้ตามย้อนกลับไปหา PR ใบนั้นได้ทันทีจาก history
3. บรรทัด `Adding the color pink` ที่อยู่ถัดลงมา — คือ description ของ merge commit ซึ่ง hosting service เอา title ของ PR มาใส่ให้

แต่ละ hosting service มี template ของข้อความนี้ต่างกันเล็กน้อย แต่หลักการเหมือนกันคือเก็บ reference กลับไปหา PR ต้นทางไว้

ลองดูภาพรวมเป็นกราฟด้วยก็ได้:

```sh
git log --oneline --decorate --all --graph
```

```text
*   2f833d6 (HEAD -> main, origin/main) Merge pull request #1 from your-username/topic
|\
| * 4c35a5c pink
|/
* 7c09136 ...
```

เห็นกิ่งเล็ก ๆ ที่แตกออกไปแล้ววกกลับมาบรรจบชัดเจน — ถ้า merge แบบ fast-forward กิ่งนี้จะหายไปเลย `pink` จะกลายเป็นจุดหนึ่งบนเส้นตรงเหมือนไม่เคยมี branch อยู่ นี่คือ "หลักฐาน" ที่ non-fast-forward เก็บไว้ให้

### เก็บกวาดฝั่ง friend-rainbow

สุดท้าย ไปที่ `friend-rainbow` เพื่อ sync ให้ครบทั้งสามฝั่ง:

```sh
cd ~/friend-rainbow
git pull
```

```text
From https://github.com/your-username/rainbow-remote
   7c09136..2f833d6  main       -> origin/main
Updating 7c09136..2f833d6
Fast-forward
 othercolors.txt | 1 +
 1 file changed, 1 insertion(+)
```

ฝั่งเพื่อนก็เป็น **fast-forward** เหมือนกัน ด้วยเหตุผลเดียวกัน คือแค่รับ commit ที่มีอยู่แล้วบน remote ลงมา

สังเกตว่าฝั่งนี้ **ไม่มีบรรทัด `[deleted]`** ทั้งที่ remote `topic` ถูกลบไปแล้ว เพราะ `friend-rainbow` ไม่เคย fetch ตอนที่ `topic` ยังมีชีวิตอยู่ มันจึงไม่เคยมี remote-tracking branch ชื่อ `origin/topic` มาตั้งแต่แรก ไม่มีอะไรให้ prune

ถึงอย่างนั้นการติดนิสัยใส่ `-p` ทุกครั้งก็ไม่เสียหาย ไม่มีอะไรให้ลบมันก็แค่ไม่ทำอะไร:

```sh
git pull -p
```

ตรวจสถานะสุดท้ายทั้งสองฝั่ง:

```sh
git status
git log --oneline --decorate --all
cat othercolors.txt
```

ทั้ง `rainbow`, `friend-rainbow` และ `rainbow-remote` ควรชี้ merge commit เดียวกันหมด และ `othercolors.txt` ทุกฝั่งควรมีบรรทัด `Pink` ต่อท้ายของเดิมเหมือนกันครบทั้งสองเครื่อง (ถ้าทำครบมาตั้งแต่ตอนที่ 9 จะได้หน้าตาแบบนี้):

```text
Brown is not a color in the rainbow.
Gray is not a color in the rainbow.
Black is not a color in the rainbow.
Pink is not a color in the rainbow.
```

ครบ 9 ขั้นแล้ว

---

## แบบฝึกหัด

รอบที่แล้วเราเดินตามคำสั่งทีละขั้น รอบนี้ลองวน pull request process ทั้ง 9 ขั้นด้วยตัวเองอีกครั้ง โดยมีคำสั่งให้น้อยลง เริ่มจากสถานะปัจจุบัน (ทั้งสาม repository sync กันที่ merge commit จาก Step 8)

1. ใน `rainbow` ตรวจก่อนว่า `working tree` clean และอยู่บน `main` ด้วย `git status` แล้วสร้าง topic branch ใหม่ชื่อ `silver` พร้อมเข้าไปในคำสั่งเดียว (คำใบ้: `git switch -c`)

2. เพิ่มบรรทัด `Silver is not a color in the rainbow.` ต่อท้าย `othercolors.txt` แล้ว commit ด้วย message `silver` — ตรวจว่า output บอก `1 file changed, 1 insertion(+)`

3. push branch ขึ้น remote **โดยห้ามพิมพ์ `--set-upstream` เอง** ให้พิมพ์ `git push` เปล่า ๆ ก่อน แล้ว copy คำสั่งที่ Git generate ให้มาวางรัน จากนั้นยืนยันด้วย `git branch -vv` ว่า `silver` มี `[origin/silver]` กำกับแล้ว

4. เปิด pull request บน hosting service โดยตั้ง source = `silver`, target = `main` และ title = `Adding the color silver` ก่อนกดสร้าง ให้อ่านทวนสองช่องแรกอีกครั้งว่าไม่ได้สลับกัน

5. เข้าไปดูแท็บไฟล์ที่เปลี่ยนใน PR ตอบตัวเองให้ได้ว่าเห็นบรรทัดสีเขียวกี่บรรทัด สีแดงกี่บรรทัด และทำไมถึงเป็นจำนวนนั้น

6. merge PR แล้วจดสามอย่างไว้: hash ของ merge commit และ hash ของ parent ทั้งสองตัว

7. ลบ remote `silver` branch (ถ้ายังไม่ถูกลบอัตโนมัติ) แล้วตรวจในหน้ารายการ branch ของ `rainbow-remote` ว่าเหลือแค่ `main`

8. กลับมาที่ `rainbow` สลับไป `main` แล้ว sync + cleanup ให้ครบในสองคำสั่ง — ต้องได้ทั้งการดึง merge commit ลงมา ลบ `origin/silver` และลบ local `silver` (คำใบ้: `git pull -p` แล้วตามด้วย `git branch -d`)

9. ปิดท้ายด้วยการ sync `friend-rainbow` ให้ตามมาด้วย `git pull`

ตรวจตัวเองให้ครบ:

- `git branch --all` ใน `rainbow` เหลือแค่ `main` กับ `remotes/origin/main`
- `othercolors.txt` ในทั้ง `rainbow` และ `friend-rainbow` ลงท้ายด้วยบรรทัด `Pink` ตามด้วย `Silver` เหมือนกันทั้งสองเครื่อง
- `git log --oneline --decorate --all --graph` ใน `rainbow` แสดงกิ่งที่แตกออกไปแล้ววกกลับมาบรรจบ **สองกิ่ง** — กิ่งของ `pink` จากในบท และกิ่งของ `silver` จากแบบฝึกหัด
- parent ทั้งสองของ merge commit ตัวใหม่ ตรงกับที่จดไว้จากหน้าเว็บในข้อ 6
- อธิบายได้ว่าทำไมการ pull ในข้อ 8 ถึงขึ้น `Fast-forward` ทั้งที่ merge บน remote เป็น non-fast-forward
- `git status` ในทั้งสอง local repository บอกว่า `working tree` clean และ up to date กับ `origin/main`

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คิดว่า pull request คือ `git pull`** — คนละเรื่องกันสิ้นเชิง `git pull` เป็นคำสั่งของ Git ที่ดึงงานลงเครื่อง ส่วน pull request เป็นฟีเจอร์บนเว็บของ hosting service ที่ Git ไม่รู้จักด้วยซ้ำ
- **สลับ source กับ target ตอนสร้าง PR** — จะกลายเป็นรวม `main` เข้า branch งานของเราแทน ตรวจสองช่องนี้ก่อนกดสร้างทุกครั้ง โดยเฉพาะเมื่อ repository มี branch ปลายทางหลายตัว
- **ตกใจว่าทำไมได้ merge commit ทั้งที่ history ไม่ diverge** — เพราะ default ของการ merge PR คือ non-fast-forward ซึ่งบังคับสร้าง merge commit เสมอ ไม่ใช่ความผิดพลาด
- **ลืมตั้ง upstream branch แล้วงงว่าทำไม `git push` ไม่ทำงาน** — ปัญหาคลาสสิก แก้ด้วยการ `git push` เปล่า ๆ แล้ว copy คำสั่งที่ Git ใบ้ให้ ไม่ต้องนั่งจำ syntax
- **PR merge ไม่ได้เพราะมี merge conflict** — ถ้า source กับ target แก้ส่วนเดียวกันชนกัน hosting service จะไม่ยอม merge จนกว่าจะ resolve ก่อน บาง hosting service resolve บนเว็บให้ได้ แต่วิธีที่นิยมกว่าคือ resolve ในเครื่องด้วยวิธีจากตอนที่ 10 แล้ว push กลับขึ้นไป — PR จะอัปเดตตัวเองแล้วปุ่ม merge ก็กลับมากดได้
- **ลบ remote branch ก่อน merge** — งานบน branch นั้นจะไม่ได้เข้า `main` และ PR จะถูกปิดไปเฉย ๆ ลบหลัง merge เสร็จเท่านั้น
- **ลบ local branch ก่อน pull** — `git branch -d` จะปฏิเสธ เพราะในเครื่องเรา `main` ยังไม่มี commit ของ branch นั้น ต้อง `git pull` ก่อนแล้วค่อยลบ ถึงจะใช้ `-d` ตัวเล็กได้
- **ลืม cleanup ทั้งชุด** — หลัง merge มีของค้างสามอย่างคือ remote branch, local branch และ remote-tracking branch ถ้าลบแค่บนเว็บ `origin/topic` ในเครื่องจะยังค้างอยู่จนกว่าจะ prune ใช้ `git pull -p` แล้วตามด้วย `git branch -d` ให้ครบ
- **ใช้ account ของบริษัทแล้วทำตามไม่ได้** — บางองค์กรบังคับจำนวน approver หรือห้าม merge PR ของตัวเอง ทำให้ flow ต่างจากตัวอย่างในบทนี้ ไม่ใช่ว่าทำผิด

---

## สรุป

1. Pull request (GitLab เรียก merge request) เป็นฟีเจอร์ของ hosting service ไม่ใช่ของ Git และไม่เกี่ยวกับคำสั่ง `git pull` เลย
2. Process ของมันมี 9 ขั้น โดยขั้น 1–3 กับขั้น 9 ทำใน terminal ส่วนขั้น 4–8 ทำบนหน้าเว็บ
3. PR นิยามทิศทางการรวมงานด้วย source branch (ต้นทาง — branch งานของเรา) และ target branch (ปลายทาง — branch ที่จะรับงานเข้าไป) สลับกันคือ merge ผิดทาง
4. `git push` เปล่า ๆ บน branch ที่ยังไม่มี upstream จะ generate คำสั่ง `git push --set-upstream origin <branch>` มาให้ copy ไปวาง ได้ทั้ง push และตั้ง upstream ในคำสั่งเดียว
5. คุณค่าหลักของ PR คือ commenting feature ที่ comment ลงไปที่บรรทัดในไฟล์ได้ และการที่ทุกอย่างอยู่บนเว็บ ทำให้คนที่ใช้ Git ไม่เป็นก็ review ได้
6. push commit เพิ่มบน branch เดิมทำให้ PR อัปเดตตัวเองอัตโนมัติ ไม่ต้องปิดแล้วเปิด PR ใหม่
7. hosting service ส่วนใหญ่ตั้ง default การ merge PR ไว้เป็น non-fast-forward (explicit merge) ซึ่งสร้าง merge commit เสมอแม้ history จะไม่ diverge เพื่อให้เห็นชัดว่างานถูกรวมเข้ามาตรงไหนผ่าน PR ใบไหน
8. ฝั่งที่ pull ตามมาทีหลังยังได้ fast-forward ตามปกติ เพราะแค่รับ commit ที่ remote สร้างไว้แล้วลงมา
9. merge commit ที่ได้มี message กับ description ที่ hosting service generate ให้อัตโนมัติ โดยอ้างเลข PR และ title ของ PR ไว้
10. topic branch ที่ merge เสร็จแล้วนิยมลบทิ้ง เพื่อไม่ให้ remote repository รกด้วย branch ที่ไม่มีใครใช้
11. `-p` (prune) ใช้ได้ทั้งกับ `git fetch` และ `git pull` เพื่อลบ remote-tracking branch ที่ต้นทางถูกลบไปแล้ว
12. cleanup ครบชุดหลัง merge คือ `git switch main` → `git pull -p` → `git branch -d <topic>` ซึ่งจัดการทั้งการ sync, ลบ remote-tracking branch และลบ local branch

กลับไปดูสิ่งที่เราทำในตอนที่ 9 อีกครั้ง — ตอนนั้นเรา fetch, merge, แล้ว push ผลลัพธ์ขึ้นไปเองทั้งหมด ไม่มีใครได้เห็นงานเราก่อนมันเข้า `main` เลย

บทนี้เปลี่ยนแค่จุดเดียว: ย้ายการ merge จากเครื่องเราไปเกิดบน remote แทน แล้วแทรกด่าน review คั่นไว้ก่อน แค่นั้นเอง แต่ผลที่ได้คือทุกงานที่เข้า `main` มีคนอ่านอย่างน้อยหนึ่งคน มีบันทึกว่าใครเห็นชอบ และตามย้อนกลับไปหาการสนทนาตอนนั้นได้เสมอ

นี่คือเหตุผลที่ทีม software แทบทุกทีมทำงานผ่าน PR

และถ้ามองย้อนกลับไปทั้งซีรีส์ ทุกอย่างที่เรียนมามาบรรจบกันที่บทนี้พอดี — branch จากตอนที่ 4, merge จากตอนที่ 5, remote กับ upstream branch จากตอนที่ 7 และ 9, การแก้ conflict จากตอนที่ 10 ล้วนเป็นชิ้นส่วนของ workflow เดียวที่เราเพิ่งเดินจบไปเมื่อกี้

ที่เหลือคือทำซ้ำ วนไปเรื่อย ๆ วันละหลายรอบ จนมันกลายเป็นกล้ามเนื้อ

> **ก้าวต่อไป:** ลองเอา workflow นี้ไปใช้กับโปรเจกต์ของตัวเองจริง ๆ ดู — แม้จะทำคนเดียว การแตก branch แล้วเปิด PR ให้ตัวเอง review ก่อน merge ก็ช่วยให้เห็น diff ทั้งก้อนก่อนมันเข้า `main` ซึ่งจับ bug ได้เยอะกว่าที่คิด

---

## Glossary

- **Pull request (PR)** — ฟีเจอร์ของ hosting service สำหรับขอรวม branch หนึ่งเข้าอีก branch บน remote พร้อมกระบวนการ review ไม่ใช่ฟีเจอร์ของ Git
- **Merge request (MR)** — ชื่อที่ GitLab ใช้เรียกฟีเจอร์เดียวกันกับ pull request
- **Open / Close a pull request** — "open" คือสร้าง PR ขึ้นมา "close" คือปิด ซึ่งเกิดได้ทั้งหลัง merge เสร็จ หรือปิดทิ้งเมื่อตัดสินใจไม่ merge
- **Source branch** — branch ต้นทางที่มีงานซึ่งอยากรวมเข้าไป (ในบทนี้คือ `topic`)
- **Target branch** — branch ปลายทางที่จะรับงานเข้าไป (ในบทนี้คือ `main`)
- **Topic branch (feature branch)** — branch ที่แตกออกมาทำงานเฉพาะส่วน มักถูกลบทิ้งหลัง merge เสร็จ
- **Non-fast-forward (explicit merge)** — option การ merge ที่บังคับสร้าง merge commit เสมอแม้ history จะไม่ diverge เป็น default ของการ merge PR บน hosting service ส่วนใหญ่
- **Commenting feature** — ความสามารถของ PR ที่ให้ comment ลงไปที่บรรทัดเจาะจงในไฟล์ ตอบกลับ และเปิด discussion thread ได้
- **Upstream branch** — remote branch ที่ local branch ตัวหนึ่ง track อยู่
- **`git push --set-upstream <shortname> <branch>`** — push branch ขึ้น remote พร้อมตั้ง upstream branch ในคำสั่งเดียว (`-u` เป็นตัวย่อของ `--set-upstream`)
- **`push.autoSetupRemote`** — config ที่ทำให้ Git ตั้ง upstream ให้อัตโนมัติทุกครั้งที่ push branch ใหม่
- **`git branch -vv`** — แสดงรายการ branch พร้อม hash, upstream branch ในวงเล็บเหลี่ยม และ commit message ล่าสุด
- **Prune (`-p`)** — ลบ remote-tracking branch ที่ remote branch ต้นทางถูกลบไปแล้ว ใช้ได้ทั้งกับ `git fetch` และ `git pull`
- **`git branch -d`** — ลบ local branch ที่ถูก merge เข้าที่อื่นเรียบร้อยแล้ว ต่างจาก `-D` ที่บังคับลบแม้ยังไม่ได้ merge

---

## Related

- [ตอนที่ 4: Branches](/git/04-branches/) — `git switch -c` ที่ใช้สร้าง topic branch ในบทนี้ และแนวคิดของ branch โดยรวม
- [ตอนที่ 5: Merging](/git/05-merging/) — นิยาม source/target branch และ fast-forward merge ที่บทนี้เอามาเทียบกับ non-fast-forward
- [ตอนที่ 6: Hosting Services and Authentication](/git/06-hosting-services-and-authentication/) — ที่มาของคำแนะนำให้ใช้ personal account แทน company account สำหรับซีรีส์นี้
- [ตอนที่ 7: Creating and Pushing to a Remote Repository](/git/07-creating-and-pushing-to-a-remote-repository/) — พื้นฐาน push, remote branch กับ remote-tracking branch และ upstream branch ที่ trick ในบทนี้ต่อยอด
- [ตอนที่ 8: Cloning and Fetching](/git/08-cloning-and-fetching/) — `-p` (prune) ที่เจอครั้งแรกกับ `git fetch` และรอบนี้เอามาใช้กับ `git pull`
- [ตอนที่ 9: Three-Way Merges](/git/09-three-way-merges/) — merge commit กับ parent สองตัว ที่ non-fast-forward สร้างขึ้นแบบเดียวกัน
- [ตอนที่ 10: Merge Conflicts](/git/10-merge-conflicts/) — วิธี resolve conflict ซึ่งต้องทำก่อน PR ถึงจะ merge ได้
- [ตอนที่ 11: Rebasing](/git/11-rebasing/) — อีกทางเลือกในการรวมงาน ที่ PR ก็เลือกใช้ได้ แต่ default คือ merge
