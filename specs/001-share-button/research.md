# Phase 0 Research: Share Button

No `NEEDS CLARIFICATION` markers remained in the Technical Context, so this
research resolves implementation-approach questions rather than open
unknowns.

## Feature detection for native share vs. fallback

**Decision**: Feature-detect with `typeof navigator.share === 'function'` at
click time (not at page load) to decide whether to invoke the native share
sheet or reveal the fallback link row.

**Rationale**: `navigator.share` existing does not guarantee it will succeed
for a given payload in every browser, but checking at page load and caching
the result is unnecessary complexity for a control that's only used once per
page view; checking at the moment of interaction keeps the logic in one
place and matches the simplicity principle. Feature detection (not user-agent
sniffing) is the standard, forward-compatible approach — new browsers that
add support automatically get the native path with no code change.

**Alternatives considered**:
- User-agent sniffing to guess mobile vs. desktop — rejected, brittle and
  explicitly discouraged by web platform guidance; a desktop browser that
  ships Web Share API support would be wrongly routed to the fallback.
- Always rendering both the native trigger and the fallback row, toggling
  visibility via CSS `@media` — rejected, adds dead markup/CSS for no benefit
  over a single JS-driven branch.

## Handling `navigator.share()` rejection

**Decision**: Wrap the `navigator.share(...)` call in a `.catch()` that
silently ignores `AbortError` (user dismissed the sheet — expected, not an
error per FR-010/edge cases) and does nothing further; no fallback UI swap
after a supported call fails, since a failure here is either a user
cancellation or a transient OS-level issue outside this feature's control.

**Rationale**: The spec (edge cases) only requires that dismissing the native
sheet leaves the page unaffected with no error — it does not require
re-offering the fallback links after a native share attempt. Keeping the
catch minimal avoids speculative error-recovery code for a case with no
defined product behavior.

**Alternatives considered**:
- Falling back to the static links if `navigator.share()` rejects for any
  reason — rejected as unnecessary complexity/YAGNI; the only common
  rejection is the user's own cancellation, which is not an error to recover
  from.

## Clipboard copy + confirmation, and its failure path

**Decision**: Use `navigator.clipboard.writeText(permalink)` (Clipboard API,
available in all target browsers over HTTPS, which GitHub Pages serves this
site over). On success, toggle a CSS class that shows a "Copied!" label near
the control for ~2 seconds via `setTimeout`, then revert. On rejection (e.g.
clipboard permission denied), fall back to selecting the visible permalink
text (if present) or, if none is on-page, show a brief inline message instead
of the "Copied!" confirmation — satisfying FR-007's "no silent failure"
requirement without introducing a new UI surface.

**Rationale**: Clipboard API is the standard, already-available mechanism;
no library needed. A timed class-toggle for the confirmation matches the
lightweight, dependency-free style of `theme.js`.

**Alternatives considered**:
- `document.execCommand('copy')` — rejected, deprecated API superseded by the
  Clipboard API in all currently-relevant browsers.
- A JS clipboard polyfill library — rejected per Constitution Principle III
  (no new dependency for something the platform already provides).

## Fallback network share URLs

**Decision**: Use each network's documented web-intent URL pattern, built
from the post's `.Title` and `.Permalink` at template-render time (server-
side, via Hugo, not JS):
- X/Twitter: `https://twitter.com/intent/tweet?text=<title>&url=<permalink>`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=<permalink>`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=<permalink>`

**Rationale**: These are stable, long-standing public share-intent endpoints
requiring no API key/app registration, consistent with "no new dependency."
Building the `href` values in the Go template (using Hugo's `absURL`/
`urlquery` functions) means the fallback links work even with JavaScript
disabled — only the native-share branch and the copy-link confirmation need
JS, degrading gracefully.

**Alternatives considered**:
- Building share URLs in JS from `window.location` — rejected; doing it in
  the template is simpler, needs no JS to function, and reuses Hugo's own
  URL-encoding helpers instead of hand-rolling encoding in JS.

## Keyboard operability & accessible names (FR-009)

**Decision**: Render the native-share trigger and each fallback control as
real `<button>` (share trigger, copy-link) or `<a>` (network links) elements
— never a non-interactive `<div>`/`<span>` with a click handler — each with
visible text or an `aria-label` describing its action (e.g. "Share this
post", "Copy link", "Share on X"). No `tabindex` hacks needed since native
interactive elements are keyboard-operable by default.

**Rationale**: Matches Constitution Principle IV directly; using native
interactive elements is the simplest way to satisfy keyboard support with no
extra JS for focus/key handling.

**Alternatives considered**:
- Custom-styled `<div role="button">` — rejected, requires manually wiring
  keydown handling for Enter/Space that a native `<button>` provides for
  free; unnecessary complexity.
