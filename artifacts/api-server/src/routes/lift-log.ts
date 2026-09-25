import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  athleteProfilesTable,
  movementsTable,
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
  GetMovementsResponse,
  CreateMovementBody,
  CreateMovementResponse,
  GetDashboardResponse,
  GetHistoryResponse,
  StartWorkoutBody,
  StartWorkoutResponse,
  GetWorkoutParams,
  GetWorkoutResponse,
  UpdateWorkoutSetParams,
  UpdateWorkoutSetBody,
  UpdateWorkoutSetResponse,
  CompleteSetParams,
  CompleteSetBody,
  CompleteSetResponse,
  MissSetParams,
  MissSetBody,
  MissSetResponse,
  FinishWorkoutParams,
  FinishWorkoutResponse,
} from "@workspace/api-zod";
import { loadAuth, requireAuth } from "../auth";

const router: IRouter = Router();
router.use(loadAuth, requireAuth);

const asNumber = (value: string | number | null | undefined) =>
  value == null ? 0 : Number(value);

const parseIdParam = (value: string | string[] | undefined) =>
  Number(Array.isArray(value) ? value[0] : value);

const normalizeSessionNumbers = <T extends { sessionNumber: number }>(sessions: T[]) =>
  sessions.map((session, index) => ({ ...session, sessionNumber: index + 1 }));

const STANDARD_MOVEMENTS = [
  { id: "snatch", name: "Snatch", category: "Competition Lifts" },
  { id: "clean_and_jerk", name: "Clean & Jerk", category: "Competition Lifts" },
  { id: "clean", name: "Clean", category: "Competition Lifts" },
  { id: "jerk", name: "Jerk", category: "Competition Lifts" },
  { id: "power_snatch", name: "Power Snatch", category: "Snatch Variations" },
  { id: "hang_snatch", name: "Hang Snatch", category: "Snatch Variations" },
  { id: "high_hang_snatch", name: "High Hang Snatch", category: "Snatch Variations" },
  { id: "block_snatch", name: "Block Snatch", category: "Snatch Variations" },
  { id: "muscle_snatch", name: "Muscle Snatch", category: "Snatch Variations" },
  { id: "snatch_from_blocks", name: "Snatch from Blocks", category: "Snatch Variations" },
  { id: "snatch_pull", name: "Snatch Pull", category: "Snatch Variations" },
  { id: "snatch_high_pull", name: "Snatch High Pull", category: "Snatch Variations" },
  { id: "snatch_balance", name: "Snatch Balance", category: "Snatch Variations" },
  { id: "overhead_squat", name: "Overhead Squat", category: "Snatch Variations" },
  { id: "power_clean", name: "Power Clean", category: "Clean Variations" },
  { id: "hang_clean", name: "Hang Clean", category: "Clean Variations" },
  { id: "high_hang_clean", name: "High Hang Clean", category: "Clean Variations" },
  { id: "block_clean", name: "Block Clean", category: "Clean Variations" },
  { id: "muscle_clean", name: "Muscle Clean", category: "Clean Variations" },
  { id: "clean_from_blocks", name: "Clean from Blocks", category: "Clean Variations" },
  { id: "clean_pull", name: "Clean Pull", category: "Clean Variations" },
  { id: "clean_high_pull", name: "Clean High Pull", category: "Clean Variations" },
  { id: "clean_deadlift", name: "Clean Deadlift", category: "Clean Variations" },
  { id: "power_jerk", name: "Power Jerk", category: "Jerk Variations" },
  { id: "push_jerk", name: "Push Jerk", category: "Jerk Variations" },
  { id: "split_jerk", name: "Split Jerk", category: "Jerk Variations" },
  { id: "hang_jerk", name: "Hang Jerk", category: "Jerk Variations" },
  { id: "jerk_from_blocks", name: "Jerk from Blocks", category: "Jerk Variations" },
  { id: "jerk_balance", name: "Jerk Balance", category: "Jerk Variations" },
  { id: "tall_jerk", name: "Tall Jerk", category: "Jerk Variations" },
  { id: "jerk_dip", name: "Jerk Dip", category: "Jerk Variations" },
  { id: "jerk_drive", name: "Jerk Drive", category: "Jerk Variations" },
  { id: "back_squat", name: "Back Squat", category: "Squats" },
  { id: "front_squat", name: "Front Squat", category: "Squats" },
  { id: "pause_back_squat", name: "Pause Back Squat", category: "Squats" },
  { id: "pause_front_squat", name: "Pause Front Squat", category: "Squats" },
  { id: "tempo_back_squat", name: "Tempo Back Squat", category: "Squats" },
  { id: "tempo_front_squat", name: "Tempo Front Squat", category: "Squats" },
  { id: "romanian_deadlift", name: "Romanian Deadlift", category: "Accessories" },
  { id: "deadlift", name: "Deadlift", category: "Accessories" },
  { id: "good_morning", name: "Good Morning", category: "Accessories" },
  { id: "bulgarian_split_squat", name: "Bulgarian Split Squat", category: "Accessories" },
  { id: "walking_lunge", name: "Walking Lunge", category: "Accessories" },
  { id: "reverse_lunge", name: "Reverse Lunge", category: "Accessories" },
  { id: "step_up", name: "Step-Up", category: "Accessories" },
  { id: "hip_thrust", name: "Hip Thrust", category: "Accessories" },
  { id: "nordic_curl", name: "Nordic Curl", category: "Accessories" },
  { id: "back_extension", name: "Back Extension", category: "Accessories" },
] as const;

function movementIdOf(exercise: ProgrammeExercise) {
  return exercise.movementId || exercise.exercise || "snatch";
}

function normalizeProgrammeSessions(sessions: Array<{
  sessionNumber: number;
  name: string;
  exercises: Array<{
    movementId?: string;
    exercise?: string;
    sets: number;
    reps: number;
    percentage?: number;
    weight?: number;
    equipment?: "kettlebell" | "bands" | "barbell" | "dumbbell";
  }>;
}>) {
  return normalizeSessionNumbers(sessions).map((session) => ({
    ...session,
    exercises: session.exercises.map(({ exercise, movementId, ...rest }) => ({
      ...rest,
      movementId: movementId ?? exercise ?? "snatch",
    })),
  }));
}

function movementResponse(row: typeof movementsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    isCustom: row.isCustom,
    userId: row.isCustom ? String(row.ownerUserId ?? row.ownerProfileId ?? "default-athlete") : null,
  };
}

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
  const sessions = (row.sessions as unknown as ProgrammeSession[]).map((session, sessionIndex) => ({
    id: row.id * 100 + sessionIndex + 1,
    sessionNumber: session.sessionNumber,
    name: session.name,
    exercises: session.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      movementId: movementIdOf(exercise),
      exercise: movementIdOf(exercise),
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
  const sessions = row.sessions as unknown as ProgrammeSession[];
  return {
    id: row.id,
    name: row.name,
    sessionsPerWeek: row.sessionsPerWeek,
    lengthWeeks: row.lengthWeeks,
    sessionNames: sessions.map((session) => session.name),
    updatedAt: row.updatedAt,
  };
}

function exercisePb(
  profile: ProfileData,
  movementId: string,
  movement?: { name: string; category: string },
) {
  const searchableName = `${movementId} ${movement?.name ?? ""}`.toLowerCase();
  const category = movement?.category;

  if (movementId === "snatch" || category === "Snatch Variations") {
    return profile.snatchPb;
  }
  if (
    movementId === "clean_and_jerk" ||
    movementId === "clean" ||
    movementId === "jerk" ||
    category === "Clean Variations" ||
    category === "Jerk Variations"
  ) {
    return profile.cleanJerkPb;
  }
  if (category === "Squats" || movementId === "back_squat" || movementId === "front_squat") {
    return searchableName.includes("front") ? profile.frontSquatPb : profile.backSquatPb;
  }

  return undefined;
}

function calculatedTargetWeight(
  profile: ProfileData,
  movementId: string,
  percentage: number,
  movement?: { name: string; category: string },
) {
  const pb = exercisePb(profile, movementId, movement);
  if (!pb) return 0;
  return Math.round(
    (pb * percentage / 100) / profile.roundingIncrement,
  ) * profile.roundingIncrement;
}

const sameMovement = (left: WorkoutSet, right: WorkoutSet) =>
  (left.movementId ?? left.exercise) === (right.movementId ?? right.exercise);

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
        const pb = pbs[s.movementId ?? s.exercise];
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

async function getProfileRow(userId: number) {
  const [row] = await db.select().from(athleteProfilesTable).where(eq(athleteProfilesTable.userId, userId)).limit(1);
  return row;
}

async function getProgrammeRow(id: number, userId: number) {
  const [row] = await db.select().from(programmesTable).where(and(eq(programmesTable.id, id), eq(programmesTable.userId, userId)));
  return row;
}

async function getWorkoutRow(id: number, userId: number) {
  const [row] = await db.select().from(workoutsTable).where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, userId)));
  return row;
}

router.get("/profile", async (req, res): Promise<void> => {
  const row = await getProfileRow(req.auth!.id);
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
  const existing = await getProfileRow(req.auth!.id);
  const values = {
    name: parsed.data.name,
    snatchPb: String(parsed.data.snatchPb),
    cleanJerkPb: String(parsed.data.cleanJerkPb),
    backSquatPb: String(parsed.data.backSquatPb),
    frontSquatPb: String(parsed.data.frontSquatPb),
    roundingIncrement: String(parsed.data.roundingIncrement),
  };
  const [row] = existing
    ? await db.update(athleteProfilesTable).set(values).where(and(eq(athleteProfilesTable.id, existing.id), eq(athleteProfilesTable.userId, req.auth!.id))).returning()
    : await db.insert(athleteProfilesTable).values({ ...values, userId: req.auth!.id }).returning();
  res.json(SaveProfileResponse.parse(profileResponse(row)));
});

router.get("/programmes", async (req, res): Promise<void> => {
  const rows = await db.select().from(programmesTable).where(eq(programmesTable.userId, req.auth!.id)).orderBy(desc(programmesTable.updatedAt));
  res.json(GetProgrammesResponse.parse(rows.map(programmeSummary)));
});

router.get("/movements", async (req, res): Promise<void> => {
  const profile = await getProfileRow(req.auth!.id);
  const customRows = await db.select().from(movementsTable)
    .where(and(eq(movementsTable.ownerUserId, req.auth!.id), eq(movementsTable.isCustom, true)))
    .orderBy(asc(movementsTable.name));
  const standard = STANDARD_MOVEMENTS.map((movement) => ({
    ...movement,
    description: null,
    isCustom: false,
    userId: null,
  }));
  res.json(GetMovementsResponse.parse([...standard, ...customRows.map(movementResponse)]));
});

router.post("/movements", async (req, res): Promise<void> => {
  const parsed = CreateMovementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = await getProfileRow(req.auth!.id);
  const [row] = await db.insert(movementsTable).values({
    id: `custom-${randomUUID()}`,
    name: parsed.data.name.trim(),
    category: parsed.data.category,
    description: parsed.data.description?.trim() || null,
    isCustom: true,
    ownerProfileId: profile?.id ?? null,
    ownerUserId: req.auth!.id,
  }).returning();
  res.status(201).json(CreateMovementResponse.parse(movementResponse(row)));
});

router.post("/programmes", async (req, res): Promise<void> => {
  const parsed = CreateProgrammeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(programmesTable).values({
    userId: req.auth!.id,
    name: parsed.data.name,
    sessionsPerWeek: parsed.data.sessionsPerWeek,
    lengthWeeks: parsed.data.lengthWeeks,
    sessions: normalizeProgrammeSessions(parsed.data.sessions),
  }).returning();
  res.status(201).json(CreateProgrammeResponse.parse(programmeResponse(row)));
});

router.get("/programmes/:programmeId", async (req, res): Promise<void> => {
  const parsed = GetProgrammeParams.safeParse({ programmeId: parseIdParam(req.params.programmeId) });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const row = await getProgrammeRow(parsed.data.programmeId, req.auth!.id);
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
    sessions: normalizeProgrammeSessions(body.data.sessions),
    updatedAt: new Date(),
  }).where(and(eq(programmesTable.id, params.data.programmeId), eq(programmesTable.userId, req.auth!.id))).returning();
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
  const [row] = await db.delete(programmesTable).where(and(eq(programmesTable.id, params.data.programmeId), eq(programmesTable.userId, req.auth!.id))).returning();
  if (!row) {
    res.status(404).json({ error: "Programme not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const [profile, programme, workouts] = await Promise.all([
    getProfileRow(req.auth!.id),
    db.select().from(programmesTable).where(eq(programmesTable.userId, req.auth!.id)).orderBy(desc(programmesTable.updatedAt)).limit(1).then((rows) => rows[0]),
    db.select().from(workoutsTable).where(eq(workoutsTable.userId, req.auth!.id)).orderBy(desc(workoutsTable.startedAt)).limit(3),
  ]);
  const detailedProgramme = programme ? programmeResponse(programme) : null;
  const latestCompletedWorkout = programme
    ? await db.select()
        .from(workoutsTable)
        .where(and(
          eq(workoutsTable.programmeId, programme.id),
          eq(workoutsTable.status, "completed"),
        ))
        .orderBy(desc(workoutsTable.completedAt), desc(workoutsTable.startedAt))
        .limit(1)
        .then((rows) => rows[0])
    : undefined;
  const completedSessionIndex = detailedProgramme?.sessions.findIndex(
    (session) => session.sessionNumber === latestCompletedWorkout?.sessionNumber,
  ) ?? -1;
  const nextSession = detailedProgramme?.sessions.length
    ? detailedProgramme.sessions[(completedSessionIndex + 1) % detailedProgramme.sessions.length]
    : null;
  const profileData = profile ? profileResponse(profile) : null;
  const recentWorkouts = workouts.map((w) => historyResponse(w, profileData));
  const weeklyCompletedSets = workouts.reduce((total, workout) => total + workout.completedSets, 0);
  res.json(GetDashboardResponse.parse({
    profile: profile ? profileResponse(profile) : null,
    programme: programme ? programmeSummary(programme) : null,
    nextSession,
    recentWorkouts,
    weeklyCompletedSets,
  }));
});

router.get("/history", async (req, res): Promise<void> => {
  const [rows, profileRow] = await Promise.all([
    db.select().from(workoutsTable).where(eq(workoutsTable.userId, req.auth!.id)).orderBy(desc(workoutsTable.startedAt)),
    getProfileRow(req.auth!.id),
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
  const [programmeRow, profileRow, customMovementRows] = await Promise.all([
    getProgrammeRow(body.data.programmeId, req.auth!.id),
    getProfileRow(req.auth!.id),
    db.select().from(movementsTable).where(eq(movementsTable.ownerUserId, req.auth!.id)),
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
  const movementsById = new Map(
    [...STANDARD_MOVEMENTS, ...customMovementRows].map((movement) => [
      movement.id,
      { name: movement.name, category: movement.category },
    ]),
  );
  const sets: WorkoutSet[] = session.exercises.flatMap((exercise) =>
    Array.from({ length: exercise.sets }, (_, index) => {
      const movementId = movementIdOf(exercise);
      const targetWeight = exercise.weight ?? calculatedTargetWeight(
        profile,
        movementId,
        exercise.percentage ?? 0,
        movementsById.get(movementId),
      );

      return {
        id: programmeRow.id * 100000 + session.sessionNumber * 1000 + exercise.order! * 100 + index + 1,
        movementId,
        exercise: movementId,
        setNumber: index + 1,
        totalSets: exercise.sets,
        reps: exercise.reps,
        percentage: exercise.percentage,
        weight: targetWeight,
        equipment: exercise.equipment,
        status: "pending" as const,
        attemptNumber: 1,
        completedAt: null,
      };
    }),
  );
  const [row] = await db.insert(workoutsTable).values({
    userId: req.auth!.id,
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
  let row = await getWorkoutRow(params.data.workoutId, req.auth!.id);
  if (!row) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }

  const pendingSets = row.sets as WorkoutSet[];
  const needsTargetRepair = pendingSets.some((set) =>
    set.status === "pending" &&
    set.percentage != null &&
    set.percentage > 0 &&
    set.weight === 0,
  );
  if (needsTargetRepair) {
    const [profileRow, customMovementRows] = await Promise.all([
      getProfileRow(req.auth!.id),
      db.select().from(movementsTable).where(eq(movementsTable.ownerUserId, req.auth!.id)),
    ]);
    if (profileRow) {
      const profile = profileResponse(profileRow);
      const movementsById = new Map(
        [...STANDARD_MOVEMENTS, ...customMovementRows].map((movement) => [
          movement.id,
          { name: movement.name, category: movement.category },
        ]),
      );
      let repaired = false;
      const sets = pendingSets.map((set) => {
        if (
          set.status !== "pending" ||
          set.percentage == null ||
          set.percentage <= 0 ||
          set.weight !== 0
        ) {
          return set;
        }
        const movementId = set.movementId ?? set.exercise;
        const weight = calculatedTargetWeight(
          profile,
          movementId,
          set.percentage,
          movementsById.get(movementId),
        );
        if (weight <= 0) return set;
        repaired = true;
        return { ...set, weight };
      });
      if (repaired) {
        const [updated] = await db.update(workoutsTable)
          .set({ sets })
          .where(eq(workoutsTable.id, row.id))
          .returning();
        row = updated;
      }
    }
  }

  res.json(GetWorkoutResponse.parse(workoutResponse(row)));
});

router.patch("/workouts/:workoutId/sets/:setId", async (req, res): Promise<void> => {
  const params = UpdateWorkoutSetParams.safeParse({
    workoutId: parseIdParam(req.params.workoutId),
    setId: parseIdParam(req.params.setId),
  });
  const body = UpdateWorkoutSetBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : body.error?.message ?? "Invalid request body" });
    return;
  }
  const row = await getWorkoutRow(params.data.workoutId, req.auth!.id);
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

  set.weight = body.data.weight;
  if (body.data.equipment !== undefined) {
    set.equipment = body.data.equipment;
  }
  for (const pendingSet of sets) {
    if (
      pendingSet.status === "pending" &&
      pendingSet.id !== set.id &&
      pendingSet.setNumber > set.setNumber &&
      sameMovement(pendingSet, set)
    ) {
      pendingSet.weight = body.data.weight;
      if (body.data.equipment !== undefined) {
        pendingSet.equipment = body.data.equipment;
      }
    }
  }

  const [updated] = await db.update(workoutsTable).set({ sets }).where(eq(workoutsTable.id, row.id)).returning();
  res.json(UpdateWorkoutSetResponse.parse(workoutResponse(updated)));
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
  const row = await getWorkoutRow(params.data.workoutId, req.auth!.id);
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
      sameMovement(item, set) &&
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
  const row = await getWorkoutRow(params.data.workoutId, req.auth!.id);
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
  const row = await getWorkoutRow(params.data.workoutId, req.auth!.id);
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