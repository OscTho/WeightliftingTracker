import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  athleteProfilesTable,
  programmesTable,
  workoutsTable,
  type ProgrammeExercise,
  type ProgrammeSession,
  type ProfileData,
  type WorkoutData,
  type WorkoutSet,
} from "@workspace/db";
import {
  GetProfileResponse,
  SaveProfileBody,
  SaveProfileResponse,
  GetProgrammesResponse,
  CreateProgrammeBody,
  CreateProgrammeResponse,
  GetProgrammeParams,
  GetProgrammeResponse,
  UpdateProgrammeParams,
  UpdateProgrammeBody,
  UpdateProgrammeResponse,
  DeleteProgrammeParams,
  GetDashboardResponse,
  GetHistoryResponse,
  StartWorkoutBody,
  StartWorkoutResponse,
  GetWorkoutParams,
  GetWorkoutResponse,
  CompleteSetParams,
  CompleteSetBody,
  CompleteSetResponse,
  MissSetParams,
  MissSetBody,
  MissSetResponse,
  FinishWorkoutParams,
  FinishWorkoutResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const asNumber = (value: string | number | null | undefined) =>
  value == null ? 0 : Number(value);

const parseIdParam = (value: string | string[] | undefined) =>
  Number(Array.isArray(value) ? value[0] : value);

const normalizeSessionNumbers = <T extends { sessionNumber: number }>(sessions: T[]) =>
  sessions.map((session, index) => ({ ...session, sessionNumber: index + 1 }));

function profileResponse(row: typeof athleteProfilesTable.$inferSelect): ProfileData {
  return {
    id: row.id,
    name: row.name,
    snatchPb: asNumber(row.snatchPb),
    cleanJerkPb: asNumber(row.cleanJerkPb),
    backSquatPb: asNumber(row.backSquatPb),
    frontSquatPb: asNumber(row.frontSquatPb),
    roundingIncrement: asNumber(row.roundingIncrement) as 1 | 2 | 2.5,
    updatedAt: row.updatedAt ? (row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt)) : null,
  };
}

function programmeResponse(row: typeof programmesTable.$inferSelect) {
  const sessions = (row.sessions as ProgrammeSession[]).map((session, sessionIndex) => ({
    id: row.id * 100 + sessionIndex + 1,
    sessionNumber: session.sessionNumber,
    name: session.name,
    exercises: session.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      id: row.id * 10000 + (sessionIndex + 1) * 100 + exerciseIndex + 1,
      order: exerciseIndex + 1,
    })),
  }));
  return {
    id: row.id,
    name: row.name,
    sessionsPerWeek: row.sessionsPerWeek,
    lengthWeeks: row.lengthWeeks,
    sessions,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function programmeSummary(row: typeof programmesTable.$inferSelect) {
  const sessions = row.sessions as ProgrammeSession[];
  return {
    id: row.id,
    name: row.name,
    sessionsPerWeek: row.sessionsPerWeek,
    lengthWeeks: row.lengthWeeks,
    sessionNames: sessions.map((session) => session.name),
    updatedAt: row.updatedAt,
  };
}

function exercisePb(profile: ProfileData, exercise: ProgrammeExercise["exercise"]) {
  const pbs = {
    snatch: profile.snatchPb,
    clean_and_jerk: profile.cleanJerkPb,
    back_squat: profile.backSquatPb,
    front_squat: profile.frontSquatPb,
  };
  return pbs[exercise];
}

function workoutResponse(row: typeof workoutsTable.$inferSelect): WorkoutData {
  return {
    id: row.id,
    programmeId: row.programmeId,
    programmeName: row.programmeName,
    sessionNumber: row.sessionNumber,
    sessionName: row.sessionName,
    status: row.status as WorkoutData["status"],
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    completedSets: row.completedSets,
    missedSets: row.missedSets,
    attempts: row.attempts,
    sets: row.sets as WorkoutSet[],
  };
}

function historyResponse(
  row: typeof workoutsTable.$inferSelect,
  profile: ProfileData | null,
) {
  const sets = row.sets as WorkoutSet[];

  const pbSets: { exercise: string; weight: number }[] = [];
  if (profile) {
    const pbs: Record<string, number> = {
      snatch: profile.snatchPb,
      clean_and_jerk: profile.cleanJerkPb,
      back_squat: profile.backSquatPb,
      front_squat: profile.frontSquatPb,
    };
    for (const s of sets) {
      if (s.status === "completed" && s.weight > 0) {
        const pb = pbs[s.exercise];
        if (pb != null && s.weight >= pb) {
          // Only add unique exercise+weight combos
          const alreadyAdded = pbSets.some(
            (p) => p.exercise === s.exercise && p.weight === s.weight,
          );
          if (!alreadyAdded) {
            pbSets.push({ exercise: s.exercise, weight: s.weight });
          }
        }
      }
    }
  }

  return {
    id: row.id,
    sessionName: row.sessionName,
    programmeName: row.programmeName,
    date: row.completedAt ?? row.startedAt,
    completedSets: row.completedSets,
    totalSets: sets.length,
    missedSets: row.missedSets,
    attempts: row.attempts,
    hasPb: pbSets.length > 0,
    pbSets,
  };
}

async function getProfileRow() {
  const [row] = await db.select().from(athleteProfilesTable).limit(1);
  return row;
}

async function getProgrammeRow(id: number) {
  const [row] = await db.select().from(programmesTable).where(eq(programmesTable.id, id));
  return row;
}

async function getWorkoutRow(id: number) {
  const [row] = await db.select().from(workoutsTable).where(eq(workoutsTable.id, id));
  return row;
}

router.get("/profile", async (_req, res): Promise<void> => {
  const row = await getProfileRow();
  if (!row) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(GetProfileResponse.parse(profileResponse(row)));
});

router.put("/profile", async (req, res): Promise<void> => {
  const parsed = SaveProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await getProfileRow();
  const values = {
    name: parsed.data.name,
    snatchPb: String(parsed.data.snatchPb),
    cleanJerkPb: String(parsed.data.cleanJerkPb),
    backSquatPb: String(parsed.data.backSquatPb),
    frontSquatPb: String(parsed.data.frontSquatPb),
    roundingIncrement: String(parsed.data.roundingIncrement),
  };
  const [row] = existing
    ? await db.update(athleteProfilesTable).set(values).where(eq(athleteProfilesTable.id, existing.id)).returning()
    : await db.insert(athleteProfilesTable).values(values).returning();
  res.json(SaveProfileResponse.parse(profileResponse(row)));
});

router.get("/programmes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(programmesTable).orderBy(desc(programmesTable.updatedAt));
  res.json(GetProgrammesResponse.parse(rows.map(programmeSummary)));
});

router.post("/programmes", async (req, res): Promise<void> => {
  const parsed = CreateProgrammeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(programmesTable).values({
    name: parsed.data.name,
    sessionsPerWeek: parsed.data.sessionsPerWeek,
    lengthWeeks: parsed.data.lengthWeeks,
    sessions: normalizeSessionNumbers(parsed.data.sessions),
  }).returning();
  res.status(201).json(CreateProgrammeResponse.parse(programmeResponse(row)));
});

router.get("/programmes/:programmeId", async (req, res): Promise<void> => {
  const parsed = GetProgrammeParams.safeParse({ programmeId: parseIdParam(req.params.programmeId) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const row = await getProgrammeRow(parsed.data.programmeId);
  if (!row) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }
  res.json(GetProgrammeResponse.parse(programmeResponse(row)));
});

router.put("/programmes/:programmeId", async (req, res): Promise<void> => {
  const params = UpdateProgrammeParams.safeParse({ programmeId: parseIdParam(req.params.programmeId) });
  const body = UpdateProgrammeBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : body.error?.message ?? "Invalid request body" });
    return;
  }
  const [row] = await db.update(programmesTable).set({
    name: body.data.name,
    sessionsPerWeek: body.data.sessionsPerWeek,
    lengthWeeks: body.data.lengthWeeks,
    sessions: normalizeSessionNumbers(body.data.sessions),
    updatedAt: new Date(),
  }).where(eq(programmesTable.id, params.data.programmeId)).returning();
  if (!row) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }
  res.json(UpdateProgrammeResponse.parse(programmeResponse(row)));
});

router.delete("/programmes/:programmeId", async (req, res): Promise<void> => {
  const params = DeleteProgrammeParams.safeParse({ programmeId: parseIdParam(req.params.programmeId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(programmesTable).where(eq(programmesTable.id, params.data.programmeId)).returning();
  if (!row) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/dashboard", async (_req, res): Promise<void> => {
  const [profile, programme, workouts] = await Promise.all([
    getProfileRow(),
    db.select().from(programmesTable).orderBy(desc(programmesTable.updatedAt)).limit(1).then((rows) => rows[0]),
    db.select().from(workoutsTable).orderBy(desc(workoutsTable.startedAt)).limit(3),
  ]);
  const detailedProgramme = programme ? programmeResponse(programme) : null;
  const profileData = profile ? profileResponse(profile) : null;
  const recentWorkouts = workouts.map((w) => historyResponse(w, profileData));
  const weeklyCompletedSets = workouts.reduce((total, workout) => total + workout.completedSets, 0);
  res.json(GetDashboardResponse.parse({
    profile: profile ? profileResponse(profile) : null,
    programme: programme ? programmeSummary(programme) : null,
    nextSession: detailedProgramme?.sessions[0] ?? null,
    recentWorkouts,
    weeklyCompletedSets,
  }));
});

router.get("/history", async (_req, res): Promise<void> => {
  const [rows, profileRow] = await Promise.all([
    db.select().from(workoutsTable).orderBy(desc(workoutsTable.startedAt)),
    getProfileRow(),
  ]);
  const profileData = profileRow ? profileResponse(profileRow) : null;
  res.json(GetHistoryResponse.parse(rows.map((r) => historyResponse(r, profileData))));
});

router.post("/workouts", async (req, res): Promise<void> => {
  const body = StartWorkoutBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [programmeRow, profileRow] = await Promise.all([
    getProgrammeRow(body.data.programmeId),
    getProfileRow(),
  ]);
  if (!programmeRow) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }
  if (!profileRow) {
    res.status(400).json({ error: "Create an athlete profile before starting a workout" });
    return;
  }
  const programme = programmeResponse(programmeRow);
  const session = programme.sessions.find((item) => item.sessionNumber === body.data.sessionNumber);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const profile = profileResponse(profileRow);
  const sets: WorkoutSet[] = session.exercises.flatMap((exercise) =>
    Array.from({ length: exercise.sets }, (_, index) => ({
      id: programmeRow.id * 100000 + session.sessionNumber * 1000 + exercise.order! * 100 + index + 1,
      exercise: exercise.exercise,
      setNumber: index + 1,
      totalSets: exercise.sets,
      reps: exercise.reps,
      percentage: exercise.percentage,
      weight: Math.round((exercisePb(profile, exercise.exercise) * exercise.percentage / 100 / profile.roundingIncrement)) * profile.roundingIncrement,
      status: "pending" as const,
      attemptNumber: 1,
      completedAt: null,
    })),
  );
  const [row] = await db.insert(workoutsTable).values({
    programmeId: programmeRow.id,
    programmeName: programmeRow.name,
    sessionNumber: session.sessionNumber,
    sessionName: session.name,
    status: "in_progress",
    completedSets: 0,
    missedSets: 0,
    attempts: 0,
    sets,
  }).returning();
  res.status(201).json(StartWorkoutResponse.parse(workoutResponse(row)));
});

router.get("/workouts/:workoutId", async (req, res): Promise<void> => {
  const params = GetWorkoutParams.safeParse({ workoutId: parseIdParam(req.params.workoutId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const row = await getWorkoutRow(params.data.workoutId);
  if (!row) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  res.json(GetWorkoutResponse.parse(workoutResponse(row)));
});

router.post("/workouts/:workoutId/sets/:setId/complete", async (req, res): Promise<void> => {
  const params = CompleteSetParams.safeParse({
    workoutId: parseIdParam(req.params.workoutId),
    setId: parseIdParam(req.params.setId),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CompleteSetBody.safeParse(req.body ?? {});
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const row = await getWorkoutRow(params.data.workoutId);
  if (!row) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  const sets = [...(row.sets as WorkoutSet[])];
  const set = sets.find((item) => item.id === params.data.setId);
  if (!set) {
    res.status(404).json({ error: "Set not found" });
    return;
  }
  if (body.data.weight !== undefined) {
    set.weight = body.data.weight;
    const nextSet = sets.find((item) =>
      item.status === "pending" &&
      item.exercise === set.exercise &&
      item.id !== set.id &&
      item.setNumber > set.setNumber,
    );
    if (nextSet) nextSet.weight = body.data.weight;
  }
  if (set.status !== "completed") {
    set.status = "completed";
    set.completedAt = new Date().toISOString();
  }
  const completedSets = sets.filter((item) => item.status === "completed").length;
  const [updated] = await db.update(workoutsTable).set({
    sets,
    completedSets,
    attempts: row.attempts + 1,
    status: completedSets + row.missedSets >= sets.length ? "completed" : "in_progress",
    completedAt: completedSets + row.missedSets >= sets.length ? new Date() : null,
  }).where(eq(workoutsTable.id, row.id)).returning();
  res.json(CompleteSetResponse.parse(workoutResponse(updated)));
});

router.post("/workouts/:workoutId/sets/:setId/miss", async (req, res): Promise<void> => {
  const params = MissSetParams.safeParse({
    workoutId: parseIdParam(req.params.workoutId),
    setId: parseIdParam(req.params.setId),
  });
  const body = MissSetBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : body.error?.message ?? "Invalid request body" });
    return;
  }
  const row = await getWorkoutRow(params.data.workoutId);
  if (!row) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  const sets = [...(row.sets as WorkoutSet[])];
  const set = sets.find((item) => item.id === params.data.setId);
  if (!set) {
    res.status(404).json({ error: "Set not found" });
    return;
  }
  if (body.data.action === "retry") {
    set.attemptNumber += 1;
  } else {
    set.status = "missed";
  }
  const completedSets = sets.filter((item) => item.status === "completed").length;
  const missedSets = sets.filter((item) => item.status === "missed" || item.status === "skipped").length;
  const isComplete = completedSets + missedSets >= sets.length;
  const [updated] = await db.update(workoutsTable).set({
    sets,
    completedSets,
    missedSets,
    attempts: row.attempts + 1,
    status: isComplete ? "completed" : "in_progress",
    completedAt: isComplete ? new Date() : null,
  }).where(eq(workoutsTable.id, row.id)).returning();
  res.json(MissSetResponse.parse(workoutResponse(updated)));
});

router.post("/workouts/:workoutId/finish", async (req, res): Promise<void> => {
  const params = FinishWorkoutParams.safeParse({ workoutId: parseIdParam(req.params.workoutId) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const row = await getWorkoutRow(params.data.workoutId);
  if (!row) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  const [updated] = await db.update(workoutsTable).set({
    status: "completed",
    completedAt: new Date(),
  }).where(eq(workoutsTable.id, row.id)).returning();
  res.json(FinishWorkoutResponse.parse(workoutResponse(updated)));
});

export default router;