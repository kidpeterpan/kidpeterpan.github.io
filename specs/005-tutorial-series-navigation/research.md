# Phase 0 Research: Tutorial Series Ordering & Episode Navigation

**Feature**: `specs/005-tutorial-series-navigation` | **Date**: 2026-08-17

All findings below were verified empirically against **Hugo v0.164.0+extended** (the version in use) using a
throwaway probe site, not inferred from documentation. The probe reproduced the real content shape: a `go`
section with prefixed episodes including a tied-date pair (`07-`/`08-`, both `2026-08-07`, mirroring
`content/go/07-types-methods-and-interfaces.md` and `content/go/08-generics.md`), one unprefixed file, and a
non-opted-in `article` section as a control.

---

## R1: How to order episodes without using the date

**Decision**: `sort .RegularPages "File.BaseFileName"`

**Rationale**: Verified to produce exact ascending course order. Zero-padded two-digit prefixes sort
lexically in numeric order, so `02-` precedes `10-` correctly, and the tied-date pair `07-`/`08-` resolves
in the right order because the date is never consulted:

```text
01 | Ep1 Setup    | 01-setup
02 | Ep2 Types    | 02-types
03 | Ep7 Ifaces   | 07-interfaces     <- tied date with the next row
04 | Ep8 Generics | 08-generics       <- correct order regardless
05 | Ep10 Modules | 10-modules        <- 10 after 02, not after 01
06 | Ep11 Tooling | 11-tooling
07 | Unprefixed   | intro             <- no prefix sorts last, predictably
```

This satisfies FR-004 (order not derived from date), FR-005 (deterministic and stable — filenames are fixed
content facts), and the Q1 decision recorded in the spec.

**Alternatives considered**:

- **`.Pages.ByWeight` with a `weight` front-matter field** — rejected as Q1 option B by the author. Would
  require editing all 19 existing episode files, and a forgotten `weight` on a future episode silently
  sorts it to the front.
- **`.Pages.ByDate` (ascending)** — rejected. Fails outright on the tied `2026-08-07` pair, and would
  couple reading order to publication dates that are already known to be unreliable for this purpose.
- **`.Pages.ByTitle`** — rejected. Episode titles are Thai prose; alphabetical order is meaningless here.

**Edge behaviour confirmed**: a file without a numeric prefix (`intro.md`) sorts *after* all prefixed files
(lexically `'0'` < `'i'`) and is still included in both the listing and the navigation chain. It is placed
predictably rather than dropped, which is what the spec's edge case requires.

---

## R2: How to derive previous/next episode

**Decision**: Compute neighbours by index from the *same* sorted collection used by the listing. Do **not**
use Hugo's built-in `.PrevInSection` / `.NextInSection`.

**Rationale**: The built-ins were tested directly and are **incorrect for this content**. They operate over
the section's default date-descending order, so ties resolve arbitrarily and "next" means *newer*, not
*later in the course*. Measured output from the probe:

| Page | `.PrevInSection` | `.NextInSection` | Correct? |
|------|------------------|------------------|----------|
| Ep1 Setup | NONE | Ep2 Types | coincidentally right |
| Ep7 Ifaces | **Ep8 Generics** | Ep10 Modules | **wrong** — "previous" points forward |
| Ep8 Generics | **Unprefixed** | **Ep7 Ifaces** | **wrong** — "next" points backward |
| Ep11 Tooling | Ep10 Modules | NONE | coincidentally right |

The failure is confined to the tied-date pair, so the built-ins would appear correct on 17 of the site's 19
real episodes and silently send readers *backwards* on the other two — a defect unlikely to be caught by
spot-checking.

Index-based derivation from the sorted collection was verified to be correct on every page, including both
ends of the course:

```text
/go/01-setup/      idx=0 of 7   prev=NONE          next=Ep2 Types
/go/07-interfaces/ idx=2 of 7   prev=Ep2 Types     next=Ep8 Generics
/go/08-generics/   idx=3 of 7   prev=Ep7 Ifaces    next=Ep10 Modules
/go/intro/         idx=6 of 7   prev=Ep11 Tooling  next=NONE
```

This satisfies FR-008, FR-010, and — because the listing and the navigation read from one collection —
FR-014.

**Alternatives considered**:

- **`.NextInSection` / `.PrevInSection`** — rejected on the measured evidence above.
- **Re-sorting independently in each template** — rejected. Two sort expressions that must stay identical
  is precisely the divergence FR-014 forbids; see D1 below.

**Mechanism note**: Hugo supports variable reassignment (`=`) inside `range`, so the current page's index is
found by scanning the sorted collection and comparing `.RelPermalink`. Neighbours are then read with
`index`, guarded by `gt $idx 0` and `lt $idx (sub (len $ordered) 1)`.

---

## R3: How a section opts in

**Decision**: A boolean `ordered` parameter under `[params]` in the section's `_index.md`.

**Rationale**: Verified working from both template contexts — `.Params.ordered` on the section page, and
`.Parent.Params.ordered` from an episode page. The control section (`article`, no flag) was confirmed
unchanged: still newest-first, and its single pages rendered no episode navigation.

`.Parent.Params.*` is already the established pattern in this repository — `layouts/_default/single.html:9`
reads `.Parent.Params.kicker` today — so this introduces no new concept. Section params are also already in
use for this purpose: `content/go/_index.md` carries `image` for the homepage covers from feature 004.

Because taxonomy term pages (`/tags/*`) are not `content/` sections, they have no `_index.md` and therefore
no `ordered` param. They fall through to the existing newest-first branch automatically, satisfying FR-006
with no special-casing. This was confirmed by the control section behaving identically.

**Alternatives considered**:

- **Hardcoding the section names `go` and `git` in the template** — rejected. Violates FR-001 (a section
  declares itself) and forces a template edit for every future course.
- **A site-level list of ordered sections in `hugo.toml`** — rejected. Splits a section's configuration
  across two files for no gain; the section already owns an `_index.md`.

---

## R4: Two constraints found during implementation

Both were discovered by building, not by reading docs, and both changed the code.

**A partial may contain only one `return`, as its final statement.** The natural early-return shape —
`{{ if .Params.ordered }}{{ return A }}{{ end }}{{ return B }}` — is valid Go-template syntax but fails the
Hugo build with `wrong number of args for return: want 0 got 1`. The working form assigns to a variable and
returns once at the end.

**The fallback branch must use `.Pages`, not `.RegularPages`.** `layouts/_default/list.html` also renders
every `/tags/*` term page, and taxonomy terms are not content sections. Keeping the fallback as the exact
pre-existing expression, `.Pages.ByDate.Reverse`, makes the FR-006 guarantee provable by diff instead of
resting on an assumption about how `.RegularPages` behaves on a term page. The ordered branch keeps
`.RegularPages`, which is the precise episode set and only ever runs on real content sections.

---

## R5: Interaction with the Pagefind search index (feature 003)

The navigation renders inside `<article data-pagefind-body>` (`single.html:5`), so it is inside the region
Pagefind indexes. The concern: each episode's indexed content would absorb its neighbours' titles, so
searching "Pointers" would match episodes 5, 6 and 7 — a precision regression in the search feature shipped
as spec 003.

**Measured, not assumed.** Pagefind stores fragment content with zero-width spaces (U+200B) between words,
so a naive substring search returns false negatives; the check below normalises them out and carries a
control probe to prove the detector works.

| Markup | `data-pagefind-ignore` | Polluted documents |
|--------|------------------------|--------------------|
| `<div class="episode-nav">` | no | **19** — every episode |
| `<nav class="episode-nav">` | no | 0 |
| `<nav class="episode-nav">` | yes | 0 |

**Conclusion**: Pagefind excludes `<nav>` by default, so choosing the semantically correct element already
prevents the regression. The `data-pagefind-ignore` attribute is retained as defence in depth — it costs one
token and keeps the exclusion true if the element is ever changed to a `<div>` — but it is not what makes the
index clean today. Verified by running the full CI pipeline: `hugo --minify` followed by
`npx pagefind --site public`.

---

## D1: Sharing the ordered collection between the two templates

**Decision**: Extract a single-expression partial, `layouts/partials/ordered-pages.html`, that takes a
section page and returns the correctly ordered page collection. Both `list.html` and `single.html` call it.

**Rationale**: FR-014 requires that the collection driving the listing and the collection driving the
navigation be the same. Duplicating the ordering expression in two templates makes that a convention held
in the author's memory; a single partial makes it structural — the two cannot drift.

**Constitution note**: Principle I (Simplicity First) forbids abstraction "beyond what a single feature
strictly needs". This partial is judged *needed rather than speculative*: it exists to satisfy a named
requirement (FR-014), it has exactly one responsibility, it is three lines with no configuration surface,
and it removes a duplicated expression rather than anticipating a future one. Hugo's `return` in partials is
a built-in, so this adds no dependency (Principle III). Recorded in the plan's Complexity Tracking table for
visibility.

**Alternatives considered**:

- **Inline the sort expression in both templates** — simpler by line count, but leaves FR-014 unenforced.
  Rejected.
- **A partial that renders the whole list** — larger, mixes ordering with markup, and `single.html` needs
  the collection rather than the markup. Rejected.

---

## D2: Placement and styling of the episode navigation

**Decision**: Render episode navigation immediately after the article body (`.prose`) and *before* the
existing share block, as a new partial `layouts/partials/episode-nav.html`, styled with a new
`.episode-nav` rule set in `assets/css/main.css` built only from existing design tokens.

**Rationale**: The spec places navigation where the reader finishes reading. Continuing the course is the
primary next action; sharing is secondary, so navigation precedes the share block. A dedicated partial
matches the repository's established structure — `layouts/partials/share.html` is the direct precedent for
an article-level UI block included from `single.html:33`.

Styling reuses existing custom properties only (`--line`, `--muted`, `--ink`, `--accent`, `--surface`,
`--font-display`, `--font-mono`), which are already redefined per theme under `[data-theme]`, so both light
and dark mode are satisfied by construction (Principle II, FR-013). No new dependency is introduced
(Principle III).

Accessibility (Principle IV, FR-012): the block is a `<nav>` with an `aria-label`; each destination is a
plain `<a>` (keyboard-reachable and Enter-activatable with no JavaScript); each link's accessible name
includes the destination episode's title rather than a bare "Next", satisfying FR-009. Direction is conveyed
by a text kicker, never by colour or arrow glyph alone.

**Alternatives considered**:

- **Navigation at the top of the article** — rejected. Offers the next episode before the current one has
  been read.
- **Placing it after the share block** — rejected. Demotes the primary action below the secondary one.
- **Reusing `.post-row`** — rejected. That class is a grid built for index/title/date list rows; the
  two-up previous/next layout does not fit it, and bending it would risk regressions on the list pages.

---

## Summary of resolved unknowns

| ID | Question | Resolution | Verified |
|----|----------|------------|----------|
| R1 | Ordering key that ignores dates | `sort .RegularPages "File.BaseFileName"` | Yes — probe build |
| R2 | Prev/next derivation | Index lookup in the same sorted collection; built-ins rejected on measured evidence | Yes — probe build |
| R3 | Section opt-in mechanism | `params.ordered` boolean in the section's `_index.md` | Yes — probe build, with control section |
| D1 | Avoiding listing/navigation drift | Shared `ordered-pages.html` partial returning the collection | Design decision |
| D2 | Navigation placement and styling | `episode-nav.html` partial after `.prose`, existing tokens only | Design decision |

No NEEDS CLARIFICATION markers remain.
