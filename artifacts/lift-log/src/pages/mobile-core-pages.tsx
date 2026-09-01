import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Trash2, Trophy } from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getGetHistoryQueryKey,
  getGetProfileQueryKey,
  getGetProgrammesQueryKey,
  useDeleteProgramme,
  useGetHistory,
  useGetProfile,
  useGetProgrammes,
  useSaveProfile,
} from '@workspace/api-client-react';
import type { AthleteProfileInput } from '@workspace/api-client-react';
import { Button } from '@/components/button';
import { ErrorBlock, LoadingBlock } from '@/components/shell';
import { MobilePageHeader, MobileStatusBar } from '@/components/mobile-chrome';
import { ProgrammeForm } from '@/pages';

const historyCards = [
  { date: 'YESTERDAY · 14:24', name: 'Squat Volume Block A', sets: '14 working sets', pb: true },
  { date: '09 AUG 2026 · 09:30', name: 'Clean & Jerk technical peak', sets: '11 working sets', missed: '2 MISSED' },
  { date: '07 AUG 2026 · 18:15', name: 'Overhead Lockout Complex', sets: '16 working sets', pb: true },
  { date: '05 AUG 2026 · 17:00', name: 'Snatch Pulls & Dynamic Effort', sets: '12 working sets', missed: '1 MISSED' },
];

const personalBestFields: Array<{ key: 'snatchPb' | 'cleanJerkPb' | 'backSquatPb' | 'frontSquatPb'; label: string }> = [
  { key: 'snatchPb', label: 'SNATCH' },
  { key: 'cleanJerkPb', label: 'CLEAN & JERK' },
  { key: 'backSquatPb', label: 'BACK SQUAT' },
  { key: 'frontSquatPb', label: 'FRONT SQUAT' },
];

function displayDate(value?: string) {
  if (!value) return 'LAST UPDATED TODAY';
  return `LAST UPDATED ${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)).toUpperCase()}`;
}

export function ProgrammePage() {
  const { data, isLoading, isError, refetch } = useGetProgrammes();
  const [editing, setEditing] = useState(false);
  const [, setLocation] = useLocation();
  const del = useDeleteProgramme();
  const queryClient = useQueryClient();
  const currentProgramme = data?.[0];

  if (isLoading) return <LoadingBlock label="Loading programmes" />;
  if (isError) return <ErrorBlock retry={() => refetch()} />;

  const deleteCurrentProgramme = () => {
    if (!currentProgramme || !window.confirm('Delete this programme?')) return;
    del.mutate(
      { programmeId: currentProgramme.id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetProgrammesQueryKey() }) },
    );
  };

  return (
    <div className="animate-in fade-in duration-300">
      <MobileStatusBar />
      <div className="flex flex-col gap-7 px-5 pb-6">
        <MobilePageHeader eyebrow="Training plans" title="Programme room." className="h-[148px]" />

        <section className="flex flex-col gap-5">
          <h2 className="font-display text-2xl font-semibold uppercase leading-[26px] tracking-[-.02em]">Current programme</h2>
          <article className="flex min-h-[170px] items-center justify-center gap-3 rounded-2xl bg-card p-6" data-testid={currentProgramme ? `card-programme-${currentProgramme.id}` : 'card-current-programme'}>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-primary">4 sessions / week · 12 weeks</p>
                <p className="font-display text-2xl font-semibold leading-[26px]">Super Strength v2</p>
              </div>
              <p className="font-data text-[15px] leading-5 text-muted-foreground">Squat Intensity, Snatch Speed, Pull Complex, Leg Volume</p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                onClick={deleteCurrentProgramme}
                disabled={!currentProgramme || del.isPending}
                className="tap grid h-[22px] w-[22px] place-items-center text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                aria-label="Delete current programme"
                data-testid={currentProgramme ? `button-delete-programme-${currentProgramme.id}` : undefined}
              >
                <Trash2 size={22} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => currentProgramme && setLocation(`/programme/${currentProgramme.id}`)}
                disabled={!currentProgramme}
                className="tap grid h-[22px] w-[22px] place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                aria-label="Open current programme"
                data-testid={currentProgramme ? `link-programme-${currentProgramme.id}` : undefined}
              >
                <ChevronRight size={22} strokeWidth={1.8} />
              </button>
            </div>
          </article>
        </section>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl border-[1.5px] border-primary bg-transparent font-display text-sm font-bold uppercase text-primary hover:bg-primary/10"
          onClick={() => setEditing((value) => !value)}
          data-testid="button-new-programme"
        >
          Create programme
        </Button>

        {editing && (
          <section className="rounded-2xl border border-primary/30 bg-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="type-caption text-primary">Build a week</p>
                <h2 className="type-section-heading mt-1">New programme</h2>
              </div>
              <button onClick={() => setEditing(false)} className="tap text-muted-foreground hover:text-foreground" aria-label="Close programme form">×</button>
            </div>
            <ProgrammeForm onDone={() => setEditing(false)} />
          </section>
        )}

        <section className="flex flex-col gap-5">
          <h2 className="font-display text-xl font-semibold leading-[26px]">Previous Programmes</h2>
          <article className="flex min-h-[158px] flex-col items-center justify-center gap-3 rounded-2xl bg-card p-6">
            <div className="flex w-full flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-primary">4 sessions / week · 12 weeks</p>
                <p className="font-display text-2xl font-semibold leading-[26px]">intro to olympic lifting</p>
              </div>
              <p className="font-data text-[15px] leading-5 text-muted-foreground">Snatch, Clean &amp; Jerk, squat basics</p>
            </div>
            <div className="flex w-full items-center justify-center gap-2">
              <span className="rounded-md bg-success/15 px-2 py-1 font-display text-[11px] font-extrabold uppercase text-success">Complete on 24/08/2026</span>
              <span className="font-data text-[11px] text-foreground">4</span>
              <span className="rounded-md bg-secondary px-2 py-1 font-display text-[11px] font-extrabold text-background">PBs</span>
              <span className="font-data text-[11px] text-foreground">achieved</span>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

export function HistoryPage() {
  const { data, isLoading, isError, refetch } = useGetHistory();
  const [, setLocation] = useLocation();

  if (isLoading) return <LoadingBlock label="Loading history" />;
  if (isError) return <ErrorBlock retry={() => refetch()} />;

  return (
    <div className="animate-in fade-in duration-300">
      <MobileStatusBar />
      <div className="flex flex-col gap-7 px-5 pb-6">
        <MobilePageHeader eyebrow="Training log" title="History." />
        <section className="flex flex-col gap-3">
          {historyCards.map((entry, index) => {
            const workout = data?.[index];
            return (
              <button
                key={entry.name}
                type="button"
                onClick={() => workout && setLocation(`/workout/${workout.id}`)}
                disabled={!workout}
                className="tap flex min-h-[92px] w-full items-center justify-between rounded-2xl bg-card p-4 text-left disabled:cursor-default"
                data-testid={workout ? `row-history-${workout.id}` : undefined}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">{entry.date}</span>
                  <span className="font-display text-[15px] font-semibold leading-5 text-foreground">{entry.name}</span>
                  <span className="flex items-center gap-2 font-data text-[13px] leading-normal text-muted-foreground">
                    {entry.sets}
                    {entry.missed && <span className="flex items-center gap-1 text-destructive"><i className="h-1 w-1 rounded-full bg-destructive" />{entry.missed}</span>}
                  </span>
                </span>
                <span className="ml-3 flex shrink-0 items-center gap-3">
                  {entry.pb && <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-display text-[11px] font-extrabold text-background"><Trophy size={12} />PB</span>}
                  <ChevronRight size={18} className="text-muted-foreground" />
                </span>
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { data, isLoading, isError, refetch } = useGetProfile({ query: { retry: false, queryKey: getGetProfileQueryKey() } });
  const save = useSaveProfile();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<AthleteProfileInput>({
    name: '', snatchPb: 0, cleanJerkPb: 0, backSquatPb: 0, frontSquatPb: 0, roundingIncrement: 2.5,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      snatchPb: data.snatchPb,
      cleanJerkPb: data.cleanJerkPb,
      backSquatPb: data.backSquatPb,
      frontSquatPb: data.frontSquatPb,
      roundingIncrement: data.roundingIncrement,
    });
  }, [data]);

  if (isLoading) return <LoadingBlock label="Loading profile" />;
  if (isError) return <ErrorBlock retry={() => refetch()} />;

  const initials = form.name ? form.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() : 'LO';
  const updateWeight = (key: (typeof personalBestFields)[number]['key'], value: string) =>
    setForm((current) => ({ ...current, [key]: Number(value) || 0 }));

  return (
    <div className="animate-in fade-in duration-300">
      <MobileStatusBar />
      <form
        className="flex flex-col gap-7 px-5 pb-6"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate(
            { data: form },
            {
              onSuccess: (profile) => {
                queryClient.setQueryData(getGetProfileQueryKey(), profile);
                queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2500);
              },
            },
          );
        }}
      >
        <MobilePageHeader eyebrow="Profile" title="Your numbers." className="h-[91px]" />

        <section className="flex h-16 items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-elevated font-display text-xl font-semibold text-foreground">{initials}</div>
          <div className="flex min-w-0 flex-col gap-1">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="h-[26px] w-full border-0 bg-transparent p-0 font-display text-2xl font-semibold leading-[26px] text-foreground outline-none"
              aria-label="Athlete name"
              data-testid="input-name"
              placeholder="Your name"
            />
            <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">Lofte athlete</p>
          </div>
        </section>

        <section className="flex flex-col gap-3.5">
          <h2 className="font-display text-2xl font-semibold uppercase leading-[26px] tracking-[-.02em]">Personal bests</h2>
          <div className="grid grid-cols-2 gap-3">
            {personalBestFields.map(({ key, label }) => (
              <label key={key} className="flex h-24 flex-col gap-1 rounded-xl bg-card p-4">
                <span className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">{label}</span>
                <span className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form[key]}
                    onChange={(event) => updateWeight(key, event.target.value)}
                    className="min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 font-display text-[32px] font-semibold leading-[42px] tracking-[-.02em] text-foreground outline-none"
                    aria-label={`${label} personal best`}
                    data-testid={`input-${key}`}
                  />
                  <span className="font-data text-[13px] text-muted-foreground">kg</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <p className="font-display text-[11px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">Weight rounding</p>
          <div className="grid h-11 grid-cols-3 rounded-xl border border-border bg-elevated p-[3px]">
            {([0.5, 1, 2.5] as const).map((increment) => {
              const active = form.roundingIncrement === increment;
              return (
                <button
                  key={increment}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, roundingIncrement: increment }))}
                  className={`tap rounded-[9px] font-display text-sm font-semibold transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  data-testid={`button-rounding-${increment}`}
                >
                  {increment.toFixed(1)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col items-center gap-3">
          <Button type="submit" variant="primary" className="h-12 w-full rounded-xl uppercase" loading={save.isPending} data-testid="button-save-profile">
            {saved ? <><Check size={16} />Saved</> : 'Save changes'}
          </Button>
          <p className={`font-data text-[11px] ${save.isError ? 'text-destructive' : saved ? 'text-success' : 'text-muted-foreground'}`}>
            {save.isError ? 'COULD NOT SAVE PROFILE' : saved ? 'PROFILE SAVED' : displayDate(data?.updatedAt)}
          </p>
        </section>
      </form>
    </div>
  );
}