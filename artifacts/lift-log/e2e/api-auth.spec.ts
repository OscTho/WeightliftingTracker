import { expect, request, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { createPasswordResetToken } from '../../api-server/src/auth';

const API = 'http://localhost:80/api/';

test('accounts persist private training data and isolate resource IDs', async () => {
  const suffix = randomUUID().slice(0, 8);
  const password = 'CorrectHorse42!';
  const athleteA = await request.newContext({ baseURL: API });
  const athleteB = await request.newContext({ baseURL: API });

  const signupA = await athleteA.post('auth/signup', {
    data: { username: `athlete_a_${suffix}`, email: `a_${suffix}@example.test`, password },
  });
  expect(signupA.status()).toBe(201);
  expect((await signupA.json()).token).toBeTruthy();

  expect((await athleteA.get('auth/me')).status()).toBe(200);
  expect((await athleteA.put('profile', {
    data: {
      name: 'Athlete A',
      snatchPb: 90,
      cleanJerkPb: 110,
      backSquatPb: 150,
      frontSquatPb: 130,
      roundingIncrement: 2.5,
    },
  })).status()).toBe(200);

  const programmeResponse = await athleteA.post('programmes', {
    data: {
      name: 'Private plan',
      sessionsPerWeek: 1,
      lengthWeeks: 4,
      sessions: [{
        sessionNumber: 1,
        name: 'Day one',
        exercises: [{ movementId: 'snatch', sets: 1, reps: 1, percentage: 80 }],
      }],
    },
  });
  expect(programmeResponse.status()).toBe(201);
  const programme = await programmeResponse.json();
  expect((await athleteA.post('workouts', {
    data: { programmeId: programme.id, sessionNumber: 1 },
  })).status()).toBe(201);

  expect((await athleteB.post('auth/signup', {
    data: { username: `athlete_b_${suffix}`, email: `b_${suffix}@example.test`, password },
  })).status()).toBe(201);
  expect((await athleteB.get(`programmes/${programme.id}`)).status()).toBe(404);
  expect(await (await athleteB.get('programmes')).json()).toEqual([]);

  const signupBody = await signupA.json();
  const nativeAthleteA = await request.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${signupBody.token}` },
  });
  expect((await nativeAthleteA.get('auth/me')).status()).toBe(200);
  expect((await nativeAthleteA.post('auth/logout')).status()).toBe(204);
  expect((await nativeAthleteA.get('auth/me')).status()).toBe(401);
  expect((await athleteA.get('auth/me')).status()).toBe(401);
  expect((await athleteA.post('auth/login', {
    data: { login: `ATHLETE_A_${suffix.toUpperCase()}`, password },
  })).status()).toBe(200);
  expect((await athleteA.get(`programmes/${programme.id}`)).status()).toBe(200);

  await nativeAthleteA.dispose();
  await athleteA.dispose();
  await athleteB.dispose();
});

test('account export and deletion stay scoped to the authenticated athlete', async () => {
  const suffix = randomUUID().slice(0, 8);
  const password = 'CorrectHorse42!';
  const athleteA = await request.newContext({ baseURL: API });
  const athleteB = await request.newContext({ baseURL: API });

  const signupA = await athleteA.post('auth/signup', {
    data: { username: `export_a_${suffix}`, email: `export_a_${suffix}@example.test`, password },
  });
  const signupB = await athleteB.post('auth/signup', {
    data: { username: `export_b_${suffix}`, email: `export_b_${suffix}@example.test`, password },
  });
  expect(signupA.status()).toBe(201);
  expect(signupB.status()).toBe(201);

  await athleteA.put('profile', {
    data: {
      name: 'Export Athlete A',
      snatchPb: 91,
      cleanJerkPb: 111,
      backSquatPb: 151,
      frontSquatPb: 131,
      roundingIncrement: 2.5,
    },
  });
  const programmeResponse = await athleteA.post('programmes', {
    data: {
      name: 'Athlete A private plan',
      sessionsPerWeek: 1,
      lengthWeeks: 4,
      sessions: [{
        sessionNumber: 1,
        name: 'Private day',
        exercises: [{ movementId: 'snatch', sets: 1, reps: 1, percentage: 80 }],
      }],
    },
  });
  const programme = await programmeResponse.json();
  await athleteA.post('workouts', { data: { programmeId: programme.id, sessionNumber: 1 } });
  await athleteA.post('movements', {
    data: { name: 'Athlete A movement', category: 'Accessories', description: 'Private movement' },
  });

  const exportAResponse = await athleteA.get('account/export');
  expect(exportAResponse.status()).toBe(200);
  expect(exportAResponse.headers()['content-disposition']).toContain('attachment;');
  const exportA = await exportAResponse.json();
  expect(exportA.account.username).toBe(`export_a_${suffix}`);
  expect(exportA.profile.name).toBe('Export Athlete A');
  expect(exportA.programmes.map((item: { name: string }) => item.name)).toEqual(['Athlete A private plan']);
  expect(exportA.workouts).toHaveLength(1);
  expect(exportA.customMovements.map((item: { name: string }) => item.name)).toEqual(['Athlete A movement']);

  const exportB = await (await athleteB.get('account/export')).json();
  expect(exportB.account.username).toBe(`export_b_${suffix}`);
  expect(exportB.programmes).toEqual([]);
  expect(exportB.workouts).toEqual([]);
  expect(exportB.customMovements).toEqual([]);

  expect((await athleteA.delete('account', {
    data: { password: 'wrong-password', confirmation: 'DELETE' },
  })).status()).toBe(403);
  expect((await athleteA.get('auth/me')).status()).toBe(200);

  expect((await athleteA.delete('account', {
    data: { password, confirmation: 'DELETE' },
  })).status()).toBe(204);
  expect((await athleteA.get('auth/me')).status()).toBe(401);
  expect((await athleteB.get('auth/me')).status()).toBe(200);
  expect((await athleteB.get('movements')).status()).toBe(200);

  const deletedLogin = await athleteA.post('auth/login', {
    data: { login: `export_a_${suffix}`, password },
  });
  expect(deletedLogin.status()).toBe(401);

  await athleteA.dispose();
  await athleteB.dispose();
});

test('authenticated password change rotates sessions, invalidates reset tokens, and stays scoped', async () => {
  const suffix = randomUUID().slice(0, 8);
  const oldPassword = 'CorrectHorse42!';
  const newPassword = 'NewCorrectHorse84!';
  const athleteA = await request.newContext({ baseURL: API });
  const athleteB = await request.newContext({ baseURL: API });
  const anonymous = await request.newContext({ baseURL: API });

  expect((await anonymous.put('auth/password', { data: { password: newPassword } })).status()).toBe(401);

  const signupA = await athleteA.post('auth/signup', {
    data: { username: `password_a_${suffix}`, email: `password_a_${suffix}@example.test`, password: oldPassword },
  });
  const accountA = await signupA.json();
  const oldBearerSession = await request.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${accountA.token}` },
  });
  const resetToken = await createPasswordResetToken(accountA.user.id);

  expect((await athleteA.put('auth/password', { data: { password: 'short' } })).status()).toBe(400);
  expect((await athleteA.put('auth/password', { data: { password: 'x'.repeat(129) } })).status()).toBe(400);

  const signupB = await athleteB.post('auth/signup', {
    data: { username: `password_b_${suffix}`, email: `password_b_${suffix}@example.test`, password: oldPassword },
  });
  const accountB = await signupB.json();
  const scopedChange = await athleteB.put('auth/password', {
    data: { password: 'ScopedPassword19!', userId: accountA.user.id },
  });
  expect(scopedChange.status()).toBe(200);
  expect((await scopedChange.json()).user.id).toBe(accountB.user.id);
  expect((await athleteA.post('auth/login', {
    data: { login: accountA.user.username, password: oldPassword },
  })).status()).toBe(200);

  const changed = await athleteA.put('auth/password', { data: { password: newPassword } });
  expect(changed.status()).toBe(200);
  const replacement = await changed.json();
  expect(replacement.token).toBeTruthy();
  expect(replacement.user.id).toBe(accountA.user.id);

  expect((await athleteA.get('auth/me')).status()).toBe(200);
  expect((await oldBearerSession.get('auth/me')).status()).toBe(401);
  expect((await athleteA.post('auth/login', {
    data: { login: accountA.user.username, password: oldPassword },
  })).status()).toBe(401);
  expect((await athleteA.post('auth/login', {
    data: { login: accountA.user.username, password: newPassword },
  })).status()).toBe(200);
  expect((await anonymous.post('auth/password-reset/confirm', {
    data: { token: resetToken.token, password: 'ShouldNotWork73!' },
  })).status()).toBe(400);

  const replacementBearer = await request.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${replacement.token}` },
  });
  expect((await replacementBearer.get('auth/me')).status()).toBe(200);

  await replacementBearer.dispose();
  await oldBearerSession.dispose();
  await anonymous.dispose();
  await athleteA.dispose();
  await athleteB.dispose();
});