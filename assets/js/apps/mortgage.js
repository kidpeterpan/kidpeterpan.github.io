(() => {
  const root = document.getElementById('app-root');
  if (!root) return;

  const { parse, chargedRate, periodsValid, buildPlan, runSchedule, normalizePreset } = window.MortgageCore;

  const BANKS = {
    gsb: { name: 'ออมสิน (GSB)', MRR: 6.045, MLR: 6.025, MOR: 5.695 },
    ghb: { name: 'อาคารสงเคราะห์ (GHB)', MRR: 6.145, MLR: 6.15, MOR: 5.85 },
    bbl: { name: 'กรุงเทพ (BBL)', MRR: 6.5, MLR: 6.35, MOR: 6.5 },
    scb: { name: 'ไทยพาณิชย์ (SCB)', MRR: 6.575, MLR: 6.35, MOR: 6.275 },
    kbank: { name: 'กสิกรไทย (KBANK)', MRR: 6.58, MLR: 6.52, MOR: 6.34 },
    bay: { name: 'กรุงศรีอยุธยา (BAY)', MRR: 6.67, MLR: 6.55, MOR: 6.375 },
    ktb: { name: 'กรุงไทย (KTB)', MRR: 6.845, MLR: 6.3, MOR: 6.27 },
    ttb: { name: 'ทหารไทยธนชาต (ttb)', MRR: 7.105, MLR: 6.95, MOR: 6.6 },
  };
  let bank = 'ttb';
  const ref = () => BANKS[bank];
  const MAX_PERIODS = 5;
  /* 50 ปี — เกินกว่านี้ตารางยาวจนเรนเดอร์ไม่ไหว ต้องบอกผู้ใช้ ไม่ใช่ตัดเงียบ */
  const MAX_MONTHS = 600;

  /* ดีลสำเร็จรูปจาก data/mortgage.yaml — ไม่มีไฟล์ ไม่มี preset ที่ผ่านการตรวจ
     หน้าก็ทำงานเหมือนเดิมทุกอย่าง แค่ไม่มีแถบเลือกดีล */
  const appData = (() => {
    const el = document.getElementById('app-data');
    if (!el) return {};
    try { return JSON.parse(el.textContent) || {}; } catch (e) { return {}; }
  })();
  const PRESETS = (Array.isArray(appData.presets) ? appData.presets : [])
    .map((raw) => normalizePreset(raw, BANKS, MAX_PERIODS))
    .filter(Boolean);
  const CUSTOM = 'custom';

  const fmtNum = (v) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(v));
  const fmtCur = (v) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Math.round(v));
  const fmtPct3 = (v) => `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 3 }).format(v)}%`;
  const fmtDur = (months) => {
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${fmtNum(m)} เดือน`;
    if (m === 0) return `${fmtNum(y)} ปี`;
    return `${fmtNum(y)} ปี ${fmtNum(m)} เดือน`;
  };

  root.innerHTML = `
    <div class="app-preset" id="mort-preset-bar" hidden>
      <label for="mort-preset">ดีลที่บันทึกไว้</label>
      <select id="mort-preset"></select>
      <button type="button" class="preset-edit" id="mort-preset-edit">ปรับเอง</button>
    </div>

    <form class="app-form" autocomplete="off">
      <div class="app-field">
        <label for="mort-amount">วงเงินกู้ (บาท)</label>
        <input id="mort-amount" inputmode="decimal" placeholder="เช่น 2,500,000" value="2000000" />
      </div>
      <div class="app-field">
        <label for="mort-years">ระยะเวลาผ่อน (ปี)</label>
        <input id="mort-years" inputmode="decimal" placeholder="เช่น 30" value="40" />
        <p class="rate-hint" id="mort-note" hidden></p>
      </div>
      <div class="app-field">
        <label for="mort-extra">ผ่อนเพิ่มต่อเดือน (บาท) <span class="opt">ไม่บังคับ</span></label>
        <input id="mort-extra" inputmode="decimal" placeholder="เช่น 5,000" value="0" />
      </div>
      <div class="app-field app-field-wide">
        <label>อัตราดอกเบี้ยรายงวด</label>
        <select class="bank-select" id="mort-bank" aria-label="ธนาคารอ้างอิง"></select>
        <div class="rate-builder" id="rate-builder"></div>
        <p class="rate-hint">อัตรา MRR / MLR / MOR ใช้ค่าของธนาคารที่เลือก · แต่ละแถว = 1 ปี · แถวสุดท้ายใช้จนครบสัญญา</p>
      </div>
    </form>

    <div class="app-results">
      <div class="app-result">
        <span class="value" id="mort-first">—</span>
        <span class="label">ค่างวดช่วงแรก</span>
      </div>
      <div class="app-result">
        <span class="value" id="mort-interest">—</span>
        <span class="label">ดอกเบี้ยรวม</span>
      </div>
      <div class="app-result">
        <span class="value" id="mort-total">—</span>
        <span class="label">รวมที่ต้องจ่าย</span>
      </div>
    </div>

    <div class="app-results app-bonus" id="mort-bonus" hidden>
      <div class="app-result">
        <span class="value" id="mort-actual">—</span>
        <span class="label" id="mort-actual-label">จ่ายจริงต่อเดือน</span>
      </div>
      <div class="app-result">
        <span class="value" id="mort-payoff">—</span>
        <span class="label" id="mort-payoff-label">ผ่อนหมดใน</span>
      </div>
      <div class="app-result">
        <span class="value" id="mort-saved">—</span>
        <span class="label">ประหยัดดอกเบี้ย</span>
      </div>
    </div>

    <div class="app-schedule" id="mort-schedule" hidden></div>

    <div class="app-table-wrap">
      <div class="app-table-head">
        <p class="app-table-title">ตารางผ่อนชำระ</p>
        <div class="app-table-actions">
          <button type="button" class="app-copy-btn" id="mort-export">↓ ดาวน์โหลด CSV</button>
          <button type="button" class="app-copy-btn" id="mort-copy">⧉ คัดลอกตาราง</button>
        </div>
      </div>
      <div class="app-table" id="mort-table"></div>
    </div>
  `;

  const amount = document.getElementById('mort-amount');
  const years = document.getElementById('mort-years');
  const extra = document.getElementById('mort-extra');
  const first = document.getElementById('mort-first');
  const interest = document.getElementById('mort-interest');
  const total = document.getElementById('mort-total');
  const bonus = document.getElementById('mort-bonus');
  const actual = document.getElementById('mort-actual');
  const payoff = document.getElementById('mort-payoff');
  const saved = document.getElementById('mort-saved');
  const note = document.getElementById('mort-note');
  const actualLabel = document.getElementById('mort-actual-label');
  const payoffLabel = document.getElementById('mort-payoff-label');
  const schedule = document.getElementById('mort-schedule');
  const table = document.getElementById('mort-table');
  const builder = document.getElementById('rate-builder');
  const bankSelect = document.getElementById('mort-bank');
  const copyBtn = document.getElementById('mort-copy');
  const exportBtn = document.getElementById('mort-export');
  const presetBar = document.getElementById('mort-preset-bar');
  const presetSelect = document.getElementById('mort-preset');
  const presetEdit = document.getElementById('mort-preset-edit');

  let lastSched = null;

  const cell = (v, align = 'right') => `<td style="text-align:${align}">${v}</td>`;

  let periods = [
    { type: 'fixed', val: '2.50' },
    { type: 'MLR', val: '-2.25' },
  ];

  function effLabel(p) {
    const r = chargedRate(p.type, ref(), p.val);
    if (r === null) return '—';
    return p.type === 'fixed' ? fmtPct3(r) : `≈ ${fmtPct3(r)}`;
  }

  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(t);
    }
    const ta = document.createElement('textarea');
    ta.value = t;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
  }

  function scheduleDataRows(delimiter) {
    return lastSched.rows.map((r) =>
      [r.i, r.annualPct.toFixed(3), r.pPaid.toFixed(2), r.iPaid.toFixed(2), r.balance.toFixed(2)].join(delimiter)
    );
  }

  copyBtn.addEventListener('click', () => {
    if (!lastSched) return;
    const tsv = ['งวด\tอัตราต่อปี(%)\tเงินต้น\tดอกเบี้ย\tยอดคงเหลือ'].concat(scheduleDataRows('\t')).join('\n');
    copyText(tsv)
      .then(() => {
        copyBtn.textContent = 'คัดลอกแล้ว ✓';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = '⧉ คัดลอกตาราง';
          copyBtn.classList.remove('copied');
        }, 1500);
      })
      .catch(() => { copyBtn.textContent = 'คัดลอกไม่สำเร็จ'; });
  });

  exportBtn.addEventListener('click', () => {
    if (!lastSched) return;
    const csv = '\uFEFF' + ['งวด,อัตราต่อปี(%),เงินต้น,ดอกเบี้ย,ยอดคงเหลือ'].concat(scheduleDataRows(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mortgage-schedule.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  function renderBankSelect() {
    bankSelect.innerHTML = Object.entries(BANKS).map(([k, b]) =>
      `<option value="${k}"${k === bank ? ' selected' : ''}>${b.name} · MRR ${fmtPct3(b.MRR)} / MLR ${fmtPct3(b.MLR)} / MOR ${fmtPct3(b.MOR)}</option>`
    ).join('');
  }

  bankSelect.addEventListener('change', (e) => {
    bank = e.target.value;
    renderBankSelect();
    renderBuilder();
    render();
  });

  /* โหมดล็อก: ช่องที่ preset กำหนดไว้จะจางและแก้ไม่ได้ เหลือ "ผ่อนเพิ่มต่อเดือน"
     ช่องเดียวที่ปรับได้ — กด "ปรับเอง" (หรือเลือก "กำหนดเอง") เพื่อปลดทั้งฟอร์ม */
  let locked = false;

  function renderPresetSelect() {
    presetSelect.innerHTML = PRESETS.map((p) => `<option value="${p.id}">${p.label}</option>`).join('') +
      `<option value="${CUSTOM}">กำหนดเอง</option>`;
  }

  /* เรียกทุกครั้งหลัง renderBuilder เพราะ builder สร้าง input ชุดใหม่ทั้งหมด
     สถานะ disabled ของชุดเก่าจึงหายไปกับ DOM เดิม */
  function applyLock() {
    [amount, years, bankSelect]
      .concat(Array.from(builder.querySelectorAll('select, input, button')))
      .forEach((el) => { el.disabled = locked; });
    presetEdit.hidden = !locked;
  }

  function applyPreset(preset) {
    bank = preset.bank;
    /* คั่นหลักพันเพราะในโหมดล็อกช่องนี้ทำหน้าที่เป็นตัวเลขให้อ่าน ไม่ใช่ช่องกรอก
       — parse() อ่านคอมมาได้อยู่แล้ว ค่าจึงยังใช้ต่อได้ตอนกด "ปรับเอง" */
    amount.value = fmtNum(preset.amount);
    years.value = String(preset.years);
    periods = preset.periods.map((p) => ({ type: p.type, val: p.val }));
    locked = true;
    presetSelect.value = preset.id;
    renderBankSelect();
    renderBuilder();
    render();
  }

  function unlock() {
    locked = false;
    presetSelect.value = CUSTOM;
    applyLock();
  }

  presetSelect.addEventListener('change', (e) => {
    const chosen = PRESETS.find((p) => p.id === e.target.value);
    if (chosen) applyPreset(chosen);
    else unlock();
  });

  presetEdit.addEventListener('click', unlock);

  function buildRateRow(period, index) {
    const periodNumber = index + 1;
    return `
      <div class="rate-row" data-i="${index}">
        <span class="rate-row-num">ปีที่ ${periodNumber}</span>
        <select class="rate-row-type" aria-label="ประเภทอัตรางวด ${periodNumber}">
          <option value="fixed"${period.type === 'fixed' ? ' selected' : ''}>คงที่</option>
          <option value="MRR"${period.type === 'MRR' ? ' selected' : ''}>MRR · ${fmtPct3(ref().MRR)}</option>
          <option value="MLR"${period.type === 'MLR' ? ' selected' : ''}>MLR · ${fmtPct3(ref().MLR)}</option>
          <option value="MOR"${period.type === 'MOR' ? ' selected' : ''}>MOR · ${fmtPct3(ref().MOR)}</option>
        </select>
        <div class="rate-row-val-wrap">
          <input class="rate-row-val" inputmode="decimal" placeholder="%" value="${period.val}" aria-label="อัตราหรือส่วนต่างงวด ${periodNumber}" />
          <button type="button" class="rate-row-sign" aria-label="สลับบวก/ลบงวด ${periodNumber}">±</button>
        </div>
        <span class="rate-row-eff">${effLabel(period)}</span>
        ${periods.length > 1 ? `<button type="button" class="rate-row-del" aria-label="ลบงวด ${periodNumber}">✕</button>` : ''}
      </div>
    `;
  }

  function bindRateRow(row) {
    const index = +row.dataset.i;
    const typeSelect = row.querySelector('.rate-row-type');
    const valueInput = row.querySelector('.rate-row-val');
    const effectLabel = row.querySelector('.rate-row-eff');

    function syncPeriod() {
      effectLabel.textContent = effLabel(periods[index]);
      render();
    }

    typeSelect.addEventListener('change', (e) => {
      periods[index].type = e.target.value;
      if (periods[index].val === '') {
        periods[index].val = '0';
        valueInput.value = '0';
      }
      syncPeriod();
    });
    valueInput.addEventListener('input', (e) => {
      periods[index].val = e.target.value;
      syncPeriod();
    });
    row.querySelector('.rate-row-sign').addEventListener('click', () => {
      const raw = String(periods[index].val).trim();
      periods[index].val = raw.startsWith('-') ? raw.slice(1) : `-${raw === '' ? '0' : raw}`;
      valueInput.value = periods[index].val;
      syncPeriod();
    });
  }

  function renderBuilder() {
    builder.innerHTML = periods.map(buildRateRow).join('') + (periods.length < MAX_PERIODS
      ? '<button type="button" class="rate-row-add">+ เพิ่มงวด</button>'
      : '');

    builder.querySelectorAll('.rate-row').forEach(bindRateRow);
    builder.querySelectorAll('.rate-row-del').forEach((btn) => {
      btn.addEventListener('click', () => {
        periods.splice(+btn.closest('.rate-row').dataset.i, 1);
        renderBuilder();
        render();
      });
    });
    const addBtn = builder.querySelector('.rate-row-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        periods.push({ type: 'MRR', val: '0' });
        renderBuilder();
        render();
      });
    }
    applyLock();
  }

  function currentInputs() {
    const principal = parse(amount.value);
    const yearsValue = parse(years.value);
    const extraAmount = parse(extra.value);
    return {
      principal,
      yearsValue,
      extraAmount,
      hasExtra: Number.isFinite(extraAmount) && extraAmount > 0,
    };
  }

  function showEmptyResults() {
    lastSched = null;
    first.textContent = '—';
    interest.textContent = '—';
    total.textContent = '—';
    bonus.hidden = true;
    schedule.hidden = true;
    table.innerHTML = '<p class="app-table-empty">กรอกวงเงินกู้ ระยะเวลาผ่อน และอัตรารายงวดอย่างน้อย 1 ช่วงก่อน</p>';
  }

  function renderStages(stages) {
    schedule.hidden = false;
    schedule.innerHTML = '<p class="app-table-title">ช่วงอัตรา</p>' + stages.map((st, idx) => `
      <div class="app-schedule-row">
        <span class="rate-row-num">ปีที่ ${idx + 1}</span>
        <span class="rate-row-eff">${fmtPct3(st.annualPct)}</span>
        <span class="schedule-months">${st.months > 12 ? `ปีที่ ${idx + 1} เป็นต้นไป` : `ปีที่ ${idx + 1}`}</span>
        <span class="schedule-pay">ค่างวด ${fmtCur(st.payment)}</span>
      </div>
    `).join('');
  }

  function renderBonus(base, sched) {
    bonus.hidden = false;
    const pays = sched.stages.map((st) => st.payment);
    const peak = Math.max(...pays);
    actual.textContent = fmtCur(pays[0]);
    actualLabel.textContent = peak - pays[0] > 1
      ? `จ่ายจริงต่อเดือน · ช่วงแรก (สูงสุด ${fmtCur(peak)})`
      : 'จ่ายจริงต่อเดือน';
    payoff.textContent = fmtDur(sched.months);
    const faster = base.months - sched.months;
    payoffLabel.textContent = faster > 0 ? `ผ่อนหมดใน · เร็วขึ้น ${fmtDur(faster)}` : 'ผ่อนหมดใน';
    saved.textContent = fmtCur(base.totalInt - sched.totalInt);
  }

  function renderTable(sched) {
    const head = '<tr><th>งวด</th><th>อัตรา/ปี</th><th>เงินต้น</th><th>ดอกเบี้ย</th><th>ยอดคงเหลือ</th></tr>';
    const body = sched.rows.map((row) => `
      <tr>
        ${cell(fmtNum(row.i))}
        ${cell(fmtPct3(row.annualPct))}
        ${cell(fmtCur(row.pPaid))}
        ${cell(fmtCur(row.iPaid))}
        ${cell(fmtCur(row.balance))}
      </tr>
    `).join('');
    table.innerHTML = `<table>${head}${body}</table>`;
  }

  function render() {
    const { principal, yearsValue, extraAmount, hasExtra } = currentInputs();

    const valid = [principal, yearsValue].every(Number.isFinite) && principal > 0 && yearsValue > 0 &&
      periodsValid(periods, ref());
    const wantedMonths = valid ? Math.max(1, Math.round(yearsValue * 12)) : 1;
    const months = Math.min(wantedMonths, MAX_MONTHS);
    note.hidden = wantedMonths <= MAX_MONTHS;
    if (!note.hidden) {
      note.textContent = `คำนวณได้สูงสุด ${MAX_MONTHS / 12} ปี · ผลลัพธ์ด้านล่างคิดที่ ${MAX_MONTHS / 12} ปี`;
    }
    const plan = valid ? buildPlan(months, periods, ref()) : [];

    if (!valid || plan.length === 0) {
      showEmptyResults();
      return;
    }

    const base = runSchedule(principal, months, plan, 0);
    const sched = hasExtra ? runSchedule(principal, months, plan, extraAmount) : base;
    lastSched = sched;

    first.textContent = fmtCur(base.stages[0].payment);
    interest.textContent = fmtCur(sched.totalInt);
    total.textContent = fmtCur(principal + sched.totalInt);

    renderStages(base.stages);
    if (hasExtra) {
      renderBonus(base, sched);
    } else {
      bonus.hidden = true;
    }
    renderTable(sched);
  }

  [amount, years, extra].forEach((el) => el.addEventListener('input', render));

  const initial = PRESETS.find((p) => p.isDefault) || PRESETS[0];
  if (initial) {
    presetBar.hidden = false;
    renderPresetSelect();
    applyPreset(initial);
  } else {
    renderBankSelect();
    renderBuilder();
    render();
  }
})();