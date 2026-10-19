# Contract: Head metadata and structured data

What `layouts/partials/seo.html` (plus the `<title>` in `baseof.html`) must emit
for each page kind. Values in `{{ }}` refer to `data-model.md` fields.

## All pages

- `<title>`:
  - product pages: `{{ seo_title }}`
  - home: `site.Params.siteTitleFull`
  - other pages: `{{ Title }} · kidpeterpan`
- `<meta name="description">`: `{{ description }}` or the site description,
  ≤ 160 chars.
- `<link rel="canonical" href="{{ .Permalink }}">`
- Open Graph: `og:site_name`, `og:title` (same as `<title>`), `og:description`,
  `og:url`, `og:locale` = `en_US`, `og:type` = `website`, `og:image` (absolute),
  `og:image:width`, `og:image:height`, `og:image:alt`.
- Twitter: `twitter:card` = `summary_large_image`, plus title, description,
  image, and image alt.
- **None** of: `article:*` meta, `<link rel="alternate" type="application/rss+xml">`,
  `BlogPosting`.
- 404 only: `<meta name="robots" content="noindex">`.

## OG image resolution (first match wins)

1. `images[0]` is a page resource → `.Fill "1200x630 top"` → PNG or JPEG (keep
   the source format). Emit its width and height.
2. `images[0]` is a path or URL → make it absolute, as today.
3. Otherwise → the generated card from `partials/og-image.html` (1200×630 PNG).

## JSON-LD by page kind

### Product page (`layout = project`)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "{{ title }}",
  "description": "{{ description }}",
  "url": "{{ .Permalink }}",
  "inLanguage": "en-US",
  "applicationCategory": "{{ category }}",
  "operatingSystem": "{{ os }}",
  "softwareVersion": "{{ version }}",
  "downloadUrl": "{{ cta.url }}",          // open-mtp-client
  "installUrl": "{{ cta.url }}",           // Inkbound
  "screenshot": ["<absolute URL of hero image>", "..."],
  "image": "<absolute OG image URL>",
  "license": "{{ repo_url }}/blob/main/LICENSE",
  "isAccessibleForFree": true,
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": { "@type": "Person", "name": "kidpeterpan", "url": "https://github.com/kidpeterpan" },
  "codeRepository": "{{ repo_url }}",
  "sameAs": ["{{ repo_url }}"]
}
```

- Emit `downloadUrl` when the CTA is a download (omc) and `installUrl` when it is
  an install (Inkbound). This is chosen by a data field or by the slug. It is
  up to the implementation, as long as only one is emitted per page.
- No `aggregateRating` and no `review` (FR-011). The validator warning about
  their absence is expected.
- `codeRepository` is not a SoftwareApplication property in schema.org (it
  belongs to `SoftwareSourceCode`). Drop it if the Schema Markup Validator
  flags it. `sameAs` carries the same link.

### Home

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "name": "kidpeterpan", "url": "<home>", "description": "<site description>", "inLanguage": "en-US",
      "publisher": { "@id": "<home>#person" } },
    { "@type": "Person", "@id": "<home>#person", "name": "kidpeterpan", "url": "<home>",
      "sameAs": ["https://github.com/kidpeterpan"] }
  ]
}
```

### `/apps/` → `CollectionPage`. Mini apps → `WebPage`.

Each has `name`, `url`, `description`, `inLanguage` (`th` for mortgage), and
`isPartOf` → the WebSite.

## Acceptance

- The Schema Markup Validator (validator.schema.org) shows 0 errors for each
  product page's built HTML.
- `grep -c BlogPosting public -r` is 0, and `grep -rl 'application/rss+xml' public`
  is empty.
