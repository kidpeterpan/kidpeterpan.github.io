# Data Model: Portfolio Redesign

The site has no database. Its "data" is Hugo content front matter (TOML) and
page-bundle images. This file defines the fields each entity carries, the
rules they must satisfy, and where each field is used.

## Product (page bundle `content/<slug>/index.md`)

Two instances: `open-mtp-client` and `inkbound`.

| Field | Type | Required | Rule | Used by |
|---|---|---|---|---|
| `title` | string | yes | The product name exactly as the repo spells it (`open-mtp-client`, `Inkbound`) | `<h1>`, cards, JSON-LD `name` |
| `description` | string | yes | ≤ 160 chars. Leads with the problem. Plain text. | meta description, OG, JSON-LD |
| `layout` | `'project'` | yes | Literal value | template choice, homepage query |
| `date` | datetime | yes | First publish date of the page | sitemap |
| `images` | [string] | yes | Exactly one entry: a bundle image filename used as the social preview | OG/Twitter image |
| `params.order` | int | yes | 1 = open-mtp-client, 2 = Inkbound | homepage order |
| `params.seo_title` | string | yes | ≤ 65 chars. Leads with the problem. Ends with the product name. | `<title>`, `og:title` |
| `params.eyebrow` | string | yes | Short platform label, e.g. `Free Mac app`, `Obsidian plugin` | hero eyebrow, card |
| `params.tagline` | string | yes | One sentence, simple English, what it does for you | hero subhead |
| `params.card_pitch` | string | yes | ≤ 90 chars, problem → fix | homepage card |
| `params.hero_image` | string | yes | Bundle image filename. It may have a `-dark` twin. | hero, homepage card |
| `params.hero_alt` | string | yes | Describes what the screenshot shows | `<img alt>` |
| `params.hero_caption` | string | no | e.g. "Shown with a virtual phone and sample files." | `<figcaption>` |
| `params.version` | string | yes | The current release, without a `v` prefix (`0.1.0`, `1.15.1`) | meta line, JSON-LD `softwareVersion` |
| `params.repo_url` | URL | yes | `https://github.com/kidpeterpan/<repo>` | links, JSON-LD `codeRepository`/`sameAs` |
| `params.license` | string | yes | `MIT` | meta line, JSON-LD `license` (as URL to the repo `LICENSE`) |
| `params.os` | string | yes | `macOS 11 or later` / `Windows, macOS, Linux, iOS, Android (Obsidian)` | requirements, JSON-LD `operatingSystem` |
| `params.category` | string | yes | schema.org value: `UtilitiesApplication` (omc), `ProductivityApplication` (Inkbound) | JSON-LD `applicationCategory` |
| `params.requirements` | [string] | yes | 1–3 short lines, facts from the README | hero meta + "Get it" section |
| `params.cta` | table | yes | `{ label, url }`. `url` must be a stable "latest" or directory URL, never a version-named file. | primary button, JSON-LD `downloadUrl` (omc) / `installUrl` (Inkbound) |
| `params.cta_secondary` | table | no | `{ label, url }`, e.g. "Build from source" / "Install manually" | secondary link |
| `params.steps` | [string] | yes | 3–6 install steps, each simple English, may contain inline Markdown (`**bold**`) | "Get it" section (`markdownify`) |
| `params.notice` | table | omc only | `{ title, body }`. `body` is Markdown with the first-launch warning steps for macOS 15+ and ≤ 14. | callout directly under the CTA |
| `params.faq` | [table] | no | `{ q, a }`. `a` is Markdown. Answers come only from the README. | FAQ `<details>` list |
| body | Markdown | yes | `##` sections: "The problem", "What it does" (omc) or "How it works" + "What you get" (Inkbound). Images as `![alt](file "caption")`. | page body via the render-image hook |

**Validation rules (from spec):**

- FR-011: every claim traces to the product's README or manifest. No ratings
  or user counts.
- FR-012: `version`, `cta.url`, `repo_url`, `os`, `category`, and `license` are
  each written exactly once per product.
- FR-008: omc `cta.url` = `https://github.com/kidpeterpan/open-mtp-client/releases/latest`.
- FR-010: Inkbound `cta.url` = `https://obsidian.md/plugins?id=inkbound`.

## Screenshot (bundle resource)

| Attribute | Rule |
|---|---|
| file | Copied from the product repo's `HEAD` at the path in the design doc. Kept at its original name, lowercased. |
| dark twin | Optional sibling `<base>-dark.<ext>`. Only omc's `main` has one. |
| alt | Required. It comes from the Markdown alt text or `hero_alt`. |
| caption | Optional. It comes from the Markdown title or `hero_caption`. |
| output | WebP resized to ≤ 1600 px wide (hero) or ≤ 1200 px wide (body), plus the original as fallback, with `width`/`height` set |

Inventory:

- `content/open-mtp-client/`: `main.png` (from `main-light.png`, 1280×994),
  `main-dark.png` (1280×994), `icon.png` (from `assets/icon-1024.png`, 1024², used
  for the card and JSON-LD `image`).
- `content/inkbound/`: `note-in-obsidian.png` (1600×1053), `export-menu.png`
  (1600×1058), `boox-library.jpg` (1050×1400), `boox-reading.jpg` (1049×1400),
  `settings.png` (1600×937, optional).

## Mini app (existing, `content/apps/*.md`)

Unchanged except for one new optional field:

| Field | Type | Rule |
|---|---|---|
| `params.content_lang` | string | Set to `'th'` on `mortgage.md`. It renders as `lang` on the content wrapper. |

Their `tags` stay in front matter but are ignored, because taxonomies are disabled.

## Site config (`hugo.toml`)

| Key | New value |
|---|---|
| `defaultContentLanguage` | `'en'` |
| `locale` | `'en-US'` |
| `disableKinds` | `['taxonomy', 'term', 'rss']` |
| `params.siteTitleFull` | `'kidpeterpan — small, free apps that fix annoying problems'` (wording final in implementation) |
| `params.description` | An English description naming both products |
| `params.github` | `'https://github.com/kidpeterpan'` |
| `params.coffee` | `'https://buymeacoffee.com/kidpeterpan'` |
