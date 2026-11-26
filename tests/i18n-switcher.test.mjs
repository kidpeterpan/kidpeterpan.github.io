import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS, attr, i18nValue, languages, page, prefix, q, read } from './helpers/i18n.mjs';

// [{ tag, lang, href, current, label }] for the switcher in <header>.
function switcherItems(html) {
  const header = (html.match(/<header\b[\s\S]*?<\/header>/) || [''])[0];
  const navs = [...header.matchAll(/<nav\b([^>]*)>([\s\S]*?)<\/nav>/g)].filter((m) => /\blang-switch\b/.test(m[1]));
  assert.equal(navs.length, 1, 'exactly one .lang-switch in the header');
  return [...navs[0][2].matchAll(/<(a|span)\b([^>]*)>([^<]*)<\/\1>/g)].map((m) => ({
    tag: m[1],
    lang: attr(m[2], 'lang'),
    href: attr(m[2], 'href'),
    current: attr(m[2], 'aria-current') === 'true',
    label: m[3],
  }));
}

test('the language switcher lists every language, marks the current one, and links to the translation', () => {
  const langs = languages();
  // [page path, language of that page, the same page's path without prefix ('' = home); null = it has no translations]
  const cases = [];
  for (const { lang } of langs) for (const base of ['', ...PRODUCTS.map((n) => `${n}/`)]) cases.push([`${prefix(lang)}/${base}`, lang, base]);
  cases.push(['/apps/', 'en', null], ['/apps/mortgage/', 'en', null], ['/404.html', 'en', null]);
  for (const { lang } of langs.filter((l) => l.lang !== 'en')) cases.push([`/${lang}/404.html`, lang, null]);
  for (const [path, here, base] of cases) {
    const items = switcherItems(page(path));
    assert.deepEqual(items.map((i) => i.label), langs.map((l) => l.name), `${path}: language names and order`);
    for (const [i, l] of langs.entries()) {
      const item = items[i];
      assert.equal(item.lang, l.locale, `${path}: lang attribute of ${l.lang}`);
      if (l.lang === here) {
        assert.ok(item.current && item.tag === 'span' && !item.href, `${path}: ${l.lang} is the current language, a span`);
      } else {
        assert.ok(!item.current && item.tag === 'a', `${path}: ${l.lang} is a link`);
        const want = base === null ? `${prefix(l.lang)}/` : `${prefix(l.lang)}/${base}`;
        assert.equal(item.href, want, `${path}: link to ${l.lang}`);
      }
    }
  }
});

test('palette names come from i18n, not from theme.js', () => {
  const js = read('static/js/theme.js');
  assert.ok(!js.includes('Midnight') && !js.includes('Default'), 'theme.js must not hold palette names');
  for (const { lang } of languages()) {
    const html = page(`${prefix(lang)}/`);
    const toggle = (html.match(/<button\b[^>]*theme-toggle[\s\S]*?<\/button>/) || [''])[0];
    const tag = toggle.match(/<button\b([^>]*)>/)[1];
    const light = i18nValue(lang, 'palette_default');
    const dark = i18nValue(lang, 'palette_midnight');
    assert.equal(attr(tag, 'data-pal-light'), light, `${lang}: data-pal-light`);
    assert.equal(attr(tag, 'data-pal-dark'), dark, `${lang}: data-pal-dark`);
    assert.match(toggle, new RegExp(`class=${q}pal-name${q}[^>]*>${light}<`), `${lang}: the visible name starts as the light palette`);
  }
});

test('language switcher controls are at least 44px, with a focus ring', () => {
  const css = read('assets/css/main.css');
  const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({ sel: m[1].trim(), body: m[2] }));
  for (const sel of ['.lang-switch summary', '.lang-menu a']) {
    const sized = rules.filter((r) => r.sel.split(',').map((x) => x.trim()).includes(sel) && /min-height:\s*44px/.test(r.body));
    assert.ok(sized.length, `${sel}: no rule with min-height: 44px`);
  }
  assert.match(css, /\.lang-switch summary:focus-visible\s*\{[^}]*3px solid var\(--accent\)/);
  assert.match(css, /\.lang-menu a:focus-visible\s*\{[^}]*3px solid var\(--accent\)/);
});

test('the switcher is a disclosure showing the current language, so the header stays one row', () => {
  const html = page('/ja/');
  const nav = (html.match(/<nav\b[^>]*\blang-switch\b[\s\S]*?<\/nav>/) || [''])[0];
  assert.match(nav, /<details\b/, 'the switcher must be a <details>');
  assert.match(nav, /<summary\b[^>]*>\s*日本語\s*<\/summary>/, 'the summary names the current language');
});

test('the header keeps its original sticky behaviour at every width', () => {
  const css = read('assets/css/main.css');
  assert.ok(!/@media \(max-width: 1199px\)/.test(css), 'no 1199px override of the header');
  assert.ok(!/\.lang-switch\s*\{[^}]*flex-basis/.test(css), 'no phone-row workaround for the switcher');
});

test('404 pages carry no hreflang alternates and no cross-language canonical', () => {
  for (const { lang } of languages()) {
    const html = page(`${prefix(lang)}/404.html`);
    assert.ok(!/hreflang=/.test(html.replace(/<nav[^>]*\blang-switch\b[\s\S]*?<\/nav>/, '')), `${lang}: 404 has hreflang`);
  }
});

test('JSON-LD @id values point at the English home, one Person and one WebSite for all languages', () => {
  for (const { lang } of languages()) {
    const html = page(`${prefix(lang)}/`);
    assert.ok(html.includes('"@id":"https://kidpeterpan.github.io/#person"'), `${lang}: Person @id`);
    assert.ok(html.includes('"@id":"https://kidpeterpan.github.io/#website"'), `${lang}: WebSite @id`);
  }
});

test('on narrow screens the language menu is anchored to the header row, like the mobile nav', () => {
  const css = read('assets/css/main.css');
  const tablet = css.match(/@media \(max-width: 900px\) \{[\s\S]*?\n\}\n/)[0];
  assert.match(tablet, /\.lang-switch\s*\{[^}]*position:\s*static/);
  assert.match(tablet, /\.lang-menu\s*\{[^}]*right:\s*var\(--gutter\)/);
  const phone = css.match(/@media \(max-width: 480px\) \{[\s\S]*?\n\}\n/)[0];
  assert.match(phone, /\.lang-menu\s*\{[^}]*left:\s*var\(--gutter\)/);
});
