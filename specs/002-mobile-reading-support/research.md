# Phase 0 Research: Mobile Reading Support

No `NEEDS CLARIFICATION` markers remained in the Technical Context, so this
research resolves implementation-approach questions rather than open
unknowns.

## Mobile access to the post's section outline

**Decision**: Render a second, minimal copy of the existing
`{{ with .TableOfContents }}` output inside the article body (right after
`.article-head`, before `.prose`), wrapped in a native
`<details class="toc-mobile">` with a `<summary>` reading "On this page".
Hide it above the breakpoint with `display: none` (mirroring how
`.toc-aside` is already hidden below it) so exactly one TOC control is
visible at any viewport width.

**Rationale**: `<details>/<summary>` is a browser-native disclosure widget —
collapsed by default, toggles open/closed on click *and* on
Enter/Space when focused, with no JavaScript. This satisfies FR-001–FR-003
and the keyboard/accessible-name requirement (FR-009) for free, and keeps
the change to templates + CSS only, matching Constitution Principle I.
Reusing `.TableOfContents` (already computed by Hugo per page) means posts
with no headings render an empty string and the `{{ with }}` guard already
skips the block entirely — FR-003 falls out of existing Hugo behavior
rather than new logic.

**Alternatives considered**:
- A JS-driven slide-down panel toggled by a button — rejected, duplicates
  what `<details>` already provides natively and adds a JS dependency the
  Constitution says to avoid unless a native mechanism can't do the job.
- Making the existing sticky `.toc-aside` responsive (e.g. turning it into
  an off-canvas drawer at mobile widths via CSS alone) — rejected as more
  CSS complexity than duplicating the small TOC partial output, and riskier
  to the "desktop must stay byte-for-byte unchanged" requirement (FR-011)
  since it reuses the same DOM node for two very different behaviors.

## Mobile access to site-section navigation

**Decision**: Add a second `<nav>` listing `site.Sections` inside a
`<details class="nav-mobile">` in the header, with a `<summary>` styled as
a hamburger control (visible text or `aria-label` "Menu"). Shown only at
mobile widths; the existing `.site-nav` flex list keeps rendering
unchanged and stays hidden below the breakpoint exactly as it is today.

**Rationale**: Same reasoning as the TOC control — `<details>` gives
click-to-open, click-again-to-close, and keyboard operability without
JavaScript, satisfying FR-004–FR-006 and FR-009. Reusing the same
`{{ range site.Sections }}` loop already used for `.site-nav` and the
footer nav means the mobile menu can never drift out of sync with the set
of site sections.

**Alternatives considered**:
- A JS-toggled `aria-expanded` button + hidden panel (the common
  hand-rolled hamburger-menu pattern) — rejected; `<details>` is the
  platform's built-in version of exactly this pattern and needs no script.
- Reusing the footer's section links as the "mobile menu" (e.g. anchor-
  scrolling to the footer) — rejected; the footer is at the bottom of a
  potentially long page, which does not give the two-tap reachability
  required by SC-002, and it conflates two different pieces of UI.

## Preventing wide tables from causing page-level horizontal scroll

**Decision**: Add `layouts/_default/_markup/render-table.html`, a Hugo
Markdown [table render hook](https://gohugo.io/render-hooks/tables/), that
reproduces Hugo's default table HTML (iterating `.THead`/`.TBody` rows and
cells, respecting each cell's `.Alignment`) but wraps the `<table>` in a
`<div class="table-scroll">`. Add `.table-scroll { overflow-x: auto; }` in
`main.css` (the existing `.prose table { width: 100%; ... }` rules are
otherwise unchanged, so tables that already fit the viewport render
identically per FR-008).

**Rationale**: Render hooks are a first-class, built-in Hugo mechanism
(confirmed available in the installed Hugo 0.164) for customizing how
Markdown constructs render, requiring no new dependency and no content
changes — every existing and future table gets the wrapper automatically.
Wrapping in a `<div>` and scrolling the *div* is the standard, cross-browser
-reliable technique; applying `overflow-x: auto` directly to a `<table>`
element (skipping the wrapper) is a known-fragile pattern because browsers
handle overflow on the `table` display type inconsistently once a caption
or unusual cell content is involved.

**Alternatives considered**:
- `.prose table { display: block; overflow-x: auto; }` with no wrapper —
  rejected; changing a table's outer `display` while its rows/cells keep
  their default `table-row`/`table-cell` display (from the UA stylesheet)
  produces inconsistent anonymous-table-box behavior across browsers.
- A JS `ResizeObserver` that adds a scroll wrapper at runtime — rejected;
  unnecessary given Hugo can do this at build time with zero JS, per
  Constitution Principle I.

## Shared breakpoint

**Decision**: Reuse the existing `@media (max-width: 900px)` breakpoint
already used to hide `.toc-aside` and `.site-nav` — the new mobile-only
controls (`.toc-mobile`, `.nav-mobile`) are shown inside that same query
(and hidden above it), so there is exactly one breakpoint value to keep in
sync.

**Rationale**: Introducing a second breakpoint constant would risk the two
controls (old "hide desktop chrome" rule, new "show mobile chrome" rule)
drifting apart at slightly different widths, producing a dead zone where
neither the desktop nor the mobile control is visible. Reusing the same
value structurally prevents that.

**Alternatives considered**:
- A new, narrower breakpoint for the mobile controls — rejected, no
  requirement calls for a different threshold, and it adds a second magic
  number to keep in sync with the first.
