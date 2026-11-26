import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// Flat `key = "value"` files only; see the plan's Task 1 interface.
export function i18nKeys(lang) {
  const file = join(root, 'i18n', `${lang}.toml`);
  assert.ok(existsSync(file), `i18n/${lang}.toml is missing`);
  return [...readFileSync(file, 'utf8').matchAll(/^([a-z0-9_]+)\s*=/gm)].map((m) => m[1]);
}

test('every i18n key used by a template exists in en.toml', () => {
  const used = new Set();
  for (const file of walk(join(root, 'layouts')).filter((f) => f.endsWith('.html'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/\bi18n\s+"([a-z0-9_]+)"/g)) used.add(m[1]);
  }
  assert.ok(used.size >= 25, `only ${used.size} i18n keys found in templates; the scan or the extraction is incomplete`);
  const have = new Set(i18nKeys('en'));
  assert.deepEqual([...used].filter((k) => !have.has(k)), [], 'keys used in templates but missing from en.toml');
});
