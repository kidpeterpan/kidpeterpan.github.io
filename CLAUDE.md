# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Hugo static site at kidpeterpan.github.io: an English portfolio of the owner's free, open source apps. It has:
- product pages for **open-mtp-client** (a Mac app for Android file transfer) and **Inkbound** (an Obsidian plugin that exports notes to EPUB for e-readers)
- two browser **mini apps** under `/apps/`: a Thai mortgage calculator and an OpenCode Go model comparison

The old Thai blog (articles, Go and Git courses, book notes) was removed in `specs/006-portfolio-redesign`. Its URLs now 404 on purpose.

**Look**: a clean product-page style.
- Colors: a cool light background, a "fountain-pen ink" blue accent (`#2340C8` light / `#8FA3FF` dark), and an ink-navy dark mode.
- Fonts: the system UI font, with IBM Plex Sans Thai for content marked `lang="th"`.
- The signature element is the dashed "route" cable (`route_from` → `route_to`) on product pages and homepage rows.
- Light and dark mode use a `data-theme` attribute, toggled by `static/js/theme.js` and saved in `localStorage` under `mha-theme`. The key name is kept from the old theme so returning visitors keep their choice.

## Commands

- `make start`: run the Hugo dev server in the background on port 1313. It uses `nohup`, tracks its PID in `.hugo-server.pid`, and logs to `hugo-server.log`. **It also renders into `public/`**, so while it runs, inspect production output with `hugo --minify -d <other dir>` instead of reading `public/`.
- `make stop`: kill the backgrounded dev server.
- `make restart`: stop, then start.
- `hugo server`: run the dev server in the foreground.
- `hugo --minify`: the production build (what CI runs). It writes to `public/` and must finish with zero warnings.
- `npm test`: Node's test runner over `tests/*.test.mjs`, which covers the mini apps' core logic (`assets/js/apps/*-core.js`).
- `npm ci`: install the Tailwind dependencies.

There is no linter. `.github/workflows/deploy.yml` builds with Hugo and deploys `public/` to GitHub Pages on every push to `main`, so a push to `main` is a live deploy.

## Architecture

**Content vs. presentation split**: `content/` holds only Markdown and TOML front matter, with no HTML. `layouts/` holds the Go templates.

`assets/css/main.css` is the single stylesheet. It is plain CSS compiled through Hugo Pipes (`css.TailwindCSS`) in `layouts/partials/css.html`: fingerprinted and minified in production, linked plainly in development. All colors and fonts are tokens on `:root` / `html[data-theme="dark"]`.

The mini-app rules at the end of the file still read the old token names (`--green`, `--red`, `--shadow-pop`, `--line-strong`, …). Those names are kept as aliases of the new tokens on purpose. Don't delete them.

**Product pages** are leaf bundles at the content root (`content/open-mtp-client/index.md`, `content/inkbound/index.md`) with `layout = 'project'`, rendered by `layouts/_default/project.html`.
- Structured facts live in front matter: `version`, `cta`, `cta_kind`, `repo_url`, `requirements`, `steps`, `notice`, `faq`, `route_from`/`route_to`, `hero_image`, `seo_title`, and so on. See `specs/006-portfolio-redesign/data-model.md`.
- Prose sections (`## The problem`, `## How it works`, …) live in the body.
- A release is a one-line edit to `version`. The buttons point at "latest" pages, never at version-named files.
- The homepage lists every `project` page by `params.order`. Leaf bundles are not sections, so the header nav is written by hand in `layouts/partials/nav-links.html`.

**Screenshots**: every image goes through `layouts/partials/shot.html` (via `shot-pictures.html` and `shot-picture.html`). These output `<picture>` with WebP plus a fallback, intrinsic `width`/`height`, and `loading="lazy"` (`fetchpriority="high"` for the hero).
- A sibling `<name>-dark.<ext>` is a dark-mode twin that CSS swaps in by `data-theme`.
- Body images are plain Markdown. `layouts/_default/_markup/render-image.html` routes them through `shot.html`.
- A standalone image becomes a `<figure>` (`wrapStandAloneImageWithinParagraph = false`). Images that share a paragraph become inline `<span class="shot">`, and `.prose p:has(> .shot + .shot)` lays them side by side.
- Never hotlink images. Copy them into the bundle.

**Mini apps**: `content/apps/*.md` use `layouts/apps/single.html`. It renders `#app-root`, injects `data/<app_data>.yaml` as JSON (`partials/app-data.html`), and loads `assets/js/apps/<app_js>` (`partials/app-script.html`). `params.content_lang = 'th'` marks the mortgage page as Thai. Keep the mini-app URLs stable.

**Templates**:
- `layouts/_default/baseof.html` is the shared shell: skip link, header nav, theme toggle, coffee link, footer.
- `<title>` comes from `partials/page-title.html`, which uses `seo_title` when it is set.
- `layouts/index.html` is the homepage: hero, one alternating row per product, the mini-app list.
- `layouts/404.html` is the not-found page. It is `noindex`.
- `single.html` and `list.html` are generic fallbacks.

**SEO**: `layouts/partials/seo.html` emits the meta, Open Graph and Twitter tags.
- `partials/social-image.html` picks the share image. A bundle image in `images` is cropped to 1200×630 as PNG/JPEG, never WebP, because some scrapers reject WebP. Otherwise it uses the generated card from `partials/og-image.html`.
- `partials/structured-data.html` emits JSON-LD by page kind: `SoftwareApplication` for products, `WebSite`+`Person` for the home page, `CollectionPage` for `/apps/`, and `WebPage` otherwise.
- There are no ratings or reviews, so don't add them. Taxonomies and RSS are disabled (`disableKinds` in `hugo.toml`).

**`design/mha-redesign/`**: a standalone static prototype of the *previous* "Plus Ultra Paper" theme. It is not part of the build and no longer matches the site.

**Node permission model note**: `hugo.toml` disables `security.node.permissions`. Hugo 0.161+ invokes Node with `--permission`, which requires Node ≥22, so this keeps older Node working (e.g. Node 20 via Homebrew on macOS).
