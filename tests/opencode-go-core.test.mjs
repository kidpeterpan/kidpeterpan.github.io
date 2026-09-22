import { test } from 'node:test';
import assert from 'node:assert/strict';
import core from '../assets/js/apps/opencode-go-core.js';
const { normalizeModel, normalizeModels, valueScores, sortModels, topBy, toMarkdownTable, formatDate, fmtInt, fmtPerf, fmtValue, COLUMNS } = core;

const row = (over = {}) => ({
  name: 'GLM-5.3',
  req_5h: 220,
  req_week: 540,
  req_month: 1080,
  speed: 67,
  perf: 9.2,
  ...over,
});

test('normalizeModel accepts a well-formed row and defaults the note', () => {
  const m = normalizeModel(row());
  assert.equal(m.name, 'GLM-5.3');
  assert.equal(m.req5h, 220);
  assert.equal(m.reqWeek, 540);
  assert.equal(m.reqMonth, 1080);
  assert.equal(m.speed, 67);
  assert.equal(m.perf, 9.2);
  assert.equal(m.note, '');
});

test('normalizeModel reads numbers written as strings', () => {
  const m = normalizeModel(row({ req_5h: '6,500', speed: '214.4' }));
  assert.equal(m.req5h, 6500);
  assert.equal(m.speed, 214.4);
});

test('normalizeModel rejects anything the table could not render', () => {
  assert.equal(normalizeModel(null), null);
  assert.equal(normalizeModel('GLM'), null);
  assert.equal(normalizeModel([row()]), null);
  assert.equal(normalizeModel(row({ name: '  ' })), null);
  assert.equal(normalizeModel(row({ req_month: 'x' })), null);
  assert.equal(normalizeModel(row({ speed: null })), null);
  assert.equal(normalizeModel(row({ perf: undefined })), null);
});

test('normalizeModels drops bad rows and keeps the rest in order', () => {
  const list = normalizeModels([row(), row({ name: '' }), row({ req_5h: 'nope' })]);
  assert.equal(list.length, 1);
  assert.equal(normalizeModels(null).length, 0);
  assert.equal(normalizeModels(undefined).length, 0);
});

test('valueScores: quality pairs with volume, 0-100 scale', () => {
  const models = normalizeModels([
    row({ name: 'best', perf: 9.5, req_month: 100000 }),
    row({ name: 'worst', perf: 6.0, req_month: 500 }),
    row({ name: 'mid', perf: 8.0, req_month: 10000 }),
  ]);
  const scored = valueScores(models);
  const by = Object.fromEntries(scored.map((m) => [m.name, m.value]));

  assert.equal(by.best, 100);
  assert.equal(by.worst, 0);
  assert.ok(by.mid > by.worst && by.mid < by.best, `mid ${by.mid}`);
});

test('valueScores: a degenerate axis gives the whole set the same credit', () => {
  // req_month equal for everyone -> that 40% becomes a constant, perf separates
  const scored = valueScores(normalizeModels([
    row({ name: 'p', perf: 9.5, req_month: 500 }),
    row({ name: 'w', perf: 6.0, req_month: 500 }),
  ]));
  const by = Object.fromEntries(scored.map((m) => [m.name, m.value]));
  assert.equal(by.p, 100);
  assert.equal(by.w, 40);
});

test('valueScores returns [] for an empty list', () => {
  assert.deepEqual(valueScores([]), []);
});

test('valueScores leaves its input untouched', () => {
  const models = normalizeModels([row(), row({ name: 'B' })]);
  valueScores(models);
  assert.equal(models[0].value, undefined);
});

test('sortModels: desc/asc by numeric key', () => {
  const models = normalizeModels([
    row({ name: 'A', req_month: 1000 }),
    row({ name: 'B', req_month: 3000 }),
    row({ name: 'C', req_month: 2000 }),
  ]);
  assert.deepEqual(sortModels(models, 'reqMonth', 'desc').map((m) => m.name), ['B', 'C', 'A']);
  assert.deepEqual(sortModels(models, 'reqMonth', 'asc').map((m) => m.name), ['A', 'C', 'B']);
});

test('sortModels: name sorts ascending naturally, ties break by name', () => {
  const models = normalizeModels([
    row({ name: 'GLM-5.10', speed: 50 }),
    row({ name: 'GLM-5.2', speed: 50 }),
    row({ name: 'GLM-5.1', speed: 50 }),
  ]);
  assert.deepEqual(sortModels(models, 'name', 'asc').map((m) => m.name), ['GLM-5.1', 'GLM-5.2', 'GLM-5.10']);
  assert.deepEqual(sortModels(models, 'speed', 'desc').map((m) => m.name), ['GLM-5.1', 'GLM-5.2', 'GLM-5.10']);
});

test('sortModels: unknown key falls back to value, input untouched', () => {
  const models = valueScores(normalizeModels([
    row({ name: 'low', perf: 6, req_month: 500 }),
    row({ name: 'high', perf: 9, req_month: 50000 }),
  ]));
  const sorted = sortModels(models, 'nope', 'desc');
  assert.equal(sorted[0].name, 'high');
  assert.equal(models[0].name, 'low');
});

test('COLUMNS lists the seven sortable fields in render order', () => {
  assert.deepEqual(COLUMNS.map((c) => c.key), ['name', 'req5h', 'reqWeek', 'reqMonth', 'speed', 'perf', 'value']);
  assert.ok(COLUMNS.every((c) => c.label));
  assert.ok(COLUMNS.every((c) => typeof c.fmt === 'function'));
});

test('topBy: highest quality first, ties broken by name, bounded by n', () => {
  const models = normalizeModels([
    row({ name: 'B', perf: 8.0 }),
    row({ name: 'A', perf: 9.0 }),
    row({ name: 'C', perf: 8.0 }),
  ]);
  assert.deepEqual(topBy(models, 'perf', 2).map((m) => m.name), ['A', 'B']);
  assert.equal(topBy(models, 'perf', 99).length, 3);
  assert.deepEqual(topBy(models, 'perf', 0), []);
});

test('toMarkdownTable: header, separator, and formatted cells', () => {
  const models = valueScores(normalizeModels([
    row({ name: 'GLM-5.3', req_5h: 220, req_week: 540, req_month: 1080, speed: 67, perf: 9.2 }),
  ]));
  const lines = toMarkdownTable(models).split('\n');
  assert.equal(lines[0], '| Model | req 5h | req week | req month | tok/s | Quality | Value |');
  assert.equal(lines[1], '| --- | --- | --- | --- | --- | --- | --- |');
  assert.ok(lines[2].startsWith('| GLM-5.3 | 220 | 540 | 1,080 | 67 | 9.2 | '), lines[2]);
});

test('formatDate prints an English date and blanks out anything else', () => {
  assert.equal(formatDate('2026-09-16'), '16 Sep 2026');
  assert.equal(formatDate('2026-01-01'), '1 Jan 2026');
  assert.equal(formatDate('2026-12-31T10:00:00+07:00'), '31 Dec 2026');
  assert.equal(formatDate(''), '');
  assert.equal(formatDate('16/09/2026'), '');
  assert.equal(formatDate('2026-13-01'), '');
  assert.equal(formatDate(null), '');
});

test('formatters keep Thai digit grouping', () => {
  assert.equal(fmtInt(226600), '226,600');
  assert.equal(fmtPerf(9.2), '9.2');
  assert.equal(fmtPerf(10), '10.0');
  assert.equal(fmtValue(82), '82');
  assert.equal(fmtValue(61.25), '61.3');
});
