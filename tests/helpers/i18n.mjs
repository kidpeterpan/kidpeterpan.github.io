import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite, pages } from './build.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));

export const q = '["\']?';
export const PRODUCTS = ['open-mtp-client', 'inkbound', 'chiaki-ngx'];

export const read = (rel) => readFileSync(join(root, rel), 'utf8');

// [{ lang, locale, name }] in hugo.toml order.
export function languages() {
  const toml = read('hugo.toml');
  return [...toml.matchAll(/^\[languages\.([a-z-]+)\]\n((?:[^[\n].*\n|\n)*)/gm)].map((m) => ({
    lang: m[1],
    locale: (/^locale\s*=\s*'([^']+)'/m.exec(m[2]) || [])[1],
    name: (/^label\s*=\s*'([^']+)'/m.exec(m[2]) || [])[1],
  }));
}

// URL prefix of a language: '' for English, '/ja' for Japanese.
export const prefix = (lang) => (lang === 'en' ? '' : `/${lang}`);

// HTML of one emitted page, by its path.
export function page(path) {
  const found = pages(buildSite()).find((p) => p.path === path);
  assert.ok(found, `page ${path} was not emitted`);
  return found.html;
}

// The value of one i18n key (flat `key = "value"` files).
export function i18nValue(lang, key) {
  const m = new RegExp(`^${key}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`, 'm').exec(read(`i18n/${lang}.toml`));
  assert.ok(m, `i18n/${lang}.toml has no ${key}`);
  return m[1].replace(/\\"/g, '"');
}

// One attribute out of a tag's attribute string; Hugo's minifier drops quotes, so accept both.
export function attr(attrs, name) {
  const m = new RegExp(`(?:^|\\s)${name}(?:=(?:"([^"]*)"|([^\\s>]+)))?(?=\\s|$)`).exec(attrs);
  return m ? (m[1] ?? m[2] ?? '') : undefined;
}
