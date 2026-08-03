---
name: thai-writer-verify
description: Proofread and, when requested, polish Thai prose so it is correct, natural, easy to understand, and faithful to the intended meaning. Use after drafting or editing Thai blog posts, translations, technical explanations, captions, or other reader-facing Thai text, especially when the user asks toตรวจภาษาไทย, เกลาสำนวน, proofread, or make text read more naturally.
---

# thai-writer-verify

Use this skill as a language-quality pass after writing. It is a reviewer and
polisher, not a reason to rewrite a user's voice into formal textbook Thai.
Preserve the author's register, humor, English technical terms, Markdown
structure, and source meaning unless they are the thing being corrected.

## Verification workflow

1. Read the whole text before changing individual sentences. Check the title,
   front matter description, headings, body, quotations, lists, and closing.
2. Mark each issue as one of these:
   - **Must fix** — spelling, grammar, punctuation, broken Markdown, ambiguity,
     or a change that could alter the meaning.
   - **Naturalness** — literal translation, awkward word order, redundancy, or
     a sentence that makes a fluent reader stop.
   - **Optional style** — a register or voice preference that is valid either
     way. Do not force these changes.
3. If the user asks to proofread, polish, or update the file, apply narrow
   edits directly with `apply_patch`. Do not rewrite the entire piece just to
   make it sound more like the reviewer.
4. Read the changed paragraphs again in context. Then reread the complete text
   aloud or mentally as a Thai reader would, checking transitions and repeated
   terms.
5. For a Hugo post, run the relevant build when practical and inspect the
   resulting `git diff`. Keep generated-file changes only when the repository
   convention requires them; do not mix unrelated worktree changes into the
   language edit.

## Thai language checks

### Spelling and particles

- Write `ล่ะ`, not `หล่ะ`, for the ordinary question or final particle.
- `ไหม` is neutral; `มั้ย` is casual and can be used when it matches the
  author's voice. Choose deliberately and keep the same register nearby.
- `หละ` may be an intentional colloquial or author-specific spelling, but do
  not use it accidentally in place of standard `ล่ะ`.
- Check common Thai spellings and technical loanwords in context, including
  `โปรเจกต์`, `ฟีเจอร์`, `โค้ด`, `คอมเมนต์`, and `ไซต์`. If the sentence means a
  software project, say `โปรเจกต์ของตัวเอง` rather than inventing a spelling
  such as `ซอยต์`.
- Check `ครับ/ค่ะ`, `คะ/ค่ะ`, pronouns, tense, and singular/plural references
  when the text mixes narration, quotation, and direct address.

### Punctuation and Markdown

- Do not put a space before `?`, `!`, or `:` in Thai prose and headings. Use
  `ใช่ไหม?`, `เอ๊ะ!?`, and `หัวข้อ: รายละเอียด`.
- Keep punctuation consistent across headings. Do not change a casual `มั้ย`
  to `ไหม` only because of punctuation cleanup; spelling and register are
  separate checks.
- Make sure Markdown emphasis does not glue unrelated words together, and do
  not break blockquotes, lists, horizontal rules, shortcode delimiters, or
  TOML front matter while editing prose.
- Preserve code, URLs, identifiers, API names, and quoted source text unless
  the user explicitly asks for those to be changed.

## Naturalness checks

Read every sentence for the following patterns:

- Literal translations that follow English word order instead of natural Thai.
  For example, replace `ฟีเจอร์ทั้งตัว` with `เขียนฟีเจอร์ทั้งหมดให้เสร็จในครั้งเดียว`
  when the intended meaning is to implement the whole feature.
- Awkward noun piles or missing verbs. Prefer `วิธีที่เขาพบว่าใช้ได้ผลจริง`
  over `สิ่งที่เขาใช้ได้จริง` when the subject is a method.
- Redundant modifiers. Do not write a phrase whose Thai gloss already means
  `เกินจำเป็น` and then append another `เกินจำเป็น`; remove repeated ideas such
  as `ทั้งหมดด้วยตัวเอง` when the surrounding sentence already says it.
- Passive or abstract phrasing that can be made direct without changing the
  meaning. Prefer concrete subjects and verbs.
- Ambiguous pronouns. Make it clear whether `เขา`, `เรา`, `ผม`, or `มัน` refers
  to the author, source author, reader, AI, or a system.
- Mixed register. Casual particles, English terms, and formal sentences can
  coexist, but the shift should be intentional and not happen sentence by
  sentence by accident.
- Paragraph rhythm. Break dense multi-clause paragraphs, but do not split a
  short connected thought into choppy fragments.

## Technical terms and glossary annotations

For posts that use the site's `(( _..._ ))` inline glossary:

- Put the English term in the prose first, followed immediately by its gloss.
  Do not leave the English term only inside the annotation, as in a gloss for
  `subtly incorrect` attached to a sentence that never says `subtly incorrect`.
- Gloss a first use once. Do not repeat a gloss every time the same term
  appears unless the meaning changes.
- Keep each gloss short and accurate. It should clarify the sentence, not
  become a dictionary entry or a second paragraph.
- Explain terms that a Thai reader may not know, but do not translate every
  common English word or clutter a technical paragraph with annotations.
- Bold named concepts when the site's writing convention calls for it; leave
  ordinary loanwords unbolded.
- Check that a gloss does not overclaim, change the source's meaning, or make a
  technically correct term sound incorrect.

## Translation checks

- Preserve the source's claim, strength, and point of view. Natural Thai is a
  reason to change wording, not a reason to add facts or soften/strengthen the
  argument without evidence.
- Keep English quotations when the post's convention calls for them, then add
  a short Thai explanation if the reader needs help. Do not silently rewrite a
  quotation and present it as the original.
- Separate the source author's opinion from the translator's own takeaway.
  A heading such as `## บทสรุป` should clearly mark the latter.
- Flag a sentence when making it natural would require deciding an uncertain
  technical or factual meaning. Ask or report the ambiguity instead of
  guessing.

## Review result

When reporting a review, list findings first and order them by severity. Use
`path:line` references when available. For an edit request, summarize the
actual changes after applying them and state what was verified.

If there are no meaningful issues, say so explicitly. Mention residual risks
such as an unverified translation nuance or a build that could not be run;
do not invent a clean bill of health from a partial read.

## Final checklist

- [ ] The whole text was read, not only the reported sentence.
- [ ] Spelling, particles, Thai punctuation, and register are consistent.
- [ ] Literal translations, redundancy, ambiguity, and unnatural word order
      were checked.
- [ ] English terms and inline glossary annotations match each other.
- [ ] Quotes, code, URLs, front matter, and Markdown structure remain intact.
- [ ] The author's voice and intended meaning remain intact.
- [ ] The final text was read aloud or mentally read as a Thai reader would.
