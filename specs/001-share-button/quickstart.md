# Quickstart: Validate the Share Button

No automated test suite exists in this repo (Constitution Principle V), so
validation is manual against the running dev server. This guide proves the
feature end-to-end per the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- `npm ci` has been run at least once (Tailwind CLI available to Hugo Pipes).
- Dev server running: `make start` (backgrounded) or `hugo server`
  (foreground) — serves at `http://localhost:1313`.

## Scenario 1 — Native share sheet (User Story 1, P1)

Requires a browser/device that implements the Web Share API (e.g. Chrome on
Android, Safari on iOS, or Chrome desktop with the experimental flag /
`navigator.share` available in DevTools device emulation is not sufficient —
use a real supporting browser or device).

1. Open any post page, e.g. `http://localhost:1313/go/01-setting-up-your-go-environment/`.
2. Activate the share control.
3. **Expect**: the OS/browser native share sheet opens, pre-filled with the
   post's title and its full permalink.
4. Dismiss the sheet without picking a destination.
5. **Expect**: page is unchanged, no console errors (`read_console_messages`
   equivalent: check the browser devtools console).

## Scenario 2 — Fallback links (User Story 2, P2)

Requires a browser without Web Share API support (e.g. desktop Safari or
Firefox).

1. Open the same post page in a non-supporting browser.
2. **Expect**: share control shows link/icons for X/Twitter, Facebook,
   LinkedIn, plus a "copy link" action — no native share prompt appears.
3. Click the X/Twitter link.
4. **Expect**: a new tab opens to `twitter.com/intent/tweet` pre-filled with
   the post title and permalink. Repeat for Facebook and LinkedIn links,
   confirming each opens its respective share-intent URL with the correct
   permalink.
5. Click "copy link".
6. **Expect**: a "Copied!" confirmation appears briefly; pasting from the
   clipboard yields the post's exact permalink.

## Scenario 3 — Theme consistency (User Story 3, P3)

1. On a post page, toggle the theme switcher to light mode.
2. **Expect**: share control icons/text are legible, colors match the
   "Plus Ultra Paper" light palette, no invisible/low-contrast elements.
3. Toggle to dark mode.
4. **Expect**: same legibility/consistency check, dark palette.

## Scope boundary check

1. Visit a list/section page (e.g. `http://localhost:1313/go/`) and the
   homepage (`http://localhost:1313/`).
2. **Expect**: no share control appears on either page.

## Build check

Run `hugo --minify` and confirm it completes with no errors before
considering the feature complete (Constitution Principle V).
