# Feature Specification: Portfolio Redesign

**Feature Branch**: `portfolio-redesign`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Portfolio redesign of kidpeterpan.github.io. The approved design is in docs/superpowers/specs/2026-10-19-portfolio-redesign-design.md — use it as the source of truth. Summary: delete all articles/courses (article, book, cheat_sheet, go, git, tools); keep the two mini apps (/apps/mortgage/, /apps/opencode-go/) working at the same URLs; add an English portfolio homepage plus product pages for open-mtp-client (Mac app, Android<->Mac file transfer, .dmg from GitHub Releases) and Inkbound (Obsidian plugin, notes -> EPUB for e-ink readers, install from Obsidian community plugins), in simple English with real screenshots from the repos; new clean product-page look with light/dark mode; strong SEO (English site language, problem-led titles, SoftwareApplication JSON-LD, screenshot OG images, 404 page); remove Pagefind search and RSS."

**Source of truth**: `docs/superpowers/specs/2026-10-19-portfolio-redesign-design.md`
(approved by the owner on 2026-10-19). If this spec and that document
disagree, the design document wins.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A Mac user with an Android phone finds and installs open-mtp-client (Priority: P1)

Someone has an Android phone and a Mac, and their phone doesn't show up, or
Android File Transfer keeps failing. They search for the problem and land on
the open-mtp-client page. The page names their problem in plain words and
shows the app working. It tells them what they need (macOS 11 or later, Apple
Silicon or Intel), gives them one obvious Download button, and warns them
ahead of time about the macOS "can't check this app for malware" message,
with the exact steps to get past it.

**Why this priority**: This is the product with the sharpest, most-searched pain,
and the visitor's first launch has a known trap (the Gatekeeper warning) that
loses users if they aren't told about it. One page that converts this visitor
is the minimum useful portfolio.

**Independent Test**: Open `/open-mtp-client/` on its own. A first-time reader
can say what the app does, find the download in one click, and follow the
first-launch steps for their macOS version without leaving the page.

**Acceptance Scenarios**:

1. **Given** a visitor lands on the open-mtp-client page, **When** they read the
   first screen, **Then** they see the app's name, a one-sentence statement of
   the problem it solves, a screenshot of the app, and a Download button.
2. **Given** the visitor clicks Download, **When** the link opens, **Then** it is
   the open-mtp-client GitHub "latest release" page, which offers the current
   `.dmg`.
3. **Given** the visitor reads the area around the Download button, **When**
   they look for what happens on first launch, **Then** they find the
   first-launch warning explained. They also find separate steps for macOS 15
   or later and for macOS 14 or earlier, why the warning appears, and that it
   only happens once.
4. **Given** the site is in dark mode, **When** the visitor views the page,
   **Then** the app screenshot shows the dark version of the app, and the
   light version shows in light mode.
5. **Given** the visitor wants more detail or the source, **When** they look for
   it, **Then** there is a link to the GitHub repository and a link to build
   from source.

---

### User Story 2 - An Obsidian user who reads on e-ink finds and installs Inkbound (Priority: P1)

Someone keeps notes in Obsidian and wants to read them on an e-ink reader
instead of a laptop screen. They land on the Inkbound page. In simple English
and pictures it shows the journey: a note in Obsidian, right-click and export,
then the book on the reader's shelf and open on the device. It then shows how
to install it from inside Obsidian.

**Why this priority**: This is equally a headline product. It is independent of
Story 1 and delivers value on its own.

**Independent Test**: Open `/inkbound/` on its own. A first-time reader can say
what the plugin does and which three ways it exports. They can reach the
plugin's install page in one click and know the in-app install steps.

**Acceptance Scenarios**:

1. **Given** a visitor lands on the Inkbound page, **When** they read the first
   screen, **Then** they see what it does (Obsidian notes → EPUB book for
   e-readers), a picture, and an Install button.
2. **Given** the visitor scrolls, **When** they reach the "how it works"
   part, **Then** they see the three-step picture story: note, export menu,
   book on the e-reader.
3. **Given** the visitor clicks Install, **When** the link opens, **Then** it
   is the Inkbound entry in Obsidian's community plugin directory.
4. **Given** the visitor reads the install section, **When** they look for
   steps, **Then** they see the steps to install from inside Obsidian
   (Settings → Community plugins → Browse → "Inkbound" → Install → Enable).
   They also see the requirement (Obsidian 1.5 or newer, desktop and mobile)
   and a secondary link to install by hand from GitHub Releases.
5. **Given** the visitor wants the full documentation, **When** they look for
   it, **Then** a link takes them to the README on GitHub. The page itself
   stays short.

---

### User Story 3 - A visitor arrives at the homepage and chooses an app (Priority: P2)

Someone opens kidpeterpan.github.io directly or from a profile link. They see
right away that this is a small collection of apps that fix everyday
problems. Each headline product has a card with its picture, a one-line
problem and solution, and a button. A smaller "Mini apps" area links to the
mortgage calculator and the OpenCode Go comparison.

**Why this priority**: The homepage routes visitors, but most search traffic is
expected to land directly on product pages (Stories 1–2).

**Independent Test**: Open `/`. From the homepage alone, a visitor can reach each
product page, each product's get-it action, and each mini app.

**Acceptance Scenarios**:

1. **Given** a visitor opens the homepage, **When** the page loads, **Then**
   they see a short pitch and two product cards (open-mtp-client, Inkbound).
   Each card has a screenshot, a one-line description, and a link to its page.
2. **Given** a visitor scans further down, **When** they look for other
   tools, **Then** they find links to the two mini apps.
3. **Given** a visitor uses any page, **When** they look at the header, **Then**
   it links to both products, the mini apps, the owner's GitHub, and a
   light/dark toggle. It has no links to deleted sections.

---

### User Story 4 - Existing mini apps keep working (Priority: P1)

A returning user opens `/apps/mortgage/` or `/apps/opencode-go/` from a
bookmark. The tool is at the same address and works exactly as before. It is
restyled to match the new look and readable in light and dark mode.

**Why this priority**: The owner chose to keep these. Breaking them is an
explicit anti-goal, so this story guards against a regression.

**Independent Test**: Open both mini-app URLs. Fill in the mortgage form and
check the results and schedule. Sort the OpenCode Go table by a column. Do
both in light and dark mode.

**Acceptance Scenarios**:

1. **Given** the redesign has shipped, **When** a visitor opens `/apps/mortgage/`,
   **Then** the calculator shows. Changing inputs updates the results the same
   way as before the redesign, and Thai text renders correctly.
2. **Given** the redesign has shipped, **When** a visitor opens `/apps/opencode-go/`,
   **Then** the comparison table shows and sorting by a column works.
3. **Given** either mini app, **When** the theme is toggled, **Then** every
   control, table and result stays readable, with no unstyled or invisible
   elements.
4. **Given** the `/apps/` listing, **When** a visitor opens it, **Then** both
   mini apps are listed.

---

### User Story 5 - Search engines and link previews understand each app (Priority: P2)

Search engines index each product page as a free software application, with
a title that names the problem people search for. When someone shares a
product link in a chat or on social media, the preview shows the app's real
screenshot.

**Why this priority**: It is the main way new visitors find the products, but it
builds on the pages in Stories 1–2.

**Independent Test**: Inspect the built HTML of each product page for its
title, description, canonical URL, language, social preview tags, and
structured data. Run the structured data through a schema validator.

**Acceptance Scenarios**:

1. **Given** a product page, **When** its metadata is read, **Then** the page
   title and description lead with the problem it solves, as well as the app
   name.
2. **Given** a product page, **When** its structured data is validated,
   **Then** it describes a free `SoftwareApplication`. That includes the name,
   description, operating system, category, current version,
   download/install link, screenshot, price 0, license, and author. It has no
   validation errors other than the missing rating/review.
3. **Given** a product page link is shared, **When** a preview is generated,
   **Then** the preview image is that product's screenshot. It is not a
   generic card and not a broken image.
4. **Given** any page on the site, **When** its language is read, **Then** it is
   English. The Thai mortgage content is marked as Thai.
5. **Given** the homepage, **When** its structured data is read, **Then** it
   describes the website and its owner (with a link to the owner's GitHub).

---

### User Story 6 - A visitor following an old blog link is not stranded (Priority: P3)

Someone follows an old link to a deleted article or course episode. Instead
of a bare error, they get a friendly "not found" page in the site's look. It
links to the homepage and to both products.

**Why this priority**: The owner accepted that old URLs break. This only softens
the dead end.

**Independent Test**: Request any non-existent path and confirm the not-found
page and its links.

**Acceptance Scenarios**:

1. **Given** a deleted URL such as `/go/01-setting-up-your-go-environment/`,
   **When** it is requested on the live site, **Then** the visitor sees the
   site's not-found page with links home and to both products.

---

### Edge Cases

- **New app release**: When either app releases a new version, the download or
  install link must not break. Links point to "latest" pages, not to
  version-named files, and the version shown is stored in one place per
  product.
- **Unsigned app warning**: open-mtp-client is not notarized. The page must not
  hide this or call it a bug. It must explain it plainly next to the download.
- **Placeholder data in screenshots**: The open-mtp-client screenshot uses a
  virtual phone and sample photos. The page must say so in a caption, as the
  repo does.
- **Tall phone photos**: The two Boox photos are portrait (about 3:4). Layouts
  must not stretch or crop them so the text on the device becomes unreadable.
- **Narrow screens**: Every page must work at 360px wide with no sideways
  scrolling, including the mini apps' tables and forms.
- **Dark mode before scripts load**: The saved theme preference must apply
  before the first paint, so pages don't flash light then dark (current
  behavior, preserved).
- **No JavaScript**: Product pages and the homepage must be fully readable and
  every link must work with scripts off. Only the theme toggle needs script.
- **Saved theme from the old site**: A returning visitor's saved light/dark
  choice is still honored.

## Requirements *(mandatory)*

### Functional Requirements

**Removal**

- **FR-001**: The site MUST no longer publish any page from the article, book,
  cheat sheet, Go course, Git course, or tools sections, or their images.
- **FR-002**: The site MUST no longer offer site search or an RSS feed, and
  nothing on any page may point to them.
- **FR-003**: The site MUST keep publishing a sitemap and robots file that list
  only pages that still exist.

**Mini apps (kept)**

- **FR-004**: `/apps/`, `/apps/mortgage/`, and `/apps/opencode-go/` MUST stay at
  the same URLs, with the same behavior and the same results for the same
  inputs.
- **FR-005**: Every visual element of both mini apps MUST be styled in the new
  look and stay readable in light and dark mode.

**Product pages**

- **FR-006**: The site MUST have a page for open-mtp-client at `/open-mtp-client/`
  and a page for Inkbound at `/inkbound/`.
- **FR-007**: Each product page MUST include:
  - a problem statement in simple English,
  - what the app does,
  - real screenshots or photos from the product's repository, with
    descriptive alternative text,
  - a primary get-it button,
  - step-by-step install instructions,
  - requirements,
  - links to the GitHub repository and to the owner's buy-me-a-coffee page.
- **FR-008**: The open-mtp-client primary button MUST link to the repository's
  latest-release page. Directly next to it, the page MUST explain the
  first-launch warning, with separate steps for macOS 15+ and macOS 14 or
  earlier.
- **FR-009**: The open-mtp-client screenshot MUST match the site theme: light
  image in light mode, dark image in dark mode.
- **FR-010**: The Inkbound primary button MUST link to Inkbound's entry in
  Obsidian's community plugin directory. The page MUST show the
  note → export → e-reader journey in pictures, and link to the full README
  for the remaining detail.
- **FR-011**: All product claims MUST come from the products' own READMEs or
  manifest. There MUST be no invented features, device support, user counts,
  ratings, or reviews.
- **FR-012**: Each product's current version, download/install link, repository
  link, platform, category, and license MUST be stored once per product, so a
  new release is a single edit.

**Homepage and navigation**

- **FR-013**: The homepage MUST present a short pitch, one card per product
  (screenshot, one-line problem/solution, link to its page), and links to the
  mini apps.
- **FR-014**: Every page MUST share a header with links to both products, the
  mini apps, the owner's GitHub, a light/dark toggle, and the buy-me-a-coffee
  link, and a footer with the same destinations. It MUST NOT link to removed
  sections.
- **FR-015**: Any unknown URL MUST show a not-found page in the site's look,
  with links to the homepage and both products.

**Look and accessibility**

- **FR-016**: The whole site MUST use a new clean product-page look that
  replaces the current comic/paper theme. It needs:
  - a light background and large type,
  - large screenshots and clear buttons,
  - full light and dark modes, with the visitor's saved choice honored and no
    flash on load.
- **FR-017**: Every page MUST be usable at 360px width with no horizontal page
  scroll.
- **FR-018**: All interactive elements MUST be keyboard-usable, have accessible
  names, and not rely on color alone.

**SEO**

- **FR-019**: The site's primary language MUST be English. The site title and
  description MUST describe a portfolio of apps. The Thai mortgage content
  MUST be marked as Thai.
- **FR-020**: Each product page title and meta description MUST lead with the
  problem the product solves. Each page MUST have exactly one top-level
  heading.
- **FR-021**: Each product page MUST carry structured data describing it as a
  free software application (see Story 5, scenario 2). The homepage MUST
  carry structured data for the website and its owner. No page may describe
  itself as a blog post.
- **FR-022**: Each product page's social preview image MUST be its own
  screenshot. Other pages keep a generated card.
- **FR-023**: Images MUST declare their dimensions (no layout shift). Images
  below the first screen MUST load lazily. Product images MUST be served in a
  compressed modern format with a fallback.
- **FR-024**: Every page MUST keep its canonical URL tag, and the site's
  existing analytics MUST keep working.

**Docs**

- **FR-025**: The repository's README and contributor guidance (CLAUDE.md)
  MUST describe the new structure and MUST NOT describe removed features.

### Key Entities

- **Product**: a featured app. It has a name, a problem statement, a one-line
  pitch, a version, a primary action (label and URL), install steps,
  requirements, a repository URL, a platform, a category, a license,
  screenshots (with light/dark variants where available) and captions, and
  optional FAQs. There are two instances: open-mtp-client and Inkbound.
- **Mini app**: an existing interactive tool under `/apps/` (mortgage calculator,
  OpenCode Go comparison). It is unchanged apart from styling.
- **Screenshot**: an image copied from a product repository, with alternative
  text, intrinsic size, an optional dark-mode twin, and an optional caption.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can go from landing on either product page to
  the product's download or install destination in 1 click, and can find the
  install steps without leaving the page.
- **SC-002**: 100% of published pages are the expected set: home, 2 product pages,
  the mini-app listing, 2 mini apps, and the not-found page. Zero pages
  remain from removed sections.
- **SC-003**: Both mini apps give identical results for the same inputs before and
  after the redesign, and their existing automated checks pass unchanged.
- **SC-004**: Both product pages' structured data validates with zero errors
  apart from the known missing rating/review warning.
- **SC-005**: Every page passes a visual check in both light and dark mode at
  desktop width and at 360px: no unreadable text, no unstyled controls, no
  horizontal scroll.
- **SC-006**: The site builds for production with zero errors and zero warnings.
- **SC-007**: A shared link to each product page shows that product's own
  screenshot as the preview image.
- **SC-008**: Raising either product's version takes editing exactly one value
  for that product.

## Assumptions

- **Owner decisions** (2026-10-19):
  - Delete the courses and articles, keep the mini apps, write in English, and
    use the "clean app page" look.
  - Old article URLs 404 with no redirects.
- **Design decided by Claude**: the remaining calls in the design document were
  made by Claude, and the owner approved that document. These include:
  - URLs `/open-mtp-client/` and `/inkbound/`,
  - removing search and RSS,
  - keeping the saved-theme key,
  - not emitting ratings,
  - adding a 404 page.
- **Constitution conflict, approved by the owner**: Principle II ("Theme
  Consistency", which requires the "Plus Ultra Paper" design system) conflicts
  with the owner's choice of a new look. The plan must amend the constitution
  (MAJOR version bump) as part of this feature, and must not treat the old
  theme as binding.
- **Screenshots**: the existing images in the two repositories are used as they
  are. No new screenshots are captured for this feature.
- **Star ratings**: no rating or review data exists, and none will be invented.
  The app-style rich result in search may therefore show without stars. This
  is accepted.
- **Mini app copy**: the mortgage page stays in Thai and the OpenCode Go page
  stays in English. Only styling changes.
- **Out of scope**:
  - new apps,
  - a blog,
  - translations of the product pages,
  - new screenshots,
  - signing or notarizing open-mtp-client,
  - files untracked in the repo (`specs/` drafts, `.claude/launch.json`, the
    stray zip) and `design/mha-redesign/`.
- **Release safety**: all work happens on the `portfolio-redesign` branch. The
  owner reviews locally before it merges to `main`, because merging deploys
  the live site.
