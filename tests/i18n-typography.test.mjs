import { test } from 'node:test';
import assert from 'node:assert/strict';
import { languages, read } from './helpers/i18n.mjs';

const css = read('assets/css/main.css');
const primary = (locale) => locale.split('-')[0];
const cjk = ['zh', 'ja', 'ko'];

test('every non-English language has a font rule that matches its locale (th-TH, zh-CN ...)', () => {
  for (const { lang, locale } of languages().filter((l) => l.lang !== 'en')) {
    const sub = primary(locale);
    assert.ok(css.includes(`[lang|="${sub}"]`), `${lang}: no [lang|="${sub}"] rule in main.css`);
  }
  assert.ok(!css.includes('[lang="th"]'), 'an exact [lang="th"] selector would miss th-TH');
});

test('CJK languages redefine the font tokens on <html>, with system fonts only', () => {
  for (const { lang, locale } of languages().filter((l) => cjk.includes(primary(l.locale)))) {
    const sub = primary(locale);
    const rule = css.match(new RegExp(`html\\[lang\\|="${sub}"\\]\\s*\\{[^}]*\\}`));
    assert.ok(rule, `${lang}: no html[lang|="${sub}"] token rule`);
    for (const token of ['--font-body', '--font-mono', '--font-chrome']) assert.ok(rule[0].includes(token), `${lang}: rule lacks ${token}`);
  }
  const base = read('layouts/_default/baseof.html');
  assert.ok(!/Noto\+Sans\+(SC|JP|KR|CJK)/.test(base), 'a CJK webfont was added to the page head');
});

test('CJK body text gets a taller line, Korean keeps words together', () => {
  for (const { lang, locale } of languages().filter((l) => cjk.includes(primary(l.locale)))) {
    const sub = primary(locale);
    assert.match(css, new RegExp(`html\\[lang\\|="${sub}"\\] body[^{]*\\{[^}]*line-height:\\s*1\\.7`), `${lang}: body line-height 1.7`);
    if (sub === 'ko') assert.match(css, /html\[lang\|="ko"\][^{]*\{[^}]*word-break:\s*keep-all/, 'ko: word-break keep-all');
  }
});
