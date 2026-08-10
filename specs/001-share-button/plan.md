# Implementation Plan: Share Button

**Branch**: `001-share-button` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-share-button/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Add a share control to individual blog post pages that uses the Web Share API
(`navigator.share`) where supported, falling back on browsers without it to
static share links (X/Twitter, Facebook, LinkedIn) plus a copy-link action
with a "Copied!" confirmation. Implemented as a Hugo partial included only
from `layouts/_default/single.html`, a small vanilla-JS file mirroring the
existing `static/js/theme.js` pattern, and additive CSS in
`assets/css/main.css` matching the "Plus Ultra Paper" theme in both light and
dark mode. No new dependencies, no build tooling changes.

## Technical Context

**Language/Version**: Go templates (Hugo 0.161+), vanilla JS (ES2017+, no
transpilation), CSS via Tailwind CSS v4

**Primary Dependencies**: None new. Uses existing toolchain: Hugo Pipes
(`css.TailwindCSS`), the browser-native Web Share API and Clipboard API — no
npm packages added.

**Storage**: N/A — no persisted data; share content (title, permalink) is
read from the current page's existing Hugo page variables (`.Title`,
`.Permalink`).

**Testing**: No automated test suite exists in this repo (per Principle V).
Verification is manual: `hugo server` / `make start`, exercised in both theme
modes and (for the fallback path) a browser without Web Share API support.

**Target Platform**: Static site served as HTML/CSS/JS to any modern browser
(mobile + desktop). Native share path targets Web Share API-supporting
browsers (primarily mobile Safari/Chrome); fallback path targets all others
(primarily desktop Safari/Firefox, per spec).

**Project Type**: Static site (Hugo) — single frontend project, no
backend/API.

**Performance Goals**: No measurable perf target beyond "no regression" —
the added JS/CSS is a few KB, loaded the same way `theme.js` already is.

**Constraints**: Must not add build tooling or JS dependencies (Constitution
Principle III); must match existing theme tokens and support both
`data-theme` modes (Principle II); must be keyboard-operable with accessible
names (Principle IV, FR-009).

**Scale/Scope**: One partial, one static JS file, CSS additions confined to a
new block in `assets/css/main.css`; included only on the single-post template,
so it renders on every post across all sections (`article/`, `book/`,
`cheat_sheet/`, `go/`) but never on list/section pages or the homepage.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Simplicity First | Plain Hugo partial + vanilla JS + CSS additions; no new abstraction layers, no JS framework, no build step changes. | PASS |
| II. Theme Consistency | New CSS reuses existing tokens (`--surface`, `--line`, `--green-deep`, etc.) from `assets/css/main.css`; must be checked in both `data-theme="light"` and `data-theme="dark"` before completion (tracked in tasks). | PASS (pending manual check in tasks) |
| III. Minimal, Justified Dependencies | No new npm packages, no CDN scripts. Uses only `navigator.share` and `navigator.clipboard`, both browser-native. | PASS |
| IV. Content-Facing Accessibility | Share control(s) required to be keyboard-operable with accessible names per FR-009; enforced as an explicit task and checked manually. | PASS (pending manual check in tasks) |
| V. Manual Verification | No test suite to update; plan requires `hugo server` check in both themes and `hugo --minify` build check before completion (tracked in tasks). | PASS (pending manual check in tasks) |

No violations requiring justification — Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-share-button/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

No `data-model.md` or `contracts/` — this feature introduces no persisted
data entities and no external API/interface contract (static site, no
backend). Skipped per Phase 1 guidance ("skip if project is purely internal"
/ no data involved).

### Source Code (repository root)

```text
layouts/
└── partials/
    └── share.html          # New partial: share control markup, included from single.html

layouts/_default/
└── single.html             # Modified: include {{ partial "share.html" . }} in article footer

static/js/
└── share.js                # New: native share + fallback + copy-link behavior (mirrors theme.js pattern)

assets/css/
└── main.css                # Modified: new .share-* rules appended, themed for data-theme light/dark
```

**Structure Decision**: Single Hugo project (this repo's existing
content/layouts/assets split, per Constitution "Technology Constraints").
The feature adds one new partial, one new static JS file, and additive CSS —
no new top-level directories, no build config changes.

## Complexity Tracking

*No entries — Constitution Check has no unjustified violations.*
