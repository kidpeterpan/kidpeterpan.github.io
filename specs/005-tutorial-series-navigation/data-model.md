# Phase 1 Data Model: Tutorial Series Ordering & Episode Navigation

**Feature**: `specs/005-tutorial-series-navigation` | **Date**: 2026-08-17

This site has no database. The "data model" here is the shape of the content front matter and the derived
page collections the templates build from it.

---

## Entity: Ordered course

A Hugo section whose notes are meant to be read in sequence.

**Represented by**: a section's `_index.md` under `content/<section>/`

**Fields**

| Field | Location | Type | Required | Default | Meaning |
|-------|----------|------|----------|---------|---------|
| `ordered` | `[params]` in `_index.md` | boolean | No | absent (falsey) | When `true`, this section is an ordered course: its listing runs in ascending course order and its notes get episode navigation. When absent or `false`, the section behaves exactly as it does today. |

**Existing fields on the same object, unchanged by this feature**: `title`, `description`,
`params.kicker` (uppercase label used on section and article pages), `params.image` (homepage cover, added by
feature 004).

**Instances after this feature**

| Section | `ordered` | Episodes | Notes |
|---------|-----------|----------|-------|
| `content/go` | `true` | 11 (`01-`…`11-`) | Gains the parameter |
| `content/git` | `true` | 8 (`01-`…`08-`) | Gains the parameter |
| `content/article` | absent | 3 | Unchanged — newest-first |
| `content/book` | absent | 2 | Unchanged — newest-first |
| `content/cheat_sheet` | absent | 0 | Unchanged — renders its existing empty state |

**Validation rules**

- `ordered` is read as a plain truthy test. Any value Hugo treats as false — absent, `false` — means
  "not a course". No other value is meaningful.
- Taxonomy term pages (`/tags/*`) are not content sections and have no `_index.md`, therefore never carry
  `ordered`. They resolve to the newest-first branch automatically (FR-006).
- A section may carry `ordered = true` with zero or one note; both are valid and handled (see Edge cases).

---

## Entity: Episode

A single note inside an ordered course.

**Represented by**: a Markdown file under `content/<course-section>/`

**Fields**

This feature adds **no** front-matter field to episode files. Position in the course is carried by the file's
own name, which every existing episode already has:

| Attribute | Source | Example | Meaning |
|-----------|--------|---------|---------|
| Course position | filename prefix, via `.File.BaseFileName` | `07-types-methods-and-interfaces` | Sort key. Zero-padded two-digit prefix orders lexically and therefore numerically. |
| Title | `title` front matter | `การใช้ Type, Method และ Interface` | Shown as the destination name in navigation links (FR-009). |
| Address | `.RelPermalink` | `/go/07-types-methods-and-interfaces/` | Link target; also the identity used to locate the current page within the ordered collection. |

**Deliberately not a sort input**: `date`. Go episodes 07 and 08 both carry `2026-08-07`, and Phase 0 measured
Hugo's date-ordered built-ins pointing *backwards* across that pair. See [research.md](./research.md) R2.

**Validation rules**

- An episode filename is expected to begin with a zero-padded two-digit prefix. This is a convention, not an
  enforced constraint — nothing fails a build without it.
- An episode without a prefix still appears, sorted after all prefixed episodes (`'0'` < `'i'` lexically) and
  still linked into the navigation chain. Verified in Phase 0.
- Draft and future-dated episodes are excluded by Hugo before this feature sees them, so they are absent from
  both the listing and the navigation chain — the two stay consistent (FR-014).

---

## Derived collection: the ordered page set

Not stored anywhere; computed per section at build time and shared by both templates.

**Produced by**: `layouts/partials/ordered-pages.html`, given a section page as context

**Rule**

| Input section | Output collection |
|---------------|-------------------|
| `ordered` is truthy | `.RegularPages` sorted ascending by `File.BaseFileName` |
| otherwise | `.Pages.ByDate.Reverse` — byte-for-byte today's behaviour, unchanged |

The fallback branch deliberately keeps `.Pages`, matching the expression `list.html` used before this
feature. That template also renders every `/tags/*` term page, and preserving the exact collection there is
what makes the unchanged-output guarantee (FR-006) provable by diff rather than argued from Hugo semantics.

**Consumers**

| Consumer | Context passed | Uses it for |
|----------|----------------|-------------|
| `layouts/_default/list.html` | `.` (the section page itself) | Rendering the section listing in order |
| `layouts/partials/episode-nav.html` | `.Parent` (the episode's section) | Locating the current episode and reading its neighbours |

Both consumers reading this one producer is what satisfies **FR-014**: a navigation link can never point to a
page the listing omits, because both are views of the same collection.

---

## Derived values: episode neighbours

Computed inside `episode-nav.html` from the ordered collection and the current page.

| Value | Definition | Absent when |
|-------|------------|-------------|
| `idx` | Position of the current episode in the ordered collection, found by matching `.RelPermalink` | Never, for a page inside an ordered course |
| previous | Element at `idx - 1` | `idx == 0` — the first episode (FR-010) |
| next | Element at `idx + 1` | `idx == len - 1` — the final episode (FR-010) |

**Edge cases**

| Situation | Result |
|-----------|--------|
| Course with one episode | `idx == 0` and `idx == len - 1`; neither link renders. Article looks as it does today. |
| Course with zero episodes | Collection is empty; the section page renders its existing "no posts found." state. Navigation never runs, since no episode page exists. |
| Note in a non-course section | `.Parent.Params.ordered` is falsey; the navigation partial renders nothing at all (FR-011). |
| Tied publication dates | Irrelevant — the date is not consulted at any point. |
