# Layout — header rail = content column

**Status:** Applied in mock-up **and** Next app (`app/mockup.css` + `src/ui/app-header.tsx`).

## Problem

On wide viewports, `.app-header` was full-width with `padding-inline: 1.25rem`, while `.app-main` is centered at `--max-app` (72rem) with the same inset. Logo / 登出 sat farther out than Decide headline and criteria plate.

## Decision

**Full-bleed chrome, shared content rail.**

| Layer | Behavior |
| --- | --- |
| `.app-header` | Sticky bar: background + bottom border span the viewport |
| `.app-header__inner` | Logo → nav → user tools; `max-width: var(--max-app)`; same `1.25rem` inset as `.app-main` |
| Logo | `margin-inline-start: -3px` on `.app-header__inner .logo` (optical nudge) |

Pages: decide / profile / saved / history (mock HTML + AppHeader).

## Not chosen

- Shrink the whole header box to 72rem only (cloth gutters beside sticky bar).
- Widen main to full viewport (breaks plate/column rhythm).

## Profile note

`app-main--profile` stays the narrower register-card column. Header remains on the 72rem rail.
