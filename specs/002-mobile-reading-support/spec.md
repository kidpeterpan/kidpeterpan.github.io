# Feature Specification: Mobile Reading Support

**Feature Branch**: `002-mobile-reading-support`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "Improve mobile reading experience on the blog: currently the site does not fully support comfortable reading on mobile devices. Need to identify and fix gaps in mobile support for article/post reading (typography, spacing, table of contents, code blocks, images, tables, mermaid diagrams, navigation) across the Hugo site (kidpeterpan.github.io) using the "Plus Ultra Paper" theme."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jump to a section from a mobile device (Priority: P1)

A reader on a phone opens a long post and wants to jump straight to a
particular section (e.g. skip intro, go to "Setup"). Today, the "on this
page" section list is only shown on wide screens and disappears entirely on
mobile, so a mobile reader has no way to see the post's outline or jump
between sections without manually scrolling through the whole article.

**Why this priority**: This is the single biggest reading-experience gap:
long posts are unusable to navigate on mobile today, and mobile is a
significant share of blog traffic.

**Independent Test**: On a narrow viewport, open a post that has an outline
(multiple `##`/`###` headings) and confirm the reader can open a list of the
post's sections and tap one to jump directly to it.

**Acceptance Scenarios**:

1. **Given** a reader is on a post with multiple sections, viewed on a
   narrow (mobile-width) viewport, **When** the post loads, **Then** a
   control to view the post's section outline is visible near the top of the
   article.
2. **Given** the section outline control is visible, **When** the reader
   activates it, **Then** the list of section links for that post is shown.
3. **Given** the section outline is shown, **When** the reader taps a
   section link, **Then** the page scrolls to that section's heading.
4. **Given** a post has no headings (no outline to show), **When** viewed on
   a narrow viewport, **Then** no empty/broken outline control is shown.

---

### User Story 2 - Navigate to another section of the site from mobile (Priority: P2)

A reader on a phone, while reading a post or browsing the homepage, wants to
go look at another part of the site (e.g. from "article" to "book" or "go").
Today, the header's section links are hidden entirely on mobile with no
replacement, so the only way to reach another section is to know its URL or
go back to the homepage and find a link in the page body.

**Why this priority**: This affects every page on mobile, not just posts,
but a reader can still reach other sections indirectly via the homepage or
footer, so it is one step less critical than the in-page TOC gap.

**Independent Test**: On a narrow viewport, open any page and confirm the
reader can open and use a menu that lists every site section and navigates
to it on tap.

**Acceptance Scenarios**:

1. **Given** a reader is on any page, viewed on a narrow viewport,
   **When** the page loads, **Then** a control to open the site's section
   navigation is visible in the header.
2. **Given** the navigation control is visible, **When** the reader
   activates it, **Then** links to every site section (the same ones shown
   in the desktop header) are shown.
3. **Given** the mobile navigation menu is open, **When** the reader taps a
   section link, **Then** they are taken to that section's page and the menu
   closes.
4. **Given** the mobile navigation menu is open, **When** the reader
   activates the control again (or taps outside the menu), **Then** the
   menu closes without navigating away.

---

### User Story 3 - Read a post with a wide table without the page scrolling sideways (Priority: P3)

A reader on a phone reaches a post that includes a data table with several
columns. Today, the table has no horizontal-scroll boundary of its own, so
on a narrow screen a wide table can force the entire page to scroll
sideways, which is disorienting and makes the rest of the article harder to
read.

**Why this priority**: Fewer posts contain wide tables than contain headings
or live on every page, so this affects a smaller slice of reading sessions
than Stories 1 and 2, but it directly harms readability wherever it occurs.

**Independent Test**: On a narrow viewport, open a post containing a table
wider than the viewport and confirm the page itself does not scroll
horizontally, while the table content remains fully reachable via scrolling
within the table area.

**Acceptance Scenarios**:

1. **Given** a post contains a table wider than the current viewport,
   **When** viewed on a narrow viewport, **Then** the overall page does not
   gain horizontal scroll.
2. **Given** such a table is shown, **When** the reader swipes/scrolls
   horizontally over the table, **Then** the table's hidden columns become
   visible.
3. **Given** a table fits within the viewport width, **When** viewed on a
   narrow viewport, **Then** it renders exactly as before (no unnecessary
   scroll container or visual change).

---

### Edge Cases

- What happens on a post with only one heading (nothing meaningful to
  navigate)? The section outline control MAY still appear if a `##`/`###`
  heading exists, since even a single jump target has some value; it MUST
  NOT appear on posts with zero headings.
- What happens if a reader rotates a phone from portrait to landscape, or
  resizes a browser window across the mobile/desktop breakpoint? Both the
  section outline and the site navigation menu MUST end up in the correct
  state for the new viewport width (mobile controls hidden and the existing
  desktop sidebar/nav shown again above the breakpoint, and vice versa)
  without requiring a page reload.
- What happens to the existing desktop table-of-contents sidebar and header
  navigation on wide screens? They MUST remain unchanged — this feature adds
  mobile-only affordances and must not alter the desktop experience.
- What happens on a post with a mermaid diagram wider than the viewport? It
  already scrolls horizontally within its own container (existing behavior)
  and is out of scope for this feature; this feature only adds the same
  contained-scroll protection to tables, which currently lack it.
- What happens with code blocks (`pre`/`code`)? They already scroll
  horizontally within their own container on overflow and are out of scope
  for this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On a narrow (mobile-width) viewport, the system MUST provide a
  way for the reader to view the current post's section outline (the same
  headings currently listed in the desktop "on this page" sidebar).
- **FR-002**: The mobile section outline MUST let the reader jump directly
  to any listed section by tapping/activating its link.
- **FR-003**: The mobile section outline MUST NOT appear on posts that have
  no headings to list.
- **FR-004**: On a narrow (mobile-width) viewport, the system MUST provide a
  way for the reader to open a menu listing every site section currently
  shown in the desktop header navigation.
- **FR-005**: Each link in the mobile section-navigation menu MUST navigate
  to the corresponding site section when activated.
- **FR-006**: The mobile section-navigation menu MUST be closeable without
  navigating away (e.g. by reactivating its control or tapping outside it).
- **FR-007**: Tables rendered within article content MUST NOT force the
  overall page to scroll horizontally on narrow viewports; any table wider
  than the viewport MUST scroll within its own bounded area instead.
- **FR-008**: Tables that already fit within the viewport width MUST render
  unchanged (no added scroll container or visual difference).
- **FR-009**: All new mobile controls (section outline toggle, navigation
  menu toggle, and their contents) MUST be operable via keyboard, not only
  touch/pointer, and MUST have an accessible name.
- **FR-010**: All new mobile controls MUST be visually consistent with the
  site's existing "Plus Ultra Paper" theme in both light and dark mode.
- **FR-011**: The existing desktop table-of-contents sidebar and desktop
  header navigation MUST remain visually and functionally unchanged above
  the mobile breakpoint.
- **FR-012**: Switching between mobile and desktop viewport widths (e.g. via
  device rotation or window resize) MUST update which controls are shown
  without requiring a page reload.

### Key Entities

- **Post**: The individual article/page being read; its heading structure
  (existing `.TableOfContents` data) drives the mobile section outline.
- **Site Section**: A top-level content section (`article`, `book`,
  `cheat_sheet`, `go`, etc.); the same set already listed in the desktop
  header drives the mobile navigation menu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a mobile-width viewport, a reader can reach any section of
  a post with headings in at most two taps (open outline, tap a link).
- **SC-002**: On a mobile-width viewport, a reader can reach any site
  section from any page in at most two taps (open menu, tap a link).
- **SC-003**: 100% of posts with headings expose a working mobile section
  outline; 0% of posts without headings show an empty one.
- **SC-004**: 0% of pages containing a wide table gain page-level horizontal
  scroll on narrow viewports; the table's own content remains fully
  reachable by scrolling within it.
- **SC-005**: The desktop reading and navigation experience shows no
  regressions (byte-for-byte the same behavior above the mobile breakpoint).

## Assumptions

- "Narrow (mobile-width) viewport" reuses the site's existing responsive
  breakpoint (currently 900px max-width, where the desktop TOC sidebar and
  header nav already switch off) rather than introducing a new breakpoint.
- The mobile section outline is a collapsible "on this page"-style control
  placed near the top of the article (default collapsed), reusing the data
  Hugo already renders via `.TableOfContents` — no new content authoring is
  required from existing or future posts.
- The mobile navigation menu is a standard toggle ("hamburger") control in
  the header that reveals the same section links already rendered for
  desktop (`site.Sections`) — no new navigation items are introduced.
- Code blocks and mermaid diagrams already have their own horizontal-scroll
  containers and are confirmed working today; this feature does not change
  them and focuses on the three confirmed gaps: TOC access, header
  navigation access, and table overflow containment.
- No analytics/tracking of mobile-control usage is required for v1.
- This feature applies to all pages rendered through the shared
  `layouts/_default/baseof.html` shell (mobile nav) and to posts rendered
  through `layouts/_default/single.html` (mobile TOC and table overflow).
