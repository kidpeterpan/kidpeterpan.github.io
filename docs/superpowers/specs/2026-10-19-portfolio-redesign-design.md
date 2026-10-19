# Portfolio redesign: kidpeterpan.github.io

Date: 2026-10-19 · Branch: `portfolio-redesign`

## Intent

Turn the site from a Thai learning blog into a small English portfolio of the
owner's apps. The visitors are people who have the problem an app solves. They
come from Google or a shared link. The page should show them, in simple
English, that the app fixes their problem, then show exactly how to get it.

Featured products:

- **open-mtp-client**: free Mac app for copying files between a Mac and an
  Android phone, and it tells you why the phone won't connect.
  Repo: https://github.com/kidpeterpan/open-mtp-client (v0.1.0, `.dmg` on Releases).
- **Inkbound**: Obsidian plugin that exports notes as EPUB books for e-ink
  readers, with an optional Wi-Fi push to an Onyx Boox.
  Repo: https://github.com/kidpeterpan/inkbound (v1.15.1, listed in Obsidian
  Community plugins as `inkbound`).

## Goals

1. Homepage: a short pitch, plus one large card per product (screenshot, one-line
   problem/solution, primary button), plus a small "Mini apps" strip.
2. One page per product at `/open-mtp-client/` and `/inkbound/`. Each covers:
   the problem, what the app does, screenshots, how to get it step by step,
   requirements, a short FAQ, and links to GitHub and to buy-me-a-coffee.
3. Good SEO for each product page, so it can rank for the problem people
   search for, not only for the app name.
4. A new clean product-page look (the owner picked this over the current theme)
   with light and dark mode.

## Non-goals

- No blog, articles, courses, search, or RSS.
- No new screenshots to start with. Use the ones already in the two repos.
- No redirects for deleted URLs. The owner accepted that old links will 404.

## Anti-goals (it fails even if it builds)

- The mini apps (`/apps/mortgage/`, `/apps/opencode-go/`) look broken, move to a
  new URL, or stop working.
- A visitor downloads open-mtp-client, gets the macOS "can't check for
  malware" warning without having been told about it, and gives up.
- The product pages turn into copies of the READMEs. The Inkbound README is
  about 600 lines. Its page should be about a tenth of that and link to the
  README for the rest.
- Hotlinked images from `raw.githubusercontent.com`.
- Anything reaches `main` before the owner has seen it. A push to `main`
  deploys to the live site.

## Decided by the owner

- Delete all articles and course content. Keep the two mini apps.
- Content is in simple English.
- Look: "clean app page". A light background, large type, big screenshots, a
  clear Download/Install button, and dark mode.

  ```
  ┌─ kidpeterpan ───────────── Apps  GitHub ─┐
  │   Small apps that fix                     │
  │   annoying problems.                      │
  │  ┌──────────────────┐ ┌─────────────────┐ │
  │  │ [ screenshot ]   │ │ [ screenshot ]  │ │
  │  │ open-mtp-client  │ │ Inkbound        │ │
  │  │ Android ↔ Mac    │ │ Obsidian → e-ink│ │
  │  │ [Download]       │ │ [Install]       │ │
  │  └──────────────────┘ └─────────────────┘ │
  │  Mini apps: Mortgage · OpenCode Go        │
  └───────────────────────────────────────────┘
  ```

## Calls made by Claude (owner can override)

### Delete

- `content/{article,book,cheat_sheet,go,git,tools}`. The herdr page under
  `tools/` is notes about someone else's tool, so it counts as an article.
- `static/images/{herdr,hidden_potential,jetbrains-context,sections}`.
- `layouts/partials/{ordered-pages,episode-nav,share,search,mermaid-scripts}.html`,
  `layouts/shortcodes/mermaid.html`. Keep `layouts/_default/_markup/render-table.html`,
  because the mortgage page has a table.
- `static/js/{hero-cat,filter,share,search}.js` (`filter.js` is loaded only by
  the current homepage) and `static/images/logo.png` (also only used there).
- `data-pagefind-body` in `layouts/apps/single.html`.
- Pagefind: the search UI, the `npx pagefind` step in
  `.github/workflows/deploy.yml`, and the `pagefind` devDependency.
- RSS: set `[outputs] home = ['html']` (keep sitemap) and drop the footer RSS
  link and the `alternate` tag.
- Leave alone: `specs/`, `.claude/launch.json`, `https_kidpeterpan.github.io.zip`,
  `design/mha-redesign/`. They aren't part of this change.

### Keep, and keep working

- `content/apps/*`, `data/*.yaml`, `assets/js/apps/*`, `layouts/apps/*`,
  `layouts/partials/app-{data,script}.html`, `tests/*.test.mjs`.
- `static/js/theme.js` with the `data-theme` attribute and the `mha-theme`
  localStorage key (keeping the key keeps visitors' saved choice). `theme.js`
  hides `.reveal` elements until the page loads (`anim-pre`), so the new CSS
  must keep that working, or both the class and the JS must be removed
  together.
- `static/js/external-links.js` and Google Analytics `G-LT3TCEMESB`.
- `layouts/partials/og-image.html`, `assets/images/og-base.png`, and
  `assets/fonts/IBMPlexSansThai-Bold.ttf`. These still generate share cards for
  the homepage and mini apps. Restyling `og-base.png` to the new look is
  optional.
- The mini apps get their styles from classes in `assets/css/main.css`. Before
  rewriting the CSS, collect every class that `layouts/apps/*.html` and
  `assets/js/apps/*.js` emit, including classes built in JS template strings
  and `classList` calls. Restyle each one in the new look. At least these:
  `app-*`, `rate-*`, `schedule-*`, `model-*`, `sort-btn`, `bank-select`,
  `preset-edit`, `opt`, `label`, `prose`, `wrap`, `back-link`, `kicker`,
  `article-head`, `article-rule`, `list-head`, `list-body`, `section-head`,
  `card-foot`, `reveal`, `d1`.
- `content/apps/mortgage.md` is Thai. The font stack must still render Thai
  well, so keep IBM Plex Sans Thai (or another Thai face) as a fallback.

### Structure

- Product pages are root-level leaf bundles: `content/open-mtp-client/index.md`
  and `content/inkbound/index.md`, using `layout = 'project'`, which renders
  through a new `layouts/_default/project.html`. Screenshots sit next to
  `index.md` as page resources, so Hugo can make resized WebP versions with
  width and height set (no layout shift). They don't go in `/apps/`, because
  `layouts/apps/single.html` expects an `#app-root` and app JS.
- Navigation is written by hand in `baseof.html` (open-mtp-client, Inkbound,
  Mini apps, GitHub, theme toggle, coffee), not `range site.Sections`. A site
  of about 5 pages doesn't need generated nav, and leaf bundles aren't
  sections anyway.
- Product facts that change with each release go in front matter, not prose:
  `version`, `download_url`, `repo_url`, `os`, `category`, `license`. Then a
  release is a one-line edit.

### Screenshots (copied into the repo)

- open-mtp-client: `docs/screenshots/main-light.png` and `main-dark.png`
  (1280×994), plus `assets/icon-1024.png`. Swap light and dark with the site's
  `data-theme`. Keep the README's caption "Shown with a virtual phone and
  sample files."
- Inkbound: tell it as 3 steps in pictures: `note-in-obsidian.png` → `export-menu.png`
  → `boox-library.jpg` + `boox-reading.jpg` (the last two are tall phone
  photos, 1050×1400). `settings.png` is optional.
- Source: the `HEAD` branch of each repo, under the paths above.

### Calls to action

- open-mtp-client: the primary button goes to
  `https://github.com/kidpeterpan/open-mtp-client/releases/latest`, the page
  and not a file, because the `.dmg` file name has the version in it. Directly
  under the button, explain the first-launch warning in the README's plain
  words. On macOS 15 or later: System Settings → Privacy & Security → Open
  Anyway. On macOS 14 or earlier: right-click the app → Open → Open. Say it is
  needed once, and why (the app isn't notarized yet). Also show "Requires
  macOS 11+, Apple Silicon or Intel" and a link to build from source.
- Inkbound: the primary button goes to `https://obsidian.md/plugins?id=inkbound`,
  plus the 3 steps (Settings → Community plugins → Browse → search "Inkbound"
  → Install → Enable). Also "Requires Obsidian 1.5+, works on desktop and
  mobile". The manual install from Releases is a secondary link.

### Copy

- Simple English, short sentences, in the owner's voice. The open-mtp-client
  README's "Why" bullets are already right, so reuse them almost word for word.
- Facts come only from the two READMEs and `manifest.json`. No invented
  claims, user counts, or device support. For Inkbound, say "any e-reader that
  opens EPUB" and name Boox for the Wi-Fi push.

### SEO

- `hugo.toml`: `defaultContentLanguage = 'en'`, `locale = 'en-US'`, an English
  `title`/`siteTitleFull`/`description` that describe a portfolio of apps.
  `<html lang>`, `og:locale`, and JSON-LD `inLanguage` all follow from this.
  On the Thai mortgage page, put `lang="th"` on its content wrapper.
- Product `<title>` and `description` lead with the problem people search for,
  for example "open-mtp-client: Android File Transfer for Mac that tells you
  why it won't connect" and "Inkbound: export Obsidian notes to EPUB for your
  e-reader". One `h1` per page and a sensible `h2` outline.
- `seo.html`: product pages emit JSON-LD `SoftwareApplication` (`name`,
  `description`, `operatingSystem`, `applicationCategory`, `softwareVersion`,
  `downloadUrl`/`installUrl`, `screenshot`, `offers` price 0, `license`,
  `author`) and `og:type=website`. The homepage emits `WebSite` plus `Person`
  (`sameAs` GitHub). Pages no longer emit `BlogPosting`.
- Each product page's OG/Twitter image is its real screenshot. The current
  `seo.html` runs `absURL` on a bare `images` value, which for a leaf-bundle
  file points at the site root. Resolve it with `.Resources.Get` (page
  resource) and fall back to the current behavior. The generated card stays for the homepage and mini
  apps.
- Every `<img>` has descriptive alt text, width and height, and
  `loading="lazy"` except the hero image. Keep canonical tags, `sitemap.xml`,
  and `robots.txt`.
- Add a simple `404.html` that links home and to both products, since old
  blog URLs will 404.

### Look

- Replace the MHA "Plus Ultra Paper" theme (halftone, speedlines, Anton
  display font, the homepage cat) with a clean product style. Use color tokens
  on `[data-theme]` for light and dark, and keep using Tailwind v4 through Hugo
  Pipes.
- The exact palette, type scale, and component details are up to the builder.
  Use the `frontend-design` skill for the visual direction.
- It must work at phone width (360px) with no horizontal scroll.

### Docs

- Update `README.md` (it still describes the blog and Pagefind).
- Update `CLAUDE.md`: remove the "Content structure" and "Ordered course
  sections" descriptions of deleted things, describe the product pages, the
  front matter fields, and the mini apps, and remove Pagefind from Commands.

## Done when

- `hugo --minify` builds with no warnings or errors.
- `find public -name index.html` lists only the home page, `/open-mtp-client/`,
  `/inkbound/`, `/apps/`, `/apps/mortgage/`, `/apps/opencode-go/` (plus
  `404.html`, `sitemap.xml`, `robots.txt`, and anything Hugo generates for
  taxonomies, which should be disabled if unused).
- `npm test` passes without changing the tests.
- In a browser, `/apps/mortgage/` and `/apps/opencode-go/` look right and work
  as before, in light and dark.
- On `/open-mtp-client/`, switching dark mode swaps the screenshot.
- Product pages emit valid `SoftwareApplication` JSON-LD with no errors in the
  Schema Markup Validator (paste the built HTML before merging). Google's star
  rich result also needs `aggregateRating` or `review`. We have neither, and we
  won't invent them, so not getting that rich result for now is expected
  (Claude's call). `<title>`, the meta description, and OG tags are correct in
  the built HTML.
- The work is on branch `portfolio-redesign`. The owner reviews it locally
  before anything merges to `main`.

## Left to the builder

- Visual design details (palette, type, spacing, cards, buttons).
- Exact copy wording, within the facts and voice rules above.
- Whether to add a short FAQ per product, and its questions. Use only answers
  that are in the READMEs.
- Whether to keep `layouts/_default/single.html`/`list.html` as fallbacks or
  slim them down.
