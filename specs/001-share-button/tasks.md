# Tasks: Share Button

**Input**: Design documents from `/specs/001-share-button/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md
(no data-model.md/contracts/ — static site, no persisted entities or API)

**Tests**: Not included — this repo has no automated test suite (Constitution
Principle V); verification is manual via `quickstart.md`.

**Organization**: Tasks are grouped by user story (spec.md) to enable
independent verification of each story. Because this feature is small and
concentrated in three shared files (`layouts/partials/share.html`,
`static/js/share.js`, `assets/css/main.css`), later-story tasks build
directly on earlier-story tasks in the same files rather than touching
disjoint files — `[P]` is only used where a task's file is untouched by any
earlier incomplete task.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

**Purpose**: Confirm baseline before making changes — no new dependencies
are introduced by this feature (Constitution Principle III).

- [X] T001 Confirm the existing toolchain runs cleanly before changes: `npm ci` (if not already done) and `hugo server`, confirming the current site builds and serves with no errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the shared partial, template wiring, base CSS, and JS
skeleton that every user story's behavior attaches to.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `layouts/partials/share.html` with the container markup: a root element exposing the post's title and permalink (e.g. `data-share-title`/`data-share-url` attributes sourced from `.Title` and `.Permalink`), a native-share trigger `<button>`, a fallback row containing `<a>` links for X/Twitter, Facebook, and LinkedIn (hrefs built server-side per research.md), and a "copy link" `<button>` — every control with visible text or `aria-label` (FR-009)
- [X] T003 Include `{{ partial "share.html" . }}` in the article footer of `layouts/_default/single.html` only (do not add it to `layouts/_default/list.html`, `layouts/index.html`, or any other template) — satisfies FR-001 scope boundary
- [X] T004 [P] Add a `.share-*` CSS block to `assets/css/main.css` using existing theme tokens (e.g. `--surface`, `--line`, `--green-deep`) for layout/spacing of both the native-trigger button and the fallback link row, as a new block near the existing `.prose`/article rules
- [X] T005 [P] Create `static/js/share.js` skeleton mirroring the `static/js/theme.js` IIFE + `DOMContentLoaded` pattern, querying the share partial's root element and doing nothing else yet
- [X] T006 Register `static/js/share.js` for loading on single-post pages only (matching how other page-scoped scripts are included in this repo's layouts, e.g. alongside `theme.js`'s inclusion pattern), so it is never fetched on list/section pages or the homepage

**Checkpoint**: Partial renders inert markup on post pages only; no JS
behavior yet. Foundation ready for user story work.

---

## Phase 3: User Story 1 - Share via native share sheet (Priority: P1) 🎯 MVP

**Goal**: On a browser/device with Web Share API support, activating the
share control opens the native OS share sheet pre-filled with the post's
title and permalink.

**Independent Test**: On a supporting browser/device, open a post page,
activate the share control, and confirm the native share sheet opens with
the correct title and link (quickstart.md Scenario 1).

- [X] T007 [US1] In `static/js/share.js`, add feature detection (`typeof navigator.share === 'function'`) evaluated when the share control is activated, per research.md
- [X] T008 [US1] Implement the native-share trigger's click handler: on supporting browsers, call `navigator.share({ title, url })` using the values from the `data-share-title`/`data-share-url` attributes set in T002 (FR-002)
- [X] T009 [US1] Toggle a class on the share root (e.g. `.share--native`) so the native-share trigger is shown and the fallback row is hidden when `navigator.share` is available, done at click-time per research.md (not at page load)
- [X] T010 [US1] Handle `navigator.share()` promise rejection: swallow `AbortError` (user dismissed the sheet) with no error surfaced and no page state change; do not fall back to the static links after a native attempt (FR-010, edge cases, research.md)

**Checkpoint**: User Story 1 is independently functional — run quickstart.md
Scenario 1 on a real supporting browser/device before moving on.

---

## Phase 4: User Story 2 - Share via fallback links (Priority: P2)

**Goal**: On a browser without Web Share API support, the reader sees
working X/Twitter, Facebook, and LinkedIn share links plus a copy-link
action with a "Copied!" confirmation.

**Independent Test**: On a non-supporting browser (e.g. desktop Safari or
Firefox), open a post page and confirm the fallback links and copy-link
action are visible and each works correctly (quickstart.md Scenario 2).

- [X] T011 [US2] Finalize the fallback link `href` values in `layouts/partials/share.html` using Hugo's URL-encoding helpers (`urlquery`/`absURL`) for the X/Twitter, Facebook, and LinkedIn share-intent URLs from research.md; each link MUST also have `target="_blank" rel="noopener noreferrer"` so it opens in a new tab (per spec.md US2 Acceptance Scenario 2) without exposing `window.opener` to the third-party origin (FR-003, FR-004)
- [X] T012 [US2] Confirm the fallback row (links + copy-link button) is the default visible state whenever JS has not run or `navigator.share` is unsupported, so the network links work even with JavaScript disabled (progressive enhancement, per research.md)
- [X] T013 [US2] Implement the copy-link click handler in `static/js/share.js` using `navigator.clipboard.writeText(permalink)`, toggling a "Copied!" confirmation element/class for ~2 seconds via `setTimeout` (FR-005, FR-006)
- [X] T014 [US2] Implement the copy-link failure path: on rejection (e.g. clipboard permission denied), do not show "Copied!" — instead make the permalink text selectable or show a brief inline message, so the reader is never left with silent failure (FR-007)

**Checkpoint**: User Stories 1 AND 2 both work independently — run
quickstart.md Scenario 2 on a real non-supporting browser.

---

## Phase 5: User Story 3 - Consistent appearance in both theme modes (Priority: P3)

**Goal**: The share control(s) are legible and on-theme in both light and
dark mode.

**Independent Test**: Toggle the site's theme switcher on a post page and
visually confirm the share control(s) remain legible and on-theme in both
modes (quickstart.md Scenario 3).

- [X] T015 [US3] Review and adjust the `.share-*` rules in `assets/css/main.css` against `[data-theme="light"]` tokens for contrast/legibility of icons, text, and the "Copied!" confirmation state
- [X] T016 [US3] Review and adjust the same rules against `[data-theme="dark"]` tokens for contrast/legibility
- [X] T017 [US3] Add hover and `:focus-visible` states to the share buttons/links matching this repo's existing interactive-element conventions, so keyboard focus is visibly indicated (Constitution Principle IV, FR-009)

**Checkpoint**: All three user stories independently functional — run
quickstart.md Scenario 3 in both theme modes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across the whole feature per Constitution
Principle V (manual verification is the only correctness gate in this repo).

- [X] T018 Run `hugo --minify` and confirm the production build completes with no errors
- [X] T019 Run the full `specs/001-share-button/quickstart.md` validation (all three scenarios plus the scope-boundary check) end-to-end
- [X] T020 [P] Spot-check the share control renders correctly on at least one post from each existing section (`content/article/`, `content/book/`, `content/cheat_sheet/`, `content/go/`), confirming FR-001's "every post" requirement and SC-003

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational; no dependency on US2/US3
- **User Story 2 (Phase 4)**: Depends on Foundational; shares files with US1
  but does not require US1's tasks to be complete (the fallback row is the
  default state regardless of whether native-share logic exists yet)
- **User Story 3 (Phase 5)**: Depends on Foundational; reviews CSS that US1
  and US2 also touch, so is easiest to verify after both are implemented,
  though the theme tokens it checks don't functionally depend on their logic
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### Within Each User Story

- Markup/href groundwork before JS behavior
- JS behavior before its failure/edge-case handling
- Story's checkpoint (manual quickstart scenario) before moving to the next
  priority

### Parallel Opportunities

- T004 and T005 (Phase 2) touch different files (`main.css`, `share.js`) and
  can run in parallel once T002 defines the markup/class names they target
- T020 (Phase 6) is independent of T018/T019 and can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run quickstart.md Scenario 1 on a real supporting
   device/browser
5. This alone is a viable increment: readers on supporting devices can share
   natively, even before the fallback path exists (though non-supporting
   browsers would see nothing until US2 lands — acceptable only as an
   interim state, not as a final ship)

### Incremental Delivery

1. Setup + Foundational → inert share partial on post pages only
2. Add User Story 1 → native share works → validate independently
3. Add User Story 2 → fallback links + copy-link work → validate
   independently — **this is the point at which the feature is complete
   enough to ship**, since both spec paths (P1 + P2) are covered
4. Add User Story 3 → theme polish confirmed in both modes → validate
5. Polish phase → build check + full quickstart pass → done

---

## Notes

- No `[Story]` label on Setup/Foundational/Polish tasks, per task format
  rules
- No test tasks generated — spec.md did not request tests and this repo has
  no automated test suite; `quickstart.md` scenarios are the verification
  mechanism instead
- Commit after each phase checkpoint, not after every individual task,
  given how small and interdependent these files are
