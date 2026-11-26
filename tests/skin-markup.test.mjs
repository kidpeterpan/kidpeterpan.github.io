import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSite, pages } from './helpers/build.mjs';

const built = () => pages(buildSite());
const page = (path) => {
  const found = built().find((p) => p.path === path);
  assert.ok(found, `page ${path} was not emitted`);
  return found.html;
};
// Hugo's minifier drops attribute quotes, so every attribute pattern accepts both forms.
const q = '["\']?';
const cls = (name) => new RegExp(`class=${q}[^"'>]*\\b${name}\\b`);
const count = (html, re) => (html.match(new RegExp(re.source, 'g')) || []).length;

test('shell: skip link, front panel, palette toggle, status bar', () => {
  const html = page('/');
  assert.match(html, new RegExp(`<body><a class=${q}skip-link`), 'skip link must be the first thing in <body>');
  assert.equal(count(html, /<header\b/), 1);
  const header = html.match(/<header\b[\s\S]*?<\/header>/)[0];
  assert.match(header, cls('site-header'));
  for (const label of ['open-mtp-client', 'Inkbound', 'Mini apps', 'GitHub']) assert.ok(header.includes(label), `nav lacks ${label}`);
  const toggle = header.match(/<button\b[^>]*theme-toggle[\s\S]*?<\/button>/);
  assert.ok(toggle, 'no theme toggle');
  assert.match(toggle[0], new RegExp(`aria-pressed=${q}false${q}`));
  assert.match(toggle[0], /Palette:/);
  assert.match(toggle[0], new RegExp(`class=${q}pal-name${q}[^>]*>Default<`));
  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/)[0];
  assert.match(footer, cls('status-bar'));
  assert.ok(footer.includes('Free and open source.'));
  assert.ok(footer.includes('Buy me a coffee'));
});

test('window-bar renders a labelled window', () => {
  for (const { path, html } of built()) {
    for (const m of html.matchAll(/<(?:section|article|div)\b[^>]*\bwin\b[^>]*aria-labelledby=["']?([^"'\s>]+)/g)) {
      assert.match(html, new RegExp(`id=${q}${m[1]}${q}[\\s>]`), `${path}: .win labelled by missing id ${m[1]}`);
    }
  }
});
