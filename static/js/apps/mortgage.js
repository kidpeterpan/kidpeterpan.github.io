(() => {
  const root = document.getElementById('app-root');
  if (!root) return;

  const { parse, effectiveRate, buildPlan, runSchedule } = window.MortgageCore;

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

  const fmtNum = (v) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(v));
  const fmtCur = (v) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(Math.round(v));
  const fmtPct = (v) => `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(v)}%`;
  const fmtPct3 = (v) => `${new Intl.NumberFormat('th-TH', { maximumFractionDigits: 3 }).format(v)}%`;

  root.innerHTML = `
    <form class="app-form" autocomplete="off">
      <div class="app-field">
        <label for="mort-amount">วงเงินกู้ (บาท)</label>
        <input id="mort-amount" inputmode="decimal" placeholder="เช่น 2,500,000" value="2000000" />
      </div>
      <div class="app-field">
        <label for="mort-years">ระยะเวลาผ่อน (ปี)</label>
        <input id="mort-years" inputmode="decimal" placeholder="เช่น 30" value="40" />
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
        <span class="label">จ่ายจริงต่อเดือน</span>
      </div>
      <div class="app-result">
        <span class="value" id="mort-payoff">—</span>
        <span class="label">จ่ายหมดไวขึ้น</span>
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
  const schedule = document.getElementById('mort-schedule');
  const table = document.getElementById('mort-table');
  const builder = document.getElementById('rate-builder');
  const bankSelect = document.getElementById('mort-bank');
  const copyBtn = document.getElementById('mort-copy');
  const exportBtn = document.getElementById('mort-export');

  let lastSched = null;

  const cell = (v, align = 'right') => `<td style="text-align:${align}">${v}</td>`;

  let periods = [
    { type: 'fixed', val: '2.50' },
    { type: 'MLR', val: '-2.25' },
  ];

  function effLabel(p) {
    const r = effectiveRate(p.type, ref(), p.val);
    if (r === null) return '—';
    if (p.type === 'fixed') return fmtPct3(r);
    return `≈ ${fmtPct3(Math.max(r, 0))}`;
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

  copyBtn.addEventListener('click', () => {
    if (!lastSched) return;
    const rows = lastSched.rows.map((r) =>
      [r.i, (r.rate * 100).toFixed(2), r.pPaid.toFixed(2), r.iPaid.toFixed(2), r.balance.toFixed(2)].join('\t')
    );
    const tsv = ['งวด\tอัตรา(%)\tเงินต้น\tดอกเบี้ย\tยอดคงเหลือ'].concat(rows).join('\n');
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
    const rows = lastSched.rows.map((r) =>
      [r.i, (r.rate * 100).toFixed(2), r.pPaid.toFixed(2), r.iPaid.toFixed(2), r.balance.toFixed(2)].join(',')
    );
    const csv = '\uFEFF' + ['งวด,อัตรา(%),เงินต้น,ดอกเบี้ย,ยอดคงเหลือ'].concat(rows).join('\n');
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

  function renderBuilder() {
    builder.innerHTML = periods.map((p, i) => `
      <div class="rate-row" data-i="${i}">
        <span class="rate-row-num">ปีที่ ${i + 1}</span>
        <select class="rate-row-type" aria-label="ประเภทอัตรางวด ${i + 1}">
          <option value="fixed"${p.type === 'fixed' ? ' selected' : ''}>คงที่</option>
          <option value="MRR"${p.type === 'MRR' ? ' selected' : ''}>MRR · ${fmtPct3(ref().MRR)}</option>
          <option value="MLR"${p.type === 'MLR' ? ' selected' : ''}>MLR · ${fmtPct3(ref().MLR)}</option>
          <option value="MOR"${p.type === 'MOR' ? ' selected' : ''}>MOR · ${fmtPct3(ref().MOR)}</option>
        </select>
        <div class="rate-row-val-wrap">
          <input class="rate-row-val" inputmode="decimal" placeholder="%" value="${p.val}" aria-label="อัตราหรือส่วนต่างงวด ${i + 1}" />
          <button type="button" class="rate-row-sign" aria-label="สลับบวก/ลบงวด ${i + 1}">±</button>
        </div>
        <span class="rate-row-eff">${effLabel(p)}</span>
        ${periods.length > 1 ? `<button type="button" class="rate-row-del" aria-label="ลบงวด ${i + 1}">✕</button>` : ''}
      </div>
    `).join('') + (periods.length < MAX_PERIODS
      ? '<button type="button" class="rate-row-add">+ เพิ่มงวด</button>'
      : '');

    builder.querySelectorAll('.rate-row').forEach((row) => {
      const i = +row.dataset.i;
      row.querySelector('.rate-row-type').addEventListener('change', (e) => {
        periods[i].type = e.target.value;
        if (periods[i].val === '') {
          periods[i].val = '0';
          row.querySelector('.rate-row-val').value = '0';
        }
        row.querySelector('.rate-row-eff').textContent = effLabel(periods[i]);
        render();
      });
      row.querySelector('.rate-row-val').addEventListener('input', (e) => {
        periods[i].val = e.target.value;
        row.querySelector('.rate-row-eff').textContent = effLabel(periods[i]);
        render();
      });
      row.querySelector('.rate-row-sign').addEventListener('click', () => {
        const v = parse(periods[i].val);
        periods[i].val = Number.isFinite(v) ? String(-v) : '-0';
        row.querySelector('.rate-row-val').value = periods[i].val;
        row.querySelector('.rate-row-eff').textContent = effLabel(periods[i]);
        render();
      });
    });
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
  }

  function buildPlanLocal(n) {
    return buildPlan(n, periods, ref());
  }

  function render() {
    const P = parse(amount.value);
    const yrs = parse(years.value);
    const extraAmt = parse(extra.value);
    const hasExtra = Number.isFinite(extraAmt) && extraAmt > 0;

    const valid = [P, yrs].every(Number.isFinite) && P > 0 && yrs > 0;
    const n = valid ? Math.max(1, Math.round(yrs * 12)) : 1;
    const plan = valid ? buildPlanLocal(n) : [];

    if (!valid || plan.length === 0) {
      lastSched = null;
      first.textContent = '—';
      interest.textContent = '—';
      total.textContent = '—';
      bonus.hidden = true;
      schedule.hidden = true;
      table.innerHTML = '<p class="app-table-empty">กรอกวงเงินกู้ ระยะเวลาผ่อน และอัตรารายงวดอย่างน้อย 1 ช่วงก่อน</p>';
      return;
    }

    const base = runSchedule(P, n, plan, 0);
    const sched = hasExtra ? runSchedule(P, n, plan, extraAmt) : base;
    lastSched = sched;

    first.textContent = fmtCur(base.stages[0].payment);
    interest.textContent = fmtCur(sched.totalInt);
    total.textContent = fmtCur(P + sched.totalInt);

    schedule.hidden = false;
    schedule.innerHTML = '<p class="app-table-title">ช่วงอัตรา</p>' + base.stages.map((st, idx) => `
      <div class="app-schedule-row">
        <span class="rate-row-num">ปีที่ ${idx + 1}</span>
        <span class="rate-row-eff">${fmtPct(st.rate * 100)}</span>
        <span class="schedule-months">${st.months > 12 ? `ปีที่ ${idx + 1} เป็นต้นไป` : `ปีที่ ${idx + 1}`}</span>
        <span class="schedule-pay">ค่างวด ${fmtCur(st.payment)}</span>
      </div>
    `).join('');

    if (hasExtra) {
      bonus.hidden = false;
      actual.textContent = fmtCur(base.stages[0].payment + extraAmt);
      const y = Math.floor(sched.months / 12);
      const m = sched.months % 12;
      payoff.textContent = `${fmtNum(y)} ปี ${fmtNum(m)} เดือน`;
      saved.textContent = fmtCur(base.totalInt - sched.totalInt);
    } else {
      bonus.hidden = true;
    }

    const head = '<tr><th>งวด</th><th>อัตรา</th><th>เงินต้น</th><th>ดอกเบี้ย</th><th>ยอดคงเหลือ</th></tr>';
    const body = sched.rows.map((row) => `
      <tr>
        ${cell(fmtNum(row.i))}
        ${cell(fmtPct(row.rate * 100))}
        ${cell(fmtCur(row.pPaid))}
        ${cell(fmtCur(row.iPaid))}
        ${cell(fmtCur(row.balance))}
      </tr>
    `).join('');
    table.innerHTML = `<table>${head}${body}</table>`;
  }

  [amount, years, extra].forEach((el) => el.addEventListener('input', render));
  renderBankSelect();
  renderBuilder();
  render();
})();