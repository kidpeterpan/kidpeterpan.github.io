---
name: kidpeterpan-writer
description: Write new blog posts for kidpeterpan.github.io (a personal Hugo site) in the site's established voice — Thai-language notes with embedded English technical terms, the site's distinctive inline-glossary annotation, and TOML front matter matching existing posts. Use this skill whenever the user asks to write, draft, translate, or summarize a post for this blog — book notes (content/book/), translated articles (content/article/), programming tutorials (content/go/), or cheat sheets (content/cheat_sheet/). Also trigger when the user pastes a book chapter or an English article and asks you to turn it into a post, or says things like "add a post about X", "แปลบทความนี้", "สรุปหนังสือเล่มนี้", even if they don't mention Hugo, front matter, or the site by name.
---

# kidpeterpan-writer

Write content/*.md files for kidpeterpan.github.io that read as if the site's
author wrote them — not a generic AI summary bolted onto Hugo front matter.
The site has a specific, recognizable voice built from nine live posts (two
book notes, two translated articles, four Go tutorial episodes, and an empty
cheat_sheet section); match the post type's conventions rather than
reinventing a "reasonable" style.

## Step 1 — figure out which section this belongs to

Each section has a different purpose, filename convention, structure, and
front matter shape. Pick based on what the user gave you:

| Section | Content | Filename | Example |
|---|---|---|---|
| `content/book/` | Notes/takeaways from a book the author read, in Thai | `snake_case.md` | `hidden_potential.md`, `leading_effective_engineering_teams.md` |
| `content/article/` | Thai translation of an existing English article | `kebab-case.md` | `loop-engineering.md`, `jetbrains-context.md` |
| `content/go/` | Numbered episodes of the "Learning Go" tutorial series | `NN-topic-slug.md` (zero-padded) | `01-setting-up-your-go-environment.md` |
| `content/cheat_sheet/` | Short technical reference — **currently empty**; the old `go.md` was replaced by the go tutorial series | `kebab-case.md` | — |

If it doesn't fit any of these, ask the user rather than guessing — don't
invent a fifth section. Before writing a cheat sheet, confirm the user really
wants one (and check whether the go series already covers the topic).

## Step 2 — front matter

TOML, delimited by `+++`. Always Bangkok time (`+07:00`).

```toml
+++
title = 'Title Case Of The Post'
date = '2026-06-27T00:00:00+07:00'
draft = false
description = 'One-sentence summary — same language as the body (Thai for book/article notes).'
tags = ['tag1', 'tag2']
+++
```

- `date`: use today's date at `00:00:00+07:00` unless the user specifies otherwise. Hugo hides future-dated pages by default — even in the dev server — so a later time-of-day (e.g. `12:00:00`) can make a same-day post silently 404 if it's still morning in Bangkok. `00:00:00` avoids that entirely. (The two book posts predate this convention and use `12:00:00`; don't copy that.)
- `title`: book posts use the book's English title; articles the article's English title; go episodes use `'ตอนที่ N: <English topic>'`.
- `draft`: `false` when the post is finished, `true` if the user wants to publish a stub (see "Unfinished posts" below).
- `description`: a real one-sentence summary in the body language — the article and go posts all have one. (The two book posts cheat by duplicating the title; don't copy that either.)
- `tags`: lowercase, matches the vocabulary already in use:
  - book: `book` (finished books add `completed`)
  - article: `ai`, `engineering`
  - go: `programming`, `go`, `tutorial`
  Check the target section's existing posts before inventing new ones.
- For **translated articles only**, add a `[params]` block with the source link:

```toml
[params]
source = 'https://example.com/original-post'
```

- For **go episodes**, note the series is a sequence: `01`–`04` exist and
  refer to each other ("ตอนที่ 2", "ตอนที่แล้ว", links in `## Related`).
  An episode must fit the numbering and recap stance of the ones before it.

## Step 3 — the glossary annotation (the signature move, but not for every section)

The author never lets an English/technical term pass without a same-breath
Thai gloss, written inline as:

```
(( _term - คำอธิบายภาษาไทยสั้นๆ_ ))
```

or, when the term is a proper concept name worth emphasizing:

```
(( _**Term** - คำอธิบายภาษาไทยสั้นๆ_ ))
```

Real examples from the site:

- `Loop Engineering (( _การออกแบบลูปงาน_ ))`
- `(( _**Psychological safety** - การที่คนในทีมกล้าแสดงความคิดเห็น หรือเสนอไอเดียโดยไม่กลัวว่าจะถูกตำหนิหรือถูกตัดสิน_ ))`
- `discomfort - ความรู้สึกไม่สบายใจหรือความยากลำบากเมื่อต้องทำสิ่งใหม่ๆ ที่ไม่คุ้นเคย`

Rules of thumb, inferred from usage across the posts:

- Gloss a term **the first time it appears**, immediately after it — not in a
  separate glossary section at the end.
  You don't need to re-gloss a term that already got one earlier in the same post.
- Keep the Thai explanation short (one clause, not a paragraph) — it's a
  gloss, not a footnote essay.
  Definitions are written from scratch to fit the sentence, not copied
  verbatim from a dictionary or the source text.
- This is why the annotation exists at all: the post is read by someone
  comfortable in Thai who may not know the English jargon, so every
  loanword earns its keep by being explained on the spot instead of assumed.
- Bold the term inside the annotation (`**Term**`) when it names a named
  concept/model worth remembering (e.g. a framework, a research finding);
  leave it unbolded for a plainer word that's just being translated.
- In the book notes the gloss is often embedded **mid-sentence, right after
  the term, inside Thai prose** (see `leading_effective_engineering_teams.md`).
- In the go tutorial series there are **no inline glosses at all** — instead
  each episode ends with a `## Glossary` section (bold term + `—` definition
  list) covering the episode's jargon. Don't bolt inline annotations onto a
  tutorial that follows the series' code-first style.

## Step 4 — structure the body

The book/article and go sections have grown distinct structural conventions.
Follow the one for your post type.

### Book notes and translated articles

- Divide the post into `## ` (H2) sections, one per major topic/chapter —
  and separate every section with a `---` horizontal rule.
- Within a section, use bold pseudo-headers for numbered subpoints
  (`**1. หัวข้อย่อย**`) rather than a third heading level — the site's H3 is
  reserved for genuine subsections (see `loop-engineering.md`'s `### 1.
  Automations` for when H3 *is* appropriate: distinct named components
  within one big idea, not just narrative beats).
- Prefer bullet or numbered lists for anything enumerable (steps, traits,
  antipatterns) over long prose paragraphs.
- Use a blockquote (`> `) for a pull-quote, either quoting the source
  material directly (kept in English in `loop-engineering.md`, with quotes
  around it) or condensing the section's takeaway into one memorable line.
  These often land at the end of a section as a closer.
- Close strong: many sections end on a single sentence that reframes the
  point in the author's own words. The register is warm and mentor-ish but
  almost never literally says "ครับ" — a direct, personal reframing line is
  the pattern (save the ครับ for rare, deliberate emphasis; it appears once
  on the whole site, at the end of go episode 04).
- **Translated articles** end with a takeaway section: `## บทสรุป` (or
  `## บทสรุป: <angle>`, see `loop-engineering.md`) that lands the article's
  big idea and what it means for the reader, in the author's voice rather
  than a restatement of the source. `jetbrains-context.md` also shows a
  `## คำถามที่พบบ่อย` FAQ section using `**คำถาม** — คำตอบ` rows — a good
  fit when the source itself is Q&A-shaped.

### Go tutorial episodes

- Numbered episode titles + filenames; each episode opens with a `---`,
  then a short "where we are in the series" paragraph (reference to the
  previous episode) and a "สิ่งที่ได้ตอนจบบทนี้" preview list, followed by a
  `{{< mermaid >}}` roadmap diagram of the episode's flow.
- Then `## Step 1: ...` through `## Step N: ...` sections (separated by
  `---`), each walking through code with ` ``` ` blocks, `###` sub-sections
  for side points, and **Markdown tables** for reference content
  (structure breakdowns, platform-by-platform install steps, command
  tables).
- Callouts are blockquotes: `> ⚠️ ...` for warnings/constraints, `> **...**
  ...` for key takeaways, `> *...*` for a teaser of the next episode.
- Finish with, in order: `## แบบฝึกหัด` (exercises), `## Common Pitfalls —
  ข้อผิดพลาดที่พบบ่อย` (a `- **mistake** — fix` bullet list), `## สรุป`
  (numbered recap, sometimes with ✅ checkmarks), `## Glossary` (bold term
  `—` definition list), `## Related` (links back to earlier episodes and a
  note on what comes next).
- Voice is a patient mentor explaining by doing: terse, code-first, no
  glossary annotations, direct instruction, occasional closing ครับ.

## Step 5 — voice

- Body language is Thai; English stays embedded for technical terms,
  proper nouns, and model/framework names (`SMART goal`, `OKR`,
  `Psychological safety`) rather than being translated outright — that's
  what the glossary annotation is for.
- Tone is a knowledgeable peer explaining something they found genuinely
  useful, not a textbook. Concrete analogies are common (e.g. comparing
  Productivity/Efficiency/Effectiveness to a car's speed vs. fuel economy
  vs. destination) — reach for one before writing pages of abstract
  qualifier-laden explanation.
- Cheat sheets were the terse, code-first exception — but the go tutorial
  series has effectively taken over that register (see Step 4), so a new
  cheat sheet, if requested, should follow the go episodes' code-first
  conventions.

## Step 6 — images, diagrams, unfinished posts

- Images referenced in a post live under `static/images/<post-slug>/` and
  are linked as `![alt text](/images/<post-slug>/<file>.ext)`.
- For a Mermaid diagram, use the shortcode, not a fenced code block —
  `{{< mermaid >}}` uses `<` delimiters so Hugo won't Markdown-wrap the
  diagram source (used in both `loop-engineering.md`-style content and the
  go episodes' opening roadmap):

  ```
  {{< mermaid >}}
  flowchart LR
    A[Hugo] --> B[Mermaid]
  {{< /mermaid >}}
  ```

- If the user wants to publish a partial draft (book not finished, article
  half-translated), end the file with a bare `TBC` line rather than padding
  it out — that's the existing convention (see `hidden_potential.md`).

## Before finishing

Reread the draft once against this checklist:

- [ ] Front matter section/filename/date/tags match the target section's existing posts (go: `NN-` numbering + `ตอนที่ N:` title)
- [ ] Every first-use English/technical term has a `(( _..._ ))` gloss — except go episodes, which use a closing `## Glossary` instead
- [ ] Body is split into `## ` sections divided by `---`
- [ ] At least one blockquote pull-quote or closing line per major section
- [ ] For translations: source credit blockquote + `[params] source` present, and the post ends with a `## บทสรุป` takeaway section
- [ ] For go episodes: opening series-recap + mermaid roadmap, and `แบบฝึกหัด`/`Common Pitfalls`/`สรุป`/`Glossary`/`Related` closing sections in order
- [ ] Reads like the author wrote it, not like a summary *about* the author's style
