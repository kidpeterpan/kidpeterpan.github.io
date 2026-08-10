# Implementation Plan: Mobile Reading Support

**Branch**: `002-mobile-reading-support` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-mobile-reading-support/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Close the three confirmed mobile reading gaps without adding any JavaScript:
a collapsible "on this page" section outline and a collapsible header
navigation menu, both built with native `<details>/<summary>` disclosures
(mobile-only via the existing 900px breakpoint, desktop untouched), and a
Hugo table render hook that wraps every rendered Markdown table in a
horizontally-scrollable container so wide tables can no longer force the
whole page to scroll sideways. All three reuse data Hugo already renders
(`.TableOfContents`, `site.Sections`, goldmark's table AST) — no new content
authoring, no new dependencies, no new static JS file.

## Technical Context

**Language/Version**: Go templates (Hugo 0.164+), CSS via Tailwind CSS v4.
No new JavaScript — native HTML `<details>/<summary>` disclosure elements
provide toggle/keyboard behavior for free.

**Primary Dependencies**: None new. Uses Hugo's built-in Markdown render
hook mechanism (`layouts/_default/_markup/render-table.html`) to customize
table output — a documented Hugo feature, not a third-party dependency.

**Storage**: N/A — no persisted data; the mobile TOC reads the page's
existing `.TableOfContents` value, the mobile nav menu reads the existing
`site.Sections`, and the table wrapper only changes how already-authored
Markdown tables render.

**Testing**: No automated test suite exists in this repo (per Constitution
Principle V). Verification is manual: `hugo server` / `make start`,
exercised at both a mobile-width and desktop-width viewport, in both theme
modes, plus a resize/rotation check across the breakpoint.

**Target Platform**: Static site served as HTML/CSS to any modern browser
(mobile + desktop). `<details>/<summary>` is supported in all currently
relevant browsers (Chrome, Safari, Firefox, Edge) with native keyboard
operability, so no polyfill is needed.

**Project Type**: Static site (Hugo) — single frontend project, no
backend/API.

**Performance Goals**: No measurable perf target beyond "no regression" —
the change is a template/CSS restructuring plus a small render-hook
template; no additional network requests or scripts are introduced.

**Constraints**: Must not add build tooling, JS dependencies, or a new JS
file (Constitution Principle I/III); must match existing theme tokens and
support both `data-theme` modes (Principle II); all new controls must be
keyboard-operable with accessible names (Principle IV, FR-009); the
existing desktop TOC sidebar and header nav must remain byte-for-byte
unchanged above the breakpoint (FR-011).

**Scale/Scope**: Two templates modified (`baseof.html`, `single.html`), one
new render-hook template, additive CSS confined to a few new rule blocks in
`assets/css/main.css` plus edits to the existing `@media (max-width: 900px)`
block. Applies to every page (mobile nav) and every post with headings
(mobile TOC) and every post with a Markdown table (table wrapper), across
all sections (`article/`, `book/`, `cheat_sheet/`, `go/`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Simplicity First | No JS file added; both new mobile controls use native `<details>/<summary>` disclosures instead of custom toggle scripts; table wrapping uses Hugo's built-in render-hook mechanism instead of a JS-based reflow/resize observer. | PASS |
| II. Theme Consistency | New CSS reuses existing tokens (`--surface`, `--line`, `--green-deep`, `--gold`, etc.); must be checked in both `data-theme="light"` and `data-theme="dark"` before completion (tracked in tasks). | PASS (pending manual check in tasks) |
| III. Minimal, Justified Dependencies | No new npm packages, no CDN scripts, no new JS runtime behavior. Render hook is a first-class Hugo template feature, already available in the installed Hugo version (0.164). | PASS |
| IV. Content-Facing Accessibility | Mobile TOC and mobile nav toggle use `<summary>`, which is keyboard-operable (Enter/Space) and focusable by default; each `<summary>` gets visible text or `aria-label` per FR-009. | PASS (pending manual check in tasks) |
| V. Manual Verification | No test suite to update; plan requires `hugo server` check at mobile and desktop widths, both themes, and a resize-across-breakpoint check, plus `hugo --minify` before completion (tracked in tasks). | PASS (pending manual check in tasks) |

No violations requiring justification — Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-mobile-reading-support/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `data-model.md` or `contracts/` — this feature introduces no persisted
data entities and no external API/interface contract (static site, no
backend; it only changes how existing page data is presented). Skipped per
Phase 1 guidance ("skip if project is purely internal" / no data involved).

### Source Code (repository root)

```text
layouts/_default/
├── baseof.html             # Modified: add mobile nav <details> menu in the header, mobile-only
└── single.html             # Modified: add mobile TOC <details> outline near the top of the article

layouts/_default/_markup/
└── render-table.html       # New: Hugo table render hook, wraps rendered tables in a scrollable container

assets/css/
└── main.css                # Modified: new .nav-mobile/.toc-mobile/.table-scroll rules; existing
                             #   @media (max-width: 900px) block updated so the new mobile-only
                             #   controls appear exactly where the old ones now disappear
```

**Structure Decision**: Single Hugo project (this repo's existing
content/layouts/assets split, per Constitution "Technology Constraints").
The feature adds one new render-hook template and additive CSS, and edits
the two templates that already own the header and the article layout — no
new top-level directories, no build config changes, no new JS file.

## Complexity Tracking

*No entries — Constitution Check has no unjustified violations.*
