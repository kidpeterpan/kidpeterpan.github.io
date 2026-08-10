# Feature Specification: Site Search

**Feature Branch**: `003-site-search`

**Created**: 2026-08-08

**Status**: Draft

**Input**: User description: "Add site search to the blog so readers can find posts by keyword. The site is a static Hugo blog deployed to GitHub Pages; search must work without any backend, must handle Thai-language content, must be fast, and must fit the existing 'Plus Ultra Paper' design."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search posts from any page (Priority: P1)

A visitor remembers a topic they read before (e.g. "named return values" or
"errors") but not which post it was in. They want to type a keyword into a
search box available on every page, see matching posts instantly, and open
the right one without leaving the search flow.

**Why this priority**: This is the core value of the feature — without it
the blog has no way to find older posts except scrolling the homepage.

**Independent Test**: On any page, open the search box, type a keyword that
appears in a published post, and confirm the matching post appears in the
results and can be opened with a single click.

**Acceptance Scenarios**:

1. **Given** a visitor is on any page of the blog, **When** they activate
   the search control, **Then** a search input with clear focus is shown.
2. **Given** the visitor types a keyword, **When** the query is a few
   characters long, **Then** matching posts are listed with their title and
   a short snippet.
3. **Given** results are shown, **When** the visitor clicks/taps a result,
   **Then** the post opens in the same tab.
4. **Given** the search UI is open, **When** the visitor presses Escape,
   **Then** the search UI closes and focus returns to where it was.

---

### User Story 2 - Search in Thai (Priority: P1)

The blog's main content is Thai (with English technical terms embedded).
A reader types a Thai keyword such as "ตัวแปร" or "pointer" and expects the
search to match Thai text correctly — not only whole-word English matches.

**Why this priority**: Most posts are Thai; a search that cannot handle Thai
correctly would fail on the majority of the site's content.

**Independent Test**: Search for a Thai word that appears inside several
posts and confirm the correct posts are returned and the keyword is
highlighted in the snippet.

**Acceptance Scenarios**:

1. **Given** a Thai keyword that exists in published posts, **When** the
   visitor searches for it, **Then** those posts appear in the results.
2. **Given** a result snippet containing the Thai keyword, **When** results
   are rendered, **Then** the matching keyword is visually highlighted.
3. **Given** an English technical term embedded in Thai text, **When** the
   visitor searches for that term, **Then** the post containing it is found.

---

### User Story 3 - Search stays fast and private (Priority: P2)

The visitor's search should feel instant and should not send their queries
to any third-party server.

**Why this priority**: This differentiates the approach from hosted search
services and matches the static, dependency-light nature of the site.

**Independent Test**: Search a common word and confirm results render
without a noticeable network round-trip beyond loading the prebuilt index.

**Acceptance Scenarios**:

1. **Given** a visitor with a typical connection, **When** they search,
   **Then** results appear in under one second.
2. **Given** the visitor searches, **When** the search completes,
   **Then** no query text is transmitted to any external server.

---

### Edge Cases

- What happens when the query has no matches? A friendly "no results"
  message, not a broken/empty UI.
- What happens when the search index is still loading? A subtle loading
  state so the visitor knows the search is initializing.
- What happens when JavaScript is unavailable? The site must still work
  normally; search simply is not available (graceful degradation).
- What happens when the query is empty or only whitespace? No results shown
  until there is a real query.
- What happens to draft/unpublished posts? They must never appear in
  results.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST provide a search control that is reachable from
  every page (header area).
- **FR-002**: Search MUST cover all published posts across every section
  (go, article, book, cheat_sheet).
- **FR-003**: Results MUST show the post title, its section, and a short
  snippet with matching terms highlighted.
- **FR-004**: The search index MUST be generated automatically as part of
  the build/deploy pipeline so new posts are searchable without manual steps.
- **FR-005**: Search MUST work entirely on the static site without a backend
  service.
- **FR-006**: Search MUST correctly match Thai-language text and embedded
  English technical terms.
- **FR-007**: The search UI MUST be usable with a keyboard (open, type,
  navigate results, close) and MUST have accessible names and visible focus.
- **FR-008**: Draft and unpublished content MUST NOT appear in search
  results.
- **FR-009**: Results MUST appear to the user within one second on a typical
  connection once the index is loaded.
- **FR-010**: The search UI MUST match the existing "Plus Ultra Paper" theme
  and work in both light and dark mode.

### Key Entities *(include if feature involves data)*

- **Search index**: A static, prebuilt dataset of all searchable posts —
  one entry per post with its text content, title, section, and URL.
- **Search result**: An entry returned for a query — post title, section,
  snippet with highlighted match, and the post URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of published posts are discoverable by searching for a
  keyword that appears in their content.
- **SC-002**: Search results render within one second on a typical
  connection, measured from first keystroke to visible results.
- **SC-003**: Thai-language queries and mixed Thai/English queries return
  the correct posts in 100% of manual test cases.
- **SC-004**: New posts are searchable after deployment with no manual
  indexing step.
- **SC-005**: The search UI passes keyboard-only navigation for open, type,
  select, and close flows, verified manually in both light and dark mode.

## Assumptions

- The site remains a fully static deployment on GitHub Pages with no server
  or database; search must be client-side.
- The search technology is chosen by the site owner: **Pagefind** — a
  static search tool that builds a search index from the site output and
  runs entirely in the browser. Justification (per Constitution Principle
  III): no hosted backend, no new runtime API for the reader, and it is a
  build-time tool invoked after the Hugo build rather than a bundled
  library.
- Pagefind will be invoked as a build step (via `npx`) in the deploy
  workflow; it does not become part of the blog's runtime bundle beyond the
  generated index and small JS assets.
- Search covers all content sections automatically including future posts;
  new posts require no manual registration.
- The existing header layout may gain one new control (search button) but
  no visual redesign; the component must blend into the current design
  system.
- No analytics or query logging is added; privacy is preserved.
