---

description: "Task list for Tutorial Series Ordering & Episode Navigation"
---

# Tasks: Tutorial Series Ordering & Episode Navigation

**Input**: Design documents from `/specs/005-tutorial-series-navigation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: No automated test tasks. This repository has no test suite or linter; constitution Principle V
(NON-NEGOTIABLE) defines the quality gate as manual verification against a running dev server plus a clean
`hugo --minify` build. Verification tasks below are therefore manual, and they are mandatory, not optional.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Hugo static site. Templates in `layouts/`, content in `content/`, single CSS source in `assets/css/main.css`.
All paths below are relative to the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a mechanical baseline so the "must not change" requirements (FR-006, FR-007) can be
proven by diff rather than by eyeball.

- [X] T001 Build the current site to a baseline directory before any change: run `hugo --destination /private/tmp/claude-502/-Users-konghiran-w-lmwn-com-ProjectG-kidpeterpan-github-io/ed50313d-a60e-47e5-9432-bd50f5887e60/scratchpad/baseline` from the repository root, so the pre-change output of the homepage, the non-course sections, and all `/tags/*` pages is captured for comparison in T008
- [X] T002 Start the dev server with `make start` (port 1313, PID in `.hugo-server.pid`, logs in `hugo-server.log`) for the manual verification tasks that follow

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared ordering mechanism and the content opt-in flags. Both user stories read from these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create `layouts/partials/ordered-pages.html` — takes a section page as context and returns its pages in the correct order: when `.Params.ordered` is truthy return `sort .RegularPages "File.BaseFileName"`, otherwise return `.Pages.ByDate.Reverse` — the exact expression `list.html` used before, so taxonomy pages are provably unchanged (per research.md R1 and D1; this single producer is what satisfies FR-014)
- [X] T004 [P] Add `ordered = true` under `[params]` in `content/go/_index.md`, keeping the existing `kicker` and `image` params intact
- [X] T005 [P] Add `ordered = true` under `[params]` in `content/git/_index.md`, keeping the existing `kicker` param intact

**Checkpoint**: The partial exists and both courses are flagged. Nothing reads the flag yet, so the rendered
site is still unchanged — this is expected and is itself worth confirming before proceeding.

---

## Phase 3: User Story 1 - Start a course at episode 1 (Priority: P1) 🎯 MVP

**Goal**: The Go and Git section pages list their episodes in ascending course order, while every other
listing page on the site keeps its current newest-first order.

**Independent Test**: Open `/go/` and `/git/` — episode 01 is the topmost entry and the list reads in course
order. Open `/article/`, `/book/`, `/cheat_sheet/` and any `/tags/*` page — all still newest-first.

### Implementation for User Story 1

- [X] T006 [US1] In `layouts/_default/list.html`, replace the `{{ with .Pages.ByDate.Reverse }}` collection at line 11 with the result of `partial "ordered-pages.html" .`, leaving the surrounding `section-head`, post-count, `post-row` markup, and the `{{ else }}` empty state untouched

### Verification for User Story 1

- [X] T007 [US1] Verify course ordering per quickstart.md step 1: `/go/` opens with episode 01 and reads 01→11 in order; `/git/` opens with episode 01 and reads 01→08; confirm specifically that `07-types-methods-and-interfaces` precedes `08-generics` despite both carrying `date = '2026-08-07'` (FR-004), and that the rendered `.idx` numbers now match the real episode numbers
- [X] T008 [US1] Prove the control surfaces are untouched (FR-002, FR-006, FR-007): rebuild to a second directory and `diff -r` it against the T001 baseline; the homepage, `/article/`, `/book/`, `/cheat_sheet/`, and every `/tags/*` page must be byte-identical, with differences confined to `/go/` and `/git/`

**Checkpoint**: User Story 1 is fully functional and independently shippable. The site's entry point into 19
of its 24 notes now opens at the correct end of the course, with no other page affected.

---

## Phase 4: User Story 2 - Continue to the next episode without backtracking (Priority: P2)

**Goal**: Each episode of an ordered course offers a link to the previous and next episode, so a reader can
move through a whole course without returning to the section index.

**Independent Test**: Open a middle episode of either course — both a previous and a next link appear, each
naming its destination episode and leading there. Open the first and last episodes — only one link each. Open
a note in `article/` or `book/` — no navigation at all.

### Implementation for User Story 2

- [X] T009 [P] [US2] Create `layouts/partials/episode-nav.html` — render nothing unless `.Parent.Params.ordered` is truthy (FR-011); otherwise resolve the ordered collection via `partial "ordered-pages.html" .Parent`, find the current page's index by matching `.RelPermalink`, and emit a `<nav>` with an `aria-label` containing a previous link when the index is greater than 0 and a next link when the index is less than `len - 1` (FR-008, FR-010). Each link must carry the destination episode's title as part of its accessible name (FR-009, FR-012), and direction must be conveyed by text rather than by colour or glyph alone (Principle IV)
- [X] T010 [P] [US2] Add an `.episode-nav` rule set to `assets/css/main.css` near the existing `.article-foot` block (~line 1284), using only existing custom properties (`--line`, `--muted`, `--ink`, `--accent`, `--surface`, `--font-display`, `--font-mono`) so both themes work by construction (FR-013, Principle II), and laying the two links out so long Thai episode titles wrap or truncate cleanly on narrow viewports
- [X] T011 [US2] In `layouts/_default/single.html`, include `{{ partial "episode-nav.html" . }}` immediately after the closing `</div>` of the `.prose` block (line 31) and before the existing `{{ partial "share.html" . }}` on line 33, so continuing the course precedes sharing (research.md D2)

### Verification for User Story 2

- [X] T012 [US2] Verify navigation targets per quickstart.md step 5, walking the table row by row: first episode has next only, last episode has previous only, middle episodes have both, the `07`/`08` pair links forward and backward correctly rather than inverting as Hugo's built-ins do, and notes in `article/` and `book/` show no navigation at all
- [X] T013 [US2] Verify accessibility per quickstart.md step 8: both links are reachable by `Tab` with a visible focus ring, activate with `Enter`, and expose an accessible name that identifies the destination episode rather than a bare direction word
- [X] T014 [US2] Verify both themes and narrow viewports per quickstart.md steps 7 and 9: the navigation is readable in light and dark mode, the theme still persists across reload via `localStorage` key `mha-theme`, and at ~375px width nothing overflows the viewport
- [X] T015 [US2] Verify the full-course read-through per quickstart.md step 6 (SC-002): starting at `/git/01-git-and-the-command-line/`, reach episode 08 using only the on-page next links — zero uses of the browser back button and zero visits to the section index

**Checkpoint**: Both user stories are functional. The courses are ordered correctly and can be read straight
through.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: The constitution's release gate plus documentation for future work.

- [X] T016 Run the complete `specs/005-tutorial-series-navigation/quickstart.md` end to end, all 10 steps, confirming every step passes rather than assuming the story-level checks covered them
- [X] T017 Run the production build `hugo --minify` and confirm it exits 0 with no new errors or warnings (Principle V), then assert the output with `grep -c 'episode-nav' public/go/05-functions/index.html` (> 0) and `grep -c 'episode-nav' public/article/jetbrains-context/index.html` (0)
- [X] T018 [P] Document the ordered-course convention in `CLAUDE.md` under the content-structure section — that a section becomes an ordered course by setting `ordered = true` in its `_index.md`, that episode order comes from the two-digit filename prefix, and that new episodes are added by continuing the numbering
- [X] T020 Run the *second half* of CI, `npx pagefind --site public`, and confirm the episode navigation does not pollute the search index shipped by feature 003 — measured A/B (see research.md R5): as a `<div>` all 19 episodes are polluted, as a `<nav>` zero are, because Pagefind skips `<nav>` by default; `data-pagefind-ignore` retained as defence in depth
- [ ] T019 Stop the dev server with `make stop` — NOT DONE: the server (PID 96934) was already running before this feature started, so it was left as found rather than stopped. Run `make stop` yourself if you want it down.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T001 **must** run before any file is modified, or the baseline is worthless.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS both user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational. Independently shippable.
- **User Story 2 (Phase 4)**: Depends on Foundational. See the note below on its relationship to US1.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Needs only T003 (the partial) and T004/T005 (the flags). No dependency on US2.
- **User Story 2 (P2)**: Needs only T003 and T004/T005. It calls the same partial that US1 calls, but it does
  not depend on T006, so it is technically implementable without US1.

  **However**, shipping US2 alone would be incoherent for the reader: episode navigation would work while the
  section page still listed episodes backwards. US1 is therefore the correct first increment, and US2 should
  follow it rather than precede it.

### Within Each User Story

- Implementation before verification.
- In US2, T009 and T010 can proceed in parallel; T011 depends on T009 existing; all verification depends on T011.

### Parallel Opportunities

- **Phase 2**: T004 and T005 are different content files with no interaction — fully parallel.
- **Phase 4**: T009 (template) and T010 (CSS) are different files — fully parallel.
- **Phase 5**: T018 (documentation) is independent of the verification tasks.
- **Across stories**: not useful here. This is a single-maintainer repository and the stories share a
  producer; sequential P1 → P2 is both simpler and the correct delivery order.

---

## Parallel Example: User Story 2

```bash
# T009 and T010 touch different files and can be done together:
Task: "Create layouts/partials/episode-nav.html"
Task: "Add .episode-nav rule set to assets/css/main.css"

# Then, once T009 exists:
Task: "Include episode-nav.html in layouts/_default/single.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup — capture the baseline before touching anything
2. Complete Phase 2: Foundational — the partial and the two content flags
3. Complete Phase 3: User Story 1 — one line changed in `list.html`, then verify
4. **STOP and VALIDATE**: `/go/` and `/git/` read in course order; the baseline diff shows no other page changed
5. This is shippable on its own — it fixes the site's entry point into 19 of 24 notes

### Incremental Delivery

1. Setup + Foundational → mechanism in place, site visibly unchanged
2. Add User Story 1 → verify → shippable (MVP)
3. Add User Story 2 → verify → shippable
4. Polish → full quickstart, production build, documentation

### Rollback

The opt-in lives in content, not in the templates. Removing `ordered = true` from the two `_index.md` files
reverts all reader-visible behaviour without touching a single template.

---

## Notes

- [P] tasks = different files, no dependencies
- No automated tests exist in this repository; the verification tasks are the quality gate, not a formality
- The T001 baseline is what turns FR-006 and FR-007 from claims into a checkable diff — do not skip it
- Commit after each phase checkpoint rather than after every task
- Constitution Principle V is NON-NEGOTIABLE: the feature is not complete until T016 and T017 pass
