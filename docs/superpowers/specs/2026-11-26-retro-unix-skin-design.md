# Retro Unix skin: kidpeterpan.github.io

Date: 2026-11-26 · Branch: `retro-cde-skin` (from `origin/main` at `0e33dac`)

## Intent

Give the portfolio a 90s flavor with 2026 usability. The owner asked for the
retro look of old Linux/Unix desktops, not Windows. The target is the CDE/Motif
look of Solaris and HP-UX: beveled gray-blue windows, Motif title bars, an X11
stipple desktop, and an `xterm` for the pitch. The owner said "flavor", so the
skin hints at the era and never turns reading into a costume.

Visitors are unchanged: people with the problem an app solves. The page must
still tell them in plain English what each app fixes and how to get it, at
least as fast as today.

## Goals

1. One consistent skin on every page: home, the three product pages
   (`open-mtp-client`, `inkbound`, `chiaki-ngx`), `/apps/` and both mini apps,
   the 404 page, and the generic `single`/`list` fallbacks.
2. Content, URLs, SEO tags, structured data, and all links stay as they are.
3. Two palettes named like CDE palettes: **Default** (light) and **Midnight**
   (dark). The existing theme toggle switches them.
4. 2026 UX stays: AA contrast, 44px targets, visible focus, no horizontal
   scroll from 320px, reduced-motion respected, forced-colors usable, dark
   twins of screenshots still swap.

## Non-goals

- No new pages, copy, sections, images, fonts, or JS libraries.
- No change to mini-app logic (`assets/js/apps/*`) or `data/*.yaml`.
- No functional window controls. Min/max/menu buttons in title bars are
  decorative and `aria-hidden`. No fake `< Back / Next >` buttons.
- No push to `main` (a push is a live deploy).

## Anti-goals

- A page that looks right in a screenshot but is harder to read or tap.
- Hover/focus states that exist only as bevel flips and vanish in forced-colors.
- Losing the "route" cable, which is the site's signature element.

## Constraints

- Build environment (local Hugo is 0.148 and Node is 20, both too old for
  `main`): Hugo 0.170.1 from `~/.hermes/cache/tools/hugo/hugo`, Node 22 from
  `~/.hermes/cache/tools/node22/node_modules/node/bin`, and
  `node_modules/.bin` on `PATH` for `tailwindcss`.
- `hugo --minify` finishes with zero warnings. `npm test` stays green.
- Keep `localStorage` key `mha-theme`.
- Keep the old token aliases `--green`, `--red`, `--shadow-pop`, `--line-strong`
  and the other names the mini-app CSS reads.
- Fonts: the site's system sans for body, IBM Plex Mono (already loaded) for
  window chrome and the terminal, IBM Plex Sans Thai for `lang="th"`. The
  only font change is adding weight 700 to the Plex Mono request.

## Palettes (values from the approved mockup, verbatim)

Default: `desk-a #53788a`, `desk-b #46687a`, `face #c3c7d4`, `hi #eceef4`,
`sh #5b5f73`, `edge #1d2030`, `paper #e6e8ef`, `ink #10131f`,
`muted #3b4057`, `title #44598f`, `title-ink #ffffff`, `accent #1c2fa3`,
`term-bg #0c0f14`, `term-ink #cfd6e4`, `term-prompt #7fd48a`.

Midnight: `desk-a #101630`, `desk-b #0a0f24`, `face #2a3150`, `hi #4a5484`,
`sh #0b0e1c`, `edge #05070f`, `paper #1a2038`, `ink #e8ebf8`,
`muted #aab2d6`, `title #3a4a95`, `title-ink #ffffff`, `accent #9fb0ff`,
terminal colors as Default.

Measured on the mockup: text/background contrast 6.8:1 to 15.1:1.

## Approaches considered

- **Windows 95/98 chrome**: rejected by the owner in favor of a Unix look.
- **Netscape-era document**: lightest, but drops the route cable.
- **Mac System 7/8**: elegant but nearly colorless; the download button would not stand out.
- **CDE/Motif (chosen)**: bevels give buttons clear affordance, the title bar
  gives each product a frame, and the route cable becomes a literal cable.
- Layout: windows stacked in one column (chosen) versus floating, overlapping
  windows (rejected: poor on phones).

## Decisions

Owner approved: CDE/Motif look, stacked windows, the mockup as the direction
(`~/.hermes/cache/scratch/mock-cde/`, throwaway).
My calls: the real build keeps the site's system sans for headings and body
(the mockup used Plex Sans); product screenshots stay and sit in an inset
frame inside each window; the toggle shows the palette name as text.

## Left to the builder

Exact spacing, title-bar ornament geometry, how the stipple behaves under
`prefers-contrast`, and the details of each page's window grouping, within the
constraints above.
