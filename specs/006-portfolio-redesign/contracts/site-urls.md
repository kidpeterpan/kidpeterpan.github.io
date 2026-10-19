# Contract: Published URLs and page anatomy

The site's external interface is its set of URLs and what each one shows.
Anything not listed here must not be published.

## URL inventory (the complete set in `public/`)

| URL | Kind | Source | Status |
|---|---|---|---|
| `/` | home | `layouts/index.html` | rewritten |
| `/open-mtp-client/` | page (leaf bundle, layout `project`) | `content/open-mtp-client/index.md` | new |
| `/inkbound/` | page (leaf bundle, layout `project`) | `content/inkbound/index.md` | new |
| `/apps/` | section | `content/apps/_index.md`, `layouts/apps/list.html` | kept, restyled |
| `/apps/mortgage/` | page | `content/apps/mortgage.md`, `layouts/apps/single.html` | kept, **same URL**, restyled |
| `/apps/opencode-go/` | page | `content/apps/opencode-go.md`, `layouts/apps/single.html` | kept, **same URL**, restyled |
| `/404.html` | 404 | `layouts/404.html` | new, `noindex` |
| `/sitemap.xml` | sitemap | Hugo built-in | kept. Lists only the 6 HTML pages above. |
| `/robots.txt` | robots | `layouts/robots.txt` | kept |
| `/favicon.svg`, `/js/theme.js`, `/js/external-links.js` | static | `static/` | kept |

**Must 404 after this change:** every URL under `/article/`, `/book/`,
`/cheat_sheet/`, `/go/`, `/git/`, `/tools/`, `/tags/`, plus `/index.xml`,
`/pagefind/`, `/images/sections/`, `/images/herdr/`, `/images/hidden_potential/`,
`/images/jetbrains-context/`, `/images/logo.png`.

Check: `find public -name '*.html' | sort` must equal exactly
`public/404.html`, `public/index.html`, `public/apps/index.html`,
`public/apps/mortgage/index.html`, `public/apps/opencode-go/index.html`,
`public/open-mtp-client/index.html`, `public/inkbound/index.html`.

## Shared shell (every page, `baseof.html`)

- `<html lang="en" data-theme="light">`. The inline head script applies the
  saved `mha-theme` before first paint.
- **Header**:
  - the brand linking to `/`
  - nav: `open-mtp-client` → `/open-mtp-client/`, `Inkbound` → `/inkbound/`,
    `Mini apps` → `/apps/`, `GitHub` → `site.Params.github`
  - the theme toggle (`button`, `aria-label`)
  - the coffee link (`aria-label`)
  - On a narrow viewport, the nav collapses into a `<details>` menu.
- **Footer**: the same destinations, plus "© year kidpeterpan" and a coffee link.
- Never links to a removed URL.

## Product page anatomy (`layouts/_default/project.html`)

In order. Each block is driven by the data-model field named.

1. **Hero** `<section>`:
   - `eyebrow`
   - `<h1>{{ title }}</h1>` (the page's only h1)
   - `tagline`
   - a primary button (`cta`) and a GitHub link (`repo_url`)
   - the route line (`route_from` ── `route_to`)
  - a facts list (`<dl>`): Price Free · License · Version · Needs (first requirement)
   - the hero `<figure>` (`hero_image`, light/dark twin, `hero_caption`)
2. **Notice** (only if `notice`): a callout placed directly under the CTA
   (before the hero figure on narrow screens), titled e.g. "First time you open
   it", with steps for macOS 15+ and macOS ≤ 14.
3. **Body** (`.Content`): `##` sections with figures through the render-image hook.
4. **Get it** `<section id="get">`:
   - the `<h2>`
   - `steps` as an `<ol>`
   - `requirements` as a list
   - the primary button again
   - `cta_secondary`
5. **FAQ** (only if `faq`): `<h2>` + `<details><summary>q</summary>a</details>` ×n.
   It works without JS.
6. **Support strip**: "It's free. If it saved you time, you can buy me a coffee."
   with links to the repo and to the coffee page.

## Homepage anatomy (`layouts/index.html`)

1. Hero: an `<h1>` pitch (e.g. "Small apps that fix annoying problems.") and
   one supporting sentence.
2. Product cards: one `<article>` per `project` page in `order`. Each has:
   - the hero image (theme-twinned)
   - `eyebrow` and the title (`<h2>`)
   - `card_pitch`
   - a primary CTA and a "Learn more" link to the page
3. Mini apps: a compact list from `/apps/` (icon, title, description) linking
   to each mini app.
4. A short about line with a GitHub link.

## 404 anatomy (`layouts/404.html`)

An `<h1>` ("Page not found"), one sentence saying the old blog posts were
retired, and links to `/`, `/open-mtp-client/`, and `/inkbound/`.

## Image output (render hook + hero partial)

For a bundle resource `x.png`, with or without `x-dark.png`:

```html
<figure class="shot">
  <picture class="shot-light">
    <source type="image/webp" srcset="…x_hu….webp" >
    <img src="…x.png" width="W" height="H" alt="…" loading="lazy" decoding="async">
  </picture>
  <!-- only when x-dark.png exists -->
  <picture class="shot-dark"> … </picture>
  <figcaption>…</figcaption>   <!-- only when a caption exists -->
</figure>
```

- `html[data-theme="dark"] .shot-light { display:none }` and
  `html:not([data-theme="dark"]) .shot-dark { display:none }`.
- On the hero image, `loading="lazy"` is replaced by `fetchpriority="high"`.
- A `src` that is not a page resource renders as a plain `<img>` with its alt.
