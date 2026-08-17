---
name: Lofte component library
description: Location, purpose, and key decisions for every component in src/components/
---

## Components

| File | Exports | Notes |
|---|---|---|
| `button.tsx` | `Button` | 6 variants (primary/secondary/tertiary/destructive/success/icon), 4 sizes (sm/default/lg/icon), `loading` prop; workout action = variant="secondary" size="lg" |
| `input.tsx` | `Input`, `Select`, `Toggle`, `Checkbox`, `RadioGroup` | All share same base height/border/bg; `Input` and `Select` accept `label`, `hint`, `error` |
| `card.tsx` | `Card`, `CardEyebrow`, `CardTitle`, `CardMeta`, `CardDivider` | 5 variants: default/elevated/interactive/highlight/disabled |
| `sheet.tsx` | `BottomSheet` | Mobile sheet modal; `open`/`onClose`/`title`/`subtitle`; replaces all custom bottom-sheet divs |
| `workout.tsx` | `WorkoutCurrentSet`, `WorkoutExerciseHeader`, `SetStatusBar`, `SetStatusDot`, `ExerciseCompleteBanner`, `PbCelebration` | Workout-specific; `SetStatusBar` takes `WorkoutSetStatus[]` (pending/current/completed/missed/retried/skipped) |
| `shell.tsx` | `Shell`, `LoadingBlock`, `ErrorBlock`, `EmptyBlock` | Shell: 4-tab nav (Track/Plans/History/Profile); Track active on / and /workout/* |

## Design system showcase
- Route: `/design` — rendered by `src/pages/design-system.tsx`
- Shows all tokens, all components, all states
- Not in the nav but reachable directly

## Key decisions
- **Never redefine Button or Field inline** in pages.tsx — import from components.
- **Workout primary action** = `variant="secondary"` (gold) to stand out against the dark card.
- **4-tab nav**: Track `/`, Plans `/programme`, History `/history`, Profile `/profile`. Track catches `/workout/*` routes.
- **BottomSheet** is the canonical modal pattern — never use raw fixed-position divs for overlays.
