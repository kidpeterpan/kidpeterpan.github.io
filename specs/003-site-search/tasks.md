# Tasks: Site Search

**Input**: Design documents from `/specs/003-site-search/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/pagefind.md

**Tests**: No automated test suite in this repo (repo convention — no test framework configured). Verification is manual via quickstart.md; no test tasks are generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Hugo static site — paths follow the repo's existing structure: `layouts/`, `static/js/`, `assets/css/`, `.github/workflows/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the search toolchain and pipeline step so an index can be produced at all.

- [X] T00- [ ] T001 Add pinned devDependency `"pagefind": "1.5.2"` to package.json and regenerate package-lock.json via `npm install`
- [X] T00- [ ] T002 Add an "Index with Pagefind" step to `.github/workflows/deploy.yml` between the `hugo --minify` build step and the artifact upload: `npx pagefind --site public`
- [X] T00- [ ] T003 Verify local index generation works: run `hugo --minify` then `npx pagefind --site public` from repo root and confirm `public/pagefind/` is created with index files, `pagefind-ui.js`, and `pagefind-ui.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI pieces that MUST exist before the user stories can be completed.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T00- [ ] T004 Create `static/js/search.js` with: dialog open/close helpers, Escape-to-close handling, focus return to the trigger button, and a single `initPagefindUI()` function that lazy-loads `/pagefind/pagefind-ui.js` + `/pagefind/pagefind-ui.css` then instantiates `PagefindUI` with `element`, `debounceTimeoutMs: 100`, `baseUrl: "/"` (function must be idempotent — no double init)
- [X] T00- [ ] T005 Create `layouts/partials/search.html` containing the `<dialog>` overlay with an accessible search mount element and a close button with `aria-label`
- [X] T00- [ ] T006 [P] Add a search trigger button with `aria-label="Search"` next to the theme toggle in `layouts/_default/baseof.html`
- [X] T00- [ ] T007 [P] Add `.pagefind-ui` theme-token overrides to `assets/css/main.css` (fonts, colors, spacing matching the design system; dark mode via `[data-theme="dark"]` rules) so the component matches both themes

**Checkpoint**: Foundation ready — dialog markup, JS, trigger, and styling exist; user story implementation can now begin.

---

## Phase 3: User Story 1 - Search posts from any page (Priority: P1) 🎯 MVP

**Goal**: A visitor can open search from any page, type a keyword, see matching posts, and open one.

**Independent Test**: On any page, activate the search button, type `pointer`, confirm the Pointers post appears with a highlighted snippet, and open it.

### Implementation for User Story 1

- [X] T00- [ ] T008 [US1] Include the search partial and `search.js` script in `layouts/_default/baseof.html` (partial near header/footer, `<script src="/js/search.js">` beside the existing theme.js script tag)
- [X] T00- [ ] T009 [US1] Confirm focus flow in `static/js/search.js`: opening focuses the search input, pressing Escape closes the dialog, focus returns to the trigger button (verify in browser)
- [X] T0- [ ] T010 [US1] Verify end-to-end per quickstart.md scenario 1–4: index builds, dialog opens from header on homepage and a post page, English keyword search returns the correct post, results open in the same tab

**Checkpoint**: User Story 1 fully functional and testable independently — this is the MVP.

---

## Phase 4: User Story 2 - Search in Thai (Priority: P1)

**Goal**: Thai-language queries and embedded English terms match correctly.

**Independent Test**: Search `ตัวแปร` and confirm posts containing that Thai word are returned with the keyword highlighted in snippets.

### Implementation for User Story 2

- [X] T0- [ ] T011 [US2] Verify no `--lang` flag is used and the generated index auto-detects Thai; confirm a Thai query (`ตัวแปร`) and a mixed query (`named return`) return the correct posts with highlighted matches per quickstart.md scenario 2
- [X] T0- [ ] T012 [US2] Add Thai + mixed Thai/English query cases to the verification scenarios in `specs/003-site-search/quickstart.md`

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Search stays fast and private (Priority: P2)

**Goal**: Search feels instant and sends no queries to any third-party server.

**Independent Test**: Search a common word; confirm results render quickly and no external network request is made beyond the local pagefind assets.

### Implementation for User Story 3

- [X] T0- [ ] T013 [US3] Ensure Pagefind assets load lazily on first dialog open (not on initial page load) in `static/js/search.js` so the rest of the site stays light
- [X] T0- [ ] T014 [US3] Verify with DevTools network tab that searching triggers no requests to external hosts — only local `/pagefind/` assets load once (document result in quickstart.md scenario 7)

**Checkpoint**: All user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification and repository hygiene across the whole feature.

- [X] T0- [ ] T015 Check `.gitignore` — confirm `/public/` is ignored so generated pagefind output never lands in the repo; add it if missing
- [X] T0- [ ] T016 Run the full production check: `hugo --minify` then `npx pagefind --site public`, both must exit 0 with no errors
- [X] T0- [ ] T017 Manual verification per Constitution Principle V: serve `public/`, exercise search in browser in both light and dark themes, including keyboard-only flow, and confirm no broken states (run quickstart.md scenarios 1–7)
- [X] T0- [ ] T018 Update `CLAUDE.md` commands section if `npx pagefind --site public` should be part of the documented build flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion; run in priority order
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — depends on US1's dialog/UI being in place to be demonstrable
- **User Story 3 (P2)**: Can start after Foundational — builds on US1's search.js

### Within Each User Story

- UI markup before JS wiring, JS before styling verification, verification last.

### Parallel Opportunities

- Setup tasks T002 and T003 can run in parallel with T001 after the dependency install (different files).
- Foundational tasks T005, T006, T007 are [P] — different files, no dependencies.
- Polish tasks T015, T016, T018 are independent of each other; T017 requires everything else.

---

## Parallel Example: User Story 1

```bash
# No [P] tasks within US1 — sequential: partial include → focus verification → e2e check
```

## Parallel Example: Foundational Phase

```bash
Task: "Create layouts/partials/search.html with dialog overlay"
Task: "Add search trigger button to layouts/_default/baseof.html"
Task: "Add .pagefind-ui overrides to assets/css/main.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: search `pointer`, open the post, check keyboard + both themes
5. Deploy/demo if ready (US2 Thai behavior comes free with the same index — verify during US2 phase)

### Incremental Delivery

1. Setup + Foundational → index builds in CI, dialog UI exists
2. Add User Story 1 → search works end-to-end (MVP!)
3. Add User Story 2 → Thai queries verified
4. Add User Story 3 → lazy-load + privacy verified
5. Polish → hygiene checks + full quickstart pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence

---

## Phase 7: Convergence

- [ ] T019 Perform the manual browser verification required by Constitution V: serve `public/` (e.g. `python3 -m http.server 8080 --directory public`), then run quickstart.md scenarios 1–7 in a real browser — including Thai query `ตัวแปร`, mixed `named return`, no-result and empty states, keyboard-only open/type/select/Escape flow, and both light and dark themes via the theme toggle; confirm no broken states before reporting the feature complete (Constitution V, partial)

