import type { Page, Route } from '@playwright/test';

// ─── Shared mock data ───────────────────────────────────────────────────────

export const PROFILE = {
  id: 1,
  name: 'Alex Johnson',
  snatchPb: 90,
  cleanJerkPb: 110,
  backSquatPb: 150,
  frontSquatPb: 130,
  roundingIncrement: 2.5,
  updatedAt: '2026-08-01T10:00:00.000Z',
};

export const PROGRAMME_SUMMARY = {
  id: 1,
  name: 'Bulgarian Method',
  sessionsPerWeek: 5,
  lengthWeeks: 8,
  sessionNames: ['Snatch Focus', 'C&J Focus', 'Squat Day', 'Max Effort', 'Recovery'],
  updatedAt: '2026-08-01T10:00:00.000Z',
};

export const PROGRAMME = {
  id: 1,
  name: 'Bulgarian Method',
  sessionsPerWeek: 5,
  lengthWeeks: 8,
  updatedAt: '2026-08-01T10:00:00.000Z',
  sessions: [
    {
      id: 101,
      sessionNumber: 1,
      name: 'Snatch Focus',
      exercises: [
        { id: 201, exercise: 'snatch',        sets: 5, reps: 2, percentage: 80 },
        { id: 202, exercise: 'front_squat',   sets: 3, reps: 3, percentage: 85 },
      ],
    },
    {
      id: 102,
      sessionNumber: 2,
      name: 'C&J Focus',
      exercises: [
        { id: 203, exercise: 'clean_and_jerk', sets: 4, reps: 2, percentage: 82 },
        { id: 204, exercise: 'back_squat',     sets: 3, reps: 4, percentage: 80 },
      ],
    },
  ],
};

export const NEXT_SESSION = {
  sessionNumber: 1,
  name: 'Snatch Focus',
  exercises: [
    { exercise: 'snatch',      sets: 5, reps: 2, percentage: 80 },
    { exercise: 'front_squat', sets: 3, reps: 3, percentage: 85 },
  ],
};

export const RECENT_WORKOUTS = [
  {
    id: 10,
    sessionName: 'Snatch Focus',
    date: '2026-08-15T08:00:00.000Z',
    completedSets: 8,
    totalSets: 8,
  },
  {
    id: 9,
    sessionName: 'C&J Focus',
    date: '2026-08-14T08:00:00.000Z',
    completedSets: 7,
    totalSets: 8,
  },
];

export const DASHBOARD_WITH_PROGRAMME = {
  profile: PROFILE,
  programme: PROGRAMME_SUMMARY,
  nextSession: NEXT_SESSION,
  recentWorkouts: RECENT_WORKOUTS,
  weeklyCompletedSets: 15,
};

export const DASHBOARD_NO_PROGRAMME = {
  profile: PROFILE,
  programme: null,
  nextSession: null,
  recentWorkouts: [],
  weeklyCompletedSets: 0,
};

export const DASHBOARD_NO_PROFILE = {
  profile: null,
  programme: null,
  nextSession: null,
  recentWorkouts: [],
  weeklyCompletedSets: 0,
};

// Workout with one pending set (active)
export const WORKOUT_ACTIVE = {
  id: 99,
  programmeId: 1,
  programmeName: 'Bulgarian Method',
  sessionName: 'Snatch Focus',
  status: 'in_progress',
  completedSets: 2,
  missedSets: 0,
  attempts: 2,
  sets: [
    {
      id: 301,
      exercise: 'snatch',
      setNumber: 1,
      totalSets: 3,
      reps: 2,
      percentage: 80,
      weight: 72,
      status: 'completed',
      attemptNumber: 1,
      completedAt: '2026-08-18T09:01:00.000Z',
    },
    {
      id: 302,
      exercise: 'snatch',
      setNumber: 2,
      totalSets: 3,
      reps: 2,
      percentage: 80,
      weight: 72,
      status: 'completed',
      attemptNumber: 1,
      completedAt: '2026-08-18T09:05:00.000Z',
    },
    {
      id: 303,
      exercise: 'snatch',
      setNumber: 3,
      totalSets: 3,
      reps: 2,
      percentage: 80,
      weight: 72,
      status: 'pending',
      attemptNumber: 1,
      completedAt: null,
    },
  ],
};

// Workout where all sets done, ready to finish
export const WORKOUT_ALL_SETS_DONE = {
  ...WORKOUT_ACTIVE,
  completedSets: 3,
  sets: WORKOUT_ACTIVE.sets.map((s) =>
    s.id === 303
      ? { ...s, status: 'completed', completedAt: '2026-08-18T09:10:00.000Z' }
      : s
  ),
};

// Completed workout (after finish)
export const WORKOUT_COMPLETED = {
  ...WORKOUT_ACTIVE,
  status: 'completed',
  completedSets: 3,
  missedSets: 0,
  attempts: 3,
  sets: WORKOUT_ACTIVE.sets.map((s) => ({ ...s, status: 'completed', completedAt: '2026-08-18T09:10:00.000Z' })),
};

export const HISTORY_ITEMS = [
  {
    id: 10,
    sessionName: 'Snatch Focus',
    programmeName: 'Bulgarian Method',
    date: '2026-08-15T08:00:00.000Z',
    completedSets: 8,
    totalSets: 8,
    missedSets: 0,
    attempts: 8,
  },
  {
    id: 9,
    sessionName: 'C&J Focus',
    programmeName: 'Bulgarian Method',
    date: '2026-08-13T08:00:00.000Z',
    completedSets: 6,
    totalSets: 8,
    missedSets: 2,
    attempts: 9,
  },
];

// ─── Route helpers ──────────────────────────────────────────────────────────

type MockRoutes = {
  dashboard?: object | 'error';
  profile?: object | 'error' | 404;
  programmes?: object[] | 'error';
  programme?: object | 'error';
  workout?: object | 'error';
  history?: object[] | 'error';
};

async function mockRoute(
  page: Page,
  pattern: string | RegExp,
  response: object | 'error' | 404,
) {
  await page.route(pattern, (route: Route) => {
    if (response === 'error') {
      return route.fulfill({ status: 500, body: JSON.stringify({ message: 'Server error' }), contentType: 'application/json' });
    }
    if (response === 404) {
      return route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not found' }), contentType: 'application/json' });
    }
    return route.fulfill({ status: 200, body: JSON.stringify(response), contentType: 'application/json' });
  });
}

export async function setupMocks(page: Page, routes: MockRoutes) {
  if (routes.dashboard !== undefined)
    await mockRoute(page, /\/api\/dashboard/, routes.dashboard);
  if (routes.profile !== undefined)
    await mockRoute(page, /\/api\/profile$/, routes.profile);
  if (routes.programmes !== undefined)
    await mockRoute(page, /\/api\/programmes$/, routes.programmes);
  if (routes.programme !== undefined)
    await mockRoute(page, /\/api\/programmes\/\d+$/, routes.programme);
  if (routes.workout !== undefined)
    await mockRoute(page, /\/api\/workouts\/\d+$/, routes.workout);
  if (routes.history !== undefined)
    await mockRoute(page, /\/api\/history/, routes.history);
}
