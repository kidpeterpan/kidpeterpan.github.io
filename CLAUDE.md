# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Hugo static site (personal blog at kidpeterpan.github.io), styled with Tailwind CSS v4. Theme name in the CSS/design files is "Plus Ultra Paper" — an MHA (My Hero Academia)-inspired palette (deku green / cape gold / sky blue / utility red), warm paper background, halftone/speedline textures, light+dark mode via a `data-theme` attribute toggled by `static/js/theme.js` and persisted in `localStorage` under `mha-theme`.

## Commands

- `make start` — run the Hugo dev server in the background on port 1313 (backgrounded via `nohup`, PID tracked in `.hugo-server.pid`, logs in `hugo-server.log`)
- `make stop` — kill the backgrounded dev server
- `make restart` — stop then start
- `hugo server` — run the dev server in the foreground directly, if you don't want the backgrounded/PID-tracked version
- `hugo --minify` — production build (what CI runs), outputs to `public/`
- `npx pagefind --site public` — build the search index from `public/` (run after `hugo --minify`; CI runs this too). Produces `public/pagefind/` with the search UI assets
- `npm ci` — install Tailwind dependencies (`@tailwindcss/cli`, `tailwindcss`, `@tailwindcss/typography`) and Pagefind (`pagefind` 1.5.2, build-time search indexer)

No test suite or linter is configured. There is one GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds with Hugo and deploys `public/` to GitHub Pages on every push to `main`.

## Architecture

**Content vs. presentation split**: `content/` holds only Markdown/TOML front matter (no HTML). `layouts/` holds the Go templates that render it. `assets/css/main.css` is the single Tailwind source file, compiled through Hugo Pipes (`css.TailwindCSS`) in `layouts/partials/css.html` — fingerprinted and minified in production, unminified with a plain `<link>` in dev (`hugo.IsDevelopment`).

**Content structure**: each top-level directory under `content/` (`article/`, `book/`, `cheat_sheet/`) is a Hugo *section*, auto-listed in the site nav (`{{ range site.Sections }}` in `baseof.html`). Every section has an `_index.md` with TOML front matter setting `title`, `description`, and `params.kicker` (an uppercase label shown on section/article pages). New posts go under the relevant section directory using `hugo new <section>/<name>.md`, which fills in front matter from `archetypes/default.md` (`date`, `draft`, `title`, `tags`). Existing posts are a mix of Thai and English content — several are Thai translations of English source articles, with a `params.source` front-matter field linking back to the original.

**Templates**: `layouts/_default/baseof.html` is the shared shell (header/nav/theme-toggle/footer) with two blocks: `title` and `main`. `layouts/index.html` defines `main` for the homepage (hero + latest posts + section cards). `layouts/_default/single.html` renders individual pages (article header, prose body, auto table-of-contents sidebar via `.TableOfContents`). `layouts/_default/list.html` renders section index pages (post list only, no TOC). `layouts/partials/seo.html` centralizes meta tags, Open Graph, Twitter Card, and JSON-LD — driven by each page's `Description`/`Summary`/`site.Params.description`.

**Mermaid diagrams**: use the `{{< mermaid >}}...{{< /mermaid >}}` shortcode (`layouts/shortcodes/mermaid.html`) inside content, not raw fenced code blocks — it uses `<` shortcode delimiters so Hugo doesn't Markdown-wrap the diagram source. `layouts/partials/mermaid-scripts.html` is only included on pages where `.HasShortcode "mermaid"` is true.

**`design/mha-redesign/`**: a standalone static HTML/CSS/JS prototype (not part of the Hugo build) used as the design reference the current theme was ported from — `assets/css/main.css` explicitly notes it was "Ported from design/mha-redesign/mha.css". Treat it as a mockup to consult, not live site code.

**Node permission model note**: `hugo.toml` disables `security.node.permissions` because Hugo 0.161+ invokes Node with `--permission`, which requires Node ≥22; this is disabled to stay compatible with older Node (e.g. Node 20 via Homebrew on macOS).
