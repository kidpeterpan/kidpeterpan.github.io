# kidpeterpan.github.io

A small portfolio of free, open source apps by kidpeterpan, at [kidpeterpan.github.io](https://kidpeterpan.github.io/).

- **[open-mtp-client](https://kidpeterpan.github.io/open-mtp-client/)**: a Mac app for copying files between a Mac and an Android phone.
- **[Inkbound](https://kidpeterpan.github.io/inkbound/)**: an Obsidian plugin that exports notes as EPUB books for e-readers.
- **[Mini apps](https://kidpeterpan.github.io/apps/)**: a Thai mortgage calculator and an OpenCode Go model comparison that run in the browser.

## Stack

- [Hugo](https://gohugo.io/) extended as the static site generator
- Plain CSS compiled through Hugo Pipes (`css.TailwindCSS`, Tailwind CSS v4)
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

Open <http://127.0.0.1:1313/>. The server writes its PID to `.hugo-server.pid` and logs to `hugo-server.log`. The dev server also writes its pages into `public/`, so build into another folder (`hugo --minify -d /tmp/site`) when you want to inspect production output while it runs.

```sh
make stop
make restart
```

To run Hugo in the foreground instead:

```sh
hugo server
```

## Production build

```sh
hugo --minify
```

The generated site is written to `public/`. Hugo output and local development files are ignored by Git.

## Products

Each product is a page bundle at the content root, rendered by `layouts/_default/project.html`:

```text
content/open-mtp-client/
├── index.md        # front matter holds the product facts; the body holds the prose sections
├── main.png        # screenshot
├── main-dark.png   # optional dark-mode twin, shown when the site is in dark mode
└── icon.png        # optional app icon
```

### Releasing a new version

Change `version` in the product's front matter. That is the only place the version is written. The download and install buttons point at "latest" pages, so they never need to change.

### Adding a product

1. Create `content/<slug>/index.md` with `layout = 'project'` and the fields listed in `specs/006-portfolio-redesign/data-model.md`.
2. Copy its screenshots into the same folder. Never link to images on another site.
3. Set `order` to place it on the homepage. It appears there and gets its own page automatically.
4. Add it to the header links in `layouts/partials/nav-links.html`.

### Screenshots in the body

Write normal Markdown images. The image hook (`layouts/_default/_markup/render-image.html`) turns them into WebP with a fallback, sets their size, and lazy-loads them. A `"title"` becomes the caption. Two images on consecutive lines sit side by side.

```md
![A chapter open on the e-reader](boox-reading.jpg "Open on the device.")
```

## Mini apps

The mini apps live in `content/apps/`. Their data is in `data/*.yaml` and their scripts in `assets/js/apps/`. Their logic has tests:

```sh
npm test
```

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and on manual dispatch. It installs dependencies, builds with Hugo, and deploys `public/` to GitHub Pages.

## Validation

Before merging to `main`:

```sh
npm test
hugo --minify
```

Then open the changed pages with `make start`, in light and dark mode and at a phone width. `specs/006-portfolio-redesign/quickstart.md` lists the full set of checks.
