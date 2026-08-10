# Contract: Pagefind Integration

**Feature**: Site Search (003)

This contract documents the two external interfaces this feature depends
on: the **Pagefind CLI** (build-time) and the **PagefindUI JavaScript
component** (runtime, emitted by the CLI). Both belong to Pagefind v1.5.2.

## 1. Build-time contract — Pagefind CLI

| Aspect | Contract |
|---|---|
| Invocation | `npx pagefind --site public` (run from repo root, `pagefind` resolved from devDependencies) |
| Input | The Hugo build output directory (`public/`) |
| Output | A `public/pagefind/` directory containing the index files, `pagefind-ui.js`, and `pagefind-ui.css` |
| Execution point | After `hugo --minify`, before artifact upload, in the deploy workflow |
| Failure behavior | Non-zero exit on invalid site output must fail the workflow (no deploy of a broken index) |
| Language | No `--lang` flag; auto-detection handles Thai + English |

## 2. Runtime contract — PagefindUI component

Loaded lazily from the generated assets (`/pagefind/pagefind-ui.js` +
`/pagefind/pagefind-ui.css`), then mounted:

| Option | Value used | Purpose |
|---|---|---|
| `element` | The search box mount element inside the dialog | Where the component renders |
| `debounceTimeoutMs` | `100` | Debounce keystrokes before searching |
| `baseUrl` | `/` (site root) | Resolve index assets |

Behavior relied upon by the feature:

- Renders a search input with accessible label and a results list.
- Highlights matching terms inside result snippets (FR-003).
- Returns result entries with `url` that are safe to render as links.
- Works offline after the index has loaded once (no query sent to any
  server — FR-005, privacy edge case).

## 3. What the site provides

- A trigger button with an accessible name, present on every page header.
- A native `<dialog>` that owns focus and closes on Escape.
- Theme overrides for the component's classes in `assets/css/main.css`
  (light + dark).

## 4. Non-goals (explicitly out of contract)

- No server-side search endpoint.
- No analytics or query logging of any kind.
- No indexing of draft/unpublished pages (they are not in the built
  output).
