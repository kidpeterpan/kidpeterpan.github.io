import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSite, pages, summarize } from './helpers/build.mjs';

const baseline = JSON.parse(readFileSync(new URL('./fixtures/parity-baseline.json', import.meta.url), 'utf8'));

test('every page keeps its h1 and its links', () => {
  const built = Object.fromEntries(pages(buildSite()).map((p) => [p.path, summarize(p.html)]));
  assert.deepEqual(Object.keys(built).sort(), Object.keys(baseline).sort(), 'set of emitted pages changed');
  for (const [path, expected] of Object.entries(baseline)) {
    assert.equal(built[path].h1, expected.h1, `${path}: h1 changed`);
    assert.deepEqual(built[path].hrefs, expected.hrefs, `${path}: links inside <main> changed`);
  }
});
