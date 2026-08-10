# Tasks: Mobile Reading Support

**Input**: Design documents from `/specs/002-mobile-reading-support/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md
(no data-model.md/contracts/ — static site, no persisted entities or API)

**Tests**: Not included — this repo has no automated test suite (Constitution
Principle V); verification is manual via `quickstart.md`.

**Organization**: Tasks are grouped by user story (spec.md). The three
stories touch disjoint template files (`single.html`, `baseof.html`, a new
`render-table.html`) plus shared, additive edits to `assets/css/main.css`,
so — unlike a Foundational phase gating everything — none of the three
stories requires another to be done first. There is no Phase 2
(Foundational) in this feature: see Notes.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: Confirm baseline before making changes — no new dependencies
are introduced by this feature (Constitution Principle III).

- [X] T001 Confirm the existing toolchain runs cleanly before changes: `npm ci` (if not already done) and `hugo server`, confirming the current site builds and serves with no errors
- [X] T002 Record the current desktop-width behavior of `.toc-aside` (sticky "ON THIS PAGE" sidebar) and `.site-nav` (header section links) on a post page, as the reference baseline for the FR-011 "desktop unchanged" regression check in Phase 5

---

## Phase 2: User Story 1 - Jump to a section from a mobile device (Priority: P1) 🎯 MVP

**Goal**: On a narrow viewport, a reader can open a collapsible "on this
page" outline of the current post's headings and tap a link to jump to
that section.

**Independent Test**: On a narrow viewport, open a post with multiple
headings, open the outline control, tap a section link, and confirm the
page scrolls to that heading (quickstart.md Scenario 1).

- [X] T003 [US1] In `layouts/_default/single.html`, add a second `{{ with .TableOfContents }}` block inside `<article>`, placed after `.article-head` and before `.prose`, rendering `<details class="toc-mobile"><summary>On this page</summary>{{ . }}</details>` (FR-001, FR-002) — `.TableOfContents` emits `<nav id="TableOfContents">`, and rendering it twice per post produced a duplicate `id`; fixed by stripping the `id` attribute from the mobile copy with `{{ . | replaceRE `id="TableOfContents"` "" | safeHTML }}`
- [X] T004 [US1] Add `.toc-mobile` rules to `assets/css/main.css` (near the existing `.toc`/`.toc-label` rules): `display: none` by default (desktop), themed `<summary>` label matching the `.toc-label` mono/uppercase style, and nested link list styled consistently with the existing `.toc` link rules, using existing tokens (`--green`, `--gold`, `--surface`, etc.)
- [X] T005 [US1] In the existing `@media (max-width: 900px)` block in `assets/css/main.css`, add `.toc-mobile { display: block; }` alongside the existing `.toc-aside { display: none; }` rule so exactly one TOC control is visible per viewport width
- [X] T006 [US1] Manually verify per quickstart.md Scenario 1: a post with headings shows the collapsed "On this page" control on a narrow viewport, expands on activation, and each link scrolls to its heading; a post with zero headings shows no control at all (FR-003)

**Checkpoint**: User Story 1 is independently functional — run quickstart.md
Scenario 1 before moving on.

---

## Phase 3: User Story 2 - Navigate to another section of the site from mobile (Priority: P2)

**Goal**: On a narrow viewport, a reader can open a menu listing every site
section from the header and tap one to navigate there.

**Independent Test**: On a narrow viewport, open any page, open the
navigation menu, tap a section link, and confirm it navigates to that
section (quickstart.md Scenario 2).

- [X] T007 [US2] In `layouts/_default/baseof.html`, add `<details class="nav-mobile"><summary aria-label="Menu">☰</summary><nav>{{ range site.Sections }}<a href="{{ .RelPermalink }}">{{ lower .Title }}</a>{{ end }}</nav></details>` inside `.header-right`, next to the existing `.site-nav` (FR-004, FR-005)
- [X] T008 [US2] Add `.nav-mobile` rules to `assets/css/main.css`: `display: none` by default (desktop); themed hamburger `<summary>` control matching the header's existing icon-button sizing (e.g. `.coffee-btn`/`.theme-toggle`); the opened `<nav>` list positioned so it does not push surrounding header content (e.g. `position: absolute`, themed background/border from `--surface`/`--line-strong`)
- [X] T009 [US2] In the existing `@media (max-width: 900px)` block in `assets/css/main.css`, add `.nav-mobile { display: block; }` (or equivalent) alongside the existing `.site-nav { display: none; }` rule
- [X] T010 [US2] Manually verify per quickstart.md Scenario 2: the menu control is visible on a narrow viewport with the desktop link row hidden, activating it reveals every site section link, tapping a link navigates there, and reactivating the control closes the menu without navigating (FR-006)

**Checkpoint**: User Stories 1 AND 2 both work independently — run
quickstart.md Scenario 2.

---

## Phase 4: User Story 3 - Read a post with a wide table without the page scrolling sideways (Priority: P3)

**Goal**: A Markdown table wider than the viewport scrolls within its own
bounds instead of forcing the whole page to scroll horizontally.

**Independent Test**: On a narrow viewport, open a post with a table wider
than the viewport and confirm the page itself does not scroll horizontally
while the table's own content remains reachable by scrolling it
(quickstart.md Scenario 3).

- [X] T011 [US3] Create `layouts/_default/_markup/render-table.html`, a Hugo table render hook per research.md: iterate `.THead`/`.TBody` (each a slice of cell slices with `.Alignment`/`.Text`) to reproduce Hugo's default `<table><thead>...<tbody>...</tbody></table>` output, wrapped in `<div class="table-scroll">...</div>` (FR-007)
- [X] T012 [US3] Add `.table-scroll { overflow-x: auto; }` to `assets/css/main.css` near the existing `.prose table` rules, and confirm the existing `.prose table { width: 100%; ... }`/`.prose th`/`.prose td` rules still apply unchanged inside the new wrapper (FR-008) — implemented as `.prose table { min-width: 100%; }` rather than a fixed `width: 100%`, since a fixed width would prevent the table from ever growing wider than its container and defeat the overflow-scroll behavior required by FR-007
- [X] T013 [US3] Manually verify per quickstart.md Scenario 3: a table wider than a narrow viewport scrolls within its own bounded area with no page-level horizontal scroll, and a table that already fits the viewport renders with no visible change from before this feature — verified via a temporary injected 10-column table (removed after verification, not committed to content/): page `scrollWidth` stayed exactly equal to `clientWidth` (no page-level overflow) while the `.table-scroll` container itself measured `scrollWidth: 1103` vs `clientWidth: 693` (contained overflow, actually scrollable)

**Checkpoint**: All three user stories independently functional — run
quickstart.md Scenario 3.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across the whole feature per Constitution
Principle V (manual verification is the only correctness gate in this repo).

- [X] T014 Run `hugo --minify` and confirm the production build completes with no errors
- [X] T015 Run the full `specs/002-mobile-reading-support/quickstart.md` validation end-to-end: all three scenarios, the desktop regression check against the T002 baseline (FR-011), and the breakpoint resize/rotation check — the first pass used a body-`max-width` CSS proxy (no real media-query evaluation), which an advisor review flagged as insufficient; re-verified with a genuine same-origin `<iframe>` at 390px width (real `matchMedia('(max-width:900px)')` evaluation). That re-check caught two real regressions this feature introduced, both now fixed: (1) `.article-layout { grid-template-columns: 1fr }` at mobile had no `minmax(0, ...)`, so the grid track wouldn't shrink below its content's intrinsic width — 269px of page-level horizontal overflow at 390px; fixed by changing it to `minmax(0, 1fr)`. (2) the new `.nav-mobile` hamburger button pushed the header 10px past the viewport edge; fixed by tightening `.header-right`'s gap to 10px at ≤900px. Post-fix, verified via iframe: `pageOverflow: 0` and `headerOverflow: 0` at 390px, both with the nav menu and the TOC disclosure open
- [X] T016 [P] Repeat the mobile TOC, mobile nav, and theme checks in both `data-theme="light"` and `data-theme="dark"` (Constitution Principle II)
- [X] T017 [P] Spot-check the mobile TOC and mobile nav render correctly on at least one post from each existing section (`content/article/`, `content/book/`, `content/cheat_sheet/`, `content/go/`) — `content/cheat_sheet/` currently has no posts (only `_index.md`), so only `.nav-mobile` (site-wide) was checked there; `.toc-mobile` was confirmed on `article`, `book`, and `go`
- [X] T018 [P] Add `:focus-visible` styling to `.toc-mobile summary` and `.nav-mobile summary` in `assets/css/main.css`, matching this repo's existing interactive-element focus conventions, so keyboard focus is visibly indicated (Constitution Principle IV, FR-009)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup; no dependency on US2/US3
- **User Story 2 (Phase 3)**: Depends on Setup; no dependency on US1/US3
- **User Story 3 (Phase 4)**: Depends on Setup; no dependency on US1/US2
- **Polish (Phase 5)**: Depends on all desired user stories being complete

### Within Each User Story

- Template markup before its CSS visibility rule
- CSS visibility rule (added to the shared `@media` block) before the manual
  verification task
- Story's checkpoint (manual quickstart scenario) before moving to the next
  priority

### Parallel Opportunities

- Phases 2, 3, and 4 (US1, US2, US3) touch entirely disjoint template files
  (`single.html`, `baseof.html`, `render-table.html`) and can be worked on
  in parallel by different people/agents once Setup is done; each only adds
  its own rule block to the shared `main.css` and `@media` block, so
  concurrent edits there are additive rather than conflicting as long as
  each story appends its own block
- T016 and T017 (Phase 5) are independent of each other and of T014/T015's
  ordering, and can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1
3. **STOP and VALIDATE**: run quickstart.md Scenario 1
4. This alone is a viable increment: mobile readers can navigate within a
   post, even before the header menu (US2) or table containment (US3) land

### Incremental Delivery

1. Setup → baseline confirmed, regression reference recorded
2. Add User Story 1 → mobile TOC works → validate independently
3. Add User Story 2 → mobile site nav works → validate independently
4. Add User Story 3 → wide tables contained → validate independently — at
   this point all three confirmed gaps from spec.md are closed
5. Polish phase → build check, full quickstart pass, both themes, all
   sections → done

---

## Notes

- No Phase "Foundational" — each story's implementation is fully contained
  in its own template file plus an additive CSS block, so nothing blocks
  more than one story at a time
- No `[Story]` label on Setup/Polish tasks, per task format rules
- No test tasks generated — spec.md did not request tests and this repo has
  no automated test suite; `quickstart.md` scenarios are the verification
  mechanism instead
- Commit after each phase checkpoint, not after every individual task
