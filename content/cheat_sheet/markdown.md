+++
title = 'Markdown & Mermaid Cheat Sheet'
date = '2026-05-23T12:00:00+07:00'
draft = false
description = 'Quick reference for Markdown syntax and Mermaid diagrams supported on this site.'
tags = ['markdown', 'mermaid', 'reference']
+++

Quick reference for everything you can write in content files on this site.

---

## Headings

```markdown
# H1 — Page title
## H2 — Major section
### H3 — Subsection
#### H4
##### H5
###### H6
```

---

## Text Formatting

| Syntax | Result |
|---|---|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `***bold italic***` | ***bold italic*** |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `` `inline code` `` | `inline code` |

---

## Links

```markdown
[External link](https://example.com)
[Internal link](/cheat_sheet/markdown/)
```

---

## Lists

Unordered:

```markdown
- Item one
- Item two
  - Nested item
  - Another nested
```

Ordered:

```markdown
1. First
2. Second
3. Third
```

---

## Blockquote

> Use blockquotes for notes, callouts, or pull-quotes.
> They can span multiple lines.

```markdown
> Use blockquotes for notes, callouts, or pull-quotes.
> They can span multiple lines.
```

---

## Code Blocks

Fenced with a language hint for syntax highlighting:

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
```

````markdown
```go
package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}
```
````

Common language hints: `go`, `js`, `ts`, `python`, `html`, `css`, `json`, `yaml`, `bash`, `sql`, `text`.

---

## Tables

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| abc  |  def   |   ghi |
| 1    |   2    |     3 |
```

| Left | Center | Right |
|:-----|:------:|------:|
| abc  |  def   |   ghi |
| 1    |   2    |     3 |

---

## Horizontal Rule

```markdown
---
```

---

## Mermaid Diagrams

Wrap diagram source in the `mermaid` shortcode using **angle-bracket** style (not `%`):

```text
{{</* mermaid */>}}
flowchart LR
    A --> B
{{</* /mermaid */>}}
```

### Flowchart

{{< mermaid >}}
flowchart LR
    Write[Write Markdown] --> Build[Hugo Build]
    Build --> HTML[Static HTML]
    HTML --> Deploy[Deploy]
{{< /mermaid >}}

```text
{{</* mermaid */>}}
flowchart LR
    Write[Write Markdown] --> Build[Hugo Build]
    Build --> HTML[Static HTML]
    HTML --> Deploy[Deploy]
{{</* /mermaid */>}}
```

Use `flowchart TD` for top-down layout.

### Sequence Diagram

{{< mermaid >}}
sequenceDiagram
    participant Browser
    participant Hugo
    Browser->>Hugo: GET /page
    Hugo-->>Browser: 200 HTML
    Browser->>Browser: Render
{{< /mermaid >}}

```text
{{</* mermaid */>}}
sequenceDiagram
    participant Browser
    participant Hugo
    Browser->>Hugo: GET /page
    Hugo-->>Browser: 200 HTML
    Browser->>Browser: Render
{{</* /mermaid */>}}
```

### Entity Relationship

{{< mermaid >}}
erDiagram
    POST ||--o{ TAG : "tagged with"
    POST {
        string title
        date date
        bool draft
    }
    TAG {
        string name
    }
{{< /mermaid >}}

```text
{{</* mermaid */>}}
erDiagram
    POST ||--o{ TAG : "tagged with"
    POST {
        string title
        date   date
        bool   draft
    }
    TAG {
        string name
    }
{{</* /mermaid */>}}
```
