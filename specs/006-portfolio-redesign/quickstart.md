# Quickstart: validate the portfolio redesign

Run from the repo root on branch `portfolio-redesign`. Expected results refer to
`contracts/site-urls.md` and `contracts/structured-data.md`.

## Prerequisites

- Hugo extended ≥ 0.164 (`hugo version`), Node ≥ 20, and `npm ci` done.
- A browser for the manual checks (Constitution V).

## 1. Build is clean (SC-006)

```sh
rm -rf public resources/_gen && hugo --minify 2>&1 | tee /tmp/hugo-build.log
grep -Ei 'warn|error' /tmp/hugo-build.log   # expect: no output
```

## 2. Exactly the expected pages (SC-002, FR-001)

```sh
find public -name '*.html' | sort
```

Expected, and nothing else:

```
public/404.html
public/apps/index.html
public/apps/mortgage/index.html
public/apps/opencode-go/index.html
public/index.html
public/inkbound/index.html
public/open-mtp-client/index.html
```

```sh
ls public/index.xml public/tags public/pagefind 2>&1 | grep -c 'No such'   # expect: 3
grep -rlE '/(article|book|cheat_sheet|go|git|tools|tags)/|pagefind|index\.xml' public --include='*.html'   # expect: no output
```

## 3. Mini apps unchanged (SC-003, FR-004)

```sh
npm test    # expect: all mortgage-core and opencode-go-core tests pass, test files untouched
git diff --stat main -- tests/ assets/js/apps/ data/   # expect: empty
```

## 4. Head metadata and JSON-LD (FR-019–FR-022, SC-004, SC-007)

```sh
for p in index open-mtp-client/index inkbound/index apps/mortgage/index; do
  echo "== $p"
  f=public/$p.html
  grep -o '<html[^>]*>' $f | head -1                       # lang="en"
  grep -o '<title>[^<]*' $f                                  # problem-led for products, ≤ 65 chars
  grep -o 'property="og:image" content="[^"]*' $f           # product pages: their own screenshot
  grep -o '"@type":"[A-Za-z]*"' $f | sort -u                 # products: SoftwareApplication + Offer + Person
done
grep -rc BlogPosting public --include='*.html' | grep -v ':0'   # expect: no output
grep -o 'lang="th"' public/apps/mortgage/index.html             # expect: one match
grep -o 'noindex' public/404.html                                # expect: one match
```

Then paste the source of each built product page into
https://validator.schema.org (code snippet). Expect 0 errors. In Google's Rich
Results Test, a missing `aggregateRating`/`review` warning is expected and
accepted.

## 5. One-edit releases (SC-008)

```sh
grep -rn '0\.1\.0' content/open-mtp-client   # expect: exactly one line (params.version)
grep -rn '1\.15\.1' content/inkbound         # expect: exactly one line (params.version)
grep -rn 'download/.*\.dmg' content layouts  # expect: no output (no version-named file links)
```

## 6. Manual browser pass (SC-001, SC-005, Constitution V)

```sh
hugo server   # http://localhost:1313/
```

Do each check at desktop width and at 360px (DevTools), in **both** light and
dark mode:

| Page | Check |
|---|---|
| `/` | Pitch, 2 product cards with screenshots, mini-app links. Every link goes somewhere live. |
| `/open-mtp-client/` | Download → `…/open-mtp-client/releases/latest`. The first-launch notice sits right under the button, with macOS 15+ and ≤ 14 steps. The screenshot is the dark image in dark mode and the light image in light mode. The caption mentions the virtual phone. Get-it steps, FAQ `<details>` open and close. |
| `/inkbound/` | Install → `obsidian.md/plugins?id=inkbound`. The note → export → Boox picture story. The portrait Boox photos are not stretched or cropped. The README link works. |
| `/apps/mortgage/` | Change rate rows and the extra-payment input, and results update. The schedule shows. Thai renders. Locked-preset fields are readable. Nothing is unstyled. |
| `/apps/opencode-go/` | The table renders. Clicking headers sorts. Narrow width scrolls the table, not the page. |
| `/apps/` | Both mini apps listed. |
| `/does-not-exist/` | The site's 404 page with 3 links (`hugo server` serves `404.html`). |
| any | Tab through the header, so the toggle and links are reachable with visible focus. Reload in dark, and there is no light flash. Turn off JS, and pages read fully and links work. |

## 7. Docs

`README.md` and `CLAUDE.md` describe product bundles, the mini apps, and the new
commands. Neither mentions Pagefind, courses, ordered sections, or the MHA
theme as current.
