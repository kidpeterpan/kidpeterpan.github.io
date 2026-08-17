# Feature Specification: Tutorial Series Ordering & Episode Navigation

**Feature Branch**: `005-tutorial-series-navigation`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Tutorial sections should read as ordered courses instead of reverse-chronological blogs. Two parts: (1) section list pages for tutorial sections (go, git) list episodes in ascending course order (episode 01 first) instead of newest-first; this must be opt-in per section so article/, book/, cheat_sheet/ and all /tags/* pages keep their current newest-first ordering. (2) each episode page gets previous/next episode navigation so readers can move through the course without returning to the section index. Ordering must not rely on the date field (Go episodes 07 and 08 share the same date). Homepage 'latest notes' list stays reverse-chronological."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a course at episode 1 (Priority: P1)

A newcomer hears the blog has a Go tutorial and opens the Go section. Today the list is ordered newest-first, so the first thing they see is the final episode ("Go Tooling") and the starting point ("Setting Up Your Go Environment") sits at the very bottom of a list of eleven. The visitor wants the section page to present the course in the order it is meant to be read, so the obvious first click is genuinely the first lesson.

**Why this priority**: This is the entry point to 19 of the site's 24 notes. A learner who lands on the hardest episode first is likely to bounce before finding episode 1. Nothing else in this feature matters if the front door still opens backwards.

**Independent Test**: Open the Go section page and the Git section page. Episodes read top-to-bottom in course order, starting at episode 01. Open the article, book, and cheat_sheet section pages and any tag page — all still list newest-first, unchanged.

**Acceptance Scenarios**:

1. **Given** a section marked as an ordered course, **When** its section page renders, **Then** its notes appear in ascending course order with episode 01 at the top and the final episode at the bottom.
2. **Given** a section not marked as an ordered course, **When** its section page renders, **Then** its notes appear newest-first exactly as they do today.
3. **Given** any tag listing page, **When** it renders, **Then** its notes appear newest-first, unaffected by any section's course marking.
4. **Given** the homepage, **When** it renders, **Then** the "latest notes" list and its filter behaviour remain newest-first and otherwise unchanged.
5. **Given** two episodes in an ordered course that carry the same publication date, **When** the section page renders, **Then** they still appear in correct course order relative to each other.

---

### User Story 2 - Continue to the next episode without backtracking (Priority: P2)

A reader finishes Git episode 3 ("Making a Commit") and wants episode 4. Today the article ends with no onward link, so they must use the browser back button or the nav to return to the section index, find their place in a reverse-ordered list, and click again. The reader wants a direct link to the next episode at the point where they finish reading, and a link back to the previous one if they need to revisit it.

**Why this priority**: This turns a set of standalone posts into a course that can be read straight through. It is valuable on its own, but it depends on a defined course order, which User Story 1 establishes.

**Independent Test**: Open any middle episode of the Go or Git course and confirm both a previous and a next link appear, each naming the adjacent episode and leading to it. Open a note in a non-course section and confirm no such navigation appears.

**Acceptance Scenarios**:

1. **Given** an episode in the middle of an ordered course, **When** the reader reaches the end of the article, **Then** a link to the previous episode and a link to the next episode are shown, each labelled with that episode's title.
2. **Given** the first episode of an ordered course, **When** it renders, **Then** only a next-episode link is shown and no previous-episode link appears.
3. **Given** the final episode of an ordered course, **When** it renders, **Then** only a previous-episode link is shown and no next-episode link appears.
4. **Given** a note in a section that is not an ordered course, **When** it renders, **Then** no episode navigation appears.
5. **Given** an episode page, **When** the reader navigates using only the keyboard, **Then** the previous and next links are reachable via Tab and activate with Enter, and each has an accessible name identifying the destination episode.
6. **Given** an episode page in either light or dark mode, **When** the episode navigation renders, **Then** it matches the existing "Plus Ultra Paper" styling and remains readable in both modes.

---

### Edge Cases

- **A course section with exactly one note**: neither a previous nor a next link appears; the article renders as it does today.
- **A course section with no notes**: the section page renders its existing empty state; no ordering or navigation logic produces an error.
- **Two episodes sharing a publication date**: course order is still unambiguous and stable (Go episodes 07 and 08 both carry `2026-08-07` today).
- **An episode inserted between two existing ones later**: the author can place it at the right position without rewriting the dates of surrounding episodes.
- **A course episode without the expected two-digit prefix**: the section still renders a deterministic, stable order rather than an arbitrary or build-dependent one, and the unprefixed episode is placed predictably rather than dropped from the listing or the navigation chain.
- **A draft or future-dated episode**: it is excluded from the course exactly as it is excluded from listings today, and the navigation links skip over it so no reader is sent to a missing page.
- **A reader returning mid-course**: with ascending order the newest episode is now at the bottom of the section page; the reader who wants "what's new" still finds recent notes on the homepage's newest-first list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A section MUST be able to declare itself an ordered course through its own section metadata, with no effect on any other section.
- **FR-002**: A section that has not declared itself an ordered course MUST list its notes newest-first, exactly as it does today.
- **FR-003**: A section that has declared itself an ordered course MUST list its notes in ascending course order on its section page.
- **FR-004**: Course order MUST NOT be derived from the publication date, because episodes may share a date.
- **FR-005**: Course order MUST be deterministic and stable across builds for a given set of content.
- **FR-006**: Tag listing pages MUST continue to list notes newest-first regardless of any section's course declaration.
- **FR-007**: The homepage's "latest notes" list, its filter controls, and its section cards MUST remain unchanged in ordering and behaviour.
- **FR-008**: A note belonging to an ordered course MUST display a link to the preceding episode and a link to the following episode, where those exist.
- **FR-009**: Episode navigation links MUST identify their destination by that episode's title, not by a bare directional word alone.
- **FR-010**: The first episode of a course MUST NOT display a previous-episode link, and the final episode MUST NOT display a next-episode link.
- **FR-011**: Notes in sections that are not ordered courses MUST NOT display episode navigation.
- **FR-012**: Episode navigation MUST be operable by keyboard and MUST expose an accessible name for each link.
- **FR-013**: Episode navigation MUST render correctly in both light and dark mode using the existing design system's tokens and textures.
- **FR-014**: The set of notes used for episode navigation MUST match the set listed on the section page, so a navigation link never points to a page absent from the listing.
- **FR-015**: Adding a new episode to an existing course MUST require only the author's normal note-authoring step plus the declared ordering information — no edits to sibling episodes.

### Key Entities

- **Ordered course**: a section whose notes are meant to be read in sequence rather than by recency. Carries a declaration in its section metadata and, through its notes, a defined reading order. The site currently has two: the Go tutorial (11 episodes) and the Git tutorial (8 episodes).
- **Episode**: a single note inside an ordered course. Has a position in the course, a title, and at most one preceding and one following episode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor opening the Go or Git section page sees the course's first episode as the topmost entry, reachable in one click without scrolling past other episodes.
- **SC-002**: A reader can read an entire course from first episode to last using only the on-page navigation, making zero return trips to the section index or the browser back button.
- **SC-003**: Every one of the site's other listing pages — the homepage, the article, book, and cheat_sheet sections, and all tag pages — presents notes in the same order after the change as before it.
- **SC-004**: Course order is correct for every episode of both courses, including the two Go episodes that share a publication date.
- **SC-005**: The site builds cleanly for production with no errors, and every affected page renders correctly in both light and dark mode.
- **SC-006**: Publishing a new episode at the end of a course, or inserting one between two existing episodes, requires editing only that new episode's own file plus, at most, its section's metadata.

## Assumptions

- Course order comes from each episode's two-digit filename prefix (see Resolved Decisions, Q1). No existing episode file is edited or renamed by this change.
- Only the Go and Git sections are declared ordered courses in this change. The article, book, and cheat_sheet sections keep newest-first ordering; either can be converted later by adding the same declaration.
- Episode navigation is placed at the end of the article body, where a reader finishes reading, rather than at the top of the page.
- Navigation labels follow the existing design system's convention of short uppercase Latin kickers (as already used for section kickers and the "MIN" read-time label), paired with the episode's own Thai or English title.
- Navigation does not wrap: the last episode does not link back to the first.
- The section page keeps its current card layout and information (title, date, read time, tags). This feature changes the order of entries and adds article-level navigation; it does not redesign the cards or add visible episode-number badges.
- No new runtime dependency, build step, or client-side script is introduced; the feature is expected to be satisfiable with the existing toolchain, per the project constitution's Simplicity First and Minimal Dependencies principles.
- Verification is manual against a running dev server plus a clean production build, per the constitution's Manual Verification principle; the repository has no automated test suite.

## Resolved Decisions

- **Q1 — How is an episode's position in the course declared?** **Resolved: the episode's own filename prefix.** Every existing episode is already named with a two-digit prefix (`01-`…`11-` for Go, `01-`…`08-` for Git), so the reading order is already encoded in the content and needs no backfill. An episode's position is therefore fixed by its filename, which also means it is fixed by its published URL.

  *Accepted consequences*: repositioning a published episode changes its URL and requires a redirect from the old address; inserting an episode between two existing ones requires either an intercalated prefix or renumbering the episodes after it. Both are rare for a published tutorial and are accepted in exchange for zero migration cost and one single ordering rule (constitution Principle I, Simplicity First).

  *Author's rule going forward*: a new episode in an ordered course is named with the next two-digit prefix. Nothing else is required of the author, satisfying FR-015.
