# Multilingual site: Thai, Simplified Chinese, Japanese, Korean

Status: draft, awaiting owner approval. Branch `feat/i18n-th-zh-ja-ko`. Nothing is pushed.

## Intent and why

The site is English only. The owner wants it readable in the four Asian languages closest to him: Thai (`th`), Simplified Chinese (`zh-cn`), Japanese (`ja`), Korean (`ko`). He picked these on "Asia, near me", not on speaker counts or on where the apps' users are. The apps (open-mtp-client, Inkbound, chiaki-ngx) are free, so the payoff is reach: someone searching in Japanese for "Obsidian EPUB" should land on a Japanese Inkbound page, and Google should know the four pages are one page.

## Goals

- Full translations of the homepage and the three product pages (open-mtp-client, Inkbound, chiaki-ngx), about 2,400 English words each time, so about 9,600 words in total.
- Each language gets its own URL prefix: `/th/`, `/zh-cn/`, `/ja/`, `/ko/`. English stays at the root, and **no existing English URL, h1 or link changes**.
- A language switcher in the header; translated UI chrome (nav, footer, buttons, 404, "You need", etc.); correct `lang`, `hreflang`, canonical, Open Graph locale and JSON-LD `inLanguage`.
- The site stays accessible and passes every existing check (53 tests, `hugo --minify` with zero warnings).

## Non-goals

- Translating the mini apps (`/apps/mortgage`, `/apps/opencode-go`). Their UI lives in JS and YAML and few people read them in four languages. Mortgage is already Thai.
- Auto-detecting the browser language or redirecting. The visitor picks.
- Tracking when a translation falls behind the English text. No tooling for that now; `CLAUDE.md` will say it is a manual job.
- Translating the `design/` prototype, `specs/` or `docs/`.

## Anti-goals (would make this a failure even if it builds)

- English URLs or their parity-test entries change.
- A release (`version` bump) now needs edits in five files.
- A broken-looking CJK page: tofu boxes, Thai font on Chinese text, line breaks in the wrong place.
- Machine-translated text presented as if a native speaker checked it.

## Constraints (from the repo)

- Hugo 0.170 and Node 22 from `~/.hermes/cache/tools` (`source ~/.hermes/cache/scratch/kpp-env.sh`). Build with `-d` to a scratch dir. `git checkout hugo_stats.json` after builds.
- `npm test` includes `skin-parity`, which compares every emitted page's h1 and `<main>` links with `tests/fixtures/parity-baseline.json`, and fails if the **set of pages** changes. New pages mean new baseline entries (intended), but the existing entries must stay byte-identical.
- `content/` holds Markdown and front matter only. `layouts/` holds templates.
- A push to `main` is a live deploy. Ask separately before pushing.
- Never hotlink images. Bundles already hold the screenshots, and Hugo shares a leaf bundle's resources across translations, so no image is copied.

## Approaches considered

| | How | Trade-off |
|---|---|---|
| **A, chosen** | Hugo native multilingual, translation by filename (`index.th.md` next to `index.md`), UI strings in `i18n/<lang>.toml` | Reuses screenshots, keeps English URLs, gives `hreflang` and sitemap alternates for free. Needs template edits for hardcoded English. |
| B | Separate `contentDir` per language | Screenshots copied per language; harder to keep in sync. |
| C | Client-side translation widget | Not indexed, uncontrolled quality, off-brand. |

The owner picked A.

## Design

### Config (`hugo.toml`)

`defaultContentLanguage = 'en'` and `defaultContentLanguageInSubdir = false` (default). Add `[languages.en]`, `.th`, `.zh-cn`, `.ja`, `.ko` with `languageName` in the native script (`English`, `ไทย`, `简体中文`, `日本語`, `한국어`), `locale` (`en-US`, `th-TH`, `zh-CN`, `ja-JP`, `ko-KR`), `weight` in that order, and a translated `title`/`params.description`/`params.siteTitleFull`. Move the existing `params.description` and `siteTitleFull` under `[languages.en.params]` so English output is unchanged. `author`, `github`, `coffee`, `googleAnalytics` stay global.

### Content

- Translated files: `content/_index.<lang>.md` and `content/<product>/index.<lang>.md` for the three products. `content/apps/_index.<lang>.md` is **not** created.
- **Language-neutral facts stay only in the English file**: `version`, `repo_url`, `license`, `os`, `category`, `order`, `images`/`hero_image`, `cta.url`, `cta_secondary.url`, `cta_kind`, `icon`. A translated file carries only translatable fields (`title`, `description`, `seo_title`, `eyebrow`, `tagline`, `card_pitch`, `route_from`/`route_to`, `hero_alt`, `requirements`, `steps`, `notice`, `faq`, `cta.label`, `cta_secondary.label`) plus the body. A new partial (`partials/neutral-param.html`) reads a neutral field from the English page of `.AllTranslations`. A release stays a one-line edit.
- Reading `os` as neutral is a call of mine: its text is English prose ("Windows, macOS, Linux, iOS, Android (Obsidian 1.5 or newer)"). If that looks wrong on a translated page, make it translatable. Builder's call per field.
- Translations are drafted by Claude. Thai is checked by the owner; zh/ja/ko are **unverified drafts** and the commit message and `CLAUDE.md` say so.

### UI strings (`i18n/*.toml`)

Keys for everything hardcoded now: skip link, "Mini apps", menu label, "Palette: " / palette names (`Default`, `Midnight`; `theme.js` also rewrites the label, so it reads the strings from `data-*` attributes), "Buy me a coffee", footer line, "How it works", "You need", "View on GitHub", "Report a problem", `product-facts` labels (Price, Free, License, Version, Needs), hero line and terminal prompt text, 404 copy, `about-line`, `aria-label`s. The `kidpeterpan@home:~$` prompt and the `GitHub` nav label stay as they are (brand and proper noun).

`i18n/en.toml` must reproduce today's English strings exactly.

### Templates

- `baseof.html`: `<html lang>` already comes from `site.Language.Locale`, which becomes per-language automatically. Add `<link rel="alternate" hreflang>` for every translation plus `x-default` pointing at English; `<link rel="canonical">` is already per page.
- Header gets the language switcher (`partials/lang-switch.html`): a `<nav aria-label>` with one link per language, `lang` and `hreflang` on each, `aria-current="true"` on the current one. Link target is the page's translation, or that language's home when the page has none (for example `/apps/` pages, 404). 44px targets and the 3px focus ring apply. On a phone it sits inside the existing `.nav-mobile` menu or wraps under the brand; builder's call, after looking at a screenshot.
- `nav-links.html`: labels from i18n; URLs through `relLangURL`/`.Language`. The "Mini apps" link always goes to the English `/apps/` and carries `lang="en"`.
- Homepage app list (`layouts/index.html`) lists the English mini apps on every language's home, each with its own `lang` attribute (already supported via `content_lang`).
- `seo.html`: `og:locale` per language plus `og:locale:alternate` for the others. `structured-data.html`: `inLanguage` from the page's language.
- `404.html`: Hugo emits `/404.html` for English and `/<lang>/404.html` for others; GitHub Pages only serves the root one, so the others are never shown. Keep the root English 404; the others are `noindex` (already) and use the i18n strings, with no further effort.
- Sitemap: Hugo's default sitemap already adds `xhtml:link` alternates. Verify it, do not hand-roll.

### Typography

CSS adds `:lang(zh-CN)`, `:lang(ja)`, `:lang(ko)` rules that set the body font stack to system CJK fonts (`"PingFang SC", "Hiragino Sans", "Apple SD Gothic Neo", "Noto Sans CJK …", "Microsoft YaHei", "Malgun Gothic"`), with `line-height` raised about 0.1 and `word-break: keep-all` only for Korean. No CJK webfont (weight). Window chrome keeps IBM Plex Mono for ASCII and falls through to the CJK stack for other glyphs. IBM Plex Sans Thai stays for `lang="th"`. Check long CJK strings in title bars and buttons for overflow, since they have no spaces to wrap on.

### Tests

- `parity-baseline.json`: existing entries unchanged; regenerate only to **add** `/th/`, `/zh-cn/`, `/ja/`, `/ko/` pages (home, three products and 404 each, 20 entries; see "Added after the builder check").
- New `i18n.test.mjs`:
  - every key in `i18n/en.toml` exists in the four other files and no file has extra keys;
  - each translated page has the same `<main>` hrefs as its English page, after stripping the language prefix and apart from the "Mini apps" link;
  - every page has `<html lang>` matching its language, one `hreflang` per translation, and `x-default`;
  - no translated front matter contains `version`, `repo_url` or `license` (guards the one-line-release rule);
  - the English build output has the same h1 and hrefs as before (covered by the untouched baseline).
- Existing `skin-markup` tests (header structure, contrast, 44px) run against the new header and must pass; add the switcher to them.
- Browser check by hand: screenshots of home and one product page in each of the five languages, light and dark, at 1280 and 390 px wide, looking for overflow and font fallback. Checked by `img.currentSrc`-style DOM queries as well as by eye.

### Rollout

Local branch only. When the owner approves the result, he decides separately on the push to `main`. After that deploy: `gh run watch`, then `curl` `/`, `/ja/`, `/th/inkbound/` and `/sitemap.xml`.

## Added after the builder check (my calls, none changes what the owner asked for)

1. **Other languages' 404 pages.** Hugo emits `/<lang>/404.html` for every language and `tests/helpers/build.mjs` collects every `404.html`, so the baseline gets **20** new entries (4 languages x home, 3 products, 404), not 16. We keep them (they stay `noindex`; GitHub Pages never serves them). No `/<lang>/apps/` page is created, because `content/apps/_index.<lang>.md` does not exist; the test asserts none is emitted.
2. **Neutral facts: where the partial is applied.** Hugo does not merge params across translations. Translated files therefore also carry `layout = 'project'` and `date` (both needed, otherwise the page renders as `single.html` and drops out of the homepage's `Layout "project"` filter). Every template read of a neutral field (`version`, `repo_url`, `license`, `os`, `category`, `order`, `images`, `hero_image`, `icon`, `cta.url`, `cta_secondary.url`, `cta_kind`) goes through the one partial: `project.html`, `index.html` (including the sort by `order`), `route.html`, `product-facts.html`, `structured-data.html`, `social-image.html`. Without `images`, a translated page would silently get the generated card instead of the screenshot, so a test asserts that each translated product's `og:image` equals the English one.
3. **`lang` format and Thai font.** `<html lang>` and `hreflang` use the BCP 47 locale (`en-US`, `th-TH`, `zh-CN`, `ja-JP`, `ko-KR`) and the set includes a self-reference plus `x-default`. The existing CSS selectors `[lang="th"]` (main.css lines 96 and 1732) match exactly and would miss `th-TH`; they change to `:lang(th)`. The mortgage page's `content_lang = 'th'` keeps working with it.
4. **English mini apps on translated pages.** Set `content_lang = 'en'` on `opencode-go.md`, so those entries carry `lang="en"` on translated homes. The mini-apps list on a translated home reads the English site's `/apps` section explicitly (`site.Sites.Default`), since `site.GetPage` resolves per language and would find nothing.
5. **hrefs test.** The nav is outside `<main>`, so the "Mini apps" link is never compared. What the test compares inside `<main>`: each translated page's links equal the English page's links, after mapping internal product links to their language prefix. The mini-app links stay on English URLs, with no prefix to strip, and are compared as they are.

## Left to the builder

- Exact i18n key names and the file layout of partials.
- How the switcher sits on a phone.
- Wording of the translations, within these rules: product and brand names stay in Latin (open-mtp-client, Inkbound, Obsidian, PlayStation, Remote Play, EPUB, Mac, Android); code, paths, menu names the user must click in an English UI (for example **Settings → Community plugins**) stay in English with a translation in parentheses on first use.
- Whether `os` should be translatable.
