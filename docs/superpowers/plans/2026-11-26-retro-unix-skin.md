# Retro Unix Skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin every page of kidpeterpan.github.io as a CDE/Motif desktop (windows, stipple, xterm hero) without changing content, URLs, or behavior.

**Architecture:** CSS-first. Tokens and bevel primitives in `assets/css/main.css` re-skin the existing classes; a small `window-bar.html` partial adds title bars; templates gain window wrappers. Two new node tests guard contrast tokens and content parity against the pre-change build.

**Tech Stack:** Hugo (extended) 0.170.1, plain CSS via `css.TailwindCSS`, Node `node:test`, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-26-retro-unix-skin-design.md`

## Global Constraints

- Work only in this worktree on branch `retro-cde-skin`. Never push, never touch `main`.
- Build env, every shell: `export PATH="$HOME/.hermes/cache/tools/node22/node_modules/node/bin:$PWD/node_modules/.bin:$PATH"` and call Hugo as `HUGO=$HOME/.hermes/cache/tools/hugo/hugo`.
- Production check: `$HUGO --minify -d <tmpdir>` ends with zero `WARN`/`ERROR` lines. `npm test` stays green.
- Palette values are exactly those in the spec's "Palettes" section.
- Keep `localStorage` key `mha-theme`; keep aliases `--green`, `--red`, `--shadow-pop`, `--line-strong`, `--line`, `--surface`, `--surface-2`, `--muted`, `--faint`, `--accent-*`, `--danger`, `--focus` (mini-app CSS reads them).
- Touch targets ≥44px. Text contrast ≥4.5:1, component boundaries ≥3:1.
- No new fonts. Only change to the font request: `IBM+Plex+Mono:wght@400;500;700`.
- Decorative title-bar controls are `aria-hidden`; no non-functional buttons.
- Do not edit `content/`, `data/`, `assets/js/`, `layouts/partials/seo.html`, `structured-data.html`, `og-image.html`, `social-image.html`, `shot*.html`.

## Review Focus

1. Long product titles in a title bar (`chiaki-ngx — PlayStation Remote Play client`) at 320px: the bar must truncate with an ellipsis, never widen the page. Pinned in Task 6 (overflow sweep).
2. Thai mortgage page inside a window: `lang="th"` text must still use IBM Plex Sans Thai, inputs included. Pinned in Task 5 (computed-style check).
3. Forced-colors / high-contrast mode: bevels become invisible if drawn only with custom colors. Pinned in Task 1 (string test) and Task 6.
4. JS disabled or `localStorage` blocked: nothing may stay hidden; the page reads in Default palette. Pinned in Task 1 (string test on `.reveal`).
5. Dark twins: `shot-light`/`shot-dark` swap must survive the new inset frame. Pinned in Task 3 (markup test) and Task 6.

---

### Task 1: Tokens, bevel primitives, parity baseline

**Files:**
- Modify: `assets/css/main.css` (token blocks lines 1–57; `body`, `a`; `.btn`, `.btn-ghost`, `.icon-btn`, `.text-link`; radii)
- Modify: `layouts/_default/baseof.html` (font URL only: Plex Mono weights)
- Create: `tests/skin-tokens.test.mjs`
- Create: `tests/skin-parity.test.mjs`
- Create: `tests/helpers/build.mjs`
- Create: `tests/fixtures/parity-baseline.json`

**Interfaces:**
- Produces (CSS custom properties, both `:root` and `html[data-theme="dark"]`): `--desk-a --desk-b --face --hi --sh --edge --paper --ink --muted --title --title-ink --accent --term-bg --term-ink --term-prompt --shadow-hard`; `--radius-panel/--radius-shot/--radius-control` become `0`. Old tokens remain as aliases: `--bg`→`--desk-a`, `--surface`→`--paper`, `--surface-2`→`--face`, `--line`→`--sh`, `--line-strong`→`--edge`.
- Produces (classes): `.out` (raised bevel), `.in` (sunken bevel), both with 1px `--edge` outline.
- Produces (`tests/helpers/build.mjs`): `buildSite(): string` — runs `process.env.HUGO || 'hugo'` with `--minify -d <mkdtemp>` and returns the output dir; throws with the command's stderr if exit ≠ 0 or output contains `WARN`.
- Produces (`parity-baseline.json`): `{ [pagePath]: { h1: string, hrefs: string[] } }` where `hrefs` is the sorted unique `href` values inside `<main>…</main>`.

- [ ] **Step 1: Capture the parity baseline from the untouched site.** Write a throwaway node script (not committed) that calls `buildSite()`, walks every `index.html` and `404.html`, extracts `<main …>…</main>`, the text of the first `<h1>`, and the sorted unique `href` list, and writes `tests/fixtures/parity-baseline.json`. Expected: one entry per emitted page, including `/`, `/open-mtp-client/`, `/inkbound/`, `/chiaki-ngx/`, `/apps/`, `/apps/mortgage/`, `/apps/opencode-go/`, `/404.html`.
- [ ] **Step 2: Write the failing tests.**
  - `tests/skin-tokens.test.mjs` — `test('palette contrast meets AA')`: parse the `:root` and `html[data-theme="dark"]` blocks of `assets/css/main.css`; for each theme assert ratio ≥4.5 for `ink/paper`, `ink/face`, `muted/paper`, `muted/face`, `accent/paper`, `accent/face`, `title-ink/title`, `term-ink/term-bg`, `term-prompt/term-bg`, and ≥3 for `edge/face`, `edge/paper`.
  - Same file — `test('forced-colors keeps borders')`: the CSS contains `@media (forced-colors: active)` and, inside it, `.out` and `.in` set `border-color` to a system color (`CanvasText`).
  - Same file — `test('nothing is hidden without JS')`: every rule that hides `.reveal` (`opacity: 0`) is scoped under `html.anim-pre`; and `animation:` with `blink` appears only inside `@media (prefers-reduced-motion: no-preference)`.
  - `tests/skin-parity.test.mjs` — `test('every page keeps its h1 and its links')`: `buildSite()`, then for each page in the baseline assert identical `h1` and that `hrefs` equals the baseline's. (Window titles are `h2`/`p`, so this holds.)
- [ ] **Step 3: Run `npm test`.** Expected: the three token tests FAIL (tokens missing, no forced-colors block); parity PASSES against the untouched templates (it is the safety net for later tasks).
- [ ] **Step 4: Implement the tokens and primitives in `assets/css/main.css`.** Replace the two token blocks with the spec's Default/Midnight values plus the aliases above; add `--shadow-hard: 5px 5px 0 rgba(0,0,0,.35)` (Midnight `.6`). `body` gets the stipple: `background-color: var(--desk-a)` and the 4px `conic-gradient(var(--desk-b) 25%, transparent 0 50%, var(--desk-b) 0 75%, transparent 0)`; remove the body color transition. Add `.out`/`.in` and the `@media (forced-colors: active)` block. Restyle `.btn`, `.btn-ghost`, `.icon-btn`, `.text-link` as bevel controls (min-height 44px, `:active` flips to `.in` bevel, `:focus-visible` 3px `--accent` outline with 2px offset, `.btn` primary gets the Motif default-button ring). Set the three radius tokens to `0`. Update the Google Fonts URL in `baseof.html`.
- [ ] **Step 5: Run `npm test`.** Expected: all pass (33 existing + new).
- [ ] **Step 6: Build and eyeball.** `$HUGO --minify -d /tmp/kpp-t1`; zero warnings. Open the home page; confirm the page is recolored and buttons are beveled (layout still the old one).
- [ ] **Step 7: Commit.**

```bash
git add assets/css/main.css layouts/_default/baseof.html tests
git commit -m "feat(skin): CDE tokens, bevel primitives, contrast and parity tests"
```

### Task 2: Shell — front panel, status bar, window-bar partial, toggle

**Files:**
- Modify: `layouts/_default/baseof.html` (header, footer)
- Create: `layouts/partials/window-bar.html`
- Modify: `static/js/theme.js`
- Modify: `assets/css/main.css` (`.site-header`, `.brand`, `.site-nav`, `.nav-mobile`, `.site-footer`, new `.win`, `.win-bar`, `.win-title`, `.win-body`, `.well`)
- Test: `tests/skin-markup.test.mjs` (create)

**Interfaces:**
- Consumes: `buildSite()`, `.out`/`.in`, tokens from Task 1.
- Produces: `partial "window-bar.html" (dict "id" string "title" string "tag" string)` — renders `<div class="win-bar">` with three decorative `aria-hidden` spans (`.k.menu`, `.k.min`, `.k.max`) and the title element: `<{tag} class="win-title" id="{id}">`. `tag` defaults to `"h2"`; `"p"` for non-heading bars. Callers wrap as `<section class="win out" aria-labelledby="{id}">` + bar + `<div class="win-body">`.
- Produces: toggle button `.theme-toggle` with visible text `Palette: <span class="pal-name">Default|Midnight</span>`, `aria-pressed="true"` in Midnight.

- [ ] **Step 1: Write the failing test.** `tests/skin-markup.test.mjs`, `test('shell: skip link, front panel, palette toggle, status bar')` on the built `/index.html`: skip link first in `<body>`; one `<header class="site-header">` containing the nav links from `nav-links.html`; one `.theme-toggle` with `aria-pressed="false"` and text containing `Palette:`; the footer has class `status-bar` and still contains the copyright text and "Buy me a coffee". Also `test('window-bar renders a labelled window')`: any `.win` found on any page has `aria-labelledby` pointing at an existing id (vacuous until Task 3; keep it).
- [ ] **Step 2: Run it.** Expected: FAIL (no `Palette:` text, no `status-bar`).
- [ ] **Step 3: Implement.** `window-bar.html` per Interfaces. `baseof.html`: header becomes the front panel (brand rendered as `kidpeterpan<i>:~$</i>`, nav links and toggle as bevel buttons, mobile `<details>` menu kept and restyled, coffee link kept); footer gets `status-bar` with the same content. `theme.js`: on toggle, also set `aria-pressed` and the `.pal-name` text; on load, sync them with the current `data-theme`. CSS: window primitives from the mockup (title bar grid `28px 1fr 28px 28px`, `--title` background, bold 15px title, `.win-title` with `min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap`; `.well` = `--paper` background inside a `.in` bevel).
- [ ] **Step 4: Run `npm test`.** Expected: all pass including parity (nav hrefs unchanged; footer is outside `<main>`).
- [ ] **Step 5: Commit** `feat(skin): front panel, status bar, window-bar partial, palette toggle`.

### Task 3: Homepage — xterm hero, product windows, mini-apps file manager

**Files:**
- Modify: `layouts/index.html`
- Modify: `assets/css/main.css` (`.home-hero`, `.product-rows`, `.product-row*`, `.eyebrow`, `.route*`, `.shot` inside windows, `.mini-apps`, `.mini-app-list`, `.about-line`)
- Test: `tests/skin-markup.test.mjs`

**Interfaces:**
- Consumes: `window-bar.html`, `.win/.well`, `partial "route.html"`, `partial "shot.html"` unchanged.
- Produces: homepage structure `main > .win.term-win` (hero; bar via `tag "p"`, title `xterm — kidpeterpan@home`; the existing `<h1>` text stays the only h1, inside `.term`), then one `.win.product-row` per product (bar title `{{ .Title }} — {{ .Params.eyebrow }}`, id `win-{{ .File.ContentBaseName }}`), then `.win.mini-apps` (title `Mini apps — File Manager`).

- [ ] **Step 1: Failing test** `test('home: one h1 in the terminal, a window per product, screenshots kept')`: exactly one `<h1>`, inside `.term`; the hero's first line is `kidpeterpan@home:~$ cat README`; the count of `.product-row` windows equals the count of `layout = "project"` pages (3); each contains a `.route`, a `.btn` link and a `<picture>` or `<img>`; the first screenshot keeps `fetchpriority="high"`; a `.mini-apps` window exists. Also `test('dark twins survive')`: `/open-mtp-client/` HTML contains both `shot-light` and `shot-dark`, and CSS contains the `.shot-light`/`.shot-dark` swap rules.
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement** per Interfaces. Screenshot sits in an inset `.in` frame (drop the rounded shadow). Route becomes the mockup's cable: two `.node.out` ends and a dashed `.route-cable` with square plugs, kept as the existing `route.html` markup restyled. Cursor in the hero is a CSS-only element; `animation: blink 1.1s steps(1) infinite` only under `prefers-reduced-motion: no-preference`. Keep the `reveal` classes. Rows keep the alternating copy/shot order at ≥900px and collapse to one column below.
- [ ] **Step 4: `npm test`** all pass; `$HUGO --minify` zero warnings.
- [ ] **Step 5: Visual check** at 1100px and 390px, both palettes, against the mockup screenshots in `~/.hermes/cache/scratch/mock-cde/`. Fix what looks off.
- [ ] **Step 6: Commit** `feat(skin): homepage as CDE desktop`.

### Task 4: Product pages

**Files:**
- Modify: `layouts/_default/project.html`
- Modify: `assets/css/main.css` (`.product-hero*`, `.app-mark`, `.notice`, `.product-body`, `.prose`, `.get`, `.steps`, `.requirements`, `.faq`, `.support`, `.facts`, `.back-link`)
- Test: `tests/skin-markup.test.mjs`

**Interfaces:**
- Consumes: Task 2 primitives. Produces windows with ids `win-hero`, `win-readme`, `win-get`, `win-faq` on every project page.

- [ ] **Step 1: Failing test** `test('product pages: windows, one h1, faq and notice preserved')` for the three product pages: one `<h1>`; `.win` ids above exist; number of `<details>` equals the number of `faq` entries in the page's front matter (read with a small regex over `content/<name>/index.md`); an `<aside class="notice">` exists iff front matter has `[notice]`/`notice =`.
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement.** Hero → window titled `{{ .Title }} — {{ $product.eyebrow }}`; `.notice` → a Motif dialog look (bevel, heavier border; keeps its `<h2>`); prose body → window `README` with `--paper` background and *no* bevel inside the reading column (keep `.prose` typography and measure); steps → window `Install {{ .Title }}`; FAQ `summary` rows styled as a tree list with a `+`/`–` marker drawn in CSS (still `<details>`); support line → status bar. `.shot` figures inside prose use the inset frame.
- [ ] **Step 4: `npm test` + zero-warning build.**
- [ ] **Step 5: Visual check** each product page, 390px and 1100px, both palettes; confirm captions, the dark twin swap, and the long `chiaki-ngx` title.
- [ ] **Step 6: Commit** `feat(skin): product pages as windows`.

### Task 5: Mini apps, `/apps/`, 404, generic fallbacks

**Files:**
- Modify: `layouts/apps/single.html`, `layouts/apps/list.html`, `layouts/404.html`, `layouts/_default/single.html`, `layouts/_default/list.html`
- Modify: `assets/css/main.css` (lines ~930–1483: `.app-*`, `.rate-*`, `.bank-select`, `.model-*`, tables; plus `.back-link`, `.article-head`, `.list-head`, `.section-head`, `.not-found`)
- Test: `tests/skin-markup.test.mjs`

**Interfaces:**
- Consumes: Task 2 primitives. `#app-root` and its ids/classes are untouched (the JS renders into them).

- [ ] **Step 1: Failing test** `test('apps and 404 are windows; app roots intact')`: `/apps/mortgage/` and `/apps/opencode-go/` contain `.win` wrapping `#app-root`; `/apps/mortgage/` has an element with `lang="th"`; `/apps/` has one `.win` per app; `/404.html` has a `.win` and keeps `noindex`.
- [ ] **Step 2: Run; expect FAIL.**
- [ ] **Step 3: Implement.** Wrap `.app-shell` in a window (`{{ .Title }}`), app list as a file-manager window (icon tile + title + description per app), 404 as an "Error" window. In the app CSS: inputs/selects as `.in` fields on `--paper` with 44px min height, buttons as bevel buttons, tables with `--sh` hairlines and a bevel header row, `overflow-x:auto` wrappers kept. Do not rename or remove any selector the app JS creates.
- [ ] **Step 4: Thai check.** With Playwright (Python, `~/.hermes/cache/scratch/mock-cde/shot.py` is the pattern), load `/apps/mortgage/` and assert `getComputedStyle(document.querySelector('[lang="th"]')).fontFamily` contains `IBM Plex Sans Thai`, for an `input` inside it as well. Screenshot both themes.
- [ ] **Step 5: `npm test` (mini-app core tests must still pass) + zero-warning build.**
- [ ] **Step 6: Commit** `feat(skin): mini apps, app list, 404 as windows`.

### Task 6: Hardening, docs, final verification

**Files:**
- Modify: `assets/css/main.css` (forced-colors, `prefers-contrast`, stipple fallback, overflow guards)
- Modify: `CLAUDE.md` ("Look" paragraph and the `design/` note), `README.md` (one line)

- [ ] **Step 1: Sweep script** (outside the repo, in `~/.hermes/cache/scratch/mock-cde/sweep.py`): for widths 320, 390, 768, 1280 × both themes × pages `/`, `/open-mtp-client/`, `/inkbound/`, `/chiaki-ngx/`, `/apps/`, `/apps/mortgage/`, `/apps/opencode-go/`, `/404.html`: serve the production build (`python3 -m http.server`), assert `document.documentElement.scrollWidth <= innerWidth` and no console errors; also run once with `forced_colors='active'` and `reduced_motion='reduce'` and screenshot the home page. Expected: zero failures.
- [ ] **Step 2: Fix what it finds** (long title bars, tables, nav wrapping). Add `@media (prefers-contrast: more)` that drops the stipple to a flat `--desk-a`.
- [ ] **Step 3: Keyboard pass.** Tab through home and one product page; every interactive element shows the 3px focus ring and the order is logical.
- [ ] **Step 4: Update `CLAUDE.md`** "Look" bullets to describe the CDE skin: palette names, window/title-bar structure, `window-bar.html`, the xterm hero, that the route cable is still the signature element, and the build-environment note (Hugo ≥0.170 needs Node ≥22). Update the `design/` note only if it is now inaccurate. Add one line to `README.md`.
- [ ] **Step 5: Final verification.** `npm test` all pass; `$HUGO --minify -d /tmp/kpp-final` zero warnings; sweep script zero failures; `git status` clean except intended files; `git log --oneline origin/main..HEAD` shows one commit per task plus the docs commit.
- [ ] **Step 6: Commit** `docs: describe the CDE skin in CLAUDE.md` and stop. Do not push.
