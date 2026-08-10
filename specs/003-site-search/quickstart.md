# Quickstart — Site Search Validation Guide

**Feature**: Site Search (003)
**Date**: 2026-08-08

## Prerequisites

- Node.js installed (`npm ci` must succeed) — installs the pinned `pagefind` devDependency
- Hugo (extended) installed
- A browser that supports `<dialog>` (all modern browsers)

## Build & index locally

From the repo root:

```sh
npm ci
hugo --minify
npx pagefind --site public
```

Expected outcome:

- `hugo --minify` completes without errors (required by Constitution).
- `npx pagefind --site public` prints an index summary and exits 0.
- `public/pagefind/` now contains the index + `pagefind-ui.js` + `pagefind-ui.css`.

## Serve and verify in the browser

Serve the built output (Pagefind assets are absolute-path based, so serve
from the public directory):

```sh
python3 -m http.server 8080 --directory public
```

Open `http://localhost:8080` and run the checks below.

## Verification scenarios

### 1. Search from the header (FR-001, FR-002)

- On the homepage and on any post page, the header shows a search button
  with an accessible name.
- Activating it opens the search dialog with the input focused.
- Type `pointer` → the Pointers post appears with a highlighted snippet.

### 2. Thai search (FR-006)

- Type a Thai keyword such as `ตัวแปร` → posts containing that Thai word
  appear, and the keyword is highlighted in snippets.
- Type a mixed query e.g. `named return` → the Functions post appears.

### 3. No-result and empty states

- Type `zzzznotfound` → a clear "no results" message, no broken UI.
- Clear the input or open with empty input → no stale results shown.

### 4. Open a result (FR-003)

- Click/tap a result → the post opens in the same tab at its URL.

### 5. Keyboard & close flow (FR-007)

- With the dialog open, press `Tab` and confirm focus stays inside and moves
  visibly through results.
- Press `Escape` → dialog closes, focus returns to the trigger button.
- Reopen with `Enter`/`Space` on the button — works without a mouse.

### 6. Both themes (FR-010, Constitution Principle II)

- Toggle dark mode via the theme button and repeat scenarios 1–3; the
  search UI must use the theme tokens in both modes with no unreadable
  contrast.

### 7. Privacy / no network (FR-005)

- With DevTools network tab open, search something and confirm no request
  goes to an external host — only the local pagefind assets load once.

## Deploy pipeline check

Push to `main` and confirm in the GitHub Actions run for `deploy.yml`:

- The new `Index` step runs `npx pagefind --site public` and exits 0.
- The artifact upload includes `pagefind/`.
- After the Pages deployment, repeat scenarios 1–2 on the live site.

## References

- Spec: [spec.md](../spec.md)
- Data model: [data-model.md](../data-model.md)
- Pagefind integration contract: [contracts/pagefind.md](../contracts/pagefind.md)
