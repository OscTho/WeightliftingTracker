import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, CircleAlert, Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import {
  getGetDashboardQueryKey, getGetHistoryQueryKey, getGetProgrammeQueryKey,
  getGetProgrammesQueryKey, getGetProfileQueryKey, getGetWorkoutQueryKey,
  useCompleteSet, useCreateProgramme, useDeleteProgramme, useFinishWorkout,
  useGetDashboard, useGetHistory, useGetProgramme, useGetProgrammes,
  useGetProfile, useGetWorkout, useMissSet, useSaveProfile,
  useStartWorkout, useUpdateProgramme,
} from '@workspace/api-client-react';
import type { AthleteProfileInput, ExerciseName, ProgrammeInput } from '@workspace/api-client-react';
import { emptyProgramme, exerciseLabels, formatDate, formatShortDate } from '@/lib/utils';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/shell';
import { Button } from '@/components/button';
import { Input, Select } from '@/components/input';
import { BottomSheet } from '@/components/sheet';
import { WorkoutCurrentSet, ExerciseCompleteBanner, SetStatusBar } from '@/components/workout';
import type { WorkoutSetStatus } from '@/components/workout';

const exerciseOptions: ExerciseName[] = ['snatch', 'clean_and_jerk', 'back_squat', 'front_squat'];

function PageHead({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="mb-8">
      <p className="type-caption text-primary">{eyebrow}</p>
      <h1 className="mt-1 type-page-title">{title}</h1>
      {detail && <p className="mt-3 type-body-sm text-muted-foreground">{detail}</p>}
    </div>
  );
}

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
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <p className="type-caption text-primary">
          Today · {formatShortDate(new Date().toISOString())}
        </p>
        <h1 className="mt-1 type-page-title">
          Ready when<br />
          <span className="text-primary">{d.profile ? d.profile.name.split(' ')[0] : 'you'} are.</span>
        </h1>
      </div>

      {!d.profile && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-secondary bg-secondary/15 p-4">
          <div>
            <p className="type-subheading">Set up your athlete profile</p>
            <p className="type-body-sm text-muted-foreground">Your percentages need a starting point.</p>
          </div>
          <Link
            href="/profile"
            className="tap shrink-0 rounded-lg bg-foreground px-3 py-2.5 type-caption font-semibold text-background"
            data-testid="link-setup-profile"
          >
            Set up <ArrowRight size={14} className="ml-1 inline" />
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {/* Next session card */}
        <section className="relative overflow-hidden rounded-xl bg-elevated p-6 text-foreground">
          <div className="absolute -right-4 -top-10 font-display text-[10rem] font-semibold leading-none opacity-[0.05]">01</div>
          <div className="relative">
            <p className="type-caption text-secondary">Next session</p>
            {d.nextSession ? (
              <>
                <h2 className="mt-2 type-page-title">{d.nextSession.name}</h2>
                <p className="mt-4 type-body-sm text-foreground/60">
                  {d.nextSession.exercises.length} movements · {d.nextSession.exercises.reduce((a, e) => a + e.sets, 0)} working sets
                </p>
                <Button
                  variant="secondary"
                  className="mt-7"
                  onClick={() => d.programme && setLocation(`/workout/start?programme=${d.programme.id}&session=${d.nextSession?.sessionNumber}`)}
                  data-testid="button-start-next"
                >
                  Start session <ArrowRight size={17} />
                </Button>
              </>
            ) : (
              <>
                <h2 className="mt-2 type-page-title">No session queued</h2>
                <p className="mt-3 type-body-sm text-foreground/60">Choose a programme and give the week a shape.</p>
                <Link
                  href="/programme"
                  className="tap mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-secondary px-5 type-button text-secondary-foreground"
                  data-testid="link-choose-programme"
                >
                  Browse programmes <ArrowRight size={17} />
                </Link>
              </>
            )}
          </div>
        </section>

        <StatsRow stats={[
          { label: 'Sets this week', value: String(d.weeklyCompletedSets), accent: true },
          { label: 'Programme',      value: d.programme ? `${d.programme.sessionsPerWeek}×` : '—' },
          { label: 'Recent',         value: String(d.recentWorkouts.length) },
        ]} />

        {/* Recent work */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="type-section-heading">Recent work</p>
            <Link href="/history" className="type-caption font-semibold text-primary" data-testid="link-see-history">
              See all
            </Link>
          </div>
          {d.recentWorkouts.length ? (
            <div className="mt-4 space-y-3">
              {d.recentWorkouts.slice(0, 3).map((w) => (
                <div key={w.id} className="flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="type-subheading">{w.sessionName}</p>
                    <p className="type-body-sm text-muted-foreground">{formatShortDate(w.date)}</p>
                  </div>
                  <span className="font-data type-caption">{w.completedSets}/{w.totalSets}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 type-body-sm text-muted-foreground">Your completed sessions will land here.</p>
          )}
        </section>
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

function ProgrammeForm({ initial, programmeId, onDone }: { initial?: ProgrammeInput; programmeId?: number; onDone: () => void }) {
  const [form, setForm] = useState<ProgrammeInput>(initial || emptyProgramme);
  const create = useCreateProgramme();
  const update = useUpdateProgramme();
  const qc = useQueryClient();
  const mutation = programmeId ? update : create;

  const setSession = (index: number, patch: Partial<ProgrammeInput['sessions'][number]>) =>
    setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === index ? { ...s, ...patch } : s) }));

  const setExercise = (si: number, ei: number, patch: Partial<ProgrammeInput['sessions'][number]['exercises'][number]>) =>
    setForm((f) => ({ ...f, sessions: f.sessions.map((s, i) => i === si ? { ...s, exercises: s.exercises.map((e, j) => j === ei ? { ...e, ...patch } : e) } : s) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const done = () => {
      qc.invalidateQueries({ queryKey: getGetProgrammesQueryKey() });
      if (programmeId) qc.invalidateQueries({ queryKey: getGetProgrammeQueryKey(programmeId) });
      onDone();
    };
    programmeId
      ? update.mutate({ programmeId, data: form }, { onSuccess: done })
      : create.mutate({ data: form }, { onSuccess: done });
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
              value={session.sessionNumber}
              onChange={(e) => setSession(si, { sessionNumber: Number(e.target.value) })}
            />
            <Input
              label={`Session ${si + 1} name`}
              value={session.name}
              onChange={(e) => setSession(si, { name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-3">
            {session.exercises.map((ex, ei) => (
              <div key={ei} className="rounded-lg border border-border bg-card/50 p-3">
                <Select
                  label="Movement"
                  value={ex.exercise}
                  onChange={(e) => setExercise(si, ei, { exercise: e.target.value as ExerciseName })}
                  options={exerciseOptions.map((x) => ({ value: x, label: exerciseLabels[x] }))}
                />
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
                    label="% 1RM"
                    type="number" min="1"
                    value={ex.percentage}
                    onChange={(e) => setExercise(si, ei, { percentage: Number(e.target.value) })}
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
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSession(si, { exercises: [...session.exercises, { exercise: 'snatch', sets: 3, reps: 2, percentage: 70 }] })}
            className="mt-4 flex items-center gap-2 type-caption font-semibold text-primary"
            data-testid={`button-add-exercise-${si}`}
          >
            <Plus size={14} /> Add movement
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="tertiary"
          onClick={() => setForm((f) => ({ ...f, sessions: [...f.sessions, { sessionNumber: f.sessions.length + 1, name: `Session ${f.sessions.length + 1}`, exercises: [{ exercise: 'snatch', sets: 3, reps: 2, percentage: 70 }] }] }))}
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
  const [editing, setEditing] = useState(false);
  const [, setLocation] = useLocation();
  const start = useStartWorkout();
  const qc = useQueryClient();

  if (q.isLoading) return <LoadingBlock />;
  if (q.isError || !q.data) return <ErrorBlock retry={() => q.refetch()} />;
  const p = q.data;

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
            initial={{ name: p.name, sessionsPerWeek: p.sessionsPerWeek, lengthWeeks: p.lengthWeeks, sessions: p.sessions.map((s) => ({ sessionNumber: s.sessionNumber, name: s.name, exercises: s.exercises.map((e) => ({ exercise: e.exercise, sets: e.sets, reps: e.reps, percentage: e.percentage })) })) }}
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
                        <p className="type-subheading">{exerciseLabels[e.exercise]}</p>
                        <p className="type-body-sm text-muted-foreground">{e.sets} sets × {e.reps} reps</p>
                      </div>
                      <span className="font-data type-body-sm text-primary">{e.percentage}%</span>
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
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const complete = useCompleteSet();
  const miss = useMissSet();
  const finish = useFinishWorkout();
  const [showMiss, setShowMiss] = useState(false);
  const [finishedExercise, setFinishedExercise] = useState<string | null>(null);

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
    <div className="text-center">
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
  );

  const completeCurrent = () => {
    if (!current) return;
    const isLastSetOfExercise = current.setNumber === current.totalSets;
    complete.mutate({ workoutId: w.id, setId: current.id }, {
      onSuccess: (next) => {
        done(next);
        if (isLastSetOfExercise) setFinishedExercise(exerciseLabels[current.exercise]);
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
        .filter((s) => s.exercise === current.exercise)
        .map((s) => {
          if (s.id === current.id) return 'current';
          if (s.status === 'completed') return 'completed';
          if (s.status === 'missed')    return 'missed';
          return 'pending';
        })
    : [];

  // Next exercise name (for exercise complete banner)
  const nextExercise = current
    ? (() => {
        const nextPending = w.sets.find((s) => s.status === 'pending' && s.id !== current.id);
        return nextPending && nextPending.exercise !== current.exercise ? exerciseLabels[nextPending.exercise] : null;
      })()
    : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
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
          <p className="type-caption text-muted-foreground">reps</p>
        </div>
      </div>

      {/* Per-exercise progress bar */}
      {current && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="type-caption text-muted-foreground">
              {exerciseLabels[current.exercise]}
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
          nextExerciseName={nextExercise}
          onContinue={() => setFinishedExercise(null)}
        />
      ) : current ? (
        <>
          <WorkoutCurrentSet
            exercise={current.exercise}
            setNumber={current.setNumber}
            totalSets={current.totalSets}
            weight={current.weight}
            reps={current.reps}
            percentage={current.percentage}
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

      {/* Missed-set sheet */}
      <BottomSheet
        open={showMiss && !!current}
        onClose={() => setShowMiss(false)}
        title="Choose your next move"
        subtitle={`Rep ${current?.setNumber ?? ''} · ${current ? exerciseLabels[current.exercise] : ''}`}
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
  );
}

// ─────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────

export function HistoryPage() {
  const q = useGetHistory();
  if (q.isLoading) return <LoadingBlock />;
  if (q.isError)   return <ErrorBlock retry={() => q.refetch()} />;
  const history = q.data || [];

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
              className="border-b border-border p-5 last:border-0"
              data-testid={`row-history-${w.id}`}
            >
              <div className="flex gap-4">
                <span className="font-data type-caption text-muted-foreground">
                  {String(history.length - i).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="type-section-heading">{w.sessionName}</h2>
                  <p className="type-body-sm text-muted-foreground">{w.programmeName} · {formatDate(w.date)}</p>
                  <div className="mt-2 flex gap-5 font-data type-caption">
                    <span><b className="text-foreground">{w.completedSets}</b> / {w.totalSets} sets</span>
                    {w.missedSets > 0 && <span className="text-destructive">{w.missedSets} missed</span>}
                    <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-secondary">{w.attempts} attempts</span>
                  </div>
                </div>
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
