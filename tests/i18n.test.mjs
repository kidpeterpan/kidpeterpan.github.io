import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite, pages, summarize } from './helpers/build.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const q = '["\']?';
const PRODUCTS = ['open-mtp-client', 'inkbound', 'chiaki-ngx'];
// Keys that live only in the English file (spec: Global Constraints).
const NEUTRAL = ['version', 'repo_url', 'license', 'license_url', 'os', 'category', 'order', 'images', 'hero_image', 'icon', 'cta_kind'];
// Keys a translated file must carry whenever the English file has them.
const TRANSLATABLE = ['title', 'description', 'date', 'layout', 'seo_title', 'eyebrow', 'tagline', 'card_pitch', 'route_from', 'route_to', 'hero_alt', 'hero_caption', 'requirements', 'steps', 'notice', 'faq', 'cta', 'cta_secondary'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// [{ lang, locale, name }] in hugo.toml order.
export function languages() {
  const toml = read('hugo.toml');
  return [...toml.matchAll(/^\[languages\.([a-z-]+)\]\n((?:[^[\n].*\n|\n)*)/gm)].map((m) => ({
    lang: m[1],
    locale: (/^locale\s*=\s*'([^']+)'/m.exec(m[2]) || [])[1],
    name: (/^label\s*=\s*'([^']+)'/m.exec(m[2]) || [])[1],
  }));
}
const others = () => languages().filter((l) => l.lang !== 'en');

// Flat `key = "value"` files only; see the plan's Task 1 interface.
export function i18nKeys(lang) {
  const file = join(root, 'i18n', `${lang}.toml`);
  assert.ok(existsSync(file), `i18n/${lang}.toml is missing`);
  return [...readFileSync(file, 'utf8').matchAll(/^([a-z0-9_]+)\s*=/gm)].map((m) => m[1]);
}

// Keys of a TOML front matter: `key =` lines plus [params.x] / [[params.x]] table names.
function frontMatterKeys(rel) {
  const fm = read(rel).split('+++')[1] || '';
  const keys = new Set();
  let inTable = false;
  for (const line of fm.split('\n')) {
    const table = /^\[\[?params\.([a-z_]+)\]\]?\s*$/.exec(line);
    if (table) { keys.add(table[1]); inTable = true; continue; }
    if (/^\[params\]\s*$/.test(line)) continue;
    if (/^\[/.test(line)) { inTable = true; continue; }
    const kv = /^([a-z_]+)\s*=/.exec(line);
    if (kv && !inTable) keys.add(kv[1]);
  }
  return { keys, text: fm };
}

const page = (path) => {
  const found = pages(buildSite()).find((p) => p.path === path);
  assert.ok(found, `page ${path} was not emitted`);
  return found.html;
};
const metaContent = (html, prop) => (new RegExp(`<meta property=${q}${prop}${q} content=${q}([^"'>]+)`).exec(html) || [])[1];

test('every i18n key used by a template exists in en.toml', () => {
  const used = new Set();
  for (const file of walk(join(root, 'layouts')).filter((f) => f.endsWith('.html'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/\bi18n\s+"([a-z0-9_]+)"/g)) used.add(m[1]);
  }
  assert.ok(used.size >= 25, `only ${used.size} i18n keys found in templates; the scan or the extraction is incomplete`);
  const have = new Set(i18nKeys('en'));
  assert.deepEqual([...used].filter((k) => !have.has(k)), [], 'keys used in templates but missing from en.toml');
});

test('hugo.toml languages and i18n files are the same set, English first', () => {
  const langs = languages();
  assert.deepEqual(langs[0] && langs[0].lang, 'en', 'English must be the first language');
  for (const l of langs) assert.ok(l.locale && l.name, `${l.lang}: locale and label are required`);
  const files = readdirSync(join(root, 'i18n')).filter((f) => f.endsWith('.toml')).map((f) => f.replace(/\.toml$/, ''));
  assert.deepEqual(files.sort(), langs.map((l) => l.lang).sort());
});

for (const { lang, locale } of others()) {
  test(`i18n keys are complete: ${lang}`, () => {
    const en = new Set(i18nKeys('en'));
    const got = new Set(i18nKeys(lang));
    assert.deepEqual([...en].filter((k) => !got.has(k)), [], `${lang}: keys missing`);
    assert.deepEqual([...got].filter((k) => !en.has(k)), [], `${lang}: extra keys`);
  });

  test(`${lang}: the expected pages exist and /apps/ is not translated`, () => {
    const paths = pages(buildSite()).map((p) => p.path);
    for (const p of [`/${lang}/`, `/${lang}/404.html`, ...PRODUCTS.map((n) => `/${lang}/${n}/`)]) assert.ok(paths.includes(p), `${p} was not emitted`);
    assert.deepEqual(paths.filter((p) => p.startsWith(`/${lang}/apps`)), []);
  });

  for (const path of [`/${lang}/`, ...PRODUCTS.map((n) => `/${lang}/${n}/`)]) {
    test(`${path}: html lang, hreflang set, og:locale:alternate`, () => {
      const html = page(path);
      assert.match(html, new RegExp(`<html[^>]*\\blang=${q}${locale}${q}[\\s>]`));
      for (const l of languages()) assert.match(html, new RegExp(`hreflang=${q}${l.locale}${q}`), `no hreflang for ${l.locale}`);
      assert.match(html, new RegExp(`hreflang=${q}x-default${q}`));
      assert.match(html, /property=["']?og:locale:alternate/);
      assert.match(html, new RegExp(`property=${q}og:locale${q} content=${q}${locale.replace('-', '_')}${q}`));
    });
  }

  test(`${lang}: internal links stay in the language (apps excepted)`, () => {
    for (const path of [`/${lang}/`, `/${lang}/404.html`, ...PRODUCTS.map((n) => `/${lang}/${n}/`)]) {
      let html = page(path);
      html = html.replace(/<nav[^>]*\blang-switch\b[\s\S]*?<\/nav>/g, '');
      const scoped = [(html.match(/<header\b[\s\S]*?<\/header>/) || [''])[0], (html.match(/<main\b[\s\S]*?<\/main>/) || [''])[0], (html.match(/<footer\b[\s\S]*?<\/footer>/) || [''])[0]].join('\n');
      const hrefs = [...scoped.matchAll(/\bhref=(?:"([^"]*)"|([^\s>]+))/g)].map((m) => m[1] ?? m[2]).filter((h) => h.startsWith('/') && !h.startsWith('//'));
      const stray = hrefs.filter((h) => !h.startsWith(`/${lang}/`) && !h.startsWith('/apps/'));
      assert.deepEqual(stray, [], `${path}: links that leave /${lang}/`);
    }
  });

  test(`${lang}: <main> links equal English once the language prefix is removed`, () => {
    for (const rel of ['', ...PRODUCTS.map((n) => `${n}/`), '404.html']) {
      const en = summarize(page(`/${rel}`)).hrefs;
      const tr = summarize(page(`/${lang}/${rel}`)).hrefs.map((h) => (h.startsWith(`/${lang}/`) ? h.slice(lang.length + 1) : h)).sort();
      assert.deepEqual(tr, en, `/${lang}/${rel}: links differ from English`);
    }
  });

  test(`${lang}: the English mini apps keep lang on the homepage`, () => {
    const html = page(`/${lang}/`);
    assert.match(html, new RegExp(`<section[^>]*\\bmini-apps\\b[^>]*\\blang=${q}en-US${q}`));
  });

  for (const name of PRODUCTS) {
    test(`${lang}/${name}: og:image is the screenshot and the version follows English`, () => {
      const en = read(`content/${name}/index.md`);
      const image = /images\s*=\s*\['([^']+)'\]/.exec(en)[1].replace(/\.[a-z]+$/, '');
      const version = /^version\s*=\s*'([^']+)'/m.exec(en)[1];
      const html = page(`/${lang}/${name}/`);
      assert.ok((metaContent(html, 'og:image') || '').includes(image), `og:image should come from ${image}`);
      assert.match(html, new RegExp(`class=${q}version${q}[^>]*>${version.replace(/\./g, '\\.')}<`));
    });

    test(`content/${name}/index.${lang}.md: only translatable fields, none forgotten`, () => {
      const en = frontMatterKeys(`content/${name}/index.md`);
      const tr = frontMatterKeys(`content/${name}/index.${lang}.md`);
      assert.deepEqual(NEUTRAL.filter((k) => tr.keys.has(k)), [], 'language-neutral keys belong in the English file');
      assert.ok(!/^\s*url\s*=/m.test(tr.text), 'urls belong in the English file');
      assert.deepEqual(TRANSLATABLE.filter((k) => en.keys.has(k) && !tr.keys.has(k)), [], 'translatable keys the English file has but this one lacks');
      const faq = (t) => (t.match(/^\[\[params\.faq\]\]/gm) || []).length;
      assert.equal(faq(tr.text), faq(en.text), 'faq entry count differs from English');
    });
  }
}
