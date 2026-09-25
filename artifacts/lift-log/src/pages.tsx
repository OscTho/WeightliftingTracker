import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BatteryFull, Check, ChevronDown, ChevronRight, ChevronUp, CircleAlert, Edit3, Plus, Save, Search, Signal, Trash2, Trophy, Wifi, X } from 'lucide-react';
import {
  getGetDashboardQueryKey, getGetHistoryQueryKey, getGetMovementsQueryKey, getGetProgrammeQueryKey,
  getGetProgrammesQueryKey, getGetProfileQueryKey, getGetWorkoutQueryKey,
  useCompleteSet, useCreateProgramme, useDeleteProgramme, useFinishWorkout,
  useGetDashboard, useGetHistory, useGetMovements, useGetProgramme, useGetProgrammes,
  useGetProfile, useGetWorkout, useMissSet, useSaveProfile, useUpdateWorkoutSet,
  useStartWorkout, useUpdateProgramme, useCreateMovement,
} from '@workspace/api-client-react';
import type { AccessoryEquipment, AthleteProfileInput, ExerciseName, Movement, ProgrammeInput } from '@workspace/api-client-react';
import { emptyProgramme, exerciseLabels, formatDate, formatShortDate } from '@/lib/utils';
import { ACCESSORY_EQUIPMENT_OPTIONS, COMMON_MOVEMENT_IDS, MOVEMENT_CATEGORIES, STANDARD_MOVEMENTS, accessoryEquipmentLabel, movementLabel } from '@/lib/movements';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/shell';
import { Button } from '@/components/button';
import { Input, Select } from '@/components/input';
import { BottomSheet } from '@/components/sheet';
import { WorkoutCurrentSet, ExerciseCompleteBanner, SetStatusBar } from '@/components/workout';
import type { WorkoutSetStatus } from '@/components/workout';
import { MobilePageHeader, MobileStatusBar } from '@/components/mobile-chrome';

function PageHead({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="mb-8">
      <p className="type-caption text-primary">{eyebrow}</p>
      <h1 className="mt-1 type-page-title">{title}</h1>
      {detail && <p className="mt-3 type-body-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

type CustomMovementDraft = {
  name: string;
  category: typeof MOVEMENT_CATEGORIES[number];
  description: string;
};

function StatsRow({ stats }: { stats: { label: string; value: string; accent?: boolean }[] }) {
  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
      {stats.map((s) => (
        <div key={s.label} className={`bg-card p-4 ${s.accent ? 'border-t-2 border-secondary' : ''}`}>
          <p className="type-caption text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-pb-number">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────

export function DashboardPage() {
  const query = useGetDashboard();
  const [, setLocation] = useLocation();
  if (query.isLoading) return <LoadingBlock />;
  if (query.isError || !query.data) return <ErrorBlock retry={() => query.refetch()} />;
  const d = query.data;
  const sessionsThisWeek = d.recentWorkouts.filter((workout) => workout.completedSets > 0).length;
  const nextSessionSets = d.nextSession?.exercises.reduce((total, exercise) => total + exercise.sets, 0) ?? 0;
  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex h-11 items-center justify-between px-6">
        <span className="font-display text-sm font-semibold">9:41</span>
        <div className="flex items-center gap-2 text-foreground">
          <Signal size={16} />
          <Wifi size={16} />
          <BatteryFull size={22} />
        </div>
      </div>
      <div className="flex flex-col gap-7 px-5 pb-6">
        <div className="flex h-9 items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold uppercase tracking-[-.04em] text-primary" data-testid="link-brand">Lofte</Link>
          <Link href="/profile" className="h-9 w-9 rounded-full bg-elevated" aria-label="Profile" data-testid="link-header-profile" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-display text-[11px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">Today</p>
          <h1 className="font-display text-[44px] font-semibold uppercase leading-[50px] tracking-[.0125em]">Ready when<br />you are.</h1>
        </div>

        {d.programme && d.nextSession ? (
          <section className="relative flex min-h-[184px] flex-col gap-6 overflow-hidden rounded-2xl bg-card p-6">
            <div className="absolute -right-1 -top-1 font-display text-[84px] font-semibold leading-[92px] tracking-[.03em] text-muted-foreground opacity-30">{String(d.nextSession.sessionNumber).padStart(2, '0')}</div>
            <div className="relative flex flex-col gap-1">
              <p className="font-display text-[11px] font-semibold uppercase leading-[14px] tracking-[.015em] text-secondary">Next session · {d.programme.name}</p>
              <h2 className="font-display text-[24px] font-semibold uppercase leading-[26px] tracking-[-.02em]">{d.nextSession.name}</h2>
              <p className="font-data text-[13px] leading-normal text-muted-foreground">{d.nextSession.exercises.length} movements · {nextSessionSets} working sets</p>
            </div>
            <Button
              variant="primary"
              className="h-12 w-[217px] rounded-xl px-0 type-button uppercase"
              onClick={() => setLocation(`/workout/start?programme=${d.programme!.id}&session=${d.nextSession!.sessionNumber}`)}
              data-testid="button-start-next"
            >
              Start session
            </Button>
          </section>
        ) : (
          <section className="flex min-h-[184px] flex-col justify-center gap-4 rounded-2xl bg-card p-6">
            <div>
              <p className="font-display text-[11px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">No active programme</p>
              <h2 className="mt-1 font-display text-[24px] font-semibold uppercase leading-[26px] tracking-[-.02em]">Ready when you are.</h2>
              <p className="mt-1 font-data text-[13px] leading-normal text-muted-foreground">Create a programme to plan your next session.</p>
            </div>
            <Button variant="tertiary" className="h-12 w-[217px] rounded-xl border-primary px-0 text-primary type-button uppercase" onClick={() => setLocation('/programme')} data-testid="button-create-first-programme">
              Create programme
            </Button>
          </section>
        )}

        <section className="flex flex-col gap-3.5">
          <h2 className="font-display text-2xl font-semibold uppercase leading-[26px] tracking-[-.02em]">Weekly statistics</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-h-[66px] flex-col gap-1 rounded-xl bg-card p-4">
              <p className="font-display text-[22px] font-bold leading-normal">{sessionsThisWeek}/{d.programme?.sessionsPerWeek ?? 0}</p>
              <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">Sessions</p>
            </div>
            <div className="flex min-h-[66px] flex-col gap-1 rounded-xl bg-card p-4">
              <p className="font-display text-[22px] font-bold leading-normal">{d.weeklyCompletedSets}</p>
              <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">Sets</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold uppercase leading-[26px] tracking-[-.02em]">Recent sessions</h2>
            <Link href="/history" className="font-display text-sm font-semibold text-primary" data-testid="link-see-history">See all</Link>
          </div>
          <div className="flex flex-col gap-3">
            {d.recentWorkouts.length > 0 ? d.recentWorkouts.map((workout) => (
              <Link key={workout.id} href={`/workout/${workout.id}`} className="flex min-h-[76px] items-center justify-between gap-3 rounded-xl bg-card p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">{formatShortDate(workout.date)}</p>
                  <p className="truncate font-display text-[15px] font-semibold leading-5">{workout.sessionName}</p>
                  <p className="font-data text-[13px] leading-normal text-muted-foreground">{workout.totalSets} working sets</p>
                </div>
                <span className={`rounded-md px-2 py-1 font-display text-[11px] font-semibold ${workout.missedSets > 0 ? 'bg-destructive/15 text-destructive' : workout.completedSets === workout.totalSets ? 'bg-success/15 text-success' : 'bg-secondary/15 text-secondary'}`}>
                  {workout.missedSets > 0 ? `${workout.missedSets} missed` : workout.completedSets === workout.totalSets ? 'Complete' : 'In progress'}
                </span>
              </Link>
            )) : (
              <div className="rounded-xl bg-card p-4">
                <p className="font-data text-[13px] leading-normal text-muted-foreground">No sessions recorded yet.</p>
              </div>
            )}
          </div>
        </section>

        {d.programme && (
          <section className="flex flex-col gap-3.5">
            <Link href="/programme" className="flex items-center gap-3 rounded-2xl bg-card p-6">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-primary">{d.programme.sessionsPerWeek} sessions / week · {d.programme.lengthWeeks} weeks</p>
              <p className="font-display text-2xl font-semibold leading-[26px] tracking-[-.02em]">{d.programme.name}</p>
              <p className="font-data line-clamp-2 text-[15px] leading-5 text-muted-foreground">{d.programme.sessionNames.join(', ')}</p>
            </div>
            <ArrowRight size={22} className="shrink-0 text-muted-foreground" />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────

export function ProfilePage() {
  const { data, isLoading } = useGetProfile({ query: { retry: false, queryKey: getGetProfileQueryKey() } });
  const save = useSaveProfile();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<AthleteProfileInput>({
    name: '', snatchPb: 0, cleanJerkPb: 0, backSquatPb: 0, frontSquatPb: 0, roundingIncrement: 2.5,
  });
  useEffect(() => {
    if (data) setForm({ name: data.name, snatchPb: data.snatchPb, cleanJerkPb: data.cleanJerkPb, backSquatPb: data.backSquatPb, frontSquatPb: data.frontSquatPb, roundingIncrement: data.roundingIncrement });
  }, [data]);
  if (isLoading) return <LoadingBlock />;

  const update = (key: keyof AthleteProfileInput, value: string) =>
    setForm((f) => ({ ...f, [key]: key === 'name' ? value : Number(value) }));

  return (
    <div>
      <PageHead
        eyebrow="Profile"
        title="Your numbers."
        detail="Keep your reference lifts close. Lofte uses them to turn percentages into weights you can load."
      />
      {data?.updatedAt && (
        <p className="type-caption text-muted-foreground -mt-5 mb-8">
          Last updated · {new Date(data.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(data.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate({ data: form }, {
            onSuccess: (p) => {
              qc.setQueryData(getGetProfileQueryKey(), p);
              qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
              setSaved(true);
              setTimeout(() => setSaved(false), 2500);
            },
          });
        }}
        className="space-y-6"
      >
        {/* Athlete card */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="type-section-heading">Athlete</h2>
              <p className="type-body-sm text-muted-foreground">The person behind the bar.</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary font-display text-xl font-semibold">
              {form.name ? form.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'LL'}
            </div>
          </div>
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Your name"
            required
            data-testid="input-name"
          />
        </section>

        {/* Personal bests */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="type-section-heading">Personal bests</h2>
          <p className="mb-6 type-body-sm text-muted-foreground">In kilograms. Be honest; useful beats impressive.</p>
          <div className="grid grid-cols-2 gap-4">
            {([['snatchPb', 'Snatch'], ['cleanJerkPb', 'Clean & jerk'], ['backSquatPb', 'Back squat'], ['frontSquatPb', 'Front squat']] as const).map(([key, label]) => (
              <Input
                key={key}
                label={`${label} · kg`}
                type="number"
                min="0"
                step="0.5"
                value={form[key] === 0 ? '' : form[key]}
                onChange={(e) => update(key, e.target.value)}
                data-testid={`input-${key}`}
              />
            ))}
          </div>
        </section>

        {/* Loading maths */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="type-section-heading">Loading maths</h2>
          <p className="mb-5 type-body-sm text-muted-foreground">Round working weights to what your gym actually has.</p>
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 2.5] as const).map((n) => (
              <Button
                key={n}
                type="button"
                variant={form.roundingIncrement === n ? 'primary' : 'tertiary'}
                className="w-full font-data"
                onClick={() => setForm((f) => ({ ...f, roundingIncrement: n }))}
                data-testid={`button-rounding-${n}`}
              >
                {n} kg
              </Button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between gap-4">
          <p className="type-body-sm">
            {saved
              ? <span className="font-semibold text-success">Profile saved.</span>
              : save.isError
              ? <span className="text-destructive">Could not save. Try again.</span>
              : null}
          </p>
          <Button
            type="submit"
            variant="primary"
            loading={save.isPending}
            data-testid="button-save-profile"
          >
            <Save size={16} /> Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Programme form
// ─────────────────────────────────────────────────────────

export function ProgrammeForm({ initial, programmeId, onDone }: { initial?: ProgrammeInput; programmeId?: number; onDone: () => void }) {
  const [form, setForm] = useState<ProgrammeInput>(initial || emptyProgramme);
  const create = useCreateProgramme();
  const update = useUpdateProgramme();
  const movementQuery = useGetMovements();
  const createMovement = useCreateMovement();
  const qc = useQueryClient();
  const mutation = programmeId ? update : create;
  const [addingToSession, setAddingToSession] = useState<number | null>(null);
  const [movementTarget, setMovementTarget] = useState<{ sessionIndex: number; exerciseIndex: number } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('All');
  const [customFormOpen, setCustomFormOpen] = useState(false);
  const [customMovement, setCustomMovement] = useState<CustomMovementDraft>({ name: '', category: MOVEMENT_CATEGORIES[0], description: '' });
  const [createdMovements, setCreatedMovements] = useState<Movement[]>([]);

  const setSession = (index: number, patch: Partial<ProgrammeInput['sessions'][number]>) =>
    setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === index ? { ...s, ...patch } : s) }));

  const setExercise = (si: number, ei: number, patch: Partial<ProgrammeInput['sessions'][number]['exercises'][number]>) =>
    setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === si ? { ...s, exercises: s.exercises.map((e, j) => j === ei ? { ...e, ...patch } : e) } : s) }));

  const serverLibrary = movementQuery.data?.length
    ? movementQuery.data
    : STANDARD_MOVEMENTS.map((movement) => ({ ...movement, description: null, isCustom: false, userId: null }));
  const library = [
    ...serverLibrary,
    ...createdMovements.filter((created) => !serverLibrary.some((movement) => movement.id === created.id)),
  ];
  const movementName = (id?: string) => library.find((movement) => movement.id === id)?.name ?? movementLabel(id ?? 'snatch');
  const commonMovements = COMMON_MOVEMENT_IDS.map((id) => library.find((movement) => movement.id === id) ?? STANDARD_MOVEMENTS.find((movement) => movement.id === id)).filter((movement): movement is Movement | (typeof STANDARD_MOVEMENTS)[number] => Boolean(movement));
  const filteredMovements = library.filter((movement) => {
    const matchesSearch = movement.name.toLowerCase().includes(librarySearch.toLowerCase().trim());
    return matchesSearch && (libraryCategory === 'All' || movement.category === libraryCategory);
  });

  const chooseMovement = (movement: Movement | { id: string; category?: string }) => {
    const isAccessory = movement.category === 'Accessories' || library.find((item) => item.id === movement.id)?.category === 'Accessories';
    if (movementTarget) {
      const current = form.sessions[movementTarget.sessionIndex].exercises[movementTarget.exerciseIndex];
      setExercise(
        movementTarget.sessionIndex,
        movementTarget.exerciseIndex,
        isAccessory
          ? { movementId: movement.id, percentage: undefined, weight: current.weight ?? 0, equipment: current.equipment ?? 'barbell' }
          : { movementId: movement.id, percentage: current.percentage ?? 70, weight: undefined, equipment: undefined },
      );
    } else if (addingToSession !== null) {
      const session = form.sessions[addingToSession];
      setSession(addingToSession, {
        exercises: [
          ...session.exercises,
          isAccessory
            ? { movementId: movement.id, sets: 3, reps: 8, weight: 0, equipment: 'barbell' }
            : { movementId: movement.id, sets: 3, reps: 2, percentage: 70 },
        ],
      });
    }
    setMovementTarget(null);
    setAddingToSession(null);
    setLibraryOpen(false);
    setCustomFormOpen(false);
  };

  const submitCustomMovement = () => {
    const name = customMovement.name.trim();
    if (!name) return;
    createMovement.mutate(
      { data: { name, category: customMovement.category, description: customMovement.description.trim() || undefined } },
      {
        onSuccess: (movement) => {
          setCreatedMovements((current) =>
            current.some((existing) => existing.id === movement.id) ? current : [...current, movement],
          );
          qc.setQueryData<Movement[]>(getGetMovementsQueryKey(), (current = []) =>
            current.some((existing) => existing.id === movement.id) ? current : [...current, movement],
          );
          qc.invalidateQueries({ queryKey: getGetMovementsQueryKey() });
          chooseMovement(movement);
          setCustomMovement({ name: '', category: MOVEMENT_CATEGORIES[0], description: '' });
        },
      },
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedForm: ProgrammeInput = {
      ...form,
      sessions: form.sessions.map((session, index) => ({
        ...session,
        sessionNumber: index + 1,
        exercises: session.exercises.map((exercise) => {
          const isAccessory = library.find((movement) => movement.id === (exercise.movementId ?? exercise.exercise))?.category === 'Accessories';
          return isAccessory
            ? { ...exercise, percentage: undefined, weight: exercise.weight ?? 0, equipment: exercise.equipment ?? 'barbell' }
            : { ...exercise, percentage: exercise.percentage ?? 70, weight: undefined, equipment: undefined };
        }),
      })),
    };
    const done = () => {
      qc.invalidateQueries({ queryKey: getGetProgrammesQueryKey() });
      if (programmeId) qc.invalidateQueries({ queryKey: getGetProgrammeQueryKey(programmeId) });
      onDone();
    };
    programmeId
      ? update.mutate({ programmeId, data: normalizedForm }, { onSuccess: done })
      : create.mutate({ data: normalizedForm }, { onSuccess: done });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Programme name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Sessions / week"
          type="number" min="1" max="14"
          value={form.sessionsPerWeek}
          onChange={(e) => setForm({ ...form, sessionsPerWeek: Number(e.target.value) })}
          required
        />
        <Input
          label="Length (weeks)"
          type="number" min="1" max="52"
          value={form.lengthWeeks}
          onChange={(e) => setForm({ ...form, lengthWeeks: Number(e.target.value) })}
          required
        />
      </div>

      {form.sessions.map((session, si) => (
        <div key={si} className="rounded-lg border border-border bg-background p-4">
          <div className="mb-4 space-y-3">
            <Input
              label="Week slot"
              type="number" min="1"
              value={si + 1}
              readOnly
              aria-label={`Week slot ${si + 1}`}
            />
            <Input
              label={`Session ${si + 1} name`}
              value={session.name}
              onChange={(e) => setSession(si, { name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
             {session.exercises.map((ex, ei) => {
              const isAccessory = library.find((movement) => movement.id === (ex.movementId ?? ex.exercise))?.category === 'Accessories';
              return (
              <div key={ei} className="rounded-lg border border-border bg-card/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="type-caption text-muted-foreground">Movement</p>
                    <p className="mt-1 truncate font-display text-lg font-semibold uppercase">{movementName(ex.movementId ?? ex.exercise)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMovementTarget({ sessionIndex: si, exerciseIndex: ei }); setLibraryOpen(true); }}
                    className="tap shrink-0 rounded-md border border-border px-2 py-1 font-display text-[10px] font-semibold uppercase text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    Change
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_38px] items-end gap-2">
                  <Input
                    label="Sets"
                    type="number" min="1"
                    value={ex.sets}
                    onChange={(e) => setExercise(si, ei, { sets: Number(e.target.value) })}
                  />
                  <Input
                    label="Reps"
                    type="number" min="1"
                    value={ex.reps}
                    onChange={(e) => setExercise(si, ei, { reps: Number(e.target.value) })}
                  />
                  <Input
                     label={isAccessory ? 'Weight (kg)' : '% 1RM'}
                     type="number"
                     min={isAccessory ? 0 : 1}
                     step={isAccessory ? 0.5 : 1}
                     value={isAccessory ? ex.weight ?? 0 : ex.percentage ?? 70}
                     onChange={(e) => setExercise(si, ei, isAccessory ? { weight: Number(e.target.value) } : { percentage: Number(e.target.value) })}
                     data-testid={isAccessory ? `input-accessory-weight-${si}-${ei}` : `input-percentage-${si}-${ei}`}
                  />
                  <button
                    type="button"
                    onClick={() => setSession(si, { exercises: session.exercises.filter((_, j) => j !== ei) })}
                    className="tap flex h-12 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    data-testid={`button-remove-exercise-${si}-${ei}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                 {isAccessory && (
                   <div className="mt-3">
                     <Select
                       label="Equipment"
                       value={ex.equipment ?? 'barbell'}
                       onChange={(event) => setExercise(si, ei, { equipment: event.target.value as AccessoryEquipment })}
                       options={ACCESSORY_EQUIPMENT_OPTIONS.map((option) => ({ ...option }))}
                       data-testid={`select-accessory-equipment-${si}-${ei}`}
                     />
                   </div>
                 )}
              </div>
              );
             })}
          </div>

          <button
            type="button"
            onClick={() => { setMovementTarget(null); setAddingToSession(si); }}
            className="mt-4 flex items-center gap-2 type-caption font-semibold text-primary"
            data-testid={`button-add-exercise-${si}`}
          >
            <Plus size={14} /> Add movement
          </button>
          {addingToSession === si && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-background p-3">
              <p className="mb-2 type-caption text-primary">Add movement</p>
              <div className="grid grid-cols-2 gap-2">
                {commonMovements.map((movement) => (
                  <button
                    key={movement.id}
                    type="button"
                    onClick={() => chooseMovement(movement)}
                    className="tap min-h-10 rounded-md border border-border px-3 text-left font-display text-xs font-semibold uppercase hover:border-primary hover:text-primary"
                  >
                    {movement.name}
                  </button>
                ))}
              </div>
              <Button type="button" variant="tertiary" className="mt-3 w-full text-xs uppercase" onClick={() => setLibraryOpen(true)}>
                Explore movement library
              </Button>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="tertiary"
          onClick={() => setForm((f) => ({ ...f, sessions: [...f.sessions, { sessionNumber: f.sessions.length + 1, name: `Session ${f.sessions.length + 1}`, exercises: [{ movementId: 'snatch', sets: 3, reps: 2, percentage: 70 }] }] }))}
          data-testid="button-add-session"
        >
          <Plus size={16} /> Add session
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={mutation.isPending}
          data-testid="button-save-programme"
        >
          <Save size={16} /> Save programme
        </Button>
      </div>

      <BottomSheet
        open={libraryOpen}
        onClose={() => { setLibraryOpen(false); setCustomFormOpen(false); }}
        title={customFormOpen ? 'Add new movement' : 'Movement library'}
        subtitle={customFormOpen ? 'Create a private movement for your library.' : 'Search the full Lofte movement library.'}
        className="max-h-[85vh] overflow-y-auto"
      >
        {customFormOpen ? (
          <div className="space-y-4">
            <Input label="Movement name" value={customMovement.name} onChange={(event) => setCustomMovement((current) => ({ ...current, name: event.target.value }))} placeholder="Enter movement name" required />
            <Select label="Category" value={customMovement.category} onChange={(event) => setCustomMovement((current) => ({ ...current, category: event.target.value as typeof MOVEMENT_CATEGORIES[number] }))} options={MOVEMENT_CATEGORIES.map((category) => ({ value: category, label: category }))} />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-muted-foreground">Description <span className="font-normal">(optional)</span></span>
              <textarea value={customMovement.description} onChange={(event) => setCustomMovement((current) => ({ ...current, description: event.target.value }))} className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="Add description" maxLength={240} />
            </label>
            <div className="flex gap-3">
              <Button type="button" variant="tertiary" className="flex-1" onClick={() => setCustomFormOpen(false)}>Back</Button>
              <Button type="button" variant="primary" className="flex-1" loading={createMovement.isPending} onClick={submitCustomMovement}>Add movement</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input aria-label="Search movements" value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} placeholder="Search movements" className="pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['All', ...MOVEMENT_CATEGORIES].map((category) => (
                <button key={category} type="button" onClick={() => setLibraryCategory(category)} className={`tap shrink-0 rounded-full border px-3 py-1.5 font-display text-[10px] font-semibold uppercase ${libraryCategory === category ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}>
                  {category}
                </button>
              ))}
            </div>
            <div className="grid max-h-[42vh] gap-1 overflow-y-auto">
              {filteredMovements.map((movement) => (
                <button key={movement.id} type="button" onClick={() => chooseMovement(movement)} className="tap flex items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-elevated">
                  <span className="font-display text-sm font-semibold uppercase">{movement.name}</span>
                  <span className="font-data text-[10px] uppercase text-muted-foreground">{movement.category}</span>
                </button>
              ))}
              {filteredMovements.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No movements found.</p>}
            </div>
            <Button type="button" variant="tertiary" className="w-full uppercase" onClick={() => setCustomFormOpen(true)}>
              <Plus size={16} /> Add new movement
            </Button>
          </div>
        )}
      </BottomSheet>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// Programme list
// ─────────────────────────────────────────────────────────

export function ProgrammePage() {
  const { data, isLoading, isError, refetch } = useGetProgrammes();
  const [editing, setEditing] = useState(false);
  const [location, setLocation] = useLocation();
  const del = useDeleteProgramme();
  const qc = useQueryClient();

  if (isLoading) return <LoadingBlock />;
  if (isError)   return <ErrorBlock retry={() => refetch()} />;

  return (
    <div>
      <PageHead
        eyebrow="Training plans"
        title="Programme room."
        detail="A good week removes decisions from the moment you need to make them."
      />

      <div className="mb-7 flex justify-end">
        <Button
          variant="primary"
          onClick={() => setEditing((v) => !v)}
          data-testid="button-new-programme"
        >
          <Plus size={18} /> New programme
        </Button>
      </div>

      {editing && (
        <section className="mb-7 rounded-xl border-2 border-primary/30 bg-card p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="type-caption text-primary">Build a week</p>
              <h2 className="type-section-heading mt-1">New programme</h2>
            </div>
            <button
              onClick={() => setEditing(false)}
              className="tap text-muted-foreground hover:text-foreground"
              data-testid="button-close-programme-form"
            >
              <X size={20} />
            </button>
          </div>
          <ProgrammeForm onDone={() => setEditing(false)} />
        </section>
      )}

      {data?.length ? (
        <div className="space-y-4">
          {data.map((p) => (
            <article key={p.id} className="rounded-xl border border-border bg-card p-5" data-testid={`card-programme-${p.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="type-caption text-primary">Weekly cycle</p>
                  <h2 className="mt-1 type-page-title">{p.name}</h2>
                </div>
                <Link
                  href={`/programme/${p.id}`}
                  className="tap flex h-10 w-10 items-center justify-center rounded-full bg-elevated"
                  data-testid={`link-programme-${p.id}`}
                >
                  <ArrowRight size={18} />
                </Link>
              </div>
              <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
                <div className="flex gap-5">
                  <div>
                    <p className="text-pb-number">{p.sessionsPerWeek}×</p>
                    <p className="type-body-sm text-muted-foreground">per week</p>
                  </div>
                  <div>
                    <p className="text-pb-number">{p.lengthWeeks}w</p>
                    <p className="type-body-sm text-muted-foreground">length</p>
                  </div>
                </div>
                <div className="text-right type-body-sm text-muted-foreground">{p.sessionNames.join(' · ')}</div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Delete this programme?'))
                    del.mutate({ programmeId: p.id }, { onSuccess: () => {
                      qc.invalidateQueries({ queryKey: getGetProgrammesQueryKey() });
                      if (location.startsWith(`/programme/${p.id}`)) setLocation('/programme');
                    }});
                }}
                className="mt-4 flex items-center gap-1 type-caption font-semibold text-muted-foreground hover:text-destructive"
                data-testid={`button-delete-programme-${p.id}`}
              >
                <Trash2 size={14} /> Delete
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyBlock
          title="No programme yet"
          detail="Build your first weekly cycle. Keep it simple enough to execute when the room is loud."
          action={
            <Button variant="primary" onClick={() => setEditing(true)} data-testid="button-empty-new-programme">
              <Plus size={17} /> Build a programme
            </Button>
          }
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Programme detail
// ─────────────────────────────────────────────────────────

export function ProgrammeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const q = useGetProgramme(id, { query: { queryKey: getGetProgrammeQueryKey(id), enabled: Number.isFinite(id) } });
  const movementsQuery = useGetMovements();
  const [editing, setEditing] = useState(false);
  const [, setLocation] = useLocation();
  const start = useStartWorkout();
  const qc = useQueryClient();

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError || !q.data) return <ErrorBlock retry={() => q.refetch()} />;
  const p = q.data;
  const displayMovement = (id: string) =>
    movementsQuery.data?.find((movement) => movement.id === id)?.name ??
    exerciseLabels[id] ??
    movementLabel(id);

  return (
    <div>
      <Link
        href="/programme"
        className="mb-5 inline-flex items-center gap-2 type-caption text-muted-foreground"
        data-testid="link-back-programmes"
      >
        ← All programmes
      </Link>

      <PageHead
        eyebrow={`${p.sessionsPerWeek}× / week · ${p.lengthWeeks} weeks`}
        title={p.name}
        detail={`Last updated ${formatDate(p.updatedAt)}. Tap a session to train it now.`}
      />

      {editing ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <ProgrammeForm
            initial={{ name: p.name, sessionsPerWeek: p.sessionsPerWeek, lengthWeeks: p.lengthWeeks, sessions: p.sessions.map((s) => ({ sessionNumber: s.sessionNumber, name: s.name, exercises: s.exercises.map((e) => ({ movementId: e.movementId ?? e.exercise ?? 'snatch', sets: e.sets, reps: e.reps, percentage: e.percentage, weight: e.weight, equipment: e.equipment })) })) }}
            programmeId={p.id}
            onDone={() => setEditing(false)}
          />
        </section>
      ) : (
        <>
          <div className="mb-5 flex justify-end">
            <Button
              variant="tertiary"
              onClick={() => setEditing(true)}
              data-testid="button-edit-programme"
            >
              <Edit3 size={16} /> Edit programme
            </Button>
          </div>
          <div className="space-y-4">
            {p.sessions.map((s) => (
              <section key={s.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="type-caption text-primary">Session {String(s.sessionNumber).padStart(2, '0')}</p>
                    <h2 className="mt-1 type-page-title">{s.name}</h2>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={start.isPending}
                    onClick={() => start.mutate(
                      { data: { programmeId: p.id, sessionNumber: s.sessionNumber } },
                      { onSuccess: (w) => { qc.setQueryData(getGetWorkoutQueryKey(w.id), w); qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); setLocation(`/workout/${w.id}`); } }
                    )}
                    data-testid={`button-start-session-${s.id}`}
                  >
                    Start <ArrowRight size={14} />
                  </Button>
                </div>
                <div className="mt-5 divide-y divide-border border-t border-border">
                  {s.exercises.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-4">
                      <div>
                        <p className="type-subheading">{displayMovement(e.movementId ?? e.exercise ?? 'snatch')}</p>
                        <p className="type-body-sm text-muted-foreground">{e.sets} sets × {e.reps} reps</p>
                      </div>
                      <span className="font-data type-body-sm text-primary">
                        {e.weight != null ? `${e.weight} kg · ${accessoryEquipmentLabel(e.equipment)}` : `${e.percentage}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Workout
// ─────────────────────────────────────────────────────────

export function WorkoutPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const q = useGetWorkout(id, { query: { queryKey: getGetWorkoutQueryKey(id), enabled: Number.isFinite(id) } });
  const movementsQuery = useGetMovements();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const complete = useCompleteSet();
  const miss = useMissSet();
  const finish = useFinishWorkout();
  const updateWorkoutSet = useUpdateWorkoutSet();
  const [showMiss, setShowMiss] = useState(false);
  const [finishedExercise, setFinishedExercise] = useState<string | null>(null);
  const [editingWeight, setEditingWeight] = useState(false);
  const [draftWeight, setDraftWeight] = useState('');
  const [draftEquipment, setDraftEquipment] = useState<AccessoryEquipment>('barbell');
  const displayMovement = (id?: string) =>
    movementsQuery.data?.find((movement) => movement.id === id)?.name ??
    exerciseLabels[id ?? ''] ??
    movementLabel(id ?? 'snatch');

  const _currentSetId = q.data?.sets?.find((s) => s.status === 'pending')?.id;
  useEffect(() => {
    setEditingWeight(false);
  }, [_currentSetId]);

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError || !q.data) return <ErrorBlock retry={() => q.refetch()} />;
  const w = q.data;
  const current = w.sets.find((s) => s.status === 'pending');
  const done = (next: typeof w) => {
    qc.setQueryData(getGetWorkoutQueryKey(w.id), next);
    qc.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  };

  // Session complete screen
  if (w.status === 'completed') return (
    <div className="animate-in fade-in duration-300">
      <MobileStatusBar />
      <div className="px-5 pb-6 pt-4 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary/20">
          <Check size={36} className="text-secondary" />
        </div>
        <p className="type-caption text-primary">Session logged</p>
        <h1 className="mt-2 type-page-title">{w.sessionName}</h1>
        <p className="mt-3 type-body-sm text-muted-foreground">
          {w.completedSets} sets completed · {w.missedSets} missed · {w.attempts} attempts
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/"
            className="tap inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 type-button text-primary-foreground"
            data-testid="link-finished-home"
          >
            Back to today
          </Link>
          <Link
            href="/history"
            className="tap inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-card px-5 type-button"
            data-testid="link-finished-history"
          >
            View history
          </Link>
        </div>
      </div>
    </div>
  );

  const completeCurrent = () => {
    if (!current) return;
    const isLastSetOfExercise = current.setNumber === current.totalSets;
    complete.mutate({
      workoutId: w.id,
      setId: current.id,
    }, {
      onSuccess: (next) => {
        done(next);
        if (isLastSetOfExercise) setFinishedExercise(displayMovement(current.movementId ?? current.exercise));
      },
    });
  };

  const missCurrent = (action: 'retry' | 'move_on') => {
    if (current)
      miss.mutate({ workoutId: w.id, setId: current.id, data: { action } }, {
        onSuccess: (next) => { done(next); setShowMiss(false); },
      });
  };

  // Status bar for current exercise
  const exerciseStatuses: WorkoutSetStatus[] = current
    ? w.sets
        .filter((s) => (s.movementId ?? s.exercise) === (current.movementId ?? current.exercise))
        .map((s) => {
          if (s.id === current.id) return 'current';
          if (s.status === 'completed') return 'completed';
          if (s.status === 'missed')    return 'missed';
          return 'pending';
        })
    : [];

  // When the exercise-complete banner is visible, `current` already points to
  // the first pending set of the NEXT exercise — so the banner's "next" label
  // is simply current.exercise (not the exercise after that).
  const nextExerciseName = finishedExercise
    ? (current ? displayMovement(current.movementId ?? current.exercise) : null)
    : null;

  return (
    <div className="animate-in fade-in duration-300">
      <MobileStatusBar />
      <div className="px-5 pb-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between pt-4">
        <div>
          <Link
            href="/"
            className="type-caption text-muted-foreground"
            data-testid="link-workout-exit"
          >
            ← Exit workout
          </Link>
          <p className="mt-3 type-caption text-primary">{w.programmeName}</p>
          <h1 className="type-page-title leading-none">{w.sessionName}</h1>
        </div>
        <div className="text-right">
          <p className="text-pb-number">{w.completedSets}/{w.sets.length}</p>
          <p className="type-caption text-muted-foreground">Sets</p>
        </div>
      </div>

      {/* Per-exercise progress bar */}
      {current && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="type-caption text-muted-foreground">
              {displayMovement(current.movementId ?? current.exercise)}
            </p>
            <p className="type-caption text-muted-foreground">
              Rep {current.setNumber} / {current.totalSets}
            </p>
          </div>
          <SetStatusBar statuses={exerciseStatuses} />
        </div>
      )}

      {/* Main content: exercise complete | current set | all done */}
      {finishedExercise ? (
        <ExerciseCompleteBanner
          exerciseName={finishedExercise}
          nextExerciseName={nextExerciseName}
          onContinue={() => setFinishedExercise(null)}
        />
      ) : current ? (
        <>
          <WorkoutCurrentSet
            exercise={current.exercise}
            exerciseLabel={displayMovement(current.movementId ?? current.exercise)}
            setNumber={current.setNumber}
            totalSets={current.totalSets}
            weight={current.weight}
            reps={current.reps}
            percentage={current.percentage}
            equipment={current.equipment}
            onEditWeight={() => {
              setDraftWeight(String(current.weight));
              setDraftEquipment(current.equipment ?? 'barbell');
              setEditingWeight(true);
            }}
          />
          <div className="mt-4 grid gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={completeCurrent}
              loading={complete.isPending}
              data-testid="button-complete-set"
            >
              <Check size={21} /> Complete rep
            </Button>
            <Button
              variant="tertiary"
              size="lg"
              className="w-full"
              onClick={() => setShowMiss(true)}
              data-testid="button-miss-set"
            >
              <CircleAlert size={19} /> Missed it
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-success/40 bg-success/10 p-7 text-center">
          <Check className="mx-auto mb-3 text-success" size={28} />
          <h2 className="type-page-title">All reps accounted for</h2>
          <Button
            variant="primary"
            className="mt-5"
            loading={finish.isPending}
            onClick={() => finish.mutate(
              { workoutId: w.id },
              { onSuccess: (next) => { done(next); qc.invalidateQueries({ queryKey: getGetHistoryQueryKey() }); } }
            )}
            data-testid="button-finish-workout"
          >
            Finish workout <ArrowRight size={17} />
          </Button>
        </div>
      )}

      {/* Weight adjustment sheet */}
      <BottomSheet
        open={editingWeight}
        onClose={() => setEditingWeight(false)}
        title="Adjust load"
        subtitle={current ? current.percentage != null
          ? `Target: ${current.percentage}% of your ${displayMovement(current.movementId ?? current.exercise)} PB`
          : `Programmed: ${current.weight} kg · ${accessoryEquipmentLabel(current.equipment)}`
          : undefined}
      >
        <div className="mt-2 space-y-4">
          <Input
            label="Weight (kg)"
            type="number"
            min="0"
            step="0.5"
            value={draftWeight}
            onChange={(e) => setDraftWeight(e.target.value)}
            data-testid="input-workout-load"
            autoFocus
          />
          {current?.percentage == null && (
            <Select
              label="Equipment"
              options={[...ACCESSORY_EQUIPMENT_OPTIONS]}
              value={draftEquipment}
              onChange={(event) => setDraftEquipment(event.target.value as AccessoryEquipment)}
              data-testid="select-workout-equipment"
            />
          )}
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              const v = parseFloat(draftWeight);
              if (!current || !Number.isFinite(v) || v <= 0) return;
              updateWorkoutSet.mutate({
                workoutId: w.id,
                setId: current.id,
                data: {
                  weight: v,
                  equipment: current.percentage == null ? draftEquipment : undefined,
                },
              }, {
                onSuccess: (next) => {
                  done(next);
                  setEditingWeight(false);
                },
              });
            }}
            loading={updateWorkoutSet.isPending}
            data-testid="button-save-workout-load"
          >
            <Check size={18} /> Save load
          </Button>
        </div>
      </BottomSheet>

      {/* Missed-set sheet */}
      <BottomSheet
        open={showMiss && !!current}
        onClose={() => setShowMiss(false)}
        title="Choose your next move"
        subtitle={`Rep ${current?.setNumber ?? ''} · ${current ? displayMovement(current.movementId ?? current.exercise) : ''}`}
      >
        <p className="mb-5 type-body-sm text-muted-foreground">No judgement. Keep the session useful and choose what happens next.</p>
        <div className="grid gap-3">
          <Button
            variant="tertiary"
            size="lg"
            className="w-full justify-between"
            onClick={() => missCurrent('retry')}
            loading={miss.isPending}
            data-testid="button-retry-set"
          >
            <span>
              <span className="block text-left">Retry this rep</span>
              <span className="block text-left type-body-sm font-normal text-muted-foreground">Take a breath and make another attempt</span>
            </span>
            <ArrowRight size={17} />
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-between"
            onClick={() => missCurrent('move_on')}
            loading={miss.isPending}
            data-testid="button-move-on"
          >
            <span>
              <span className="block text-left">Move on</span>
              <span className="block text-left type-body-sm font-normal text-primary-foreground/70">Log it and continue the session</span>
            </span>
            <ArrowRight size={17} />
          </Button>
        </div>
      </BottomSheet>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────

export function HistoryPage() {
  const q = useGetHistory();
  const movementsQuery = useGetMovements();
  const [expandedPb, setExpandedPb] = useState<number | null>(null);
  if (q.isLoading) return <LoadingBlock />;
  if (q.isError)   return <ErrorBlock retry={() => q.refetch()} />;
  const history = q.data || [];
  const displayMovement = (id: string) =>
    movementsQuery.data?.find((movement) => movement.id === id)?.name ??
    exerciseLabels[id] ??
    movementLabel(id);

  return (
    <div>
      <PageHead
        eyebrow="Training history"
        title="The work stays."
        detail="A record of completed sessions, misses included. Consistency is the metric."
      />
      {history.length ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {history.map((w, i) => (
            <article
              key={w.id}
              className={`border-b border-border last:border-0 ${w.hasPb ? 'border-l-2 border-l-secondary' : ''}`}
              data-testid={`row-history-${w.id}`}
            >
              <div className="p-5">
                <div className="flex gap-4">
                  <span className="font-data type-caption text-muted-foreground">
                    {String(history.length - i).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="type-section-heading">{w.sessionName}</h2>
                      {w.hasPb && (
                        <button
                          onClick={() => setExpandedPb(expandedPb === w.id ? null : w.id)}
                          className="tap shrink-0 flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1 type-caption font-semibold text-secondary"
                          data-testid={`badge-pb-${w.id}`}
                          aria-expanded={expandedPb === w.id}
                          aria-label="Personal best — tap to see details"
                        >
                          <Trophy size={11} />
                          PB
                          {expandedPb === w.id
                            ? <ChevronUp size={11} />
                            : <ChevronDown size={11} />}
                        </button>
                      )}
                    </div>
                    <p className="type-body-sm text-muted-foreground">{w.programmeName} · {formatDate(w.date)}</p>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-data type-caption">
                      <span><b className="text-foreground">{w.completedSets}</b> / {w.totalSets} sets</span>
                      {w.missedSets > 0 && <span className="text-destructive">{w.missedSets} missed</span>}
                      <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-secondary">{w.attempts} attempts</span>
                    </div>
                  </div>
                </div>

                {/* PB detail panel */}
                {w.hasPb && expandedPb === w.id && (
                  <div className="mt-4 rounded-lg border border-secondary/30 bg-secondary/10 p-3" data-testid={`pb-detail-${w.id}`}>
                    <p className="mb-2 flex items-center gap-1.5 type-caption font-semibold text-secondary">
                      <Trophy size={11} /> Personal best{w.pbSets.length > 1 ? 's' : ''} this session
                    </p>
                    <ul className="space-y-1">
                      {w.pbSets.map((s, idx) => (
                        <li key={idx} className="flex items-center justify-between">
                          <span className="type-body-sm text-foreground/80">{displayMovement(s.exercise)}</span>
                          <span className="text-pb-number text-secondary">{s.weight}<span className="ml-0.5 type-caption font-semibold text-secondary/60">kg</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyBlock
          title="Nothing logged yet"
          detail="Start a session from Track or your programme. This page will remember the work."
          action={
            <Link
              href="/"
              className="tap inline-flex min-h-12 items-center rounded-lg bg-primary px-5 type-button text-primary-foreground"
              data-testid="link-history-start"
            >
              Go to Track <ArrowRight size={16} className="ml-2" />
            </Link>
          }
        />
      )}
    </div>
  );
}
