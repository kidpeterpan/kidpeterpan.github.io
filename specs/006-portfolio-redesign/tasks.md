---
description: "Task list for the portfolio redesign"
---

# Tasks: Portfolio Redesign

**Input**: Design documents from `specs/006-portfolio-redesign/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/site-urls.md,
contracts/structured-data.md, quickstart.md. The owner-approved design is
`docs/superpowers/specs/2026-10-19-portfolio-redesign-design.md`.

**Tests**: No new automated tests were requested. The existing `npm test` is a
regression gate for the mini apps. Each story ends with a verification task
that uses the shell and browser checks in `quickstart.md` (Constitution V).

**Organization**: Tasks are grouped by user story. Story phases follow spec priority:
US1, US2, and US4 (all P1), then US3 and US5 (P2), then US6 (P3).

**Ground rules for every task**:
- Work on branch `portfolio-redesign`. Never push to `main`.
- No HTML inside Markdown content and no inline `<style>`. All CSS goes in
  `assets/css/main.css`.
- Product copy may only state facts found in the product's README or
  `manifest.json` (FR-011).
- Screenshot source: `https://raw.githubusercontent.com/kidpeterpan/<repo>/HEAD/<path>`.
  Download it once into the bundle. Never hotlink.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US6 from spec.md)

---

## Phase 1: Setup (config and removals)

**Purpose**: Strip the blog down to a buildable skeleton and switch the site to English.

- [X] T001 Delete the removed content and images with `git rm -r`:
  - `content/article`, `content/book`, `content/cheat_sheet`, `content/go`,
    `content/git`, `content/tools`
  - `static/images/herdr`, `static/images/hidden_potential`,
    `static/images/jetbrains-context`, `static/images/sections`,
    `static/images/logo.png`
- [X] T002 [P] Delete the removed templates and scripts with `git rm`:
  - `layouts/partials/ordered-pages.html`, `layouts/partials/episode-nav.html`,
    `layouts/partials/share.html`, `layouts/partials/search.html`,
    `layouts/partials/mermaid-scripts.html`, `layouts/shortcodes/mermaid.html`
  - `static/js/hero-cat.js`, `static/js/filter.js`, `static/js/share.js`,
    `static/js/search.js`

  Keep `layouts/_default/_markup/render-table.html`.
- [X] T003 Update `hugo.toml` per data-model.md "Site config":
  - `defaultContentLanguage = 'en'`, `locale = 'en-US'`
  - add `disableKinds = ['taxonomy', 'term', 'rss']`
  - `params.siteTitleFull` = an English portfolio title, and `params.description`
    = an English description that names open-mtp-client and Inkbound
  - add `params.github = 'https://github.com/kidpeterpan'` and
    `params.coffee = 'https://buymeacoffee.com/kidpeterpan'`
  - keep `googleAnalytics`, the markup settings, the security block, and the
    cachebusters
- [X] T004 [P] Remove Pagefind:
  - delete the "Index with Pagefind" step from `.github/workflows/deploy.yml`
  - remove `pagefind` from `devDependencies` in `package.json`
  - run `npm install` to refresh `package-lock.json`
  - do not touch `yarn.lock`
- [X] T005 [P] Set English front matter in `content/_index.md` (title `Home`,
  plus an English `description`) and in `content/apps/_index.md` (an English
  `description`, `kicker = 'MINI APPS'`). Add `content_lang = 'th'` under
  `[params]` in `content/apps/mortgage.md`. Do not change anything else in the
  mini-app content files.
- [X] T006 Temporarily stub out the deleted partials so the build passes:
  - In `layouts/_default/baseof.html`, remove the calls to `search.html`,
    `mermaid-scripts.html`, `search.js`, the search toggle button, and the RSS
    footer link.
  - In `layouts/_default/single.html`, remove the calls to `share.html` and
    `episode-nav.html`.
  - In `layouts/_default/list.html`, remove the `ordered-pages.html` usage.
  - In `layouts/index.html`, remove the `filter.js`/`hero-cat.js`/`logo.png`
    references.
  - In `layouts/apps/single.html`, remove the `data-pagefind-body` attribute.

  Then run `hugo --minify`. It must build with zero errors (warnings about
  missing styles are fine for now). Commit as
  "chore: remove blog content, search and RSS".

**Checkpoint**: The site builds. `find public -name '*.html'` shows only home,
`/apps/` and its 2 apps, and `404.html` if Hugo makes one.

---

## Phase 2: Foundational (design system, shell, image pipeline, product layout)

**Purpose**: The look and the shared building blocks every story uses.
⚠️ Must be done before any story phase.

- [X] T007 Load the `frontend-design` skill. Use it to settle the visual direction:
  - a clean, light product page with one accent color, large type, and large
    screenshots, plus a matching dark mode
  - the system UI font stack with an `IBM Plex Sans Thai` fallback, and a
    `ui-monospace` stack (research R5)

  Write the decisions (palette hex values for light and dark, type scale,
  radius, shadow, spacing) as a short comment at the top of
  `assets/css/main.css`.
- [X] T008 Rewrite the top of `assets/css/main.css`, everything **before** the
  `/* ---------- apps section (mini apps hub + shells) ---------- */` block:
  - New tokens on `:root` and `html[data-theme="dark"]`: `--bg`, `--surface`,
    `--surface-2`, `--ink`, `--muted`, `--faint`, `--line`, `--accent`,
    `--accent-ink`, `--focus`, `--shadow`, `--radius`, and `--font-body`,
    `--font-display`, `--font-mono`.
  - **Legacy aliases** the apps block reads (research R6): `--green`, `--surface`,
    `--line-strong`, `--muted`, `--faint`, `--ink`, `--line`, `--accent`, `--bg`,
    `--red`, `--shadow-pop`, `--font-mono`, `--font-display`, each pointed at a
    new token.
  - Base element styles.
  - Header and nav, including the `<details>` mobile menu below 900px.
  - The theme toggle, coffee link, and footer.
  - Buttons: `.btn` (primary), `.btn-ghost`.
  - Layout: `.wrap` with max-width and a 16px side gutter.
  - Shared classes used by the apps: `back-link`, `arr`, `kicker`,
    `article-head`, `article-rule`, `list-head`, `list-body`, `section-head`,
    `rule`, `count`, `desc`, `card-foot`, `arrow`.
  - `.prose` typography.
  - The `.reveal`/`.d1`–`.d3` fade-up under `html.anim-pre`. It must stay
    visible when JS is off.
  - A visible `:focus-visible` ring.

  Delete every halftone, speedline, hero-cat, filter-bar, TOC, share, episode-nav,
  and search/pagefind rule. Keep the apps block and everything after it,
  unchanged for now.
- [X] T009 Rewrite `layouts/_default/baseof.html` per contracts/site-urls.md "Shared shell":
  - Keep the inline `mha-theme` head script, `seo.html`, `css.html`, and GA.
  - The Google Fonts link loads only `IBM Plex Sans Thai:wght@400;600;700` and
    `IBM Plex Mono:wght@400;500`.
  - Hand-write the nav (open-mtp-client, Inkbound, Mini apps, GitHub from
    `site.Params.github`) in both the desktop nav and the `<details class="nav-mobile">`.
  - Theme toggle `<button class="theme-toggle" aria-label="Toggle dark mode">`.
  - Coffee link from `site.Params.coffee` with an `aria-label`.
  - Footer with the same links and "© {{ now.Year }} kidpeterpan".
  - Scripts: only `theme.js` and `external-links.js`.
  - Remove `.top-stripe`, `.halftone`, and the `.to-top` link.
  - `<title>`: use `.Params.seo_title` when set, otherwise the existing logic.
- [X] T010 [P] Edit `static/js/theme.js`: delete the scroll-to-top block. Keep the
  toggle, the `mha-theme` key, and the `anim-pre` → `is-loaded` handoff.
- [X] T011 Create `layouts/partials/shot.html`, the single place that builds
  screenshot markup (contracts/site-urls.md "Image output"):
  - **Input**: a dict with `page`, `src` (resource name), `alt`, `caption`
    (optional), `width` (target px, default 1200), and `hero` (bool).
  - **When `src` is a page resource**:
    - Resize it with `.Process (printf "resize %dx webp" width)`, or keep it
      as-is when it is already narrower.
    - Emit `<figure class="shot">` containing `<picture class="shot-light">`,
      with a WebP `<source>` and an `<img>` fallback that has `width`/`height`,
      `alt`, and `decoding="async"`.
    - Use `loading="lazy"`, or `fetchpriority="high"` when `hero`.
    - If a sibling `<base>-dark.<ext>` resource exists, add a second
      `<picture class="shot-dark">` built the same way.
    - Add a `<figcaption>` when there is a caption.
  - **When `src` is not a resource**: emit a plain `<img src alt loading="lazy">`.
  - Add CSS in `assets/css/main.css`: `.shot` (rounded, border, shadow,
    max-width 100%, height auto), `html[data-theme="dark"] .shot-light{display:none}`,
    and `html:not([data-theme="dark"]) .shot-dark{display:none}`.
- [X] T012 Create `layouts/_default/_markup/render-image.html`. It calls `shot.html`
  with `page=.Page`, `src=.Destination`, `alt=.Text`, `caption=.Title`, and
  `width=1200`. It must render as a block figure. Add a `.prose figure` rule so a
  figure inside a paragraph doesn't break the layout. If Hugo wraps it in `<p>`,
  set `[markup.goldmark.parser] wrapStandAloneImageWithinParagraph = false` in
  `hugo.toml`.
- [X] T013 Create `layouts/_default/project.html` per contracts/site-urls.md
  "Product page anatomy":
  - **Hero**: `eyebrow`, `<h1>`, `tagline`, `.btn` primary (`cta`), a GitHub
    `.btn-ghost` (`repo_url`), and the meta line
    `Free · Open source (license) · v{{version}} · {{index requirements 0}}`.
  - **Notice**: when present, `notice.title` plus `notice.body | markdownify`
    in an `<aside class="notice">`, placed directly after the buttons.
  - **Hero figure**: `shot.html` with `hero=true` and `width=1600`, with
    `hero_alt` and `hero_caption`.
  - **Body**: `.Content` in `.prose`.
  - **"Get it"** in `<section id="get">`:
    - an `<ol>` of `steps | markdownify`
    - a requirements list
    - the primary `.btn` again
    - `cta_secondary` as a link
  - **FAQ**: when present, `<details><summary>{{q}}</summary>{{a | markdownify}}</details>`.
  - **Support strip**: coffee and repo links.
  - Add the CSS for `.product-hero`, `.notice`, `.meta-line`, `.get`, `.faq`,
    and `.support` to `assets/css/main.css`. Layout: two columns (copy |
    screenshot) at ≥ 960px, stacked below that. No horizontal scroll at 360px.

**Checkpoint**: `hugo --minify` builds. The shell renders in the new look in both
themes. Commit as "feat: new design system, shell, screenshot pipeline and
product layout".

---

## Phase 3: User Story 1 - Mac user installs open-mtp-client (Priority: P1) 🎯 MVP

**Goal**: `/open-mtp-client/` converts a visitor with the Android-on-Mac problem.

**Independent Test**: Open `/open-mtp-client/` alone. You can say what it does,
Download goes to `…/releases/latest` in 1 click, the first-launch steps for
macOS 15+ and macOS ≤ 14 are right under the button, and the screenshot swaps
with the theme.

- [X] T014 [P] [US1] Create the bundle `content/open-mtp-client/` and download
  the images into it:
  - `docs/screenshots/main-light.png` → `main.png`
  - `docs/screenshots/main-dark.png` → `main-dark.png`
  - `assets/icon-1024.png` → `icon.png`

  All come from the `kidpeterpan/open-mtp-client` repo.
- [X] T015 [US1] Write `content/open-mtp-client/index.md` with the TOML front
  matter from data-model.md:
  - **Release facts**:
    - `layout='project'`, `order=1`, `version='0.1.0'`
    - `repo_url='https://github.com/kidpeterpan/open-mtp-client'`
    - `license='MIT'`, `os='macOS 11 or later'`, `category='UtilitiesApplication'`
    - `images=['main.png']`
  - **Download**:
    - `cta={label='Download for Mac', url='https://github.com/kidpeterpan/open-mtp-client/releases/latest'}`
    - `cta_secondary` = "Build from source", linking to the README#build-from-source
  - **Requirements**: "macOS 11 or later", "Apple Silicon or Intel", "An
    Android phone and a USB data cable".
  - **Wording**:
    - `seo_title` ≤ 65 chars, problem-led, e.g. "Android File Transfer for
      Mac that works | open-mtp-client"
    - `description` ≤ 160 chars, problem-led
    - `eyebrow='Free Mac app'`
    - `tagline` from the README's first line
    - `card_pitch` ≤ 90 chars
  - **Hero image**: `hero_image='main.png'` and `hero_alt`. The
    `hero_caption` is "Shown with a virtual phone and sample files."
  - `notice`: title "The first time you open it". The body uses the README's
    wording about the app not being notarized yet (Apple charges a yearly fee),
    then:
    - **macOS 15 or later**: System Settings → Privacy & Security → Open Anyway
    - **macOS 14 or earlier**: right-click the app → Open → Open
    - "You only do this once."
  - `steps`: download the `.dmg`, drag to Applications, open the app, then
    connect the phone: data cable, unlock, choose **File transfer** in the USB
    notification, quit Android File Transfer.
  - `faq`, 3–5 items, answered only from the README. Candidates:
    - Why doesn't my phone show up?
    - Is it safe? (no telemetry, no network code, open source)
    - Does it cost anything?
    - Can I use it from the terminal? (`open-mtp-client-cli`)
  - **Body**:
    - `## The problem`: the README's 5 "Why" bullets, almost word for word.
    - `## What it does`: about 6–8 short bullets grouped from the README
      features table (only ✅ items).
      - Groups: connect and explain failures, free the phone from other apps,
        resume copies, check every file, two-pane browsing with thumbnails,
        import new photos by date.
      - Optionally one `![…](main-dark.png "…")` is fine, but don't repeat the
        hero.
- [X] T016 [US1] Verify US1: run `hugo server` and open `/open-mtp-client/` at
  desktop and 360px in light and dark. Check every acceptance scenario of US1
  in spec.md. Run `grep -rn '0\.1\.0' content/open-mtp-client` and expect
  exactly 1 line. Fix anything that fails, then commit as
  "feat: open-mtp-client product page".

**Checkpoint**: US1 is fully usable on its own (MVP).

---

## Phase 4: User Story 2 - Obsidian user installs Inkbound (Priority: P1)

**Goal**: `/inkbound/` shows the note → export → e-reader journey and gets the
visitor to install it.

**Independent Test**: Open `/inkbound/` alone. Install goes to
`obsidian.md/plugins?id=inkbound`, the 3-step picture story renders, the
portrait Boox photos are undistorted, and the README link works.

- [X] T017 [P] [US2] Create the bundle `content/inkbound/` and download these
  files from `kidpeterpan/inkbound` `docs/images/`: `note-in-obsidian.png`,
  `export-menu.png`, `boox-library.jpg`, `boox-reading.jpg`, `settings.png`.
- [X] T018 [US2] Write `content/inkbound/index.md` with the front matter from
  data-model.md:
  - **Release facts**:
    - `layout='project'`, `order=2`, `version='1.15.1'`
    - `repo_url='https://github.com/kidpeterpan/inkbound'`
    - `license='MIT'`, `os='Windows, macOS, Linux, iOS, Android (Obsidian 1.5 or newer)'`
    - `category='ProductivityApplication'`
    - `images=['note-in-obsidian.png']`
  - **Install**:
    - `cta={label='Install in Obsidian', url='https://obsidian.md/plugins?id=inkbound'}`
    - `cta_secondary` = "Install manually", linking to `…/inkbound/releases/latest`
  - **Requirements**: "Obsidian 1.5.0 or newer", "Desktop and mobile".
  - **Wording**:
    - `seo_title` ≤ 65 chars, e.g. "Export Obsidian Notes to EPUB for Your
      E-Reader | Inkbound"
    - `description` ≤ 160 chars
    - `eyebrow='Obsidian plugin'`
    - `tagline` from the README's first paragraph
    - `card_pitch` ≤ 90 chars
  - **Hero image**: `hero_image='note-in-obsidian.png'` with `hero_alt`.
  - `steps`: Settings → Community plugins → Browse → search **Inkbound** →
    Install → Enable.
  - `faq`, 3–5 items from the README. Candidates:
    - Which e-readers? (any that opens EPUB; Wi-Fi push is for Onyx Boox via BooxDrop)
    - Does Thai/other languages work? (any language; Thai font embedded automatically)
    - Does it work on my phone?
    - What does it access? (vault, one output file, network only for cover URLs/push)
  - **Body**:
    - `## How it works`, as three numbered steps with images:
      1. a note in Obsidian (`note-in-obsidian.png`)
      2. right-click → export (`export-menu.png`)
      3. the book lands on your Boox (`boox-library.jpg` and `boox-reading.jpg`)
    - `## What you get`, about 6–8 short bullets:
      - three export modes
      - covers
      - a table of contents that jumps to sections
      - images shrunk for e-ink
      - Mermaid and math as pictures
      - footnotes
      - Thai font embedded
      - an export report
    - A final line linking to the full README for settings and front-matter
      fields.
- [X] T019 [US2] Add CSS in `assets/css/main.css` so the two portrait Boox photos sit side by
  side at ≥ 640px and stack below that, with no stretching or cropping (e.g. a
  `.prose p:has(> figure + figure)` two-column grid, or a sibling selector).
  This must use only CSS, with no HTML in the Markdown.
- [X] T020 [US2] Verify US2: run `hugo server` and open `/inkbound/` at both widths
  and in both themes. Check every acceptance scenario of US2. Run
  `grep -rn '1\.15\.1' content/inkbound` and expect exactly 1 line. Fix
  anything that fails, then commit as "feat: Inkbound product page".

**Checkpoint**: US1 and US2 both work on their own.

---

## Phase 5: User Story 4 - Existing mini apps keep working (Priority: P1)

**Goal**: `/apps/`, `/apps/mortgage/`, and `/apps/opencode-go/` work as before,
at the same URLs, in the new look.

**Independent Test**: Use the mortgage form (rate rows, extra payment, presets,
schedule) and sort the OpenCode Go table, in both themes and at both widths.
`npm test` passes.

- [X] T021 [US4] Update `layouts/apps/single.html` and `layouts/apps/list.html`:
  - Keep the structure and class names that the app JS and the CSS expect.
  - In `single.html`, add `lang="{{ . }}"` from `.Params.content_lang` on the
    `<article class="app-shell">`.
  - Make the back link and kicker match the new shell.
- [X] T022 [US4] Restyle in place inside the apps block of
  `assets/css/main.css`, from the "apps section" comment to the end of the
  file:
  - Replace old-look leftovers: hard offset `--shadow-pop` shadows, the
    uppercase display font on labels and headings, and thick
    `--line-strong` borders. Use the new tokens instead.
  - Keep every selector and every state rule: locked preset, rate rows, sort
    buttons, and the narrow-width result-card rule near the end of the file.
  - Do not edit `assets/js/apps/*` or `data/*`.
- [X] T023 [US4] Verify US4:
  - Run `npm test` and expect all tests to pass.
  - Run `git diff main --stat -- assets/js/apps data tests` and expect empty
    output.
  - In the browser, exercise both apps per quickstart §6 in both themes at
    desktop and 360px. Thai text on `/apps/mortgage/` must render in IBM Plex
    Sans Thai.

  Fix anything that fails, then commit as "style: mini apps on the new design
  system".

---

## Phase 6: User Story 3 - Homepage routes visitors (Priority: P2)

**Goal**: `/` pitches the collection, shows the two product cards, and links
the mini apps.

**Independent Test**: From `/` alone, you can reach both product pages, both
get-it destinations, and both mini apps.

- [X] T024 [US3] Rewrite `layouts/index.html` per contracts/site-urls.md "Homepage anatomy":
  - **Hero**: `<h1>` "Small apps that fix annoying problems." plus one
    sentence.
  - **Product cards**: range over
    `sort (where site.RegularPages "Layout" "project") "Params.order"`. Each card
    has:
    - the card image (`shot.html` with the page's `hero_image`, `width=1200`;
      the first card's image is not lazy)
    - the eyebrow and an `<h2>` title linking to the page
    - `card_pitch`
    - the `cta` `.btn` and a "Learn more →" link
  - **Mini apps**: list `(site.GetPage "/apps").RegularPages` sorted by
    `Params.order`, showing the icon, title, and description.
  - **About line**: a short about line with a GitHub link.
- [X] T025 [US3] Add the homepage CSS to `assets/css/main.css`: `.home-hero`,
  `.product-cards` (2 columns ≥ 900px, 1 below), `.product-card`, and
  `.mini-apps`. Cards use the tokens and the theme-twinned shots.
- [X] T026 [US3] Verify US3: run `hugo server`, open `/` at both widths and in
  both themes, and click every link. Commit as "feat: portfolio homepage".

---

## Phase 7: User Story 5 - Search engines and link previews (Priority: P2)

**Goal**: Each product page is understood as a free software application, has
a problem-led title, and previews with its own screenshot.

**Independent Test**: Run the quickstart §4 greps on the built HTML, and the
Schema Markup Validator shows 0 errors on both product pages.

- [X] T027 [US5] Rewrite `layouts/partials/seo.html` per contracts/structured-data.md:
  - **Title and description**: `$title` = `.Params.seo_title`, otherwise the
    existing logic. Description ≤ 160 chars.
  - **OG image resolution order**:
    1. `.Params.images[0]` as a page resource → `.Fill "1200x630 top"` in its
       source format, with width and height
    2. an absolute or relative URL
    3. the `og-image.html` card
  - **Tags removed**: the RSS alternate link, all `article:*` meta, and
    `BlogPosting`.
  - `og:type=website` everywhere, and `og:locale` from `en-US` → `en_US`.
  - **JSON-LD**:
    - `layout = project` → `SoftwareApplication` with `downloadUrl` for
      open-mtp-client and `installUrl` otherwise (pick by a `cta_kind`
      front-matter value or by slug, and document the choice in data-model.md
      if a field is added).
      - `screenshot` = the absolute hero image URL(s)
      - `offers` price 0 USD, `isAccessibleForFree`
      - `license` = `{{repo_url}}/blob/main/LICENSE`
      - `author` = Person kidpeterpan with the GitHub URL
      - `sameAs` = the repo
    - Home → `@graph` of `WebSite` and `Person` (`sameAs` GitHub).
    - `/apps/` → `CollectionPage`.
    - Other pages → `WebPage` with `inLanguage` from `content_lang`, otherwise
      `en-US`.
  - **404**: when `.Kind == "404"`, emit `<meta name="robots" content="noindex">`.
- [X] T028 [US5] Verify US5:
  - Run `hugo --minify`, then the quickstart §4 commands.
  - `<title>` must be ≤ 65 chars on both product pages.
  - Paste each built product page into https://validator.schema.org and expect
    0 errors. If `codeRepository` or another property is flagged, remove it.
  - Commit as "feat: SEO metadata and SoftwareApplication structured data".

---

## Phase 8: User Story 6 - Old links land somewhere useful (Priority: P3)

**Goal**: Unknown URLs show a friendly 404 with links to home and both products.

**Independent Test**: In `hugo server`, open `/go/01-setting-up-your-go-environment/`
and see the site's 404 page with 3 working links.

- [X] T029 [US6] Create `layouts/404.html`:
  - Define `main` with `<h1>Page not found</h1>`.
  - One sentence saying the old blog posts were retired.
  - Links to `/`, `/open-mtp-client/`, and `/inkbound/`.
  - Add the `.not-found` CSS to `assets/css/main.css`.
- [X] T030 [US6] Verify US6: run `hugo server`, open the deleted Go URL, and
  check that `public/404.html` contains `noindex` after a build. Commit as
  "feat: 404 page".

---

## Phase 9: Polish and cross-cutting

- [X] T031 [P] Slim `layouts/_default/single.html` and `layouts/_default/list.html`
  down to generic fallbacks in the new look: an `article-head` and `.prose` for
  single pages, a title plus a page list for list pages. No TOC, share, or
  episode navigation.
- [X] T032 [P] Update `README.md` to describe the new site:
  - what it is (a portfolio of apps plus mini apps)
  - how to add or update a product (bundle and front-matter fields;
    bump `params.version` on release)
  - commands: `make start`, `hugo --minify`, `npm test`

  Remove the Pagefind instructions and blog wording.
- [X] T033 [P] Update `CLAUDE.md`:
  - Replace the theme description (MHA "Plus Ultra Paper") with the new design
    system and its tokens, including the legacy aliases kept for the mini apps.
  - Replace "Content structure" and "Ordered course sections" with product leaf
    bundles (layout `project`, front-matter fields, `shot.html` and
    `render-image.html`, the `-dark` twin convention) and the mini apps.
  - Remove Pagefind from Commands and the Mermaid section.
  - Keep the Node permission note and `design/mha-redesign/`, described as the
    old theme's mockup.
- [X] T034 Delete CSS that nothing uses any more from `assets/css/main.css`.
  Grep each top-level class selector against `layouts/` and `assets/js/apps/`,
  and remove the selectors that don't match.
- [X] T035 Run the full `quickstart.md`:
  - **Build and output checks**:
    - §1 clean build with no warnings
    - §2 the exact page inventory and no references to removed paths
    - §3 `npm test`
    - §4 metadata
    - §5 one-edit releases
  - **Manual pass (§6)**:
    - every page, both themes, desktop and 360px
    - keyboard tabbing through the header
    - reload in dark mode with no flash
    - JS off
    - the `/does-not-exist/` 404

  Record anything that fails, fix it, and repeat until everything passes.
- [X] T036 Final commit on `portfolio-redesign`, then report to the owner:
  - what changed
  - the local preview command
  - the follow-ups: run the Rich Results Test after deploy, `yarn.lock` is
    stale, and there is no star rating without reviews

  Do **not** merge or push to `main`. Merging is the owner's call.

---

## Dependencies and execution order

### Phase dependencies

- **Setup (Phase 1)**: none. T006 depends on T001–T005.
- **Foundational (Phase 2)**: depends on Setup. It is in order: T007 → T008 →
  T009 (T010 in parallel) → T011 → T012 → T013. It blocks every story.
- **US1 (Phase 3)** and **US2 (Phase 4)**: depend only on Foundational, and are
  independent of each other.
- **US4 (Phase 5)**: depends only on Foundational, specifically T008's legacy
  aliases.
- **US3 (Phase 6)**: depends on Foundational. Its cards need at least one
  product bundle (US1 and/or US2) to show anything.
- **US5 (Phase 7)**: depends on Foundational. Checking it needs US1 and US2
  done.
- **US6 (Phase 8)**: depends only on Foundational (T009 shell).
- **Polish (Phase 9)**: after all the stories you want shipped.

### Within each story

Bundle images (T014/T017) → front matter and copy (T015/T018) → story CSS →
verify → commit.

### Parallel opportunities

- Setup: T002, T004, and T005 can run alongside T001 (different files).
- Foundational: T010 alongside T009.
- After Foundational: US1 (T014–T016), US2 (T017–T020), US4 (T021–T023), and
  US6 (T029–T030) touch separate content files and templates. The only file
  they share is `assets/css/main.css`, so serialize the CSS edits or give each
  story its own commented block.
- Polish: T031, T032, and T033 run in parallel.

### Parallel example: after Phase 2

```text
Task: "T014 [US1] Create bundle content/open-mtp-client/ and download images"
Task: "T017 [US2] Create bundle content/inkbound/ and download images"
Task: "T021 [US4] Update layouts/apps/single.html and list.html"
Task: "T029 [US6] Create layouts/404.html"
```

---

## Implementation strategy

### MVP first

1. Phase 1: Setup → the site builds without the blog.
2. Phase 2: Foundational → the new look and the product layout.
3. Phase 3: US1 → the open-mtp-client page. **Stop and validate.** This alone
   is a useful portfolio page.

### Incremental delivery

1. Add US2 (Inkbound) → validate.
2. Add US4 (mini-app restyle) → validate. Ship nothing to `main` before this,
   since the live mini apps must not regress.
3. Add US3 (home) → US5 (SEO) → US6 (404) → Polish → the full quickstart pass.
4. Hand off to the owner for local review. The owner merges to `main`, which
   deploys.

---

## Notes

- Commit after each phase checkpoint, and only on `portfolio-redesign`.
- `assets/css/main.css` is the most shared file. Keep each story's rules in a
  commented block (`/* ---------- product page ---------- */` etc.) to avoid
  edit collisions.
- If a step needs a fact that is not in the README or manifest, leave it out
  instead of guessing (FR-011).
