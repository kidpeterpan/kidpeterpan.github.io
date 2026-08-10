# Quickstart: Validate Mobile Reading Support

No automated test suite exists in this repo (Constitution Principle V), so
validation is manual against the running dev server, using browser devtools
device emulation (or a real phone) at a mobile width (e.g. 375–414px) and a
desktop width (e.g. 1280px+). This guide proves the feature end-to-end per
the acceptance scenarios in [spec.md](./spec.md).

## Prerequisites

- `npm ci` has been run at least once (Tailwind CLI available to Hugo Pipes).
- Dev server running: `make start` (backgrounded) or `hugo server`
  (foreground) — serves at `http://localhost:1313`.

## Scenario 1 — Mobile section outline (User Story 1, P1)

1. Open a post with multiple headings, e.g.
   `http://localhost:1313/go/01-setting-up-your-go-environment/`, at a
   mobile viewport width.
2. **Expect**: a collapsed "On this page" control is visible near the top
   of the article, and the sticky desktop TOC sidebar is not shown.
3. Activate the control.
4. **Expect**: the post's section links are listed.
5. Tap a section link.
6. **Expect**: the page scrolls to that heading.
7. Open a post with no headings at the same mobile width.
8. **Expect**: no "On this page" control appears at all.

## Scenario 2 — Mobile site navigation (User Story 2, P2)

1. Open any page at a mobile viewport width.
2. **Expect**: a menu control is visible in the header; the desktop section
   links row is not shown.
3. Activate the control.
4. **Expect**: links to every site section (article/book/cheat_sheet/go)
   appear, matching the desktop header's link set.
5. Tap a section link.
6. **Expect**: the browser navigates to that section's page and the menu is
   no longer open.
7. Re-open the menu and activate its control again without tapping a link.
8. **Expect**: the menu closes and the page is unchanged.

## Scenario 3 — Wide table containment (User Story 3, P3)

1. Open (or temporarily create) a post containing a Markdown table with
   enough columns to exceed a mobile viewport's width.
2. **Expect**: the overall page does not gain a horizontal scrollbar/scroll
   gesture; swiping/scrolling horizontally over the table itself reveals
   its remaining columns.
3. Open a post with a table that already fits the viewport.
4. **Expect**: it renders exactly as it did before this feature (no visible
   scroll container, no layout change).

## Desktop regression check (FR-011)

1. At a desktop viewport width, open the same post used in Scenario 1.
2. **Expect**: the sticky "ON THIS PAGE" sidebar behaves exactly as before
   this feature, and no mobile-only controls are visible.
3. **Expect**: the header's section links row behaves exactly as before,
   and no mobile menu control is visible.

## Breakpoint / resize check (edge case)

1. With devtools open at a desktop width, slowly resize/rotate down across
   900px while on a post with headings.
2. **Expect**: the desktop TOC sidebar and header nav disappear and the
   mobile "On this page" control and menu control appear at the same
   point, with no gap where neither is visible, and no page reload.

## Theme check (Principle II)

1. Repeat Scenario 1 and 2 in both light and dark mode (toggle via the
   theme switcher).
2. **Expect**: all new controls (summary labels, icons, open/closed states)
   are legible and match the "Plus Ultra Paper" palette in both modes.

## Build check

Run `hugo --minify` and confirm it completes with no errors before
considering the feature complete (Constitution Principle V).
