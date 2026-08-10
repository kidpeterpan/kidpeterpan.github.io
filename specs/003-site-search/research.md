# Research: Pagefind for Static Site Search

**Feature**: Site Search (003)
**Date**: 2026-08-08

## Decision 1 — Search technology: Pagefind

- **Decision**: Use Pagefind (version `1.5.2`, latest at time of research) as
  the build-time search indexer.
- **Rationale**: The site is fully static on GitHub Pages with no server.
  Pagefind generates a search index from the built site output and runs
  entirely in the browser, satisfying FR-005 (no backend) and FR-009 (fast,
  sub-second results). It supports Thai-language text (FR-006) via
  `Intl.Segmenter` since v1.3, and its UI assets (`pagefind-ui.js` /
  `pagefind-ui.css`) are emitted into the site output by the CLI — no
  second npm package is needed.
- **Alternatives considered**:
  - **Fuse.js/Lunr + custom JSON index**: requires writing a Hugo output
    format, an index build, and a full custom UI; fuzzy matching on Thai
    without segmentation is unreliable. Rejected: more code, weaker Thai
    support.
  - **Hosted search (Algolia/Meilisearch)**: needs an external account,
    API keys, and network calls; violates the static/privacy goals.
    Rejected.

## Decision 2 — Dependency strategy

- **Decision**: Add `pagefind` as a pinned devDependency (`1.5.2`) and run
  it via the repo's existing `npm ci` + `npx pagefind --site public`.
- **Rationale**: Pinning gives reproducible builds in CI. It is a
  build-time-only tool: nothing from it ships in the site except the
  generated `/pagefind/` assets, so it does not add runtime bundle weight or
  third-party runtime calls (Constitution Principle III — justified).
- **Alternatives considered**: `npx --yes pagefind` without a pin — rejected
  because unpinned npx downloads can change behavior between builds.

## Decision 3 — UI approach

- **Decision**: Use the official `PagefindUI` component (mounted inside a
  native `<dialog>` overlay), with the component's stylesheet loaded from
  the generated `/pagefind/pagefind-ui.css` and overridden in
  `assets/css/main.css` using the site's design tokens.
- **Rationale**: The official component provides ranking, snippet
  highlighting, and result markup out of the box — the simplest mechanism
  that satisfies FR-003/FR-007 (Constitution Principle I). The native
  `<dialog>` gives focus management and Escape-to-close for free
  (Constitution Principle IV). CSS overrides keep it visually consistent
  with "Plus Ultra Paper" in both themes (Constitution Principle II).
- **Alternatives considered**: Building a custom results renderer on the
  core `pagefind.search()` API — rejected: more JS to write and maintain
  for no additional user value.

## Decision 4 — Thai + English matching

- **Decision**: Rely on Pagefind's built-in language detection; do not pass
  a `--lang` flag, so Thai posts and English technical terms are indexed
  and matched naturally (FR-006).
- **Rationale**: Verified behavior of the v1.x series; per-page language is
  auto-detected from content.
- **Alternatives considered**: Forcing a single language — rejected, the
  blog mixes Thai prose with English terms per post.

## Decision 5 — Pipeline integration

- **Decision**: Add one step to `.github/workflows/deploy.yml` between
  `hugo --minify` and artifact upload: `npx pagefind --site public`.
- **Rationale**: The index must be rebuilt on every deploy so new posts are
  searchable automatically (FR-004, SC-004). Hugo itself cannot generate a
  search index (Constitution Principle III justification).
- **Alternatives considered**: A pre-commit hook or manual reindex —
  rejected: would miss deploys.

## Unresolved items

None. All technical unknowns were resolved during research.
