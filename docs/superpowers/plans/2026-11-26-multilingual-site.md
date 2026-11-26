# Multilingual Site (th, zh-cn, ja, ko) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the homepage and the three product pages in Thai, Simplified Chinese, Japanese and Korean under `/th/`, `/zh-cn/`, `/ja/`, `/ko/`, with English unchanged at the root.

**Architecture:** Hugo native multilingual with translation by filename (`index.th.md` beside `index.md`). UI strings move to `i18n/<lang>.toml`. Language-neutral product facts stay only in the English file; one partial merges them into translated pages' params. A header switcher links each page to its translation.

**Tech Stack:** Hugo 0.170 (`$HUGO`), Node 22 test runner (`npm test`), Tailwind v4 via Hugo Pipes. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-26-multilingual-site-design.md` (read its "Added after the builder check" section too).

## Global Constraints

- Toolchain: `source ~/.hermes/cache/scratch/kpp-env.sh` (Hugo 0.170.1, Node 22). In this worktree run `ln -s ../kidpeterpan.github.io/node_modules node_modules` once; never `git add -A` (add explicit paths) so the symlink is not committed. After every build run `git checkout hugo_stats.json`.
- `hugo --minify` must finish with zero warnings (the test helper fails on any `WARN`/`ERROR`).
- No existing English URL, h1 or `<main>` link changes. Existing entries in `tests/fixtures/parity-baseline.json` stay byte-identical; only add entries.
- `content/` holds Markdown and front matter only; `layouts/` holds templates.
- Language keys and prefixes: `en` (root, `en-US`), `th` (`th-TH`), `zh-cn` (`zh-CN`), `ja` (`ja-JP`), `ko` (`ko-KR`). `languageName`: `English`, `ไทย`, `简体中文`, `日本語`, `한국어`. `<html lang>` and `hreflang` use the locale (`zh-CN`, not `zh-cn`), with a self-reference plus `x-default` (English).
- Neutral facts live only in the English file: `version`, `repo_url`, `license`, `license_url`, `os`, `category`, `order`, `images`, `hero_image`, `icon`, `cta.url`, `cta_secondary.url`, `cta_kind`. Translated files carry `title`, `description`, `date`, `layout = 'project'`, `seo_title`, `eyebrow`, `tagline`, `card_pitch`, `route_from`, `route_to`, `hero_alt`, `hero_caption` (if English has it), `requirements`, `steps`, `notice` (if English has it), `faq`, `cta.label`, `cta_secondary.label` (if English has it), plus the body.
- Brand and proper nouns stay Latin: open-mtp-client, Inkbound, chiaki-ngx, Obsidian, PlayStation, Remote Play, EPUB, Mac, Android, GitHub, the `kidpeterpan@home:~$` prompt. UI paths a user must click in an English app (e.g. **Settings → Community plugins**) stay English, with a translation in parentheses on first use.
- zh/ja/ko text is an unverified Claude draft; say so in the commit message and in `CLAUDE.md`. Thai is checked by the owner.
- Commits: plain repo style (`feat:`, `content:`, `docs:`), no `Co-Authored-By`. Nothing is pushed; a push to `main` is a live deploy and needs the owner's separate approval.

## Review Focus

1. A Japanese/Korean/Thai/Chinese visitor clicks the brand, a nav link, a product row or a 404 button and lands on the **English** page, because templates use `relURL` (not `relLangURL`). Expect every internal link on a translated page to stay in the language, except the mini-apps links. Owned by Task 2.
2. A translator forgets a field and the translated page silently shows English text (the params merge fills it). Expect the build's tests to fail. Owned by Task 2.
3. The switcher on a page with no translation (`/apps/…`, `/404.html`) must not link to a 404; it goes to that language's home. Owned by Task 3.
4. The palette toggle flips to the hardcoded English "Midnight"/"Default" after a click on a translated page. Owned by Task 3.
5. A version bump in the English file must show on all translated pages without touching them; long CJK strings must not overflow the header or buttons at 390 px wide. Owned by Tasks 2 and 7.

---

### Task 1: Move UI strings to `i18n/en.toml` (English output byte-identical)

**Files:**
- Create: `i18n/en.toml`, `tests/i18n.test.mjs`
- Modify: `layouts/_default/baseof.html`, `layouts/partials/nav-links.html`, `layouts/partials/product-facts.html`, `layouts/partials/route.html`, `layouts/index.html`, `layouts/_default/project.html`, `layouts/404.html`, `layouts/apps/list.html`, `layouts/apps/single.html` (only if it has hardcoded English chrome), `static/js/theme.js`

**Interfaces:**
- Produces: every hardcoded English UI string listed in the spec's "UI strings" section is read with `{{ i18n "<key>" }}` (or `{{ i18n "<key>" (dict …) }}` for strings with a variable, such as the year, the product title, the license). Key names are the builder's call (lowercase, `_`-separated, one flat `key = "value"` per line, no `[section]` tables, so the completeness test in Task 2 can parse them with one regex). The two palette names are exposed to JS as `data-pal-light` / `data-pal-dark` attributes on `.theme-toggle`, and `theme.js` reads them instead of its literals.
- Strings that contain a link (the home `about-line`, the product `support` line) use one key whose value holds a `{{ .link }}` placeholder; the template passes the anchor as `safeHTML`. Mechanism is the builder's call.

- [ ] **Step 1: Capture the reference build.** Before editing anything: `hugo --minify -d $TMPDIR/en-before`, then `git checkout hugo_stats.json`.
- [ ] **Step 2: Write the failing test** in `tests/i18n.test.mjs`: `test('every i18n key used by a template exists in en.toml')` scans `layouts/**/*.html` for `i18n "key"` calls and asserts each key is a key of `i18n/en.toml`; also assert the scan found at least 25 keys (guards a regex that matches nothing). Run `node --test tests/i18n.test.mjs`; expected FAIL (`i18n/en.toml` missing).
- [ ] **Step 3: Extract the strings** into `i18n/en.toml` and switch the templates to `i18n`. Values must reproduce today's text exactly, including the `© {year}` footer line and the `Palette: ` label.
- [ ] **Step 4: Prove zero diff.** `hugo --minify -d $TMPDIR/en-after`, `git checkout hugo_stats.json`, then `diff -r $TMPDIR/en-before $TMPDIR/en-after` prints nothing.
- [ ] **Step 5: Run the gate.** `npm test`; expected all 53 existing tests plus the new one pass.
- [ ] **Step 6: Commit.** `git add i18n layouts static tests/i18n.test.mjs && git commit -m "refactor: move UI strings to i18n/en.toml (English output unchanged)"`

### Task 2: Languages, neutral-param merge and the Thai slice

**Files:**
- Modify: `hugo.toml`, `assets/css/main.css` (lines 96 and 1732: `[lang="th"]` becomes `:lang(th)`), `content/apps/opencode-go.md` (`content_lang = 'en'`), `layouts/_default/baseof.html`, `layouts/partials/nav-links.html`, `layouts/partials/seo.html`, `layouts/partials/structured-data.html`, `layouts/partials/social-image.html`, `layouts/partials/route.html`, `layouts/partials/product-facts.html`, `layouts/_default/project.html`, `layouts/index.html`, `layouts/404.html`, `tests/fixtures/parity-baseline.json`, `tests/i18n.test.mjs`
- Create: `layouts/partials/product-params.html`, `i18n/th.toml`, `content/_index.th.md`, `content/open-mtp-client/index.th.md`, `content/inkbound/index.th.md`, `content/chiaki-ngx/index.th.md`

**Interfaces:**
- Produces: `partial "product-params.html" <page> → map`: for a page whose language is not the default, returns `merge <English page>.Params <page>.Params` (translated values win, nested maps such as `cta` merge key by key); for the English page returns `.Params` unchanged. The English page is found with `where .AllTranslations "Language.Lang" "en"`. Every template read of a product field goes through it (`$product := partial "product-params.html" .`), including `structured-data.html` (`inLanguage` = the page's locale, not `content_lang` unless set), `social-image.html` (`images`) and `shot.html` callers (`hero_image`).
- Produces: internal links built with `relLangURL` / `.RelPermalink` so they keep the language; the Mini apps nav link and the homepage's mini-app list stay on the English `/apps/…` URLs and carry `lang="en"`.
- Produces on the homepage: products come from `range sort (where site.Sites.Default.RegularPages "Layout" "project") "Params.order"`, each mapped to its translation in the current language with `index (where .AllTranslations "Language.Lang" site.Language.Lang) 0` (skipped when there is none). The mini-apps window reads `site.Sites.Default.GetPage "/apps"`.
- Produces in `<head>`: `<link rel="alternate" hreflang="<locale>" href=…>` for every translation including itself, plus `x-default`; `og:locale:alternate` for the other languages.
- `hugo.toml`: `[languages.en]` and `[languages.th]` (`weight` 1 and 2). `description` and `siteTitleFull` move to `[languages.<lang>.params]` (English keeps today's text exactly; Thai gets a translation). `author`, `github`, `coffee`, `googleAnalytics` stay global.

- [ ] **Step 1: Write the failing tests** in `tests/i18n.test.mjs`. Read the language list from `hugo.toml` (`/^\[languages\.([a-z-]+)\]/gm`), take locales from the same blocks, and for each non-English language `L` (locale `LOC`) assert:
  - `i18n/L.toml` has exactly the keys of `i18n/en.toml` (`test('i18n keys are complete: L')`);
  - `/L/`, `/L/open-mtp-client/`, `/L/inkbound/`, `/L/chiaki-ngx/` and `/L/404.html` are emitted, and `/L/apps/` is not;
  - each has `<html lang=LOC>`, one `hreflang` link per language (locale-valued) plus `x-default`, and `og:locale:alternate`;
  - every `href` inside `<header>` and `<main>` that starts with `/` and is not `/apps/…` or a static asset starts with `/L/`;
  - each translated product page's `og:image` equals the English page's `og:image` (the screenshot, not the generated card), and its `.version` text equals the `version` parsed from `content/<name>/index.md`;
  - `content/<name>/index.L.md` front matter contains none of `version`, `repo_url`, `license`, `license_url`, `os`, `category`, `order`, `images`, `hero_image`, `icon`, `cta_kind`, a `url =` line, and contains every translatable key (list in Global Constraints) that the English file contains. Assert with `assert.deepEqual(missing, [])` so the failure names the key.
  - the English pages' h1 and links are unchanged (this is the untouched baseline in `skin-parity`).
  Run `npm test`; expected FAIL.
- [ ] **Step 2: Configure** `hugo.toml` for `en` and `th`, add `partials/product-params.html`, and switch the templates listed above (links to `relLangURL`, params through the partial, `<head>` alternates, 404 and nav strings through `i18n`). Add `i18n/th.toml`.
- [ ] **Step 3: Translate to Thai** `content/_index.th.md` and the three `index.th.md` (rules in Global Constraints; keep English `[params.notice]`/faq structure one-to-one so the `skin-markup` FAQ count test still equals the front matter count).
- [ ] **Step 4: Fix the Thai font selector** (`:lang(th)` at both lines of `main.css`) and add `content_lang = 'en'` to `opencode-go.md`.
- [ ] **Step 5: Add baseline entries.** Run a one-off node script that imports `buildSite, pages, summarize` from `tests/helpers/build.mjs` and writes entries only for paths not already in `parity-baseline.json` (the 5 `/th/` pages). `git diff tests/fixtures/parity-baseline.json` must show additions only.
- [ ] **Step 6: Run the gate.** `npm test` passes; `hugo --minify` has no warnings. Check `sitemap.xml` of the build contains `xhtml:link` alternates for `th` on `/inkbound/`. Show the Thai `/th/inkbound/` and English `/inkbound/` rendered side by side in a screenshot for the owner (`MEDIA:` path); do not describe it as verified beyond what the DOM checks show.
- [ ] **Step 7: Commit.** Explicit paths, `git commit -m "feat: multilingual plumbing and Thai translation"`.

### Task 3: Language switcher

**Files:**
- Create: `layouts/partials/lang-switch.html`
- Modify: `layouts/_default/baseof.html`, `assets/css/main.css`, `static/js/theme.js` (only if Task 1 left a literal), `tests/skin-markup.test.mjs`, `tests/i18n.test.mjs`

**Interfaces:**
- Consumes: `i18n` keys from Task 1; `languageName` from `hugo.toml`.
- Produces: `partial "lang-switch.html" .` renders `<nav class="lang-switch" aria-label="<i18n lang_switch_label>">` with one `<a lang=<locale> hreflang=<locale>>languageName</a>` per site language; the current language is a `<span aria-current="true">` (not a link). A link points to `.Translations`' page for that language, else to that language's home (`relLangURL "/"` for the target language). It sits in the header's `.header-right` and also inside `.nav-mobile`'s menu on narrow screens; 44 px targets and the 3 px `--accent` focus ring apply.

- [ ] **Step 1: Write the failing tests.**
  - `skin-markup`: in `<header>` of `/` there is exactly one `.lang-switch`; it lists `English` and `ไทย`; `English` is the `aria-current` span. On `/inkbound/` the `ไทย` link targets `/th/inkbound/`; on `/apps/` and `/404.html` it targets `/th/` (Review Focus 3). On `/th/inkbound/` the `English` link targets `/inkbound/`.
  - `i18n`: `static/js/theme.js` contains neither `'Midnight'` nor `'Default'`; on `/th/` the `.theme-toggle` has `data-pal-light` and `data-pal-dark` equal to the values in `i18n/th.toml` (Review Focus 4).
  Run; expected FAIL.
- [ ] **Step 2: Implement** the partial, wire it into `baseof.html`, add CSS beside `.theme-toggle` (reuse `.btn-ghost` look), and make `theme.js` read the two data attributes.
- [ ] **Step 3: Gate.** `npm test` passes. Take screenshots of `/` and `/th/inkbound/` at 1280 and 390 px wide (header must not overflow; menu opens); send them to the owner as `MEDIA:` paths.
- [ ] **Step 4: Commit.** `git commit -m "feat: language switcher in the header"`.

### Task 4: Simplified Chinese (`zh-cn`)

**Files:**
- Modify: `hugo.toml` (add `[languages.zh-cn]`, `weight = 3`, `hasCJKLanguage = true`), `assets/css/main.css`, `tests/fixtures/parity-baseline.json`, `tests/skin-tokens.test.mjs`
- Create: `i18n/zh-cn.toml`, `content/_index.zh-cn.md`, `content/{open-mtp-client,inkbound,chiaki-ngx}/index.zh-cn.md`

**Interfaces:** Consumes the tests of Task 2 (they pick the new language up from `hugo.toml`) and the switcher of Task 3.

- [ ] **Step 1: Add `[languages.zh-cn]` only.** Run `npm test`; expected FAIL (missing `i18n/zh-cn.toml`, missing pages). This is the RED state.
- [ ] **Step 2: Add the CJK font rule.** In `main.css`, `:lang(zh-CN)` sets `font-family` to the system stack `"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", var(--font-body)`; the `.win-title`, `.btn`, `.btn-ghost`, `.theme-toggle` chrome gets the same fallback after IBM Plex Mono. Body `line-height` grows by 0.1 under `:lang(zh-CN), :lang(ja), :lang(ko)`. No webfont is added (the Google Fonts `<link>` is unchanged). Add an assertion in `tests/skin-tokens.test.mjs` that `main.css` contains `:lang(zh-CN)` and `:lang(th)`.
- [ ] **Step 3: Write `i18n/zh-cn.toml` and the four content files** (rules in Global Constraints).
- [ ] **Step 4: Add baseline entries** as in Task 2 Step 5 (5 new `/zh-cn/` paths, additions only).
- [ ] **Step 5: Gate.** `npm test` passes, zero Hugo warnings.
- [ ] **Step 6: Commit.** `git commit -m "feat: Simplified Chinese translation (unverified draft)"`.

### Task 5: Japanese (`ja`)

Same shape as Task 4, with: `[languages.ja]` (`weight = 4`, `hasCJKLanguage = true`), `:lang(ja)` font stack `"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", "Yu Gothic", "Meiryo", var(--font-body)`, `i18n/ja.toml`, `content/_index.ja.md` and the three `index.ja.md`, five new `/ja/` baseline entries, commit `feat: Japanese translation (unverified draft)`. Order of steps: RED (add the language only, run `npm test`, see it fail), font rule, translations, baseline, gate, commit.

### Task 6: Korean (`ko`)

Same shape as Task 4, with: `[languages.ko]` (`weight = 5`, `hasCJKLanguage = true`), `:lang(ko)` font stack `"Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", var(--font-body)` plus `word-break: keep-all` for `:lang(ko)` only, `i18n/ko.toml`, `content/_index.ko.md` and the three `index.ko.md`, five new `/ko/` baseline entries, commit `feat: Korean translation (unverified draft)`.

### Task 7: Browser check, docs and final gate

**Files:**
- Modify: `CLAUDE.md`, `README.md` (only if it describes languages or structure), possibly `assets/css/main.css` for overflow fixes found here
- Test: existing suite

- [ ] **Step 1: Build and serve.** `$HUGO --minify -d $TMPDIR/site`; `terminal(background=true)` `python3 -m http.server 8765 --bind 127.0.0.1` in that dir.
- [ ] **Step 2: Inspect with `browser_exec`.** For `/`, `/th/`, `/zh-cn/`, `/ja/`, `/ko/` and one product page per language, at 1280 and 390 px wide, light and dark: no horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`), `getComputedStyle(body).fontFamily` starts with the expected stack, header and buttons do not clip text (`scrollWidth <= clientWidth` for `.btn`, `.win-title`, `.lang-switch a`), the palette toggle label after a click is in the page language, screenshots of each language's home and `inkbound` page saved and sent as `MEDIA:` paths. Fix real overflow in CSS only; record each fix.
- [ ] **Step 3: Update `CLAUDE.md`.** Add: the language list and URL scheme, "translated files carry only translatable fields; `version` etc. stay in the English file", how to add a language (hugo.toml block, `i18n/<lang>.toml`, content files, baseline entries), the CJK font rule, "zh/ja/ko translations are unverified drafts", and "translations do not auto-update when English changes". Fix the sentences that now say "an English portfolio".
- [ ] **Step 4: Full gate.** `npm test`; `hugo --minify` with zero warnings; `git status` shows no stray files (remove the `node_modules` symlink, kill the http server, `git checkout hugo_stats.json`).
- [ ] **Step 5: Commit.** `git commit -m "docs: describe the multilingual setup"`.
- [ ] **Step 6: Stop.** Report to the owner what ran, what was not verified (native-speaker quality of zh/ja/ko; real phones), and ask separately whether to push; do not push.
