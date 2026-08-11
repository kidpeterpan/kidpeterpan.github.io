# kidpeterpan.github.io

Personal blog at [kidpeterpan.github.io](https://kidpeterpan.github.io/), written primarily in Thai. The site contains notes about Go, software engineering, AI, books, and practical programming topics.

## Stack

- [Hugo](https://gohugo.io/) extended for the static site generator
- Tailwind CSS v4 through Hugo Pipes
- [Pagefind](https://pagefind.app/) for client-side search
- GitHub Pages for hosting and deployment

## Requirements

- Hugo extended
- Node.js and npm
- Make, if you want to use the helper commands below

## Setup

```sh
git clone https://github.com/kidpeterpan/kidpeterpan.github.io.git
cd kidpeterpan.github.io
make setup
```

`make setup` installs the npm dependencies and installs Hugo with Homebrew when Hugo is not already available. On other platforms, install Hugo manually before running `npm ci`.

## Development

Start the background development server on port `1313`:

```sh
make start
```

Open <http://127.0.0.1:1313/>. The server writes its PID to `.hugo-server.pid` and logs to `hugo-server.log`.

```sh
make stop
make restart
```

To run Hugo in the foreground instead:

```sh
hugo server
```

## Production Build

Build the site and create the Pagefind search index:

```sh
hugo --minify
npx pagefind --site public
```

The generated site is written to `public/`. Hugo output and local development files are ignored by Git.

## Content Structure

Content lives under `content/` and is rendered by Hugo templates in `layouts/`.

| Directory | Purpose |
|---|---|
| `content/article/` | Thai translations of English articles |
| `content/book/` | Thai notes and takeaways from books |
| `content/go/` | Numbered Learning Go tutorial episodes |
| `content/git/` | Numbered Learning Git tutorial episodes |
| `content/cheat_sheet/` | Short technical references |

Create a new post with Hugo when an archetype fits:

```sh
hugo new go/12-topic-slug.md
```

Go and Git tutorial episodes use zero-padded filenames such as `11-go-tooling.md`. Mermaid diagrams belong in the `mermaid` shortcode rather than a regular fenced code block:

```md
{{< mermaid >}}
flowchart LR
  A[Source] --> B[Build]
{{< /mermaid >}}
```

Images referenced by posts live under `static/images/<post-slug>/`.

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatches. It installs dependencies, builds Hugo, generates the Pagefind index, and deploys `public/` to GitHub Pages.

## Validation

There is no separate test suite. Before publishing content, run the production build and inspect the generated page locally:

```sh
hugo --minify
npx pagefind --site public
```
