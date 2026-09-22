+++
title = 'Writing Docs That Are Easy to Read'
date = '2026-09-22T22:55:00+07:00'
draft = false
description = 'A one-page cheat sheet for technical writing: the four kinds of docs, the right format for each job, and small rules that make every sentence clearer.'
tags = ['writing', 'engineering']
+++

Most docs are hard to read for two reasons: one page tries to do too many jobs, and it is written for the author's head instead of the reader's. Both are fixable. Start with structure, pick the right format, then tighten the sentences.

> **The short version** — One page, one job. Pick the format that fits the job. Write short, active sentences.

## Start with three questions

1. **Who reads this?** A new teammate, an on-call engineer, or a PM — each one wants a different level of detail.
2. **What should they do after reading?** If you cannot finish this sentence, the page has no job.
3. **What are they looking for?** To learn, to do a task, to look up a fact, or to understand a design.

> **The rule of one** — One page, one job. A page that teaches, instructs, and explains at the same time will lose every reader.

## The four kinds of docs (Diátaxis)

[Diátaxis](https://diataxis.fr) is a common method for organizing technical docs. It says every page should serve exactly one of four reader needs.

{{< mermaid >}}
flowchart TD
  Q["What does the reader need?"]
  Q -->|"to learn by doing"| T["Tutorial"]
  Q -->|"to finish a real task"| H["How-to guide"]
  Q -->|"to look up a fact"| R["Reference"]
  Q -->|"to understand why"| E["Explanation"]
{{< /mermaid >}}

| Kind | The reader wants to… | A question it answers | Style | Example |
|---|---|---|---|---|
| **Tutorial** | learn by doing | "Teach me" | A guided lesson. No choices. It must always work. | Onboarding workshop |
| **How-to guide** | finish a real task | "How do I do X?" | Short steps. Assume the basics are known. | "How to deploy the service" |
| **Reference** | look up a fact | "What is X? Which fields does it have?" | Neutral and complete. Describe only. Give no advice. | API docs, config fields |
| **Explanation** | understand why | "Why is it built this way?" | Background, trade-offs, decisions. | Design doc, ADR |

> **Tutorial vs. how-to** — Both are step lists, but they make different promises. A tutorial teaches: if a reader follows it and it fails, that is the author's bug. A how-to gets work done for someone who already knows the basics.

> **Reference: describe, don't teach** — People do not read reference, they consult it. Keep it neutral, and link out to a how-to or an explanation instead of adding advice.

## Pick the right format

| Format | Use it when | Watch out for |
|---|---|---|
| **Table** | You compare 3+ options across 2+ dimensions. | More than five columns gets hard to scan. |
| **Diagram** | Order or flow matters, or 3+ parts are connected. | Keep the source (Mermaid, Excalidraw) so you can update it later. |
| **Code block** | You mention config, an API, or a command. | Keep it minimal and runnable. Show the expected output. |
| **Numbered steps** | A procedure must happen in order. | One list per branch. Do not hide "if" cases inside a step. |
| **Note box** | You warn about an exception or a trap. | One or two per page. When everything is a warning, nothing is. |
| **Before / after** | You teach a change or a tricky idea. | Show the real thing, not a description of it. |

{{< mermaid >}}
flowchart TD
  S["Something to explain"]
  S -->|"options or specs to compare"| TB["Table"]
  S -->|"steps, flow, or branches"| D["Diagram or numbered steps"]
  S -->|"a warning or exception"| N["Note box"]
  S -->|"a reason or a trade-off"| P["Plain prose — that's fine"]
{{< /mermaid >}}

## Write short sentences

- **One sentence, one idea.** Split the sentence instead of stretching it with "and", "while", and "in the case that".
- **Active voice.** "The consumer writes events to Elasticsearch." Not "Events are written to Elasticsearch by the consumer."
- **One word per thing.** Pick "service" and stop switching between "service", "system", and "module".
- **Cut filler.** "in the case that" → "if". "in order to" → "to". "it should be noted that" → delete it.
- **Show, don't tell.** "Supports several modes" says nothing. "`mode: strict` rejects records that fail the schema" shows it.
- **Put the point first.** The first sentence of a paragraph is the only one most readers finish.

## Before and after

> **Before** — "Deploying the service can be performed in several ways depending on the environment. In the case of production, approval must be obtained prior to proceeding, whereas staging can be deployed immediately. In all cases, a check must be performed to confirm that migrations have completed successfully prior to deployment, in order to prevent potential issues."

**After**

| Environment | Approval | Migration check |
|---|---|---|
| Staging | Not needed | Must pass before deploy |
| Production | One approver | Must pass before deploy |

> **Warning** — In production, a deploy is blocked if migrations have not passed.

Same facts. A third of the reading time. The table did most of the work, and the one warning is impossible to miss.

## Before you publish

- **Read it as a stranger.** Do the first five lines answer "what is this for?"
- **Add a date.** A doc that never says when it changed cannot be trusted.
- **Run every code block.** Copy, paste, check the output.
- **Keep diagram sources.** A diagram you cannot regenerate will rot.
- **Test with one person.** Ask someone outside the team to follow the page. Watch where they get stuck.
- **Cut 10%.** There is always something to drop.

---

*Adapted from [Diátaxis](https://diataxis.fr), a well-known method for technical documentation.*
