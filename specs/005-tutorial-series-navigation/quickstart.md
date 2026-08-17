# Quickstart: Tutorial Series Ordering & Episode Navigation

**Created**: 2026-08-17 | **Feature**: [spec.md](spec.md)

คู่มือตรวจสอบแบบ end-to-end ว่า feature ทำงานถูกต้อง ตาม Principle V ของ constitution ที่กำหนดว่าทุกการแก้ template/CSS/JS
ต้องตรวจด้วยมือบน dev server ก่อนถือว่าเสร็จ

## Prerequisites

- Hugo (รุ่นเดียวกับที่ใช้ใน CI — ปัจจุบัน `v0.164.0+extended`)
- npm dependencies (`npm ci`)
- เนื้อหาปัจจุบัน: section `go` มี 11 ตอน (`01-`…`11-`), section `git` มี 8 ตอน (`01-`…`08-`)

```sh
make start   # หรือ hugo server
```

เปิด `http://localhost:1313/`

---

## 1. ลำดับตอนใน section ที่เป็นคอร์ส (FR-003, FR-004, FR-005)

เปิด `http://localhost:1313/go/` แล้วตรวจ:

1. รายการบนสุดคือ **ตอนที่ 01 "Setting Up Your Go Environment"** ไม่ใช่ตอนล่าสุด
2. ไล่จากบนลงล่างได้ครบ 01 → 11 ตามลำดับคอร์ส
3. **จุดสำคัญ:** ตอน `07-types-methods-and-interfaces` ต้องอยู่ **ก่อน** `08-generics` ทั้งสองไฟล์มี `date = '2026-08-07'`
   เท่ากัน — ถ้าลำดับสลับกันแปลว่าโค้ดยังไปอ่านค่า date อยู่ ซึ่งผิด FR-004
4. เลข `.idx` ที่แสดงหน้าแต่ละแถว (01, 02, …) ต้องตรงกับเลขตอนจริง

ทำซ้ำกับ `http://localhost:1313/git/` — ต้องขึ้นตอน 01 "Git and the Command Line" ก่อน แล้วไล่ถึง 08

## 2. Section ที่ไม่ใช่คอร์สต้องไม่เปลี่ยน (FR-002)

เปิดทีละหน้าแล้วเทียบกับก่อนแก้ ต้องเรียงใหม่สุดก่อนเหมือนเดิมทุกหน้า:

- `http://localhost:1313/article/`
- `http://localhost:1313/book/`
- `http://localhost:1313/cheat_sheet/` — ยังไม่มีโพสต์ ต้องขึ้น empty state `no posts found.` ตามเดิม ไม่ error

## 3. หน้า tag ต้องไม่เปลี่ยน (FR-006)

หน้า `/tags/*` ใช้ `list.html` ตัวเดียวกับ section แต่ไม่มี `_index.md` จึงไม่มี param `ordered` — ต้องตกไปทาง newest-first เอง

ตรวจอย่างน้อย 2 หน้า:

- `http://localhost:1313/tags/go/` — มี 11 โพสต์จาก section ที่เป็นคอร์ส ต้องยัง **เรียงใหม่สุดก่อน** (ตอน 11 อยู่บน)
- `http://localhost:1313/tags/tutorial/` — มีทั้งโพสต์ go และ git ปนกัน ต้องเรียงตามวันที่ ไม่ใช่ตามชื่อไฟล์

## 4. หน้าแรกต้องไม่เปลี่ยน (FR-007)

เปิด `http://localhost:1313/` แล้วตรวจ:

1. รายการ "All notes" ยังเรียงใหม่สุดก่อน
2. dropdown category filter ยังกรองได้ปกติ
3. การ์ด section (รวม cover image จาก feature 004) ยังแสดงเหมือนเดิม

## 5. ปุ่มไปตอนก่อนหน้า/ตอนถัดไป (FR-008, FR-009, FR-010, FR-011)

| หน้าที่เปิด | ต้องเห็น |
|---|---|
| `/go/01-setting-up-your-go-environment/` | มีแต่ปุ่ม **ตอนถัดไป** (ชี้ไปตอน 02) ไม่มีปุ่มตอนก่อนหน้า |
| `/go/07-types-methods-and-interfaces/` | ก่อนหน้า = ตอน 06, ถัดไป = **ตอน 08** (คู่ date ซ้ำ — ต้องไม่ชี้ย้อนกลับ) |
| `/go/08-generics/` | ก่อนหน้า = **ตอน 07**, ถัดไป = ตอน 09 |
| `/go/11-go-tooling/` | มีแต่ปุ่ม **ตอนก่อนหน้า** ไม่มีปุ่มตอนถัดไป |
| `/git/04-branches/` | มีทั้งสองปุ่ม ชี้ไปตอน 03 และ 05 |
| `/article/jetbrains-context/` | **ไม่มี** episode navigation เลย |
| `/book/hidden_potential/` | **ไม่มี** episode navigation เลย |

ตรวจเพิ่ม:

- แต่ละปุ่มแสดง **ชื่อตอนปลายทาง** ไม่ใช่แค่คำว่า "ถัดไป" เฉย ๆ (FR-009)
- กดปุ่มแล้วไปหน้าที่ถูกต้องจริง ไม่ 404
- ตำแหน่งอยู่ท้ายเนื้อหาบทความ **เหนือ** บล็อก share

## 6. อ่านคอร์สรวดเดียวจนจบ (SC-002)

เปิด `/git/01-git-and-the-command-line/` แล้วกดปุ่มตอนถัดไปรวดเดียวจนถึงตอน 08 โดย **ไม่ใช้ปุ่ม back ของ browser และไม่กลับไปหน้า section เลย**
ต้องไปได้ครบ 8 ตอนตามลำดับ

## 7. Dark mode + light mode (FR-013, Principle II)

กดปุ่มสลับธีมบน header แล้วดู `/go/05-functions/` ทั้งสองโหมด:

1. ตัวอักษรและเส้นขอบของ episode navigation อ่านออกทั้งสองโหมด
2. สีที่ใช้มาจาก token เดิม ไม่มีสีที่ hardcode จนเพี้ยนในโหมดใดโหมดหนึ่ง
3. รีเฟรชหน้าแล้วธีมยังคงอยู่ (localStorage `mha-theme` ทำงานเหมือนเดิม)

## 8. Keyboard + accessibility (FR-012, Principle IV)

บนหน้า `/go/05-functions/`:

1. กด `Tab` ไล่จากเนื้อหาลงมา ต้องโฟกัสปุ่มตอนก่อนหน้าและตอนถัดไปได้ และเห็น focus ring ชัดเจน
2. กด `Enter` ตอนโฟกัสอยู่ ต้องไปหน้าปลายทางได้
3. ทิศทางต้องสื่อด้วย "ข้อความ" ไม่ใช่สีหรือลูกศรอย่างเดียว

## 9. Responsive (มือถือ)

ย่อหน้าต่างเหลือ ~375px แล้วดู `/go/05-functions/`:

- ปุ่มตอนก่อนหน้า/ถัดไปไม่ล้นขอบจอ ชื่อตอนยาว ๆ ตัดบรรทัดหรือ truncate อย่างเรียบร้อย

## 10. Production build (Principle V)

```sh
hugo --minify
```

ต้องจบด้วย exit code 0 และไม่มี error/warning ใหม่

ตรวจไฟล์ที่ build ออกมาแบบเร็ว ๆ:

```sh
grep -c 'episode-nav' public/go/05-functions/index.html      # ต้องได้ > 0
grep -c 'episode-nav' public/article/jetbrains-context/index.html   # ต้องได้ 0
```

---

## Rollback

feature นี้แตะแค่ 6 ไฟล์ ถ้าต้องถอย:

- ลบบรรทัด `ordered = true` ออกจาก `content/go/_index.md` และ `content/git/_index.md` → ทุกอย่างกลับไปเรียงตามวันที่และ episode navigation หายไปเอง โดยไม่ต้องแตะ template
- ถ้าจะถอยทั้งหมด: `git revert` commit ของ feature นี้
