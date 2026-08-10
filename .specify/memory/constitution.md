<!--
Sync Impact Report
- Version change: TEMPLATE → 1.0.0 (initial ratification)
- Modified principles: n/a (first version)
- Added sections: Core Principles (5), Technology Constraints, Development Workflow, Governance
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gate is generic; no edit needed)
  - ✅ .specify/templates/spec-template.md (no principle-specific references found)
  - ✅ .specify/templates/tasks-template.md (no principle-specific references found)
  - ✅ CLAUDE.md (already reflects Hugo/no-test-suite/Tailwind facts consistent with this constitution)
- Follow-up TODOs: none
-->

# kidpeterpan.github.io Constitution

## Core Principles

### I. Simplicity First
Every change MUST use the simplest mechanism that satisfies the requirement. Do not add
build tooling, JS frameworks, package dependencies, or abstraction layers (helper functions,
config flags, generic components) beyond what a single feature strictly needs. Prefer plain
Go templates, vanilla CSS/JS, and Hugo built-ins over new libraries. Rationale: this is a
personal static blog, not a product with a team maintaining it — every added dependency or
abstraction is a durable maintenance cost paid by one person.

### II. Theme Consistency
All content-facing UI (templates, partials, shortcodes, CSS) MUST match the existing
"Plus Ultra Paper" design system: the established color tokens, typography, and textures
in `assets/css/main.css`, and MUST work correctly in both light and dark mode via the
`data-theme` attribute toggled by `static/js/theme.js`. New UI is not "done" until it has
been checked in both themes. Rationale: visual inconsistency or dark-mode breakage is highly
visible on a public blog and cheap to prevent by checking both modes before shipping.

### III. Minimal, Justified Dependencies
New npm packages, Hugo modules, or third-party scripts/CDN embeds MUST NOT be introduced
unless the feature is infeasible with what's already in the toolchain (Hugo Pipes, Tailwind
CSS v4, the packages already in `package.json`). Any new dependency MUST be named and
justified when proposed. Rationale: keeps `npm ci` fast, keeps the production build
(`hugo --minify`) self-contained, and avoids supply-chain and staleness risk on a repo with
no active dependency-maintenance process.

### IV. Content-Facing Accessibility
UI that readers interact with directly (buttons, links, navigation, interactive controls)
MUST be usable via keyboard, MUST have accessible names (visible text or `aria-label`), and
MUST NOT rely on color alone to convey meaning or state. Rationale: this is public-facing
content meant to be read and shared broadly; accessibility here is a correctness requirement,
not a nice-to-have.

### V. Manual Verification (NON-NEGOTIABLE)
This repository has no automated test suite or linter. Every change to templates, CSS, or
JS MUST be manually verified by running `hugo server` (or `make start`) and exercising the
affected page(s) in a browser — checking the golden path, both theme modes, and any
interactive states — before the change is reported as complete. A production build
(`hugo --minify`) MUST also succeed without errors before merging. Rationale: without
automated tests, manual verification against the running dev server is the only correctness
signal available; skipping it means shipping unverified changes to a live public site.

## Technology Constraints

This is a Hugo static site. Content lives in `content/` as Markdown with TOML front matter;
presentation lives in `layouts/` as Go templates; the single Tailwind CSS v4 source is
`assets/css/main.css`, compiled through Hugo Pipes (`css.TailwindCSS`). New sections, pages,
or components MUST follow this existing content/presentation split — no inline `<style>`
blocks or HTML embedded directly in Markdown content. `design/mha-redesign/` is a reference
mockup only, never a build dependency.

## Development Workflow

Since there is no CI test gate beyond the Hugo build itself, the practical quality gate for
every change is: (1) it builds cleanly with `hugo --minify`, (2) it has been visually
checked via `hugo server` in both light and dark mode, and (3) it does not introduce a new
dependency without justification (Principle III). Changes that only touch content
(Markdown posts) are exempt from the CSS/theme checks in Principles II and IV but still
require a build check.

## Governance

This constitution supersedes ad-hoc conventions for any conflict between them. Amendments
require: (1) the change is written directly into this file, (2) the version is bumped per
the policy below, (3) dependent templates (`plan-template.md`, `spec-template.md`,
`tasks-template.md`) are re-checked for now-stale references. Versioning policy follows
semantic versioning for governance documents: MAJOR for backward-incompatible principle
removals/redefinitions, MINOR for new principles or materially expanded guidance, PATCH for
wording/clarification fixes. All feature specs and plans produced by the Spec Kit workflow
MUST be checked against these principles at the "Constitution Check" gate in the plan
template; unjustifiable violations block the plan from proceeding.

**Version**: 1.0.0 | **Ratified**: 2026-07-31 | **Last Amended**: 2026-07-31
