import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';
import type { ExerciseName, ProgrammeInput } from '@workspace/api-client-react';
import { movementLabels } from './movements';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const exerciseLabels: Record<ExerciseName, string> = movementLabels;

export const formatDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) : '—';

export const formatShortDate = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(value)) : '—';

export const emptyProgramme: ProgrammeInput = {
  name: 'Foundation cycle',
  sessionsPerWeek: 3,
  lengthWeeks: 4,
  sessions: [
    { sessionNumber: 1, name: 'Power & positions', exercises: [{ movementId: 'snatch', sets: 4, reps: 2, percentage: 72 }, { movementId: 'back_squat', sets: 4, reps: 3, percentage: 78 }] },
  ],
};
