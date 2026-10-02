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

  function toLatinDigits(s) {
    return s.replace(/[๐-๙]/g, (digit) => String(THAI_DIGITS.indexOf(digit)));
  }

  function parse(s) {
    if (!s) return NaN;
    return parseFloat(normalizeCommas(toLatinDigits(String(s))).replace(/[^\d.-]/g, ''));
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
    for (const row of rows) {
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
  function buildPlan(termMonths, periods, rates) {
    const plan = [];
    let elapsed = 0;
    for (const [idx, period] of periods.entries()) {
      const annualPct = chargedRate(period.type, rates, period.val);
      if (annualPct === null) continue;
      const isLastPeriod = idx === periods.length - 1;
      const monthsLeft = termMonths - elapsed;
      const monthsThisPeriod = isLastPeriod ? monthsLeft : Math.min(12, monthsLeft);
      if (monthsThisPeriod <= 0) break;
      plan.push({ months: monthsThisPeriod, rate: annualPct / 100 / 12, annualPct });
      elapsed += monthsThisPeriod;
      if (elapsed >= termMonths) break;
    }
    if (plan.length > 0 && elapsed < termMonths) {
      plan[plan.length - 1].months += termMonths - elapsed;
    }
    return plan;
  }

  /* Level payment that clears `balance` over `months` at `monthlyRate`.
     A zero rate is just the balance split evenly. */
  function monthlyPayment(balance, monthlyRate, months) {
    if (monthlyRate === 0) return balance / months;
    const growth = Math.pow(1 + monthlyRate, months);
    return (balance * monthlyRate * growth) / (growth - 1);
  }

  /* One month of a level-payment loan: interest owed, and principal paid.
     The principal is capped at the remaining balance so the last month of
     an early payoff lands exactly on zero. */
  function amortizeMonth(balance, monthlyRate, payment) {
    const interestPaid = balance * monthlyRate;
    const principalPaid = Math.min(payment - interestPaid, balance);
    return { interestPaid, principalPaid };
  }

  /* Amortize `principal` over `termMonths` with the rate plan. Payment is
     recomputed at each rate change so the loan still ends at month
     `termMonths` (plus optional extra monthly payment that shortens the term). */
  function runSchedule(principal, termMonths, plan, extraMonthly) {
    let balance = principal;
    let elapsed = 0;
    let totalInt = 0;
    const rows = [];
    const stages = [];
    for (const st of plan) {
      if (balance <= 0.5) break;
      const remainingMonths = termMonths - elapsed;
      const payment = monthlyPayment(balance, st.rate, remainingMonths) + extraMonthly;
      stages.push({ months: st.months, rate: st.rate, annualPct: st.annualPct, payment, final: elapsed + st.months >= termMonths });
      /* elapsed < termMonths is a backstop only: the plan's months already sum to termMonths. */
      for (let k = 0; k < st.months && balance > 0.5 && elapsed < termMonths; k++) {
        elapsed += 1;
        const { interestPaid, principalPaid } = amortizeMonth(balance, st.rate, payment);
        balance -= principalPaid;
        totalInt += interestPaid;
        rows.push({ i: elapsed, rate: st.rate, annualPct: st.annualPct, pPaid: principalPaid, iPaid: interestPaid, balance });
      }
    }
    return { months: elapsed, totalInt, rows, stages };
  }

  const core = { parse, effectiveRate, chargedRate, periodsValid, buildPlan, runSchedule, normalizePreset };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  } else {
    global.MortgageCore = core;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
