/* Pure helpers for the OpenCode Go comparison mini app.
   No DOM access — shared between the browser page and Node unit tests. */
(function (global) {
  'use strict';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fmtIntFn = new Intl.NumberFormat('th-TH');
  const fmtPerfFn = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmtValueFn = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 1 });

  const fmtInt = (v) => fmtIntFn.format(v);
  const fmtPerf = (v) => fmtPerfFn.format(v);
  const fmtValue = (v) => fmtValueFn.format(v);

  /* Columns of the comparison table, in render order. `fmt` turns a model into
     a cell — shared by the on-screen table and the Markdown export so the two
     never drift. */
  const COLUMNS = [
    { key: 'name', label: 'Model', fmt: (m) => m.name },
    { key: 'req5h', label: 'req 5h', fmt: (m) => fmtInt(m.req5h) },
    { key: 'reqWeek', label: 'req week', fmt: (m) => fmtInt(m.reqWeek) },
    { key: 'reqMonth', label: 'req month', fmt: (m) => fmtInt(m.reqMonth) },
    { key: 'speed', label: 'tok/s', fmt: (m) => fmtInt(m.speed) },
    { key: 'perf', label: 'Quality', fmt: (m) => fmtPerf(m.perf) },
    { key: 'value', label: 'Value', fmt: (m) => fmtValue(m.value) },
  ];

  const KEYS = COLUMNS.map((c) => c.key);

  /* '2026-09-22' -> '22 Sep 2026'; '' when the value is not a date. */
  function formatDate(iso) {
    const m = typeof iso === 'string' ? iso.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
    if (!m) return '';
    const month = Number(m[2]);
    if (month < 1 || month > 12) return '';
    return `${Number(m[3])} ${MONTHS[month - 1]} ${m[1]}`;
  }

  /* Robust number read for values that arrive from YAML as numbers but may be
     written as strings ("6,500") by a future edit. null/undefined/booleans are
     NaN — a missing value must reject the row, not silently become 0. */
  function num(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const s = v.trim().replace(/,/g, '');
      return s === '' ? NaN : Number(s);
    }
    return NaN;
  }

  /* One raw row from data/opencode-go.yaml -> a model record, or null when a
     field would break the table. A typo in the data file costs that one row,
     not the whole app — same contract as normalizePreset in mortgage-core. */
  function normalizeModel(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const name = String(raw.name || '').trim();
    if (!name) return null;
    const req5h = num(raw.req_5h);
    const reqWeek = num(raw.req_week);
    const reqMonth = num(raw.req_month);
    const speed = num(raw.speed);
    const perf = num(raw.perf);
    if (![req5h, reqWeek, reqMonth, speed, perf].every(Number.isFinite)) return null;
    return {
      name,
      req5h,
      reqWeek,
      reqMonth,
      speed,
      perf,
      note: String(raw.note || '').trim(),
    };
  }

  function normalizeModels(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map(normalizeModel).filter(Boolean);
  }

  /* คุ้มค่า = 60% คุณภาพ + 40% ปริมาณ request — แต่ละแกน min-max normalize
     (request ใช้ log scale เพราะช่วง 160–226,600 ห่างกันสามหลัก) แล้วสเกลเป็น 0–100
     แกนที่ค่าทุกตัวเท่ากันแจกเครดิตเท่ากันทั้งชุด (แยกอันดับด้วยแกนที่เหลือ) */
  function valueScores(models) {
    if (models.length === 0) return [];
    const perfs = models.map((m) => m.perf);
    const reqs = models.map((m) => Math.log10(Math.max(1, m.reqMonth)));
    const minP = Math.min(...perfs);
    const maxP = Math.max(...perfs);
    const minR = Math.min(...reqs);
    const maxR = Math.max(...reqs);
    const span = (v, lo, hi) => (hi > lo ? (v - lo) / (hi - lo) : 1);
    return models.map((m, i) => Object.assign({}, m, {
      value: Math.round((0.6 * span(perfs[i], minP, maxP) + 0.4 * span(reqs[i], minR, maxR)) * 1000) / 10,
    }));
  }

  /* Non-mutating sort; unknown key falls back to 'value'; ties break by name. */
  function sortModels(models, key, dir) {
    const k = KEYS.indexOf(key) >= 0 ? key : 'value';
    const sign = dir === 'asc' ? 1 : -1;
    return models.slice().sort((a, b) => {
      const cmp = k === 'name'
        ? String(a.name).localeCompare(String(b.name), 'en', { numeric: true })
        : a[k] - b[k];
      if (cmp !== 0) return sign * cmp;
      return String(a.name).localeCompare(String(b.name), 'en', { numeric: true });
    });
  }

  /* Highest-N rows for a numeric column (descending), ties broken by name.
     The "copy top 10" export always ranks by quality. */
  function topBy(models, key, n) {
    return sortModels(models, key, 'desc').slice(0, Math.max(0, n));
  }

  /* Rows -> GitHub-flavoured Markdown table, using the same labels and value
     formatting as the on-screen table. Pipes inside a cell are escaped. */
  function toMarkdownTable(rows, columns) {
    const cols = Array.isArray(columns) && columns.length > 0 ? columns : COLUMNS;
    const cell = (text) => String(text).replace(/\|/g, '\\|');
    const line = (values) => `| ${values.join(' | ')} |`;
    return [
      line(cols.map((c) => cell(c.label))),
      line(cols.map(() => '---')),
      ...rows.map((m) => line(cols.map((c) => cell(c.fmt(m))))),
    ].join('\n');
  }

  const core = {
    COLUMNS,
    formatDate,
    normalizeModel,
    normalizeModels,
    valueScores,
    sortModels,
    topBy,
    toMarkdownTable,
    fmtInt,
    fmtPerf,
    fmtValue,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  } else {
    global.OpenCodeGoCore = core;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
