import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('home: one h1 in the terminal, a window per product, screenshots kept', () => {
  const html = page('/');
  assert.equal(count(html, /<h1\b/), 1);
  assert.match(html, new RegExp(`class=${q}[^"'>]*\\bterm\\b[^>]*>(?:(?!</section>)[\\s\\S])*?<h1\\b`), 'the h1 must sit inside the .term block');
  assert.ok(html.includes('kidpeterpan@home</span>:~$ cat README') || html.includes('kidpeterpan@home:~$ cat README'), 'hero must open with the cat README prompt');
  const rows = html.split(/<article\b/).slice(1).map((r) => r.split('</article>')[0]).filter((r) => /product-row/.test(r.slice(0, 120)));
  assert.equal(rows.length, 3, 'one window per project page');
  for (const row of rows) {
    assert.match(row.slice(0, 120), /\bwin\b/, 'product row must be a .win');
    assert.match(row, cls('route'));
    assert.match(row, cls('btn'));
    assert.match(row, /<picture\b|<img\b/);
  }
  assert.match(rows[0], /fetchpriority=["']?high/, 'first screenshot keeps fetchpriority=high');
  assert.match(html, new RegExp(`<section class=${q}[^"'>]*\\bmini-apps\\b[^>]*>`));
  assert.match(html.match(/<section class=["']?[^"'>]*mini-apps[^>]*>[\s\S]*?<\/section>/)[0], cls('win'));
});

test('dark twins survive', () => {
  const html = page('/open-mtp-client/');
  assert.match(html, /shot-light/);
  assert.match(html, /shot-dark/);
  const css = readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');
  assert.ok(css.includes('html[data-theme="dark"] .shot-light { display: none; }'));
  assert.ok(css.includes('html:not([data-theme="dark"]) .shot-dark { display: none; }'));
});

test('window titles are real elements, not escaped text', () => {
  const home = page('/');
  assert.ok(!/&lt;(?:p|h[1-6])\b/.test(home), 'a window title leaked as escaped markup');
  for (const id of ['win-term', 'win-open-mtp-client', 'win-inkbound', 'win-chiaki-ngx', 'win-mini-apps']) {
    assert.match(home, new RegExp(`<p class=${q}win-title${q} id=${q}${id}${q}>`), `no title element with id ${id}`);
  }
});

for (const name of ['open-mtp-client', 'inkbound', 'chiaki-ngx']) {
  test(`product page ${name}: windows, one h1, faq and notice preserved`, () => {
    const html = page(`/${name}/`);
    const fm = readFileSync(new URL(`../content/${name}/index.md`, import.meta.url), 'utf8');
    assert.equal(count(html, /<h1\b/), 1);
    for (const id of ['win-hero', 'win-readme', 'get', 'win-faq']) {
      assert.match(html, new RegExp(`<section class=${q}[^>]*\\bwin\\b[^>]*id=${q}${id}${q}|<section id=${q}${id}${q}[^>]*class=${q}[^>]*\\bwin\\b`), `no .win section with id ${id}`);
    }
    assert.ok(!/&lt;(?:p|h[1-6])\b/.test(html), 'a window title leaked as escaped markup');
    // The mobile nav is also a <details>, so count only inside the FAQ window.
    const faq = (html.match(/<section\b[^>]*id=["']?win-faq[\s\S]*?<\/section>/) || [''])[0];
    assert.equal(count(faq, /<details\b/), (fm.match(/^\[\[params\.faq\]\]/gm) || []).length, 'faq entries lost');
    assert.equal(/<aside\b[^>]*\bnotice\b/.test(html), /^\[params\.notice\]/m.test(fm), 'notice presence differs from front matter');
  });
}

test('apps and 404 are windows; app roots intact', () => {
  for (const path of ['/apps/mortgage/', '/apps/opencode-go/']) {
    const html = page(path);
    const win = html.match(/<section\b[^>]*\bapp-shell\b[\s\S]*?<\/section>/);
    assert.ok(win, `${path}: no .app-shell window`);
    assert.match(win[0], cls('win'));
    assert.match(win[0], new RegExp(`id=${q}app-root${q}`), `${path}: #app-root is not inside the window`);
    assert.ok(!/&lt;(?:p|h[1-6])\b/.test(html), `${path}: a window title leaked as escaped markup`);
  }
  assert.match(page('/apps/mortgage/'), /lang=["']?th/);
  const list = page('/apps/');
  assert.match(list, cls('win'));
  assert.equal(count(list, /<a\b[^>]*\bapp-card\b/), 2, '/apps/ lost an app card');
  const notFound = page('/404.html');
  assert.match(notFound, cls('win'));
  assert.match(notFound, /noindex/);
});
