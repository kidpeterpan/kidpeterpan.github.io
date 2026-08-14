+++
title = 'ตอนที่ 6: Hosting Services and Authentication'
date = '2026-08-13T00:00:00+07:00'
draft = false
description = 'เลือก hosting service และเตรียม authentication ผ่าน HTTPS หรือ SSH ก่อนเชื่อม local repository เข้ากับ remote repository'
tags = ['programming', 'git', 'tutorial', 'verified']
+++

---

ตอนที่แล้วเรา merge งานจาก `feature` กลับเข้า `main` และปิดช่วงแรกของการทำงานกับ **local repository** ในเครื่องตัวเองไปแล้ว

แต่โปรเจกต์จริงมักไม่ได้อยู่บนเครื่องของเราคนเดียว เราต้องมีที่เก็บ **remote repository** บนคลาวด์สำหรับสำรองงาน แชร์โค้ด และทำงานร่วมกับคนอื่นด้วย

บทนี้ยังไม่รีบ `git push` เพราะก่อนส่งข้อมูลออกไป เราต้องเลือกว่าจะฝาก repository ไว้กับใคร และจะใช้ช่องทางไหนยืนยันตัวตนก่อน

สิ่งที่จะได้ตอนจบบทนี้:

- แยก local repository, remote repository และ hosting service ออกจากกัน
- เลือก hosting service สำหรับทำแบบฝึกหัดต่อไป
- เลือกใช้ HTTPS หรือ SSH เป็นช่องทางเชื่อมต่อ remote
- รู้ว่า GitHub, GitLab และ Bitbucket ต้องใช้ credential แบบไหนเมื่อเชื่อมต่อผ่าน HTTPS
- สร้าง SSH key pair โดยไม่เขียนทับ key เดิมในเครื่อง
- เพิ่ม private key เข้า SSH agent และนำเฉพาะ public key ไปใส่ใน hosting service
- ทดสอบว่า credential พร้อมใช้ก่อนสร้าง remote repository ในตอนถัดไป

{{< mermaid >}}
flowchart LR
  L["rainbow<br/>local repository"] --> C{"เลือก protocol"}
  C -->|"HTTPS"| H["username + token<br/>หรือ credential"]
  C -->|"SSH"| S["private key บนเครื่อง<br/>public key บน hosting service"]
  H --> R["remote repository<br/>บน hosting service"]
  S --> R
  R --> N["ตอนที่ 7<br/>สร้างและ push"]
{{< /mermaid >}}

---

## วิธีทำตามบทนี้

บทนี้ต่อจากตอนที่ 5 โดยสมมติว่าเรามี `rainbow` เป็น local repository อยู่แล้ว และควรเริ่มจากสถานะที่ไม่มีงานค้าง

เข้าไปใน repository แล้วตรวจสถานะกับ commit ล่าสุดก่อน โดยวางคำสั่งชุดนี้ใน terminal:

```sh
cd ~/rainbow
git status
git log --oneline --decorate -3
```

ถ้าทำตามตอนก่อนหน้าครบ ผลลัพธ์ควรมีหน้าตาประมาณนี้:

```text
On branch main
nothing to commit, working tree clean

fc8139c (HEAD -> main, feature) yellow
7acb333 orange
abc1234 red
```

hash และจำนวน commit ในเครื่องเราอาจต่างจากตัวอย่าง จุดสำคัญคือ `rainbow` เป็น repository ที่เปิดใช้งานแล้ว และ `git status` บอกว่า working tree clean ถ้าตอนนี้ยังอยู่บน branch อื่น ให้กลับไป `main` ด้วย `git switch main` ก่อน

เครื่องหมาย `$` ในตัวอย่างเป็นเพียง command prompt ไม่ต้องพิมพ์ตามไปด้วย

---

## Step 1: รู้จัก local, remote และ hosting service

ตอนนี้ `rainbow` อยู่ในเครื่องเรา นี่คือ **local repository** ซึ่งมีไฟล์งานและข้อมูล Git ในโฟลเดอร์ `.git`

ถ้าเราต้องการให้คนอื่นดึงงานไปใช้ หรืออยากมีจุดเก็บงานที่อยู่นอกเครื่อง ก็สร้าง **remote repository** บนบริการที่เรียกว่า **hosting service**

| คำ | อยู่ที่ไหน | ใช้ทำอะไร |
|---|---|---|
| Local repository | เครื่องของเรา | แก้ไฟล์ สร้าง commit และดู history |
| Remote repository | บนคลาวด์ | แชร์และเก็บสำเนา history ให้เข้าถึงจากที่อื่นได้ |
| Hosting service | บริษัทที่ให้บริการฝาก remote | จัดการ repository, สิทธิ์ และการทำงานร่วมกัน |

สามเจ้าที่เราจะพูดถึงในบทนี้คือ:

- **GitHub**
- **GitLab**
- **Bitbucket**

### ทำไมต้องแยกคำพวกนี้? (Why)

เพราะ `git push` ไม่ได้ส่งไฟล์ไปที่ “Git” กลาง ๆ แต่ส่งจาก local repository ของเราไปยัง remote repository ที่อยู่บน hosting service ตัวใดตัวหนึ่ง

ภาพการรับส่งข้อมูลจะประมาณนี้:

| คำสั่ง | ทิศทาง | ความหมาย |
|---|---|---|
| `git push` | local → remote | ส่ง commit จากเครื่องขึ้นคลาวด์ |
| `git clone` | remote → local | คัดลอก repository มาสร้างบนเครื่อง |
| `git fetch` | remote → local | ดาวน์โหลดข้อมูลจาก remote โดยยังไม่รวมเข้ากับ branch ปัจจุบัน |
| `git pull` | remote → local | ดาวน์โหลดแล้วรวมการเปลี่ยนแปลงเข้ามาใน branch ปัจจุบัน |

คำสั่งเหล่านี้จะทำงานข้ามเครื่องได้ก็ต่อเมื่อ Git รู้ว่าจะเชื่อมต่อไปที่ไหน และ hosting service ยืนยันได้ว่าเรามีสิทธิ์เข้าถึง repository นั้น

> local repository คือที่ที่เราทำงาน ส่วน remote repository คือจุดที่เราใช้ส่งต่อและรับงานกลับมา ทั้งสองฝั่งต้องมีช่องทางเชื่อมต่อและการยืนยันตัวตนที่ตรงกัน

---

## Step 2: เลือก hosting service และบัญชีที่จะใช้

ถ้ามี hosting service ที่ใช้อยู่แล้ว ให้ใช้บัญชีนั้นได้เลย ถ้ายังไม่มี ผู้เขียนต้นฉบับแนะนำ **GitHub** เพราะเป็นบริการที่นิยมและตัวอย่างในบทถัด ๆ ไปใช้ได้ตรงไปตรงมา

### ใช้บัญชีส่วนตัวก่อน

ถ้ากำลังทำตามแบบฝึกหัด ให้ใช้บัญชีส่วนตัวแทนบัญชีบริษัท เหตุผลไม่ใช่เรื่องว่า service ไหนดีกว่า แต่บัญชีบริษัทอาจมี policy, SSO หรือ permission ที่ทีมตั้งเพิ่มไว้ ทำให้ขั้นตอนฝึกบางอย่างไม่เหมือนบัญชีทั่วไป

ทำตามนี้:

1. เลือก GitHub, GitLab หรือ Bitbucket หนึ่งเจ้า
2. เปิดเว็บไซต์ของ service นั้นแล้วสมัครหรือล็อกอินด้วยบัญชีส่วนตัว
3. จำชื่อ username หรืออีเมลของบัญชีไว้ เพราะจะใช้ตอน Git ถามหา username
4. ยังไม่ต้องสร้าง remote repository ในบทนี้ เราจะสร้างและเชื่อม `rainbow` ในตอนถัดไป

ถ้ามีบัญชีและตั้งค่า authentication สำหรับ Git ไว้ครบแล้ว สามารถข้ามไปตอนที่ 7 ได้เลย แต่ถ้ายังไม่แน่ใจว่าตั้งค่าครบหรือยัง ให้ทำต่อในบทนี้

### บัญชีเว็บกับ credential ของ Git เหมือนกันไหม?

เวลาเราเปิด GitHub ใน browser เราล็อกอินผ่านหน้าเว็บได้ด้วย username หรืออีเมลกับรหัสผ่าน แต่ตอนที่ Git ใน terminal ต้องส่งข้อมูลไปยัง remote มันต้องใช้ credential ของโปรโตคอลที่เราเลือกอีกชั้นหนึ่ง

ดังนั้น ล็อกอินหน้าเว็บได้แล้วไม่ได้แปลว่า `git push` จะพร้อมใช้งานทันที

---

## Step 3: เลือกช่องทางเชื่อมต่อ: HTTPS หรือ SSH

เมื่อเราจะเชื่อม local repository กับ remote จะเห็น URL ให้เลือกสองแบบ โดยแต่ละแบบใช้ authentication คนละวิธี:

| | HTTPS | SSH |
|---|---|---|
| หน้าตา URL | `https://github.com/owner/repo.git` | `git@github.com:owner/repo.git` |
| สิ่งที่ใช้ยืนยันตัวตน | username + token หรือ credential | SSH key pair |
| จุดเด่น | เริ่มต้นง่ายและเข้าใจ flow ได้เร็ว | ตั้งค่าครั้งแรกแล้วใช้ซ้ำสะดวก |
| สิ่งที่ต้องระวัง | อย่าใช้ account password แทน token ถ้า service ไม่อนุญาต | ห้ามแชร์ private key |

### ต้องตั้งค่าทั้งสองแบบไหม?

ไม่ต้อง ตั้งค่าแค่ **โปรโตคอลเดียว** ก็พอสำหรับทำงานในบทถัดไป

ถ้ายังไม่แน่ใจ ให้เริ่มจาก HTTPS เพราะขั้นตอนสั้นกว่าและเหมาะกับการทำตามครั้งแรก ส่วน SSH เหมาะกับคนที่ต้องเชื่อม repository บ่อย ๆ และต้องการให้เครื่องยืนยันตัวตนด้วย key

สิ่งสำคัญคือ URL ที่จะใช้ในตอนที่ 7 ต้องตรงกับโปรโตคอลที่เราเตรียมไว้:

- เตรียม HTTPS ก็ใช้ URL ที่ขึ้นต้นด้วย `https://`
- เตรียม SSH ก็ใช้ URL ที่มีรูปแบบ `git@host:owner/repo.git`

> อย่าเลือกจากความเคยชินอย่างเดียว ให้ดู URL ตอนสร้าง remote แล้วจับคู่กับ credential ที่ตั้งค่าไว้ ถ้าสองอย่างคนละโปรโตคอล Git จะเชื่อมต่อไม่สำเร็จ

---

## Step 4: เตรียม authentication สำหรับ HTTPS

HTTPS ใช้ username คู่กับ credential ที่ทำหน้าที่เหมือน password ของการเชื่อมต่อ Git แต่ hosting service แต่ละเจ้าตั้งชื่อและกติกาไม่เหมือนกัน

| Hosting service | Username | ค่าในช่อง password ของ Git |
|---|---|---|
| GitHub | email address หรือ username | Personal access token |
| GitLab | email address หรือ username | Account password หรือ token ตาม policy ของบัญชี |
| Bitbucket | email address หรือ username | App password |

GitHub และ Bitbucket ไม่ให้ใช้ account password ตรง ๆ สำหรับ Git over HTTPS แล้ว จึงต้องสร้าง **personal access token** หรือ **app password** แยกขึ้นมา ส่วน GitLab อาจรองรับ account password ตามการตั้งค่าของบัญชี แต่ถ้าบัญชีเปิด 2FA หรือองค์กรบังคับใช้ token ให้ใช้ credential ที่ service กำหนดแทน

### สร้าง credential อย่างปลอดภัย

ให้เข้าไปที่หน้า Settings ของ hosting service แล้วสร้าง credential สำหรับ Git over HTTPS โดยตั้งชื่อให้จำได้ เช่น `learning-git` และให้สิทธิ์เท่าที่จำเป็นกับแบบฝึกหัด

สำหรับ GitHub ให้เลือกชนิด personal access token ที่ระบบแนะนำในปัจจุบัน และให้สิทธิ์เข้าถึง repository เท่าที่ต้องใช้ อย่าเลือกสิทธิ์กว้าง ๆ เพียงเพราะสะดวก

หลังสร้าง token หรือ app password แล้ว ให้เก็บไว้ใน password manager ก่อนออกจากหน้าเว็บ เพราะหลาย service จะแสดงค่าเต็มให้ดูครั้งเดียว

> token ไม่ใช่ข้อความที่เอาไว้แชร์หรือใส่ใน commit มันคือ credential สำหรับยืนยันตัวตน ให้คิดเหมือนรหัสผ่านอีกชุดหนึ่ง

### ตอน Git ถาม username และ password

ในตอนที่ 7 เมื่อเราสั่งคำสั่งผ่าน HTTPS เป็นครั้งแรก Git อาจถามข้อมูลประมาณนี้:

```text
Username for 'https://github.com': your-username
Password for 'https://github.com':
```

ให้พิมพ์ username ของบัญชีในบรรทัดแรก และ paste personal access token หรือ credential ของ service ในบรรทัด `Password` อย่า paste token ต่อท้ายคำสั่งใน terminal เพราะคำสั่งอาจถูกบันทึกไว้ใน shell history

ถ้า terminal ไม่แสดงตัวอักษรตอนพิมพ์หรือ paste password นั่นเป็นพฤติกรรมปกติของโปรแกรม ไม่ได้แปลว่ากดไม่ติด ให้กด Enter หลังวางค่าเสร็จ

### ตรวจว่าเลือก HTTPS จริงหรือยัง

ตอนนี้เรายังไม่ได้สร้าง remote จึงยังไม่มี URL ให้ Git ตรวจ แต่จำรูปแบบนี้ไว้สำหรับตอนถัดไป:

```text
https://github.com/your-username/rainbow.git
```

บรรทัดนี้เป็นรูปแบบ URL ตัวอย่าง ไม่ต้องรัน และให้เปลี่ยน `your-username` เป็น username จริงของเราเมื่อสร้าง remote

ถ้าใช้ GitLab หรือ Bitbucket ให้เปลี่ยน host เป็นของ service นั้น ส่วนหลักการเหมือนกัน: URL ต้องขึ้นต้นด้วย `https://` และตอน Git ถาม password ให้ใช้ credential ที่สร้างไว้ ไม่ใช่ account password ที่ใช้ล็อกอินหน้าเว็บ

---

## Step 5: เตรียม authentication สำหรับ SSH

SSH ใช้ **SSH key pair** หรือคู่กุญแจสองไฟล์:

- **Private key** เก็บไว้ในเครื่องของเราเท่านั้น
- **Public key** นำไปเพิ่มในบัญชีบน hosting service ได้

สองไฟล์นี้ทำงานคู่กัน แต่มีหน้าที่ไม่เหมือนกัน การนำ public key ไปใส่บน hosting service ไม่ได้ทำให้คนอื่นรู้ private key ของเรา

### สร้าง key pair

ก่อนสร้าง ให้เลือกชื่อไฟล์ที่ไม่ชนกับ key เดิม ในตัวอย่างนี้ใช้ `id_ed25519_learning_git` เพื่อไม่เขียนทับ `~/.ssh/id_ed25519` ที่อาจมีอยู่แล้ว

ถ้าเครื่องยังไม่มีโฟลเดอร์ `~/.ssh` ให้สร้างและกำหนด permission ก่อน คำสั่งชุดนี้ไม่มี output เมื่อทำงานสำเร็จ:

```sh
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

เมื่อไม่มี output และกลับมาที่ prompt แปลว่าโฟลเดอร์พร้อมใช้งานแล้ว คำสั่งนี้ไม่ได้สร้างหรือแก้ private key ใด ๆ

รันคำสั่งนี้ แล้วตอนที่ระบบถาม passphrase ให้ตั้งรหัสเพิ่มอีกชั้นหนึ่งถ้าทำได้:

```sh
ssh-keygen -t ed25519 -C "you@example.com" -f ~/.ssh/id_ed25519_learning_git
```

ถ้าสำเร็จ จะเห็นข้อความประมาณนี้:

```text
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /Users/you/.ssh/id_ed25519_learning_git
Your public key has been saved in /Users/you/.ssh/id_ed25519_learning_git.pub
```

อีเมลใน `-C` เป็น comment ที่ช่วยจำว่า key นี้สร้างเพื่ออะไร ไม่ใช่ password และเปลี่ยนเป็นอีเมลของเราได้ ถ้าไฟล์ชื่อนี้มีอยู่แล้ว อย่ากดยืนยันเขียนทับ ให้ยกเลิกแล้วเลือกชื่อไฟล์ใหม่แทน

หลังคำสั่งนี้จะมีไฟล์สองไฟล์ แต่ยังไม่ต้องเปิดหรือ copy ไฟล์ที่ไม่มี `.pub` เพราะนั่นคือ private key

### เพิ่ม private key เข้า SSH agent

**SSH agent** เป็นโปรแกรมบนเครื่องที่ช่วยถือ private key ไว้ใช้ตอน authenticate เราไม่ได้อัปโหลด private key ไปที่ hosting service และไม่ได้ย้ายไฟล์ออกจากเครื่อง

ให้เริ่ม agent แล้วเพิ่ม private key ที่เพิ่งสร้าง:

```sh
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_learning_git
```

ถ้าสำเร็จ ผลลัพธ์จะมีหน้าตาประมาณนี้:

```text
Agent pid 12345
Identity added: /Users/you/.ssh/id_ed25519_learning_git (you@example.com)
```

เลข `pid` และ path จะต่างกันตามเครื่อง ถ้าเห็น `Identity added` แปลว่า SSH agent รับ key ไว้แล้ว ถ้าเครื่องถาม passphrase ให้ใส่ passphrase ที่ตั้งไว้ตอนสร้าง key

### เพิ่ม public key เข้า hosting service

คราวนี้ให้อ่านเฉพาะไฟล์ที่ลงท้ายด้วย `.pub`:

```sh
cat ~/.ssh/id_ed25519_learning_git.pub
```

ผลลัพธ์จะเป็นข้อความยาวหนึ่งบรรทัด เริ่มด้วย `ssh-ed25519` และลงท้ายด้วย comment เช่นอีเมล:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... you@example.com
```

คัดลอกทั้งบรรทัดไปเพิ่มในหน้า SSH keys ของ hosting service ที่เลือกไว้:

- GitHub: Settings → SSH and GPG keys → New SSH key
- GitLab: Preferences หรือ User Settings → SSH Keys
- Bitbucket: Personal settings → SSH keys

สิ่งที่นำไปวางคือ **public key ที่มี `.pub` เท่านั้น** ห้ามเปิดเผยหรืออัปโหลด `~/.ssh/id_ed25519_learning_git` ซึ่งเป็น private key เด็ดขาด

### ทดสอบ SSH กับ GitHub

ถ้าเลือก GitHub ให้ทดสอบด้วยคำสั่งนี้หลังเพิ่ม public key แล้ว:

```sh
ssh -T git@github.com
```

ถ้า authentication สำเร็จ GitHub จะตอบประมาณนี้:

```text
Hi your-username! You've successfully authenticated, but GitHub does not provide shell access.
```

ข้อความที่บอกว่า GitHub ไม่เปิด shell access ไม่ใช่ error ของ key การทดสอบนี้แค่ยืนยันว่า GitHub จำ public key ได้และจับคู่กับ private key ในเครื่องเราแล้ว ถ้าใช้ GitLab หรือ Bitbucket ให้ใช้ host ของ service นั้นแทน:

ถ้าใช้ GitLab ให้รัน `ssh -T git@gitlab.com` ส่วน Bitbucket ให้รัน `ssh -T git@bitbucket.org` เลือกเพียงคำสั่งที่ตรงกับ service ของเรา

ผลลัพธ์ของแต่ละ service จะใช้ข้อความคนละแบบ แต่ใจความคือบัญชีถูกยืนยันแล้วและ service มักไม่เปิด shell ให้เราใช้งาน

> private key อยู่กับเครื่องเรา, public key อยู่บน hosting service, SSH agent ช่วยเรียกใช้ private key ทั้งสามส่วนนี้ต้องอยู่ถูกที่ ถึงจะเชื่อมต่อได้

---

## Step 6: ตรวจความพร้อมก่อนสร้าง remote

ตอนนี้เราไม่จำเป็นต้องตั้งค่าทั้ง HTTPS และ SSH ให้ครบ เลือกตามนี้ได้เลย:

| ถ้า... | ให้ทำ |
|---|---|
| อยากเริ่มเร็วและทำตามขั้นตอนได้ง่าย | สร้าง credential สำหรับ HTTPS |
| ใช้ Git หลาย repository เป็นประจำ | ตั้งค่า SSH key pair |
| มี credential พร้อมใช้แล้ว | ทดสอบและข้ามไปตอนที่ 7 |
| ยังไม่รู้ว่าจะเลือกอะไร | เริ่มจาก HTTPS ก่อน |

ใช้ checklist นี้ตรวจตัวเอง:

- มีบัญชีบน GitHub, GitLab หรือ Bitbucket แล้ว
- ใช้บัญชีส่วนตัวสำหรับแบบฝึกหัด
- เลือกแล้วว่าจะใช้ HTTPS หรือ SSH
- ถ้าใช้ HTTPS: รู้แล้วว่าจะใช้ token, app password หรือ credential ตาม policy ของ service
- ถ้าใช้ SSH: เพิ่ม private key เข้า SSH agent แล้ว
- ถ้าใช้ SSH: เพิ่ม public key เข้า hosting service แล้ว และทดสอบ `ssh -T` สำเร็จ
- ยังไม่ได้เอา token หรือ private key ไปใส่ใน repository, commit หรือ chat

ในตอนนี้ `rainbow` ยังไม่มี remote ก็ไม่เป็นไร เพราะบทนี้เตรียม authentication ไว้ก่อน ส่วนการสร้าง remote และนำ URL มาเชื่อมกับ repository จะเริ่มในตอนที่ 7

---

## แบบฝึกหัด

ทำแบบฝึกหัดต่อไปนี้โดยใช้บัญชีส่วนตัวและ local repository `rainbow` ของเรา:

1. เปิดหน้าเว็บของ GitHub, GitLab หรือ Bitbucket แล้วจดชื่อ service กับ username ที่จะใช้ในบทถัดไป โดยยังไม่ต้องสร้าง remote repository
2. เลือก HTTPS หรือ SSH เพียงหนึ่งแบบ แล้วเขียน URL รูปแบบที่คาดว่าจะใช้กับ `rainbow` เช่น `https://github.com/your-username/rainbow.git` หรือ `git@github.com:your-username/rainbow.git`
3. ถ้าเลือก HTTPS ให้สร้าง credential ชื่อ `learning-git` และตรวจว่าคัดลอกค่าไปเก็บใน password manager แล้ว โดยห้ามใส่ค่าจริงลงในไฟล์หรือ commit
4. ถ้าเลือก SSH ให้รัน `ssh-keygen` ด้วยชื่อไฟล์ `id_ed25519_learning_git` จากนั้นรัน `ssh-add` และ `cat` เฉพาะไฟล์ `.pub`
5. เพิ่ม public key เข้า hosting service แล้วรันคำสั่ง `ssh -T` ของ service ที่เลือก ผลลัพธ์ต้องยืนยันบัญชีได้ ถ้าเจอ `Permission denied (publickey)` ให้ตรวจว่าเพิ่ม public key ครบทั้งบรรทัดและ key ที่เพิ่มเข้า agent เป็นไฟล์ที่ถูกต้อง
6. รัน `cd ~/rainbow` และ `git status` ตรวจว่า repository เดิมยังอยู่และ working tree ยัง clean การตั้ง authentication ไม่ควรแก้ไฟล์หรือสร้าง commit ใด ๆ

ตรวจตัวเองให้ครบ:

- อธิบายได้ว่า remote repository ต่างจาก hosting service อย่างไร
- บอกได้ว่า `git push` ส่งข้อมูลไปทิศทางไหน
- จับคู่ HTTPS URL กับ HTTPS credential และ SSH URL กับ SSH key ได้
- บอกได้ว่าไฟล์ไหนคือ private key และไฟล์ไหนคือ public key
- ทดสอบ authentication ได้โดยไม่ต้องเปิดเผย token หรือ private key

---

## Common Pitfalls — ข้อผิดพลาดที่พบบ่อย

- **คิดว่าล็อกอินหน้าเว็บแล้ว `git push` ต้องใช้ได้เลย** — browser login กับ credential สำหรับ Git ผ่าน HTTPS หรือ SSH เป็นคนละขั้นตอน
- **ใช้ account password กับ GitHub หรือ Bitbucket ผ่าน HTTPS** — สอง service นี้ต้องใช้ personal access token หรือ app password ตามลำดับ
- **เอา personal access token ไปต่อท้ายคำสั่ง Git** — token อาจหลุดไปอยู่ใน shell history ให้รอกรอกตอน Git ถามแทน
- **แชร์ private SSH key** — private key ต้องอยู่ในเครื่องเราเท่านั้น สิ่งที่เพิ่มใน hosting service คือ public key ที่ลงท้ายด้วย `.pub`
- **สร้าง key แล้วเขียนทับ key เดิม** — ถ้ามีไฟล์ชื่อเดียวกันอยู่แล้ว ให้ยกเลิกและตั้งชื่อ key ใหม่ เช่น `id_ed25519_learning_git`
- **ใช้ URL ผิดโปรโตคอล** — HTTPS ต้องใช้ URL ที่ขึ้นต้นด้วย `https://` ส่วน SSH ต้องใช้ URL รูปแบบ `git@host:owner/repo.git`
- **ตั้งค่า HTTPS และ SSH พร้อมกันทั้งที่ยังไม่จำเป็น** — เลือกแค่หนึ่งแบบก่อนก็ทำงานในตอนถัดไปได้
- **ใช้บัญชีบริษัททำแบบฝึกหัด** — SSO, policy หรือ permission ขององค์กรอาจทำให้ผลลัพธ์ต่างจากบทเรียน ใช้บัญชีส่วนตัวจะตรวจตามได้ง่ายกว่า
- **คิดว่า SSH agent เอา private key ไปอัปโหลด** — agent แค่ช่วยให้โปรแกรมในเครื่องเรียกใช้ key ได้ โดย private key ยังอยู่ในเครื่อง
- **เอาไฟล์ credential หรือโฟลเดอร์ `.ssh` เข้า `rainbow`** — credential ต้องอยู่นอก repository และไม่ควรอยู่ใน commit

---

## สรุป

1. Local repository อยู่บนเครื่องเรา ส่วน remote repository อยู่บน hosting service ในคลาวด์
2. GitHub, GitLab และ Bitbucket เป็น hosting service ที่ใช้เก็บ remote repository และจัดการสิทธิ์การเข้าถึง
3. ก่อนใช้ `git push`, `git clone`, `git fetch` หรือ `git pull` ต้องรู้ว่าจะเชื่อมต่อไปที่ไหนและใช้ credential แบบใด
4. HTTPS ใช้ username คู่กับ token, app password หรือ credential ตาม policy ของ hosting service
5. GitHub และ Bitbucket ไม่ใช้ account password ตรง ๆ สำหรับ Git over HTTPS แล้ว
6. SSH ใช้ public/private key pair โดย private key อยู่กับเครื่องและ public key ถูกเพิ่มใน hosting service
7. การตั้งค่า SSH มีลำดับหลักคือสร้าง key pair, เพิ่ม private key เข้า SSH agent และเพิ่ม public key เข้า hosting service
8. URL ของ remote ต้องตรงกับโปรโตคอลที่เลือก: `https://` สำหรับ HTTPS และ `git@host:` สำหรับ SSH
9. ตั้งค่าแค่โปรโตคอลเดียวก็พอ ถ้ายังไม่แน่ใจให้เริ่มจาก HTTPS
10. Token และ private SSH key เป็นความลับ ห้ามแชร์และห้ามใส่ลงใน repository

ตอนนี้ `rainbow` ยังอยู่ในเครื่องเหมือนเดิม แต่เราเตรียม authentication สำหรับเชื่อมต่อ remote repository ไว้แล้ว

บทถัดไปเราจะสร้าง remote repository จริง แล้วใช้ URL กับ credential ที่เตรียมไว้เชื่อม `rainbow` เข้ากับ hosting service

> *ตอนหน้าจะสร้าง remote repository แล้วส่ง commit แรกจาก local ขึ้นไป*

---

## Glossary

- **Hosting service** — บริการที่รับฝาก remote repository บนคลาวด์ เช่น GitHub, GitLab และ Bitbucket
- **Remote repository** — repository ที่อยู่บน hosting service และใช้แชร์หรือรับส่ง commit กับ local repository
- **Authentication** — การยืนยันว่าเราเป็นใครและมีสิทธิ์เข้าถึง repository หรือไม่
- **Protocol** — กติกาและช่องทางที่ใช้รับส่งข้อมูลระหว่าง local กับ remote ในบทนี้คือ HTTPS หรือ SSH
- **HTTPS** — โปรโตคอลรับส่งข้อมูลที่ใช้ username คู่กับ credential เช่น token หรือ app password
- **SSH** — โปรโตคอลที่ใช้คู่กุญแจ public/private เพื่อยืนยันตัวตน
- **Personal access token** — credential ของ GitHub ที่ใช้แทน account password เมื่อเชื่อมต่อผ่าน HTTPS
- **App password** — credential ของ Bitbucket ที่ใช้แทน account password เมื่อเชื่อมต่อผ่าน HTTPS
- **SSH key pair** — คู่ไฟล์ private key และ public key ที่ทำงานร่วมกันเพื่อยืนยันตัวตนผ่าน SSH
- **Private key** — กุญแจลับที่ต้องเก็บไว้ในเครื่องของเจ้าของ ห้ามแชร์หรืออัปโหลด
- **Public key** — กุญแจที่นำไปเพิ่มในบัญชี hosting service เพื่อให้จับคู่กับ private key
- **SSH agent** — โปรแกรมบนเครื่องที่ช่วยจัดการ private key สำหรับการ authenticate ผ่าน SSH

---

## Related

- [ตอนที่ 1: Git and the Command Line](/git/01-git-and-the-command-line/) — เตรียม command line, ติดตั้ง Git และสร้างโฟลเดอร์ `rainbow`
- [ตอนที่ 2: Local Repositories](/git/02-local-repositories/) — เปลี่ยน `rainbow` ให้เป็น local repository และรู้จักพื้นที่ทำงานของ Git
- [ตอนที่ 3: Making a Commit](/git/03-making-a-commit/) — ใช้ `git add`, `git commit` และ `git log` สร้างประวัติที่จะส่งขึ้น remote
- [ตอนที่ 4: Branches](/git/04-branches/) — แยกสายการทำงานด้วย branch ก่อนนำงานมารวมกัน
- [ตอนที่ 5: Merging](/git/05-merging/) — รวม `main` กับ `feature` และปิดช่วงการทำงานใน local repository
- [ตอนที่ 7: Creating and Pushing to a Remote Repository](/git/07-creating-and-pushing-to-a-remote-repository/) — สร้าง remote repository และเริ่มใช้ `git push`
