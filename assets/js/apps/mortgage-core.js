/* Pure calculation core for the mortgage mini app.
   No DOM access — shared between the browser page and Node unit tests. */
(function (global) {
  'use strict';

  const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

  /* A comma only groups thousands when it is followed by exactly 3 digits;
     "1,5" is a decimal comma, "2,500,000" is not. */
  function normalizeCommas(s) {
    if (s.indexOf('.') >= 0) return s;
    return s.replace(/,(\d{1,2})(?!\d)/g, '.$1');
  }

  function parse(s) {
    if (!s) return NaN;
    const latin = String(s).split('').map((c) => {
      const i = THAI_DIGITS.indexOf(c);
      return i >= 0 ? String(i) : c;
    }).join('');
    return parseFloat(normalizeCommas(latin).replace(/[^\d.-]/g, ''));
  }

  const RATE_TYPES = ['fixed', 'MRR', 'MLR', 'MOR'];

  /* Turn one raw preset (straight from data/mortgage.yaml) into the shape the
     rate builder edits, or null when a field would break the calculator.
     A typo in the data file costs that one preset, not the whole app. */
  function normalizePreset(raw, banks, maxPeriods) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

    const id = String(raw.id || '').trim();
    const label = String(raw.label || '').trim();
    if (!id || !label) return null;
    if (!banks || !banks[raw.bank]) return null;

    const amount = parse(raw.amount);
    const years = parse(raw.years);
    if (!(amount > 0) || !(years > 0)) return null;

    const rows = raw.periods;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > maxPeriods) return null;

    const periods = [];
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      if (!row || RATE_TYPES.indexOf(row.type) < 0) return null;
      /* The builder round-trips these through <input>, so they stay strings —
         a YAML author writing `val: 2.5` should not get a different type. */
      const val = String(row.val).trim();
      if (!Number.isFinite(parse(val))) return null;
      periods.push({ type: row.type, val });
    }

    return { id, label, isDefault: raw.default === true, bank: raw.bank, amount, years, periods };
  }

  /* Annual percentage rate for a period; null when the value is invalid. */
  function effectiveRate(type, rates, rawVal) {
    const v = parse(rawVal);
    if (!Number.isFinite(v)) return null;
    return type === 'fixed' ? v : (rates[type] || 0) + v;
  }

  /* What the loan is actually charged: a negative result is floored at 0.
     The UI labels this too, so what is shown matches what is amortized. */
  function chargedRate(type, rates, rawVal) {
    const r = effectiveRate(type, rates, rawVal);
    return r === null ? null : Math.max(r, 0);
  }

  /* Every row has to parse before any total is worth showing — a half-typed
     row would otherwise silently stretch its neighbour over the whole term. */
  function periodsValid(periods, rates) {
    return periods.length > 0 &&
      periods.every((p) => effectiveRate(p.type, rates, p.val) !== null);
  }

  /* Split the loan term into per-period months.
     Each row is 1 year (12 months); the last row covers the remainder.
     Rows carry the monthly rate the amortizer needs *and* the annual
     percentage the UI shows, so neither side has to guess the unit. */
  function buildPlan(n, periods, rates) {
    const plan = [];
    let elapsed = 0;
    for (const [idx, p] of periods.entries()) {
      const annualPct = chargedRate(p.type, rates, p.val);
      if (annualPct === null) continue;
      const isLast = idx === periods.length - 1;
      const m = Math.min(isLast ? n - elapsed : 12, n - elapsed);
      if (m <= 0) break;
      plan.push({ months: m, rate: annualPct / 100 / 12, annualPct });
      elapsed += m;
      if (elapsed >= n) break;
    }
    if (plan.length > 0 && elapsed < n) {
      plan[plan.length - 1].months += n - elapsed;
    }
    return plan;
  }

  /* Amortize P over n months with the rate plan. Payment is recomputed at
     each rate change so the loan still ends at month n (plus optional extra
     monthly payment that shortens the term). */
  function runSchedule(P, n, plan, extraAmt) {
    let balance = P;
    let elapsed = 0;
    let totalInt = 0;
    let i = 0;
    const rows = [];
    const stages = [];
    for (const st of plan) {
      if (balance <= 0.5) break;
      const rem = n - elapsed;
      const r = st.rate;
      const M = r === 0 ? balance / rem : (balance * r * Math.pow(1 + r, rem)) / (Math.pow(1 + r, rem) - 1);
      const payment = M + extraAmt;
      stages.push({ months: st.months, rate: r, annualPct: st.annualPct, payment, final: elapsed + st.months >= n });
      /* i < n is a backstop only: the plan's months already sum to n. */
      for (let k = 0; k < st.months && balance > 0.5 && i < n; k++) {
        i++;
        elapsed++;
        const iPaid = balance * r;
        let pPaid = payment - iPaid;
        if (pPaid >= balance) {
          pPaid = balance;
          balance = 0;
        } else {
          balance -= pPaid;
        }
        totalInt += iPaid;
        rows.push({ i, rate: r, annualPct: st.annualPct, pPaid, iPaid, balance });
      }
    }
    return { months: i, totalInt, rows, stages };
  }

  const core = { parse, effectiveRate, chargedRate, periodsValid, buildPlan, runSchedule, normalizePreset };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  } else {
    global.MortgageCore = core;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
