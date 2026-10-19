# Research: Portfolio Redesign

Phase 0 output for `specs/006-portfolio-redesign/plan.md`. Every decision below was
checked against this repo, Hugo v0.164.0+extended, or a throwaway Hugo site in the
session scratchpad.

## R1. Where the product pages live

- **Decision**: Product pages are root-level **leaf bundles**,
  `content/open-mtp-client/index.md` and `content/inkbound/index.md`, with
  `layout = 'project'` rendered by `layouts/_default/project.html`.
- **Rationale**: A scratch build gave these results:
  - A root leaf bundle renders at `/foo/` with `.Kind = page`,
    `.BundleType = leaf`, and `.Section = ""`.
  - It does **not** appear in `site.Sections` (only `Apps` did).
  - Its images are reachable with `.Resources.Get`, which lets Hugo resize and
    convert them.

  This gives the URLs the spec requires (`/open-mtp-client/`, `/inkbound/`).
  It also keeps the images next to the copy that uses them.
- **Alternatives considered**:
  - `content/apps/<name>.md`: the URL would be `/apps/<name>/`, and
    `layouts/apps/single.html` would wrap it in a mini-app shell
    (`#app-root`, app JS). Rejected.
  - A `content/projects/` section: the URL would be `/projects/<name>/`, which
    is a longer URL with a weaker keyword. Rejected.
  - Images under `static/`: no resizing, WebP, or intrinsic sizes. That breaks
    FR-023. Rejected.

## R2. Images: format, sizes, light/dark twins

- **Decision**:
  - Copy the repo images into each bundle.
  - Render them through `<picture>`: a WebP `<source>` (Hugo `.Process "resize Wx webp"`)
    plus the original PNG/JPEG as the `<img>` fallback, with `width`/`height` set
    from the processed image.
  - Use `loading="lazy"` for every image except each page's hero, which gets
    `fetchpriority="high"`.
  - A dark twin is a sibling resource named `<base>-dark.<ext>`. When one
    exists, render two `<picture>`s with classes `shot-light` and `shot-dark`,
    and show one by `[data-theme]` in CSS.
- **Rationale**:
  - The scratch build confirmed WebP encoding works in this Hugo build
    (`shot.png` → 800×621 `.webp`).
  - Switching by CSS follows the site's own toggle, which `<picture media="(prefers-color-scheme)">`
    cannot do.
  - With scripts off, the light image shows by default.
- **Alternatives considered**:
  - Hotlinking `raw.githubusercontent.com`: forbidden by the design.
  - `prefers-color-scheme` `<source>`: ignores the site's manual toggle.

## R3. How copy and images are authored (no HTML in Markdown)

- **Decision**:
  - Fixed, repeated structure goes in front matter: hero, CTA, requirements,
    install steps, FAQ, schema facts.
  - Free prose goes in the Markdown body under `##` headings: "The problem",
    "What it does", and Inkbound's "How it works".
  - Body images use plain Markdown `![alt](file.png "caption")`.
  - A new `layouts/_default/_markup/render-image.html` hook turns a page
    resource into the `<picture>` from R2, with the title as a `<figcaption>`.
- **Rationale**:
  - The constitution forbids HTML in Markdown, and this approach needs none.
  - Each release edit is one front-matter value (FR-012).
  - The hook is Hugo-native, so no shortcode is needed.
  - Pages with no images, such as the mini apps, are unaffected. A non-resource
    `src` falls back to a plain `<img>`.
- **Alternatives considered**:
  - All content in front matter: prose becomes awkward to write.
  - Shortcodes for images: extra syntax that Markdown already covers.

## R4. Removing search, RSS, tags

- **Decision**: In `hugo.toml`, set `disableKinds = ['taxonomy', 'term', 'rss']`.
  Then delete:
  - the search UI partial and JS,
  - the Pagefind CI step,
  - `pagefind` from `package.json` (and refresh `package-lock.json`),
  - the RSS `<link rel=alternate>` and the footer link.
- **Rationale**:
  - In the scratch build, `disableKinds` removed `/tags/` pages and `index.xml`
    and kept `sitemap.xml`.
  - The mini apps still have `tags = [...]` in front matter. With taxonomies
    disabled, those are ignored and no tag pages are generated.
- **Note**: `yarn.lock` also lists Pagefind. CI uses `npm ci`, so `yarn.lock` is
  not part of the build. Leave it untouched (out of scope) and mention it to
  the owner.

## R5. Visual system and fonts

- **Decision**:
  - Use a new token set on `:root` / `html[data-theme="dark"]` in a rewritten
    `assets/css/main.css`.
  - **Body/display font**: the system UI stack (`-apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "IBM Plex Sans Thai", sans-serif`).
  - **Mono font**: `ui-monospace, "SF Mono", "IBM Plex Mono", monospace`.
  - Google Fonts loads only `IBM Plex Sans Thai` and `IBM Plex Mono`. Anton is
    dropped.
  - The palette, type scale, and components are chosen in implementation
    through the `frontend-design` skill. The tokens must cover: bg, surface,
    surface-2, ink, muted, faint, line, accent, accent-ink, focus ring, shadow.
- **Rationale**:
  - The system font looks native for a Mac app's page.
  - The first screen loads no web font.
  - The Thai fallback keeps `/apps/mortgage/` readable (spec edge case).
- **Alternatives considered**: Inter or Geist from Google Fonts. These add a
  font download for little gain and read as "template default".

## R6. Keeping the mini apps styled

- **Decision**:
  - Keep the mini-app CSS block (current `main.css` lines ~1588–2157,
    "apps section" through the end) nearly verbatim.
  - The new stylesheet defines the **legacy token names** that block reads
    (`--green`, `--surface`, `--line-strong`, `--muted`, `--faint`, `--ink`,
    `--line`, `--accent`, `--bg`, `--red`, `--shadow-pop`, `--font-mono`,
    `--font-display`) as aliases of the new tokens.
  - Restyle in place only where the old look leaks: hard offset shadows,
    uppercase display font, and comic borders.
  - Shared classes the apps rely on (`wrap`, `back-link`, `kicker`,
    `article-head`, `article-rule`, `list-head`, `list-body`, `section-head`,
    `rule`, `count`, `desc`, `prose`, `reveal`, `d1`, `card-foot`, `arrow`,
    `arr`) get new definitions in the new base.
- **Rationale**:
  - Counting `var(--…)` in that block found 13 legacy tokens. Aliasing them is
    the smallest change that keeps every app control styled (FR-005), and it
    avoids rewriting about 570 lines of tuned form and table CSS.
  - The class list comes from grepping `layouts/apps/*.html` and
    `assets/js/apps/*.js`.
- **Alternatives considered**: Rewriting the app CSS from scratch. High risk of
  regressions in tuned states (locked presets, narrow-width result cards), for
  no gain to the user.

## R7. Load-reveal animation (`theme.js`)

- **Decision**:
  - Keep `theme.js` and its `anim-pre` → `is-loaded` handoff and the `.reveal`
    and `.d1–.d3` classes, with a simpler fade-up in the new CSS.
  - Drop the scroll-to-top button (pages are short). Its JS block goes, along
    with the `.to-top` element.
  - Keep the `mha-theme` storage key.
- **Rationale**:
  - The mini-app templates use `.reveal`.
  - Keeping the key preserves returning visitors' choice (spec edge case).
  - The `<head>` inline snippet already applies the theme before first paint.
- **Constraint**: `.reveal` must end visible even if JS never runs. Under
  `html:not(.anim-pre)` the elements are visible by default.

## R8. SEO mechanics

- **Decision**:
  - **`hugo.toml`**:
    - `defaultContentLanguage = 'en'`, `locale = 'en-US'`.
    - English `title`, `params.siteTitleFull`, and `params.description`.
    - Add `params.github = 'https://github.com/kidpeterpan'` and
      `params.coffee = 'https://buymeacoffee.com/kidpeterpan'`.
  - **`<title>`**: product pages use `params.seo_title` when set, else
    `Title · site.Title`. Keep it ≤ 65 characters and lead with the problem.
  - **`seo.html`**:
    - `layout = project` → `SoftwareApplication` JSON-LD (shape in
      `contracts/structured-data.md`) and `og:type = website`.
    - Home → `WebSite` + `Person` (`@graph`).
    - Other pages → `WebPage` (mini apps) or `CollectionPage` (`/apps/`).
    - `BlogPosting` is removed. `article:*` meta is removed.
  - **OG image**:
    - If `params.images[0]` names a page resource, `.Fill "1200x630 top"` it to
      PNG/JPEG (not WebP, because some scrapers reject WebP) and emit it with
      its width and height.
    - Otherwise use the absolute URL as today.
    - Otherwise fall back to the generated `og-image.html` card.
  - Mortgage page: `params.content_lang = 'th'` → `lang="th"` on its content
    wrapper in `layouts/apps/single.html`.
- **Rationale**:
  - Google's SoftwareApplication rich result also needs `aggregateRating`/`review`.
    We have neither, and FR-011 forbids inventing them. Valid JSON-LD still
    helps understanding (accepted in the spec's Assumptions).
  - A 1.91:1 crop from the top keeps the app's title bar and first rows visible.
- **Alternatives considered**: An FAQPage schema. Google limited FAQ rich
  results to authoritative gov/health sites in 2023, so it adds no benefit.
  The FAQ stays as page content only.

## R9. 404 page

- **Decision**: `layouts/404.html` defines `main` in `baseof.html`. It has a short
  message and links to `/`, `/open-mtp-client/`, and `/inkbound/`.
- **Rationale**:
  - Hugo builds `public/404.html`, which the scratch build confirmed, and
    GitHub Pages serves it for unknown paths.
  - It needs `noindex`. `seo.html` emits `<meta name="robots" content="noindex">`
    when `.Kind == "404"`.

## R10. Homepage product cards

- **Decision**:
  - The homepage lists `where site.RegularPages "Layout" "project"`, sorted by
    `params.order`.
  - Each card uses that page's `hero_image` resource, `card_pitch`, and primary
    CTA.
  - Mini apps are listed from `site.GetPage "/apps"`.
- **Rationale**:
  - Product facts are written once and pulled from there (FR-012).
  - A third product later is one new bundle, with no template edit.

## R11. Verification approach

- **Decision**:
  - Constitution V: manual browser checks, plus the existing `npm test`
    (mortgage and opencode-go core logic).
  - Shell checks on `public/`: page inventory, `<title>`/meta/OG/JSON-LD greps,
    no references to removed paths.
  - Validate the JSON-LD by pasting built HTML into the Schema Markup Validator
    (validator.schema.org).
  - No new test tooling.
- **Rationale**: Principle I/III. A static site of 7 pages doesn't justify a test
  framework. The commands are listed in `quickstart.md`.
