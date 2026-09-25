/**
 * Workout components — Lofte design system
 *
 * Components specific to the weightlifting session experience:
 *
 *   WorkoutCurrentSet   — the primary display: exercise + load + reps (dominant)
 *   WorkoutExerciseHeader — exercise name, set count, rep target, percentage
 *   SetStatusBar        — visual strip showing status of all sets in the exercise
 *   SetStatusDot        — single set status indicator
 *   PbCelebration       — full-screen overlay when athlete sets a new personal best
 *   ExerciseCompleteBanner — confirmation between exercises
 */

import { ArrowRight, Check, Pencil, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exerciseLabels } from '@/lib/utils';
import { accessoryEquipmentLabel } from '@/lib/movements';
import type { ExerciseName } from '@workspace/api-client-react';
import { Button } from '@/components/button';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export type WorkoutSetStatus = 'pending' | 'current' | 'completed' | 'missed' | 'retried' | 'skipped';

// ─────────────────────────────────────────────────────────
// WorkoutCurrentSet
// ─────────────────────────────────────────────────────────

/**
 * The primary UI element during a training set.
 * Weight is always the dominant typographic element.
 *
 *   SNATCH
 *   SET 3 OF 8
 *   67.5 KG       ← dominant
 *   2 REPS  ·  75%
 */
export interface WorkoutCurrentSetProps {
  exercise: ExerciseName;
  exerciseLabel?: string;
  setNumber: number;
  totalSets: number;
  weight: number;
  reps: number;
  percentage?: number;
  equipment?: string;
  /** Called when the athlete taps the edit affordance on the weight. */
  onEditWeight?: () => void;
}

export function WorkoutCurrentSet({
  exercise, exerciseLabel, setNumber, totalSets, weight, reps, percentage, equipment, onEditWeight
}: WorkoutCurrentSetProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-elevated p-6 text-foreground">
      {/* Large ghost number for depth */}
      <div
        className="pointer-events-none absolute right-4 top-2 select-none font-display text-[8rem] font-semibold leading-none opacity-[0.06]"
        aria-hidden="true"
      >
        {String(setNumber).padStart(2, '0')}
      </div>

      <div className="relative">
        {/* Exercise name + set counter */}
        <p className="font-data text-[10px] uppercase tracking-[.2em] text-secondary">
          Rep {setNumber} of {totalSets}
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold uppercase leading-none tracking-tight">
          {exerciseLabel ?? exerciseLabels[exercise] ?? exercise.replace(/_/g, ' ')}
        </h2>

        {/* Weight — the dominant element */}
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <p className="font-data text-[9px] uppercase tracking-[.2em] text-foreground/50">Load</p>
            {onEditWeight && (
              <button
                type="button"
                onClick={onEditWeight}
                className="tap flex items-center gap-1.5 rounded border border-border px-2 py-1 font-data text-[10px] uppercase tracking-wider text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                data-testid="button-edit-workout-load"
              >
                <Pencil size={10} /> edit
              </button>
            )}
          </div>
          <p className="text-workout-weight text-secondary">
            {weight}
            <span className="text-workout-weight-unit ml-3 opacity-60">kg</span>
          </p>
        </div>

        {/* Reps + target */}
        <div className="mt-5 flex gap-8">
          <div>
            <p className="font-data text-[9px] uppercase tracking-[.2em] text-foreground/50">Reps</p>
            <p className="font-display text-4xl font-semibold">{reps}</p>
          </div>
          <div>
            <p className="font-data text-[9px] uppercase tracking-[.2em] text-foreground/50">
              {percentage != null ? 'Target' : 'Equipment'}
            </p>
            <p className="font-display text-2xl font-semibold">
              {percentage != null ? `${percentage}%` : accessoryEquipmentLabel(equipment)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// WorkoutExerciseHeader
// ─────────────────────────────────────────────────────────

/**
 * Compact header for an exercise in a programme or session overview.
 *
 *   SNATCH
 *   8 SETS × 2 REPS · 75% PB
 */
export interface WorkoutExerciseHeaderProps {
  exercise: ExerciseName;
  sets: number;
  reps: number;
  percentage: number;
  className?: string;
}

export function WorkoutExerciseHeader({
  exercise, sets, reps, percentage, className
}: WorkoutExerciseHeaderProps) {
  return (
    <div className={className}>
      <p className="font-display text-xl font-semibold uppercase">
        {exerciseLabels[exercise]}
      </p>
      <p className="mt-0.5 font-data text-xs text-muted-foreground">
        {sets} sets × {reps} reps · {percentage}%
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SetStatusBar  (progress through an exercise)
// ─────────────────────────────────────────────────────────

const statusColours: Record<WorkoutSetStatus, string> = {
  pending:   'bg-border',
  current:   'bg-primary animate-pulse',
  completed: 'bg-success',
  missed:    'bg-destructive',
  retried:   'bg-secondary',
  skipped:   'bg-muted-foreground/40',
};

export interface SetStatusBarProps {
  statuses: WorkoutSetStatus[];
}

export function SetStatusBar({ statuses }: SetStatusBarProps) {
  return (
    <div className="flex gap-1" role="list" aria-label="Set progress">
      {statuses.map((s, i) => (
        <div
          key={i}
          role="listitem"
          aria-label={s}
          className={cn('h-1.5 flex-1 rounded-full transition-colors', statusColours[s])}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SetStatusDot  (single dot, for legend / list use)
// ─────────────────────────────────────────────────────────

export function SetStatusDot({ status, label }: { status: WorkoutSetStatus; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full', statusColours[status])} aria-hidden="true" />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// ExerciseCompleteBanner
// ─────────────────────────────────────────────────────────

export interface ExerciseCompleteBannerProps {
  exerciseName: string;
  nextExerciseName?: string | null;
  onContinue: () => void;
}

export function ExerciseCompleteBanner({
  exerciseName, nextExerciseName, onContinue
}: ExerciseCompleteBannerProps) {
  return (
    <div className="animate-in fade-in rounded-xl border-2 border-success/40 bg-success/10 p-8 text-center duration-300">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
        <Check size={28} className="text-success" />
      </div>
      <p className="font-data text-[10px] uppercase tracking-[.2em] text-success">Exercise complete</p>
      <h2 className="mt-2 font-display text-4xl font-semibold uppercase leading-tight">{exerciseName}</h2>
      {nextExerciseName && (
        <p className="mt-3 text-sm text-muted-foreground">
          Next up: <span className="font-semibold text-foreground">{nextExerciseName}</span>
        </p>
      )}
      <Button
        variant="primary"
        size="lg"
        className="mt-7 w-full"
        onClick={onContinue}
        data-testid="button-next-exercise"
      >
        {nextExerciseName ? <>Next exercise <ArrowRight size={17} /></> : <>Finish session <ArrowRight size={17} /></>}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PbCelebration
// ─────────────────────────────────────────────────────────

/**
 * Full-screen overlay shown when an athlete sets a new personal best.
 *
 *   NEW PB
 *   92.5 KG      ← dominant
 *   + 2.5 KG
 */
export interface PbCelebrationProps {
  exercise: ExerciseName;
  newPb: number;
  improvement: number;
  onContinue: () => void;
}

export function PbCelebration({ exercise, newPb, improvement, onContinue }: PbCelebrationProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="New personal best"
    >
      <div
        className="w-full rounded-2xl border-2 border-secondary/60 bg-card p-8 text-center"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/15">
          <Trophy size={34} className="text-secondary" />
        </div>

        {/* Labels */}
        <p className="font-data text-[10px] uppercase tracking-[.25em] text-secondary">New personal best</p>
        <p className="mt-2 font-display text-lg font-semibold uppercase text-muted-foreground">
          {exerciseLabels[exercise]}
        </p>

        {/* The weight — dominant */}
        <p className="text-workout-weight mt-3 text-secondary">
          {newPb}
          <span className="text-workout-weight-unit ml-2 opacity-60">kg</span>
        </p>

        {/* Improvement */}
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-success/15 px-5 py-2.5">
          <TrendingUp size={15} className="text-success" />
          <span className="font-semibold text-sm text-success">+{improvement} kg</span>
        </div>

        <Button
          variant="secondary"
          size="lg"
          className="mt-8 w-full"
          onClick={onContinue}
        >
          Continue <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
