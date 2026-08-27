import { test } from 'node:test';
import assert from 'node:assert/strict';
import core from '../static/js/apps/mortgage-core.js';
const { parse, effectiveRate, buildPlan, runSchedule } = core;

const BBL = { MRR: 6.5, MLR: 6.35, MOR: 6.5 };
const SCB = { MRR: 6.575, MLR: 6.35, MOR: 6.275 };

const close = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`);

test('parse handles commas, Thai digits and negatives', () => {
  assert.equal(parse('2,500,000'), 2500000);
  assert.equal(parse('๒๕'), 25);
  assert.equal(parse('-2.25'), -2.25);
  assert.equal(parse('5.25%'), 5.25);
  assert.ok(Number.isNaN(parse('')));
  assert.ok(Number.isNaN(parse('abc')));
});

test('effectiveRate: fixed returns the value, refs add margin', () => {
  close(effectiveRate('fixed', BBL, '2.50'), 2.5);
  close(effectiveRate('MLR', BBL, '-2.25'), 4.1);
  close(effectiveRate('MRR', SCB, '-1.25'), 5.325);
  close(effectiveRate('MOR', BBL, '0'), 6.5);
  assert.equal(effectiveRate('MLR', BBL, ''), null);
  assert.equal(effectiveRate('MLR', BBL, 'x'), null);
});

test('buildPlan: each row is 1 year, last row covers the remainder', () => {
  const n = 360;
  const two = buildPlan(n, [{ type: 'fixed', val: '2.50' }, { type: 'MLR', val: '-2.25' }], BBL);
  assert.deepEqual(two.map((s) => s.months), [12, 348]);
  close(two[0].rate, 2.5 / 100 / 12);
  close(two[1].rate, 4.1 / 100 / 12);

  const three = buildPlan(n, [
    { type: 'fixed', val: '2.50' },
    { type: 'MLR', val: '-2.25' },
    { type: 'MRR', val: '-1.25' },
  ], BBL);
  assert.deepEqual(three.map((s) => s.months), [12, 12, 336]);
  close(three[2].rate, 5.25 / 100 / 12);

  const invalidLast = buildPlan(n, [{ type: 'fixed', val: '2.50' }, { type: 'MRR', val: '' }], BBL);
  assert.deepEqual(invalidLast.map((s) => s.months), [360]);

  const shortTerm = buildPlan(120, [{ type: 'fixed', val: '2.50' }, { type: 'MLR', val: '-2.25' }], BBL);
  assert.deepEqual(shortTerm.map((s) => s.months), [12, 108]);

  assert.deepEqual(buildPlan(n, [], BBL), []);
});

test('runSchedule: base loan ends exactly at the term with full payoff', () => {
  const P = 2000000;
  const n = 480;
  const plan = buildPlan(n, [{ type: 'fixed', val: '2.50' }, { type: 'MLR', val: '-2.25' }], BBL);
  const s = runSchedule(P, n, plan, 0);

  assert.equal(s.months, n);
  const last = s.rows[s.rows.length - 1];
  close(last.balance, 0, 1);
  close(s.rows.length, n);
  close(s.totalInt, s.totalInt); // sanity: defined
  assert.ok(s.totalInt > 0);
  // total paid reconciles: sum of principal == P
  const paidPrincipal = s.rows.reduce((acc, r) => acc + r.pPaid, 0);
  close(paidPrincipal, P, 1);
});

test('runSchedule: payment is recomputed when the rate resets', () => {
  const P = 2500000;
  const n = 360;
  const plan = buildPlan(n, [
    { type: 'fixed', val: '2.50' },
    { type: 'MLR', val: '-2.25' },
    { type: 'MRR', val: '-1.25' },
  ], BBL);
  const s = runSchedule(P, n, plan, 0);

  assert.equal(s.stages.length, 3);
  assert.ok(s.stages[1].payment > s.stages[0].payment, 'payment must rise when the rate goes up');
  assert.ok(s.stages[2].payment > s.stages[1].payment);
  assert.equal(s.months, n);
});

test('runSchedule: extra monthly payment shortens the term and saves interest', () => {
  const P = 2500000;
  const n = 360;
  const plan = buildPlan(n, [
    { type: 'fixed', val: '2.50' },
    { type: 'MLR', val: '-2.25' },
  ], BBL);
  const base = runSchedule(P, n, plan, 0);
  const accel = runSchedule(P, n, plan, 5000);

  assert.ok(accel.months < base.months, `${accel.months} < ${base.months}`);
  assert.ok(accel.totalInt < base.totalInt);
  close(accel.totalInt, base.totalInt - (base.totalInt - accel.totalInt)); // identity
  const saved = base.totalInt - accel.totalInt;
  assert.ok(saved > 500000, `saved ~${saved.toFixed(0)}`);
  // no balance left
  close(accel.rows[accel.rows.length - 1].balance, 0, 1);
});

test('runSchedule: zero interest pays principal-only, ends exactly on term', () => {
  const P = 1000000;
  const n = 120;
  const plan = buildPlan(n, [{ type: 'fixed', val: '0' }], BBL);
  const s = runSchedule(P, n, plan, 0);

  assert.equal(s.months, n);
  close(s.totalInt, 0, 1);
  close(s.rows[0].pPaid, P / n, 1);
});

test('runSchedule: extra payment larger than the minimum closes the loan quickly', () => {
  const P = 500000;
  const n = 360;
  const plan = buildPlan(n, [{ type: 'fixed', val: '7.05' }], BBL);
  const s = runSchedule(P, n, plan, 50000);

  assert.ok(s.months < 12);
  assert.equal(s.rows[0].i, 1);
  close(s.rows[s.rows.length - 1].balance, 0, 1);
});