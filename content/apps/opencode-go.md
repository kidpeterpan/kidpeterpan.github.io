+++
title = 'เทียบโมเดล OpenCode Go'
date = '2026-09-16T00:00:00+07:00'
draft = false
description = 'ตารางเทียบโมเดล OpenCode Go — request ต่อ 5 ชม./สัปดาห์/เดือน, ความเร็ว (tok/s), คุณภาพ และคะแนนคุ้มค่า กดหัวตารางเพื่อเรียงลำดับได้'
tags = ['tools', 'ai']
[params]
order = 2
icon = '📊'
app_data = 'opencode-go'
app_core_js = 'opencode-go-core.js'
app_js = 'opencode-go.js'
+++

ตารางด้านล่างเทียบทุกโมเดลของ [OpenCode Go](https://opencode.ai/docs/go/) (แผน $10/เดือน) ในแกนที่เลือกใช้จริง — กดหัวคอลัมน์เพื่อเรียงลำดับได้ทุกช่อง

**วิธีอ่าน**

- **req 5 ชม. · req สัปดาห์ · req เดือน** — จำนวน request โดยประมาณต่อช่วงเวลา จากตาราง Estimated requests ของเอกสารทางการ (คิดจากโควตาและราคาของแต่ละโมเดล)
- **tok/s** — ความเร็ว output (median tokens ต่อวินาที) จาก [Artificial Analysis](https://artificialanalysis.ai/)
- **คุณภาพ** — คะแนน 0–10 สังเคราะห์จาก benchmark สาธารณะ (SWE-bench, Terminal-Bench, vals.ai ฯลฯ) ใช้เทียบเชิงสเกล ไม่ใช่ค่าทางการ
- **คุ้มค่า** — 60% คุณภาพ + 40% ปริมาณ request (log scale) — จุดสมดุลระหว่าง "เก่ง" กับ "ใช้ได้เยอะ"

> ⚠️ ตัวเลขเป็นค่าประมาณ ณ วันที่อัปเดต (แสดงอยู่ใต้ตาราง) — โปรโมชันและโควตาของ OpenCode ปรับได้ระหว่างเดือน
