# Feature Specification: Share Button

**Feature Branch**: `001-share-button`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "Add a share button to individual blog post pages (layouts/_default/single.html) so readers can share the current post. Behavior: on supporting browsers, tapping/clicking the share control invokes the native OS share sheet via the Web Share API (navigator.share) with the post's title and permalink. On browsers without Web Share API support (desktop Safari/Firefox), fall back to a small set of static share links/icons: X/Twitter, Facebook, LinkedIn, and a \"copy link\" action that copies the permalink to the clipboard with a brief visual confirmation (e.g. \"Copied!\"). Must match the existing \"Plus Ultra Paper\" visual theme and work in both light and dark mode. Only needed on single post pages, not list/section pages or the homepage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share via native share sheet on a supporting device (Priority: P1)

A reader on a mobile device (or any browser that supports the native OS share
capability) is reading a blog post and wants to send it to a friend via a
messaging app, social app, or email. They tap a single share control and the
device's native share sheet opens, pre-filled with the post's title and link,
so they can pick a destination app in one step.

**Why this priority**: This is the primary, lowest-friction sharing path and
covers the majority of mobile readers, who are the most likely audience to
share a post socially.

**Independent Test**: On a browser/device that supports the native share
capability, open a post page, activate the share control, and confirm the OS
share sheet appears pre-filled with the post title and the correct permalink.

**Acceptance Scenarios**:

1. **Given** a reader is on a single post page in a browser that supports the
   native share capability, **When** they activate the share control, **Then**
   the OS share sheet opens containing the post's title and its permalink.
2. **Given** the native share sheet is open, **When** the reader selects a
   destination app and completes the share, **Then** the shared content
   includes a working link back to the post.
3. **Given** the reader dismisses the native share sheet without choosing a
   destination, **When** they return to the page, **Then** the post page is
   unaffected and no error is shown.

---

### User Story 2 - Share via fallback links on a non-supporting browser (Priority: P2)

A reader on a desktop browser that does not support the native OS share
capability (e.g. desktop Safari or Firefox) wants to share the post to a
specific social network. They see a small set of share icons/links (X/Twitter,
Facebook, LinkedIn) and a "copy link" action, and use whichever matches their
intent.

**Why this priority**: Ensures readers on non-supporting browsers — a
significant share of desktop traffic — are not left without any way to share,
preserving reach for the blog.

**Independent Test**: On a browser without native share support, open a post
page and confirm the fallback share icons/links and copy-link action are
visible and each opens the correct destination or copies the correct link.

**Acceptance Scenarios**:

1. **Given** a reader is on a single post page in a browser without native
   share support, **When** the page loads, **Then** they see share links for
   X/Twitter, Facebook, and LinkedIn plus a copy-link action instead of a
   native share prompt.
2. **Given** the fallback share links are visible, **When** the reader
   activates the X/Twitter, Facebook, or LinkedIn link, **Then** a new tab
   opens to that network's share flow pre-filled with the post's title and
   permalink.
3. **Given** the fallback controls are visible, **When** the reader activates
   "copy link", **Then** the post's permalink is copied to their clipboard and
   a brief visual confirmation (e.g. "Copied!") is shown.

---

### User Story 3 - Consistent appearance in both theme modes (Priority: P3)

A reader browsing in either light mode or dark mode sees the share control(s)
rendered in a style consistent with the rest of the site's "Plus Ultra Paper"
theme, with no illegible text, invisible icons, or jarring color mismatches.

**Why this priority**: Visual consistency is a stated site-wide standard;
getting it wrong is highly visible but does not block the core sharing
functionality delivered by P1/P2.

**Independent Test**: Toggle the site's theme switcher on a post page and
visually confirm the share control(s) remain legible and on-theme in both
modes.

**Acceptance Scenarios**:

1. **Given** a post page in light mode, **When** the reader views the share
   control(s), **Then** icons, text, and states (e.g. hover, "Copied!") are
   legible and match the site's light-mode palette.
2. **Given** a post page in dark mode, **When** the reader views the share
   control(s), **Then** icons, text, and states are legible and match the
   site's dark-mode palette.

---

### Edge Cases

- What happens if the clipboard-copy action fails (e.g. clipboard permission
  denied by the browser)? The reader MUST still be able to obtain the link
  (e.g. a visible fallback such as the permalink text itself remains
  selectable, or an unobtrusive error state is shown) — the control MUST NOT
  fail silently with no feedback at all.
- What happens on a browser that supports the native share capability but the
  reader cancels the OS share sheet? The page MUST return to its normal state
  with no error message.
- What happens on a list/section page or the homepage? No share control is
  shown — this feature applies only to individual post pages.
- What happens for a post with a very long title? The shared title text
  MUST NOT break the native share sheet or fallback links; truncation, if
  needed, is acceptable as long as the permalink itself is always complete
  and correct.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a share control on every individual
  blog post page, and MUST NOT display it on list/section pages or the
  homepage.
- **FR-002**: On a browser/device that supports a native OS-level share
  capability, activating the share control MUST invoke that native share
  flow, pre-filled with the current post's title and its permalink.
- **FR-003**: On a browser/device that does not support a native OS-level
  share capability, the system MUST instead present fallback share
  links/icons for X/Twitter, Facebook, and LinkedIn.
- **FR-004**: Each fallback network link MUST open that network's share flow
  pre-filled with the current post's title and permalink.
- **FR-005**: The system MUST provide a "copy link" action, available
  alongside the fallback links, that copies the current post's permalink to
  the reader's clipboard.
- **FR-006**: When the copy-link action succeeds, the system MUST show a
  brief, clearly visible confirmation (e.g. "Copied!") to the reader.
- **FR-007**: When the copy-link action fails, the system MUST provide the
  reader some way to still obtain the link, rather than failing with no
  feedback.
- **FR-008**: The share control(s) MUST be legible and visually consistent
  with the site's existing "Plus Ultra Paper" theme in both light and dark
  mode.
- **FR-009**: The share control(s) MUST be operable via keyboard (not only
  pointer/touch) and MUST have an accessible name for each individual action
  (native share trigger, each network link, copy-link action).
- **FR-010**: Activating and later dismissing/completing any share path
  (native share sheet or a fallback link) MUST NOT leave the post page in a
  broken or altered state.

### Key Entities

- **Post**: The individual blog post being viewed; the entity whose title and
  permalink are shared. No new persisted data entity is introduced by this
  feature — sharing uses information already present on the post page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a device with native share support, a reader can share a
  post to another app in one activation of the share control (no intermediate
  steps beyond the OS's own share sheet).
- **SC-002**: On a browser without native share support, a reader can copy a
  working link to a post, or open a pre-filled share flow to X/Twitter,
  Facebook, or LinkedIn, within two visible actions (find the control,
  activate it).
- **SC-003**: 100% of individual post pages display a working share control;
  0% of list/section pages or the homepage display one.
- **SC-004**: The share control(s) remain legible and usable in both light
  and dark mode with no visual regressions reported.

## Assumptions

- "Supporting browsers" for the native share sheet means browsers that
  implement the Web Share API (`navigator.share`); this is a reasonable,
  widely-recognized technical boundary for "native OS share capability" as
  named by the user and is treated here as the feature boundary rather than a
  further open question.
- Desktop Safari and Firefox are called out by the user as browsers expected
  to fall into the "no native share support" path today; the fallback path is
  designed for any browser lacking the capability, not only those two.
- The three named fallback networks (X/Twitter, Facebook, LinkedIn) plus
  copy-link are the complete fallback set for v1; no other networks are in
  scope.
- No analytics/tracking of share events is required for v1 — this spec covers
  the reader-facing sharing capability only.
- The feature applies to posts across all existing sections (`article/`,
  `book/`, `cheat_sheet/`, `go/`, etc.) that render through
  `layouts/_default/single.html`, since that is the shared single-post
  template named by the user.
