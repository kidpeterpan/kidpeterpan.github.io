# Implementation Plan: Portfolio Redesign

**Branch**: `portfolio-redesign` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-portfolio-redesign/spec.md`. The
owner-approved design is `docs/superpowers/specs/2026-10-19-portfolio-redesign-design.md`.

## Summary

Turn kidpeterpan.github.io from a Thai learning blog into an English portfolio
of two products, open-mtp-client and Inkbound, and keep the two mini apps.

- **Removal**: delete every article and course section, and remove search,
  RSS, and tags.
- **Product pages**: each product gets a root-level Hugo leaf bundle (`/open-mtp-client/`,
  `/inkbound/`). The page is rendered by a new `project` layout from
  structured front matter plus a short Markdown body.
- **Screenshots**: copied from the repos and served as WebP with a fallback
  through an image render hook. Theme twins switch with the site toggle.
- **Look**: a clean product-page style replaces the MHA theme.
  - Mini-app CSS is kept and mapped onto the new tokens through aliases, so
    the apps keep working unchanged.
- **SEO**: English site language, problem-led titles,
  `SoftwareApplication`/`WebSite`+`Person` JSON-LD, and screenshot OG images.
  A `noindex` 404 page catches retired URLs.

## Technical Context

**Language/Version**: Hugo extended v0.164.0 (local; CI uses `latest` extended).
Go templates, plain CSS through Hugo Pipes `css.TailwindCSS` (Tailwind v4, no utility
classes used), vanilla JS.

**Primary Dependencies**:
- Existing only: Hugo, `@tailwindcss/cli`/`tailwindcss`, and Google Fonts
  (now IBM Plex Sans Thai + IBM Plex Mono only).
- `pagefind` is **removed**.

**Storage**: N/A. Content is TOML front matter, Markdown, and page-bundle images.

**Testing**:
- The existing `npm test` (Node test runner on `tests/*.test.mjs` for the
  mini-app cores) as a regression gate.
- Shell checks against `public/` and manual browser checks (Constitution V),
  as listed in `quickstart.md`.

**Target Platform**: Static site on GitHub Pages, evergreen browsers, desktop
plus mobile (from 360px wide).

**Project Type**: Static website (Hugo).

**Performance Goals**:
- No web font is loaded for the first screen of Latin pages.
- Hero image is WebP at ≤ 1600 px with intrinsic size, so CLS ≈ 0.
- Images below the first screen load lazily.

**Constraints**:
- Mini-app URLs and behavior must not change.
- No HTML in Markdown.
- No new dependencies.
- Pages work with JS off (apart from the theme toggle).
- Nothing merges to `main` (which deploys) before the owner reviews.

**Scale/Scope**: 6 HTML pages plus a 404, 2 products, and about 9 images.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v2.0.0 (amended in this plan, see below):

| Principle | Status | Notes |
|---|---|---|
| I. Simplicity First | ✅ Pass | No new tooling. One new layout, one render hook, one 404 template. The site gets net smaller (search, RSS, tags, courses, episode nav, and share removed). |
| II. Design System Consistency | ✅ Pass (after amendment) | v1.0.0 bound all UI to "Plus Ultra Paper". The owner explicitly chose a new look (design doc, 2026-10-19), so II was redefined to "use the current token set in `main.css`" → **v2.0.0 (MAJOR)**, written into `.specify/memory/constitution.md` with a Sync Impact Report. The new UI uses one token set, in both themes. |
| III. Minimal, Justified Dependencies | ✅ Pass | Removes `pagefind`. Adds nothing. Google Fonts usage shrinks. |
| IV. Content-Facing Accessibility | ✅ Pass (by design) | Real `<button>`/`<a>` with names. FAQ uses native `<details>`. Visible focus ring token. Theme twins are not color-only signals. Checked in quickstart §6. |
| V. Manual Verification | ✅ Planned | quickstart §6 covers a browser pass in both themes at 2 widths, plus `hugo --minify` and `npm test`. |
| Tech constraints (content/presentation split, no inline `<style>`, no HTML in Markdown) | ✅ Pass | Structured fields go in front matter. Images use Markdown syntax plus a render hook. All CSS is in `main.css`. |

**Post-design re-check (after Phase 1)**: still passes. `data-model.md` and the
contracts add no dependency, keep all styling in `main.css`, and keep content as
Markdown/TOML.

## Project Structure

### Documentation (this feature)

```text
specs/006-portfolio-redesign/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R11
├── data-model.md        # Phase 1: front-matter schema for Product / Screenshot / Mini app / site config
├── quickstart.md        # Phase 1: validation commands and manual checks
├── contracts/
│   ├── site-urls.md         # URL inventory and page anatomy
│   └── structured-data.md   # <head> metadata and JSON-LD per page kind
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks), not created here
```

### Source Code (repository root)

```text
hugo.toml                          # MODIFY: en/en-US, disableKinds, English params, github/coffee params
package.json, package-lock.json    # MODIFY: drop pagefind
.github/workflows/deploy.yml       # MODIFY: drop Pagefind step
README.md, CLAUDE.md               # MODIFY: describe the new structure
.specify/memory/constitution.md    # MODIFIED in this plan → v2.0.0

content/
├── _index.md                      # MODIFY: English title/description for home
├── open-mtp-client/               # NEW leaf bundle
│   ├── index.md
│   ├── main.png, main-dark.png, icon.png
├── inkbound/                      # NEW leaf bundle
│   ├── index.md
│   ├── note-in-obsidian.png, export-menu.png, boox-library.jpg, boox-reading.jpg, settings.png
├── apps/                          # KEEP (mortgage.md gains params.content_lang = 'th'; _index.md English description)
└── article/ book/ cheat_sheet/ go/ git/ tools/   # DELETE

layouts/
├── _default/
│   ├── baseof.html                # REWRITE: new header/footer, hand-written nav, no search/RSS/to-top/mermaid
│   ├── project.html               # NEW: product page
│   ├── single.html, list.html     # SLIM: generic fallbacks in the new look (no TOC/share/episode nav)
│   └── _markup/
│       ├── render-table.html      # KEEP (mortgage table)
│       └── render-image.html      # NEW: page-resource → <figure><picture> with WebP and theme twin
├── partials/
│   ├── seo.html                   # REWRITE per contracts/structured-data.md
│   ├── shot.html                  # NEW: shared figure/picture builder (used by hook, hero, home cards)
│   ├── css.html, og-image.html, app-data.html, app-script.html   # KEEP
│   └── ordered-pages, episode-nav, share, search, mermaid-scripts .html   # DELETE
├── shortcodes/mermaid.html        # DELETE
├── apps/list.html, single.html    # MODIFY: new-look markup hooks, content_lang, drop data-pagefind-body
├── index.html                     # REWRITE: portfolio homepage
├── 404.html                       # NEW
└── robots.txt                     # KEEP

assets/css/main.css                # REWRITE: new tokens + base/header/footer/home/product/prose/404;
                                   #   keep the mini-app block, re-pointed via legacy token aliases
assets/{fonts,images/og-base.png}  # KEEP (OG card generator)
assets/js/apps/*                   # KEEP untouched

static/js/theme.js                 # MODIFY: drop scroll-to-top block, keep toggle and anim-pre
static/js/{hero-cat,filter,share,search}.js   # DELETE
static/js/external-links.js        # KEEP
static/images/{herdr,hidden_potential,jetbrains-context,sections,logo.png}   # DELETE

data/*.yaml, tests/*.test.mjs      # KEEP untouched
```

**Structure Decision**: This is a single Hugo site. Products are root leaf
bundles with a shared `project` layout. One `shot.html` partial is the only
place that builds `<picture>` markup, and the render hook, hero, and homepage
cards all call it.

## Implementation notes for /speckit-tasks

- **Order**:
  1. Config and deletions (the site still builds)
  2. New CSS tokens and shell
  3. `shot.html` and the render hook
  4. The `project` layout and the two bundles (US1/US2)
  5. The homepage (US3)
  6. Mini-app restyle check (US4)
  7. `seo.html` (US5)
  8. 404 (US6)
  9. Docs
  10. Quickstart pass
- **Copy**: write it from the READMEs only. Reuse omc's "Why" bullets almost
  verbatim. Inkbound's page is about 1/10 of its README and links to it.
- **Visual direction**: use the `frontend-design` skill when writing the
  token set and components. It is a clean light product page with one accent
  color, large type, and large screenshots, plus a matching dark mode.
- **Commits**: one per completed phase on `portfolio-redesign`. Never push to
  `main`.

## Complexity Tracking

No unjustified violations. The only gate issue (Principle II) was resolved by
an owner-approved constitution amendment (v2.0.0), not by a waiver.
