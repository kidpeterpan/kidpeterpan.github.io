/* Pure calculation core for the mortgage mini app.
   No DOM access — shared between the browser page and Node unit tests. */
(function (global) {
  'use strict';

  const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

  function parse(s) {
    if (!s) return NaN;
    const latin = String(s).split('').map((c) => {
      const i = THAI_DIGITS.indexOf(c);
      return i >= 0 ? String(i) : c;
    }).join('');
    return parseFloat(latin.replace(/[^\d.-]/g, ''));
  }

  /* Annual percentage rate for a period; null when the value is invalid. */
  function effectiveRate(type, rates, rawVal) {
    const v = parse(rawVal);
    if (!Number.isFinite(v)) return null;
    return type === 'fixed' ? v : (rates[type] || 0) + v;
  }

  /* Split the loan term into per-period months.
     Each row is 1 year (12 months); the last row covers the remainder. */
  function buildPlan(n, periods, rates) {
    const plan = [];
    let elapsed = 0;
    for (const [idx, p] of periods.entries()) {
      const annual = effectiveRate(p.type, rates, p.val);
      if (annual === null) continue;
      const isLast = idx === periods.length - 1;
      const m = Math.min(isLast ? n - elapsed : 12, n - elapsed);
      if (m <= 0) break;
      plan.push({ months: m, rate: Math.max(annual, 0) / 100 / 12 });
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
      stages.push({ months: st.months, rate: r, payment, final: elapsed + st.months >= n });
      for (let k = 0; k < st.months && balance > 0.5 && i < 600; k++) {
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
        rows.push({ i, rate: r, pPaid, iPaid, balance });
      }
    }
    return { months: i, totalInt, rows, stages };
  }

  const core = { parse, effectiveRate, buildPlan, runSchedule };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  } else {
    global.MortgageCore = core;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);