# Implementation Plan: Tutorial Series Ordering & Episode Navigation

**Branch**: `005-tutorial-series-navigation` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-tutorial-series-navigation/spec.md`

## Summary

Make the Go and Git tutorial sections read as ordered courses rather than reverse-chronological blogs, and
let readers move episode to episode without returning to the section index.

A section opts in by setting `ordered = true` under `[params]` in its own `_index.md`. A single new partial
resolves any section page to its correctly ordered pages — ascending by filename prefix when the section is
an ordered course, unchanged newest-first otherwise. The section list template and the article template both
read from that one partial, so the listing and the navigation can never disagree about the course order
(FR-014). Episode navigation is a new article-level partial rendered after the article body, styled from
existing design tokens.

All three mechanisms were verified against Hugo v0.164.0 in a throwaway probe site before this plan was
written; see [research.md](./research.md). That probe also established that Hugo's built-in
`.PrevInSection` / `.NextInSection` are *incorrect* for this content — they point backwards across the
tied-date pair `07-`/`08-` — which is why neighbours are derived by index instead.

## Technical Context

**Language/Version**: Go templates (Hugo `v0.164.0+extended+withdeploy`), CSS (Tailwind CSS v4 via Hugo Pipes)

**Primary Dependencies**: None added. Hugo built-ins only (`sort`, `index`, `partial` with `return`).

**Storage**: N/A — static site; content is Markdown with TOML front matter under `content/`

**Testing**: No automated test suite in this repository. Verification is a clean `hugo --minify` build plus a
manual pass against `hugo server` in both light and dark mode, per constitution Principle V. A throwaway
probe site under the session scratchpad was used for Phase 0 mechanism verification and is not part of the repo.

**Target Platform**: Static site served by GitHub Pages; modern evergreen browsers, desktop and mobile

**Project Type**: Hugo static site (content/presentation split; no frontend or backend application tiers)

**Performance Goals**: No runtime cost — all ordering and navigation is resolved at build time and emitted as
static HTML. No new JavaScript, no new network requests, no added page weight beyond the navigation markup.

**Constraints**: No new npm package, Hugo module, or third-party script (Principle III). All new UI must use
existing `assets/css/main.css` custom properties so both themes work by construction (Principle II). No
existing episode file is edited or renamed (spec Assumptions). Homepage and tag-page ordering must be
byte-for-byte unchanged (FR-006, FR-007).

**Scale/Scope**: 2 ordered sections (Go, 11 episodes; Git, 8 episodes) out of 5 sections; 19 of the site's 24
notes affected. 3 non-course sections and all 9 tag pages must remain unchanged. 2 templates modified, 2
partials added, 2 content `_index.md` files gain one line each, 1 CSS block added.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against `.specify/memory/constitution.md` v1.0.0.

| Principle | Assessment | Status |
|-----------|-----------|--------|
| **I. Simplicity First** | Uses Hugo built-ins only — no build tooling, no JS, no package. Two partials are added; `episode-nav.html` is a UI block matching the existing `share.html` precedent, and `ordered-pages.html` is a three-line unit that exists to satisfy a named requirement (FR-014) rather than to anticipate future need. The latter is logged in Complexity Tracking. | PASS (one item justified) |
| **II. Theme Consistency** | New `.episode-nav` styling is composed only from existing custom properties (`--line`, `--muted`, `--ink`, `--accent`, `--surface`, `--font-display`, `--font-mono`), which are already redefined per theme under `[data-theme]`. Both modes are an explicit acceptance scenario (US2 #6) and a required verification step. | PASS |
| **III. Minimal, Justified Dependencies** | Zero new dependencies. `sort`, `index`, and `return`-in-partial are Hugo built-ins present in v0.164.0 and verified working in the Phase 0 probe. `package.json` is untouched. | PASS |
| **IV. Content-Facing Accessibility** | Episode navigation is a `<nav>` with an `aria-label`; destinations are plain `<a>` elements, keyboard-reachable and Enter-activatable without JavaScript. Each link's accessible name carries the destination episode's title (FR-009), so it is never a bare "Next". Direction is conveyed by text, not by colour or glyph alone. | PASS |
| **V. Manual Verification (NON-NEGOTIABLE)** | [quickstart.md](./quickstart.md) defines the required manual pass — both courses, both control surfaces, both themes, keyboard traversal, plus a clean `hugo --minify` build. The task list terminates in that verification; the feature is not complete without it. | PASS |

**Technology Constraints**: Honoured. Ordering and navigation live in `layouts/` as Go templates; styling
lives in the single `assets/css/main.css` source; the only `content/` change is one front-matter parameter per
course section. No inline `<style>` and no HTML in Markdown. `design/mha-redesign/` is untouched.

**Gate result**: PASS. No unjustifiable violations. Proceed.

**Post-Phase 1 re-check**: PASS — the Phase 1 design introduced no new dependency, no JavaScript, and no
styling outside the existing token set. The one justified item (the `ordered-pages.html` partial) is unchanged
from the initial assessment and remains recorded below.

## Project Structure

### Documentation (this feature)

```text
specs/005-tutorial-series-navigation/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — mechanism verification and decisions
├── data-model.md        # Phase 1 output — the ordered-course / episode model
├── quickstart.md        # Phase 1 output — manual verification guide
├── checklists/
│   └── requirements.md  # Spec quality checklist (20/20)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

No `contracts/` directory. This site exposes no API, CLI, or machine-readable interface; its only
authoring-facing contract is the `ordered` section parameter, which is documented in `data-model.md`
alongside the entities it belongs to. This matches the shape of features 001–004 in this repository.

### Source Code (repository root)

```text
layouts/
├── _default/
│   ├── list.html            # MODIFIED — resolve pages through the new partial instead of .ByDate.Reverse
│   └── single.html          # MODIFIED — include episode-nav after the article body
└── partials/
    ├── ordered-pages.html   # NEW — returns a section's pages in the correct order
    └── episode-nav.html     # NEW — renders previous/next episode links

assets/css/
└── main.css                 # MODIFIED — add the .episode-nav rule set

content/
├── go/_index.md             # MODIFIED — add ordered = true
└── git/_index.md            # MODIFIED — add ordered = true
```

**Structure Decision**: The existing Hugo content/presentation split is kept intact. Ordering logic and
navigation markup are templates under `layouts/`; the opt-in declaration is content front matter under
`content/`; styling is appended to the single Tailwind source `assets/css/main.css`. No new top-level
directory is introduced, and no file outside the eight listed above is touched.

`layouts/index.html` is deliberately **not** in the list: the homepage keeps its own reverse-chronological
query, satisfying FR-007. `layouts/_default/list.html` is shared with taxonomy term pages, which have no
`_index.md` and therefore no `ordered` param — they fall through to the unchanged newest-first branch,
satisfying FR-006 without special-casing.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| A shared partial (`ordered-pages.html`) rather than an inline expression — a helper abstraction under Principle I | FR-014 requires the section listing and the episode navigation to be driven by the *same* ordered collection. A partial makes that structural; duplication would make it a convention that can silently drift, and the drift's symptom is a navigation link to a page absent from the listing. | Inlining `sort .RegularPages "File.BaseFileName"` in both templates is fewer lines but leaves FR-014 unenforced — the two expressions differ in receiver (`.` vs `.Parent`), so they are easy to change in one place only. The partial is three lines, has one responsibility and no configuration surface, and removes an existing duplication rather than anticipating a future one. |
