---
name: Lofte design system
description: Colour tokens, typography, and design direction for the Lofte app
---

## Direction
Dark-first. Strava / Nike athletic aesthetic. Strong, focused, clear. No light mode.

## Font
Geist (variable weight 100–900) from Google Fonts. Two weights in use: 400 (Regular) and 600 (SemiBold).
- `.font-display` → Geist 600, letter-spacing -0.02em — headings and section titles
- `.font-data` → Geist 400, tabular-nums — labels, counters, metadata

## Colour tokens (all in index.css as HSL components)
| Token | Hex | Role |
|---|---|---|
| --background | #111315 | Base canvas |
| --card | #1B1E22 | Raised surface |
| --elevated / --accent | #262A2F | Further raised (workout cards) |
| --foreground | #F4F5F7 | Primary text |
| --muted-foreground | #9CA3AF | Secondary text |
| --primary | #D84B32 | Lofte red — brand, CTAs, active nav |
| --secondary | #C99A2E | Achievement gold — PBs, highlights |
| --success | #3F8F68 | Positive state |
| --destructive | #C74D4D | Error / destructive actions |
| --border | #343941 | Dividers |

**Why:** User's explicit brand brief (Aug 2026). Dark-only. Never reintroduce a light theme.

## Named type utilities (index.css @layer utilities)
- `.type-page-title` — 44px / 600 / uppercase / -0.03em
- `.type-section-heading` — 24px / 600 / uppercase / -0.02em
- `.type-subheading` — 18px / 600 / -0.01em
- `.type-body` — 15px / 400
- `.type-body-sm` — 13px / 400
- `.type-caption` — 11px / 400 / uppercase / +0.1em
- `.type-button` — 14px / 600
- `.text-workout-weight` — 88px / 600 / -0.045em / tabular — THE most prominent number in the app
- `.text-workout-weight-unit` — 28px / 400 — "kg" suffix alongside weight
- `.text-pb-number` — 32px / 600 / tabular — PB / stats display

**Why:** workout weight (e.g. 67.5 KG) is the single most important UI element during a session.
