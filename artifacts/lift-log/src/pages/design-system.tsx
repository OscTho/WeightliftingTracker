/**
 * Design System Showcase — Lofte
 *
 * Internal reference page showing every component, token, and state.
 * Route: /design
 *
 * Sections:
 *   1. Colour palette
 *   2. Typography scale
 *   3. Spacing scale
 *   4. Buttons
 *   5. Form components
 *   6. Cards
 *   7. Workout components
 *   8. Set status
 *   9. PB celebration
 *   10. Feedback states
 */

import { useState } from 'react';
import { ArrowRight, Check, Plus, Save, Trash2, Trophy } from 'lucide-react';
import { Button } from '@/components/button';
import { Input, Select, Toggle, Checkbox, RadioGroup } from '@/components/input';
import { Card, CardEyebrow, CardTitle, CardMeta, CardDivider } from '@/components/card';
import { BottomSheet } from '@/components/sheet';
import {
  WorkoutCurrentSet,
  WorkoutExerciseHeader,
  SetStatusBar,
  SetStatusDot,
  ExerciseCompleteBanner,
  PbCelebration,
} from '@/components/workout';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '@/components/shell';

// ─── helpers ─────────────────────────────────────────────

function DSSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div className="border-b border-border pb-3">
        <h2 className="font-display text-2xl font-semibold uppercase tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DSLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function DSRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <DSLabel>{label}</DSLabel>
      <div className="mt-3 flex flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────

const SWATCHES = [
  { name: 'Background',        cls: 'bg-background border border-border',  hex: '#111315', note: 'Base canvas' },
  { name: 'Card',              cls: 'bg-card',                              hex: '#1B1E22', note: 'Raised surface' },
  { name: 'Elevated / Accent', cls: 'bg-elevated',                         hex: '#262A2F', note: 'Higher elevation' },
  { name: 'Foreground',        cls: 'bg-foreground',                       hex: '#F4F5F7', note: 'Primary text' },
  { name: 'Muted foreground',  cls: 'bg-muted-foreground',                 hex: '#9CA3AF', note: 'Secondary text' },
  { name: 'Primary (Red)',     cls: 'bg-primary',                          hex: '#D84B32', note: 'Brand accent / CTA' },
  { name: 'Secondary (Gold)',  cls: 'bg-secondary',                        hex: '#C99A2E', note: 'PB / achievement' },
  { name: 'Success',           cls: 'bg-success',                          hex: '#3F8F68', note: 'Positive state' },
  { name: 'Destructive',       cls: 'bg-destructive',                      hex: '#C74D4D', note: 'Error / danger' },
  { name: 'Border',            cls: 'bg-border',                           hex: '#343941', note: 'Dividers' },
];

const BRAND_ASSET_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/brand`;

const BRAND_MARKS = [
  { label: 'Icon mark', file: 'lofte-icon.svg', surface: 'bg-background', size: 'icon' },
  { label: 'Wordmark', file: 'lofte-wordmark.svg', surface: 'bg-background', size: 'wordmark' },
  { label: 'Horizontal lockup', file: 'lofte-lockup-horizontal.svg', surface: 'bg-background', size: 'wide' },
  { label: 'Stacked lockup', file: 'lofte-lockup-stacked.svg', surface: 'bg-background', size: 'stacked' },
  { label: 'Icon · ink', file: 'lofte-icon-mono.svg', surface: 'bg-[#F4F0E9]', size: 'icon' },
  { label: 'Icon · reverse', file: 'lofte-icon-reverse.svg', surface: 'bg-background', size: 'icon' },
  { label: 'Wordmark · ink', file: 'lofte-wordmark-mono.svg', surface: 'bg-[#F4F0E9]', size: 'wordmark' },
  { label: 'Wordmark · reverse', file: 'lofte-wordmark-reverse.svg', surface: 'bg-background', size: 'wordmark' },
  { label: 'Horizontal · ink', file: 'lofte-lockup-horizontal-mono.svg', surface: 'bg-[#F4F0E9]', size: 'wide' },
  { label: 'Horizontal · reverse', file: 'lofte-lockup-horizontal-reverse.svg', surface: 'bg-background', size: 'wide' },
  { label: 'Stacked · ink', file: 'lofte-lockup-stacked-mono.svg', surface: 'bg-[#F4F0E9]', size: 'stacked' },
  { label: 'Stacked · reverse', file: 'lofte-lockup-stacked-reverse.svg', surface: 'bg-background', size: 'stacked' },
] as const;

const SPACING_STEPS = [
  { token: '--space-1',  label: 'space-1',  px: '4px',  tw: 'p-1'  },
  { token: '--space-2',  label: 'space-2',  px: '8px',  tw: 'p-2'  },
  { token: '--space-3',  label: 'space-3',  px: '12px', tw: 'p-3'  },
  { token: '--space-4',  label: 'space-4',  px: '16px', tw: 'p-4'  },
  { token: '--space-6',  label: 'space-6',  px: '24px', tw: 'p-6'  },
  { token: '--space-8',  label: 'space-8',  px: '32px', tw: 'p-8'  },
  { token: '--space-12', label: 'space-12', px: '48px', tw: 'p-12' },
  { token: '--space-16', label: 'space-16', px: '64px', tw: 'p-16' },
];

type BrandTileProps = {
  label: string;
  file: string;
  surface: 'bg-background' | 'bg-[#F4F0E9]';
  size: 'icon' | 'wordmark' | 'wide' | 'stacked';
};

function BrandTile({ label, file, surface, size }: BrandTileProps) {
  const tileSize =
    size === 'wide'
      ? 'col-span-2 min-h-28'
      : size === 'stacked'
        ? 'min-h-52'
        : 'min-h-28';
  const imageSize =
    size === 'icon'
      ? 'h-20 w-20'
      : size === 'stacked'
        ? 'h-44 w-36'
        : 'h-16 w-[88%]';

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-border p-4 ${surface} ${tileSize}`}>
      <span className={`absolute left-3 top-3 font-data text-[9px] uppercase tracking-widest ${surface === 'bg-background' ? 'text-muted-foreground' : 'text-background/50'}`}>
        {label}
      </span>
      <img
        src={`${BRAND_ASSET_BASE}/${file}`}
        alt={`Lofte ${label}`}
        className={`object-contain ${imageSize}`}
        loading="lazy"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────

export function DesignSystemPage() {
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [pbOpen, setPbOpen]         = useState(false);
  const [exOpen, setExOpen]         = useState(false);
  const [toggle, setToggle]         = useState(false);
  const [checkbox, setCheckbox]     = useState(false);
  const [radio, setRadio]           = useState('a');

  return (
    <div className="space-y-14 pb-16">

      {/* ─── Title ─────────────────────────────────────── */}
      <div>
        <p className="font-data text-[11px] uppercase tracking-[.22em] text-primary">Internal</p>
        <h1 className="mt-1 font-display text-5xl font-semibold uppercase leading-[.88] tracking-tight">
          Design System
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Lofte component library — tokens, components, and states.
        </p>
      </div>

      {/* ─── 1. Colours ────────────────────────────────── */}
      <DSSection title="01 — Colours">
        <div className="grid grid-cols-2 gap-3">
          {SWATCHES.map(s => (
            <div key={s.name} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className={`h-16 w-full ${s.cls}`} />
              <div className="p-3">
                <p className="text-xs font-semibold leading-tight">{s.name}</p>
                <p className="font-data text-[10px] text-muted-foreground">{s.hex}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </DSSection>

      {/* ─── 2. Brand marks ─────────────────────────────── */}
      <DSSection title="02 — Brand Marks">
        <div className="space-y-5">
          <p className="type-body-sm text-muted-foreground">
            The production wordmark uses uppercase LOFTE in the same Geist display face as the product UI. Primary marks use Lofte red; ink and reverse variants are ready for stamping and dark surfaces.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {BRAND_MARKS.map(mark => (
              <BrandTile key={mark.file} {...mark} />
            ))}
          </div>
        </div>
      </DSSection>

      {/* ─── 3. Typography ─────────────────────────────── */}
      <DSSection title="03 — Typography">
        <div className="space-y-6 rounded-xl border border-border bg-card p-5">

          <div>
            <DSLabel>Page title · font-display / 44px / semibold / uppercase</DSLabel>
            <p className="type-page-title mt-2">Programme room.</p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>Section heading · font-display / 24px / semibold / uppercase</DSLabel>
            <p className="type-section-heading mt-2">Personal bests</p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>Subheading · font-display / 18px / semibold</DSLabel>
            <p className="type-subheading mt-2">Power & positions</p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>Body · Geist / 15px / regular</DSLabel>
            <p className="type-body mt-2 text-muted-foreground">Keep your reference lifts close. Lofte uses them to turn percentages into weights you can load.</p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>Body SM · Geist / 13px / regular</DSLabel>
            <p className="type-body-sm mt-2 text-muted-foreground">2 movements · 8 working sets</p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>Caption · Geist / 11px / uppercase / wide tracking</DSLabel>
            <p className="type-caption mt-2 text-muted-foreground">Today · Mon, 17 Aug</p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>Button text · Geist / 14px / semibold</DSLabel>
            <p className="type-button mt-2">Start session</p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>Workout weight · Geist / 88px / semibold — the dominant number</DSLabel>
            <p className="text-workout-weight mt-2 text-secondary">
              67.5<span className="text-workout-weight-unit ml-3 opacity-60">kg</span>
            </p>
          </div>
          <CardDivider className="my-0" />

          <div>
            <DSLabel>PB number · Geist / 32px / semibold / tabular</DSLabel>
            <p className="text-pb-number mt-2 text-secondary">92.5</p>
          </div>

        </div>
      </DSSection>

      {/* ─── 4. Spacing ────────────────────────────────── */}
      <DSSection title="04 — Spacing">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          {SPACING_STEPS.map(s => (
            <div key={s.label} className="flex items-center gap-4">
              <div
                className="shrink-0 rounded bg-primary/40"
                style={{ width: s.px, height: '12px' }}
              />
              <div className="font-data text-xs text-muted-foreground">
                <span className="text-foreground">{s.px}</span> · {s.token} · tw:{s.tw}
              </div>
            </div>
          ))}
        </div>
      </DSSection>

      {/* ─── 5. Buttons ────────────────────────────────── */}
      <DSSection title="05 — Buttons">
        <DSRow label="Variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="success">Success</Button>
        </DSRow>

        <DSRow label="Sizes">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="default">Default</Button>
          <Button variant="primary" size="lg">Large (workout)</Button>
        </DSRow>

        <DSRow label="Icon button">
          <Button variant="icon" size="icon"><Trash2 size={18} /></Button>
          <Button variant="icon" size="icon"><Plus size={18} /></Button>
          <Button variant="icon" size="icon"><Save size={18} /></Button>
        </DSRow>

        <DSRow label="With icon">
          <Button variant="primary"><Check size={16} /> Complete rep</Button>
          <Button variant="secondary">Start session <ArrowRight size={16} /></Button>
        </DSRow>

        <DSRow label="Loading">
          <Button variant="primary" loading>Logging…</Button>
          <Button variant="secondary" loading>Starting…</Button>
        </DSRow>

        <DSRow label="Disabled">
          <Button variant="primary" disabled>Primary</Button>
          <Button variant="secondary" disabled>Secondary</Button>
          <Button variant="tertiary" disabled>Tertiary</Button>
          <Button variant="destructive" disabled>Destructive</Button>
        </DSRow>

        <DSRow label="Workout action (lg)">
          <Button variant="secondary" size="lg" className="w-full">
            <Check size={20} /> Complete rep
          </Button>
        </DSRow>
      </DSSection>

      {/* ─── 6. Form components ────────────────────────── */}
      <DSSection title="06 — Form Components">
        <div className="space-y-4">
          <Input label="Text input" placeholder="Your name" />
          <Input label="Number input" type="number" placeholder="0" />
          <Input label="With hint" placeholder="e.g. 92.5" hint="In kilograms. Be honest; useful beats impressive." />
          <Input label="With error" placeholder="0" defaultValue="abc" error="Must be a number." />
          <Input label="Disabled" placeholder="Not editable" disabled defaultValue="Oscar" />

          <Select
            label="Movement"
            options={[
              { value: 'snatch', label: 'Snatch' },
              { value: 'clean_and_jerk', label: 'Clean & jerk' },
              { value: 'back_squat', label: 'Back squat' },
              { value: 'front_squat', label: 'Front squat' },
            ]}
          />

          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <DSLabel>Toggle</DSLabel>
            <Toggle checked={toggle} onChange={setToggle} label={toggle ? 'Enabled' : 'Disabled'} />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <DSLabel>Checkbox</DSLabel>
            <Checkbox checked={checkbox} onChange={setCheckbox} label="I've warmed up properly" />
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <RadioGroup
              label="Rounding increment"
              value={radio}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setRadio(value);
                }
              }}
              options={[
                { value: 'a', label: '1 kg' },
                { value: 'b', label: '2 kg' },
                { value: 'c', label: '2.5 kg' },
              ]}
            />
          </div>
        </div>
      </DSSection>

      {/* ─── 7. Cards ──────────────────────────────────── */}
      <DSSection title="07 — Cards">
        <DSRow label="Default">
          <Card className="w-full">
            <CardEyebrow>Weekly cycle</CardEyebrow>
            <CardTitle>Foundation Cycle</CardTitle>
            <CardMeta>3× per week · 4 weeks</CardMeta>
          </Card>
        </DSRow>

        <DSRow label="Elevated (workout)">
          <Card variant="elevated" className="w-full">
            <CardEyebrow>Next session</CardEyebrow>
            <CardTitle>Power & Positions</CardTitle>
            <CardMeta>2 movements · 8 working sets</CardMeta>
          </Card>
        </DSRow>

        <DSRow label="Interactive">
          <Card variant="interactive" className="w-full" onClick={() => {}}>
            <CardEyebrow>Tap me</CardEyebrow>
            <CardTitle>Interactive card</CardTitle>
            <CardMeta>Hover or tap to see the active state</CardMeta>
          </Card>
        </DSRow>

        <DSRow label="Highlight (selected)">
          <Card variant="highlight" className="w-full">
            <CardEyebrow>Selected</CardEyebrow>
            <CardTitle>Highlight card</CardTitle>
            <CardMeta>Used for featured or selected content</CardMeta>
          </Card>
        </DSRow>

        <DSRow label="Disabled">
          <Card variant="disabled" className="w-full">
            <CardEyebrow>Unavailable</CardEyebrow>
            <CardTitle>Disabled card</CardTitle>
            <CardMeta>Content is not interactive</CardMeta>
          </Card>
        </DSRow>
      </DSSection>

      {/* ─── 8. Workout components ─────────────────────── */}
      <DSSection title="08 — Workout Components">

        <DSRow label="Current set (dominant weight)">
          <div className="w-full">
            <WorkoutCurrentSet
              exercise="snatch"
              setNumber={3}
              totalSets={8}
              weight={67.5}
              reps={2}
              percentage={75}
            />
          </div>
        </DSRow>

        <DSRow label="Exercise header">
          <div className="w-full rounded-xl border border-border bg-card p-4">
            <WorkoutExerciseHeader exercise="clean_and_jerk" sets={5} reps={3} percentage={80} />
          </div>
        </DSRow>

        <DSRow label="Exercise complete">
          <div className="w-full">
            <ExerciseCompleteBanner
              exerciseName="Snatch"
              nextExerciseName="Clean & jerk"
              onContinue={() => {}}
            />
          </div>
        </DSRow>

      </DSSection>

      {/* ─── 9. Set status ─────────────────────────────── */}
      <DSSection title="09 — Set Status">

        <DSRow label="Status bar (completed / current / missed / pending)">
          <div className="w-full space-y-3">
            <SetStatusBar statuses={['completed', 'completed', 'current', 'pending', 'pending', 'pending']} />
            <SetStatusBar statuses={['completed', 'missed', 'retried', 'completed', 'pending', 'pending']} />
            <SetStatusBar statuses={['completed', 'completed', 'completed', 'completed', 'completed', 'completed']} />
          </div>
        </DSRow>

        <DSRow label="Status dots (legend)">
          {(['pending', 'current', 'completed', 'missed', 'retried', 'skipped'] as const).map(s => (
            <SetStatusDot key={s} status={s} label={s} />
          ))}
        </DSRow>

      </DSSection>

      {/* ─── 10. PB celebration ────────────────────────── */}
      <DSSection title="10 — PB Celebration">
        <DSRow label="Trigger (renders full-screen overlay)">
          <Button variant="secondary" onClick={() => setPbOpen(true)}>
            <Trophy size={16} /> Preview PB celebration
          </Button>
        </DSRow>
        {pbOpen && (
          <PbCelebration
            exercise="snatch"
            newPb={92.5}
            improvement={2.5}
            onContinue={() => setPbOpen(false)}
          />
        )}
      </DSSection>

      {/* ─── 11. Bottom sheet ──────────────────────────── */}
      <DSSection title="11 — Bottom Sheet">
        <Button variant="tertiary" onClick={() => setSheetOpen(true)}>
          Open bottom sheet
        </Button>
        <BottomSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Choose your next move"
          subtitle="No judgement. Keep the session useful and choose what happens next."
        >
          <div className="grid gap-3 mt-2">
            <Button variant="tertiary" size="lg" className="w-full justify-between" onClick={() => setSheetOpen(false)}>
              <span>
                <span className="block text-left">Retry this rep</span>
                <span className="block text-left text-xs font-normal text-muted-foreground">Take a breath and make another attempt</span>
              </span>
              <ArrowRight size={17} />
            </Button>
            <Button variant="primary" size="lg" className="w-full justify-between" onClick={() => setSheetOpen(false)}>
              <span>
                <span className="block text-left">Move on</span>
                <span className="block text-left text-xs font-normal text-primary-foreground/70">Log it and continue the session</span>
              </span>
              <ArrowRight size={17} />
            </Button>
          </div>
        </BottomSheet>
      </DSSection>

      {/* ─── 12. Feedback states ───────────────────────── */}
      <DSSection title="12 — Feedback States">
        <div className="space-y-4">
          <div>
            <DSLabel>Loading</DSLabel>
            <div className="mt-3"><LoadingBlock /></div>
          </div>
          <div>
            <DSLabel>Error</DSLabel>
            <div className="mt-3"><ErrorBlock retry={() => {}} /></div>
          </div>
          <div>
            <DSLabel>Empty state</DSLabel>
            <div className="mt-3">
              <EmptyBlock
                title="No sessions yet"
                detail="Start a session from Track or your programme. This page will remember the work."
                action={<Button variant="primary" size="default">Start training</Button>}
              />
            </div>
          </div>
        </div>
      </DSSection>

      {/* ─── 13. Borders & shadows ─────────────────────── */}
      <DSSection title="13 — Elevation & Shadows">
        <div className="space-y-3">
          {[
            { label: '--shadow-sm', cls: '[box-shadow:var(--shadow-sm)]' },
            { label: '--shadow-md', cls: '[box-shadow:var(--shadow-md)]' },
            { label: '--shadow-lg', cls: '[box-shadow:var(--shadow-lg)]' },
            { label: '--shadow-xl', cls: '[box-shadow:var(--shadow-xl)]' },
          ].map(s => (
            <div
              key={s.label}
              className={`rounded-xl bg-card p-5 ${s.cls}`}
            >
              <p className="font-data text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </DSSection>

      {/* ─── Footer ────────────────────────────────────── */}
      <div className="border-t border-border pt-8 text-center">
        <p className="font-data text-[10px] uppercase tracking-widest text-muted-foreground">
          Lofte Design System · Internal reference
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Edit <code className="rounded bg-card px-1 py-0.5 text-[11px]">src/index.css</code> to update global tokens.
          Add components in <code className="rounded bg-card px-1 py-0.5 text-[11px]">src/components/</code>.
        </p>
      </div>

    </div>
  );
}
