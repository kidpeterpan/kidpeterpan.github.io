# Data Model: Site Search

**Feature**: Site Search (003)

This feature does not introduce a database or application-managed data. The
only "data" involved is the search index generated at build time and the
search result objects produced at runtime by the browser-side search engine.

## Entities

### SearchIndex (generated at build time)

A static dataset written into the site output by the search indexer. It is
rebuilt on every deploy, never stored in the repo, and never touched by
application code.

| Attribute | Description |
|---|---|
| Page record | One record per published page (URL, title, section, full text content) |
| Index fragments | Per-page compressed word/segment index for matching |
| Language info | Per-page detected language (Thai, English, or mixed) |
| UI assets | The search component's JS/CSS emitted alongside the index |

**Generation rule**: every page in the built site output is indexed, which
automatically excludes drafts (Hugo does not emit draft pages), satisfies
FR-008, and includes future posts without manual registration (FR-004).

### SearchResult (runtime, browser-side)

Produced in the browser when a visitor submits a query.

| Attribute | Description |
|---|---|
| `url` | Absolute URL of the matching post |
| `title` | Post title |
| `excerpt` | Snippet of matching content with matches highlighted |
| `section` | The post's section (go / article / book / cheat_sheet), when shown |

**Runtime rule**: results are rendered only for non-empty queries (FR
edge cases); a query with no matches shows an explicit "no results" state.

## Validation rules

- Query is trimmed; empty/whitespace-only queries render nothing (edge case).
- Draft/unpublished content never appears because it is not part of the
  built site output.
- All result links point to pages that exist in the built site.

## State transitions

Search UI states, from the visitor's perspective:

```text
Closed --> Open (button activated, index may still be loading)
Open   --> Loading (index initializing) --> Ready (queryable)
Ready  --> Results (query submitted, matches found)
Ready  --> Empty (query submitted, no matches)
Any    --> Closed (Escape pressed or close activated)
```
