import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronRight, Download, Trash2, Trophy } from 'lucide-react';
import {
  exportAccountData,
  getGetDashboardQueryKey,
  getGetCurrentSessionQueryKey,
  getGetProfileQueryKey,
  getGetProgrammesQueryKey,
  useChangePassword,
  useDeleteProgramme,
  useDeleteAccount,
  useGetHistory,
  useGetCurrentSession,
  useGetProfile,
  useGetProgrammes,
  useLogout,
  useSaveProfile,
} from '@workspace/api-client-react';
import type { AthleteProfileInput } from '@workspace/api-client-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { BottomSheet } from '@/components/sheet';
import { ErrorBlock, LoadingBlock } from '@/components/shell';
import { MobilePageHeader, MobileStatusBar } from '@/components/mobile-chrome';
import { ProgrammeForm } from '@/pages';

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

function formatHistoryDate(value: string) {
  const date = new Date(value);
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).toUpperCase();
  const timeLabel = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${dateLabel} · ${timeLabel}`;
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
          {currentProgramme ? (
            <article className="flex min-h-[170px] items-center justify-center gap-3 rounded-2xl bg-card p-6" data-testid={`card-programme-${currentProgramme.id}`}>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-primary">{currentProgramme.sessionsPerWeek} sessions / week · {currentProgramme.lengthWeeks} weeks</p>
                  <p className="font-display text-2xl font-semibold leading-[26px]">{currentProgramme.name}</p>
                </div>
                <p className="font-data text-[15px] leading-5 text-muted-foreground">{currentProgramme.sessionNames.join(', ')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <button
                  type="button"
                  onClick={deleteCurrentProgramme}
                  disabled={del.isPending}
                  className="tap grid h-[22px] w-[22px] place-items-center text-muted-foreground transition-colors hover:text-destructive disabled:opacity-40"
                  aria-label="Delete current programme"
                  data-testid={`button-delete-programme-${currentProgramme.id}`}
                >
                  <Trash2 size={22} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => setLocation(`/programme/${currentProgramme.id}`)}
                  className="tap grid h-[22px] w-[22px] place-items-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Open current programme"
                  data-testid={`link-programme-${currentProgramme.id}`}
                >
                  <ChevronRight size={22} strokeWidth={1.8} />
                </button>
              </div>
            </article>
          ) : (
            <div className="flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-2xl bg-card p-6 text-center" data-testid="empty-current-programme">
              <p className="font-display text-xl font-semibold">No active programme</p>
              <p className="font-data text-[15px] leading-5 text-muted-foreground">Create your first training cycle to start planning sessions.</p>
            </div>
          )}
        </section>

        <Button
          type="button"
          variant="tertiary"
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
          {data && data.length > 1 ? data.slice(1).map((programme) => (
            <button
              key={programme.id}
              type="button"
              onClick={() => setLocation(`/programme/${programme.id}`)}
              className="tap flex min-h-[158px] w-full flex-col items-start justify-center gap-3 rounded-2xl bg-card p-6 text-left"
              data-testid={`card-previous-programme-${programme.id}`}
            >
              <div className="flex w-full flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-primary">{programme.sessionsPerWeek} sessions / week · {programme.lengthWeeks} weeks</p>
                  <p className="font-display text-2xl font-semibold leading-[26px]">{programme.name}</p>
                </div>
                <p className="font-data text-[15px] leading-5 text-muted-foreground">{programme.sessionNames.join(', ')}</p>
              </div>
              <p className="font-data text-[11px] uppercase text-muted-foreground">Updated {formatHistoryDate(programme.updatedAt).split(' · ')[0]}</p>
            </button>
          )) : (
            <div className="rounded-2xl bg-card p-6">
              <p className="font-data text-[15px] leading-5 text-muted-foreground">No previous programmes yet.</p>
            </div>
          )}
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
          {data && data.length > 0 ? data.map((workout) => (
              <button
                key={workout.id}
                type="button"
                onClick={() => setLocation(`/workout/${workout.id}`)}
                className="tap flex min-h-[92px] w-full items-center justify-between rounded-2xl bg-card p-4 text-left disabled:cursor-default"
                data-testid={`row-history-${workout.id}`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="font-display text-[10px] font-semibold uppercase leading-[14px] tracking-[.015em] text-muted-foreground">{formatHistoryDate(workout.date)}</span>
                  <span className="font-display text-[15px] font-semibold leading-5 text-foreground">{workout.sessionName}</span>
                  <span className="flex items-center gap-2 font-data text-[13px] leading-normal text-muted-foreground">
                    {workout.totalSets} working sets
                    {workout.missedSets > 0 && <span className="flex items-center gap-1 text-destructive"><i className="h-1 w-1 rounded-full bg-destructive" />{workout.missedSets} MISSED</span>}
                  </span>
                </span>
                <span className="ml-3 flex shrink-0 items-center gap-3">
                  {workout.hasPb && <span className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-display text-[11px] font-extrabold text-background"><Trophy size={12} />PB</span>}
                  <ChevronRight size={18} className="text-muted-foreground" />
                </span>
              </button>
          )) : (
            <div className="rounded-2xl bg-card p-6">
              <p className="font-data text-[15px] leading-5 text-muted-foreground">No sessions recorded yet.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [, setLocation] = useLocation();
  const { data, isLoading, isError, error, refetch } = useGetProfile({ query: { retry: false, queryKey: getGetProfileQueryKey() } });
  const save = useSaveProfile();
  const session = useGetCurrentSession();
  const programmes = useGetProgrammes();
  const logout = useLogout();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
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
  const profileIsMissing = isError && error?.status === 404;
  if (isError && !profileIsMissing) return <ErrorBlock retry={() => refetch()} />;

  const initials = form.name ? form.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() : 'LO';
  const updateWeight = (key: (typeof personalBestFields)[number]['key'], value: string) =>
    setForm((current) => ({ ...current, [key]: Number(value) || 0 }));
  const signOut = () => {
    setLogoutError('');
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation('/login');
      },
      onError: () => setLogoutError('Could not sign out. Check your connection and try again.'),
    });
  };
  const downloadExport = async () => {
    setExportError('');
    setExporting(true);
    try {
      const data = await exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lofte-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Could not export your data. Check your connection and try again.');
    } finally {
      setExporting(false);
    }
  };
  const permanentlyDeleteAccount = () => {
    deleteAccount.mutate(
      { data: { password: deletePassword, confirmation: 'DELETE' } },
      {
        onSuccess: () => {
          queryClient.clear();
          window.location.assign('/login');
        },
      },
    );
  };
  const submitPasswordChange = () => {
    setPasswordError('');
    setPasswordChanged(false);
    if (newPassword.length < 8 || newPassword.length > 128) {
      setPasswordError('Password must be between 8 and 128 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    changePassword.mutate(
      { data: { password: newPassword } },
      {
        onSuccess: (replacementSession) => {
          queryClient.setQueryData(getGetCurrentSessionQueryKey(), replacementSession);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordChanged(true);
        },
        onError: () => setPasswordError('Could not change your password. Please try again.'),
      },
    );
  };

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

        {session.data?.user && (
          <section className="rounded-2xl bg-card p-5">
            <p className="type-caption text-primary">Account</p>
            <p className="mt-2 font-display text-xl font-semibold">{session.data.user.username}</p>
            <p className="mt-1 font-data text-sm text-muted-foreground">{session.data.user.email}</p>
          </section>
        )}

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
            {([1, 2, 2.5] as const).map((increment) => {
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

        <section className="flex flex-col gap-3.5">
          <h2 className="font-display text-2xl font-semibold uppercase leading-[26px] tracking-[-.02em]">Saved programmes</h2>
          {Array.isArray(programmes.data) && programmes.data.length ? (
            <div className="space-y-2">
              {programmes.data.map((programme) => (
                <Link key={programme.id} href={`/programme/${programme.id}`} className="flex items-center justify-between rounded-xl bg-card p-4">
                  <span>
                    <span className="block font-display text-base font-semibold">{programme.name}</span>
                    <span className="mt-1 block font-data text-xs text-muted-foreground">{programme.sessionsPerWeek} sessions / week · {programme.lengthWeeks} weeks</span>
                  </span>
                  <ChevronRight size={18} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-card p-4 font-data text-sm text-muted-foreground">No programmes saved yet.</p>
          )}
        </section>

        <section className="flex flex-col items-center gap-3">
          <Button type="submit" variant="primary" className="h-12 w-full rounded-xl uppercase" loading={save.isPending} data-testid="button-save-profile">
            {saved ? <><Check size={16} />Saved</> : 'Save changes'}
          </Button>
          <p className={`font-data text-[11px] ${save.isError ? 'text-destructive' : saved ? 'text-success' : 'text-muted-foreground'}`}>
            {save.isError ? 'COULD NOT SAVE PROFILE' : saved ? 'PROFILE SAVED' : data?.updatedAt ? displayDate(data.updatedAt) : 'PROFILE NOT SAVED'}
          </p>
          <Button type="button" variant="tertiary" className="w-full uppercase" loading={logout.isPending} onClick={signOut} data-testid="button-logout">
            Sign out
          </Button>
          {logoutError && <p className="font-data text-[11px] text-destructive" role="alert">{logoutError}</p>}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="type-caption text-primary">Your data</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Account controls</h2>
            <p className="mt-2 font-data text-sm leading-5 text-muted-foreground">Download a portable JSON copy of your PBs, programmes, workouts, and custom movements.</p>
          </div>
          <Button type="button" variant="secondary" className="w-full uppercase" onClick={() => { setPasswordOpen(true); setPasswordError(''); setPasswordChanged(false); }} data-testid="button-open-change-password">
            Change password
          </Button>
          <Button type="button" variant="secondary" className="w-full uppercase" loading={exporting} onClick={downloadExport} data-testid="button-export-data">
            <Download size={16} /> Export my data
          </Button>
          {exportError && <p className="font-data text-xs text-destructive" role="alert">{exportError}</p>}
          <div className="my-1 h-px bg-border" />
          <p className="font-data text-sm leading-5 text-muted-foreground">Deleting your account permanently removes your profile and private training history. This cannot be undone.</p>
          <Button type="button" variant="destructive" className="w-full uppercase" onClick={() => setDeleteOpen(true)} data-testid="button-open-delete-account">
            Delete account
          </Button>
        </section>
      </form>

      <BottomSheet
        open={passwordOpen}
        onClose={() => !changePassword.isPending && setPasswordOpen(false)}
        title="Change password"
        subtitle="Set a new password for this account. Other signed-in devices will be signed out."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitPasswordChange();
          }}
        >
          <Input
            type="password"
            autoComplete="new-password"
            label="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            data-testid="input-new-password"
          />
          <Input
            type="password"
            autoComplete="new-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            data-testid="input-confirm-new-password"
          />
          {passwordError && <p className="font-data text-xs text-destructive" role="alert">{passwordError}</p>}
          {passwordChanged && <p className="font-data text-xs text-success" role="status">Password changed. You are still signed in.</p>}
          <Button
            type="submit"
            variant="primary"
            className="w-full uppercase"
            loading={changePassword.isPending}
            onClick={submitPasswordChange}
            data-testid="button-change-password"
          >
            Change password
          </Button>
          <Button type="button" variant="tertiary" className="w-full uppercase" disabled={changePassword.isPending} onClick={() => setPasswordOpen(false)}>
            Done
          </Button>
        </form>
      </BottomSheet>

      <BottomSheet
        open={deleteOpen}
        onClose={() => !deleteAccount.isPending && setDeleteOpen(false)}
        title="Delete account?"
        subtitle="This permanently removes your account, PBs, programmes, workouts, custom movements, and every active session."
      >
        <div className="space-y-4">
          <Input
            type="password"
            autoComplete="current-password"
            label="Current password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            data-testid="input-delete-password"
          />
          <Input
            label="Type DELETE to confirm"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            data-testid="input-delete-confirmation"
          />
          {deleteAccount.isError && (
            <p className="font-data text-xs text-destructive" role="alert">
              {deleteAccount.error?.status === 403 ? 'Your current password is incorrect.' : 'Could not delete your account. Please try again.'}
            </p>
          )}
          <Button
            type="button"
            variant="destructive"
            className="w-full uppercase"
            disabled={!deletePassword || deleteConfirmation !== 'DELETE'}
            loading={deleteAccount.isPending}
            onClick={permanentlyDeleteAccount}
            data-testid="button-confirm-delete-account"
          >
            Permanently delete account
          </Button>
          <Button type="button" variant="tertiary" className="w-full uppercase" disabled={deleteAccount.isPending} onClick={() => setDeleteOpen(false)}>
            Keep my account
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}