import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import {
  athleteProfilesTable,
  db,
  movementsTable,
  programmesTable,
  usersTable,
  workoutsTable,
  type ProgrammeExercise,
  type ProgrammeSession,
  type WorkoutSet,
} from "@workspace/db";
import { ChangePasswordBody, ConfirmPasswordResetBody, DeleteAccountBody, ExportAccountDataResponse } from "@workspace/api-zod";
import { authThrottleSubject, changePassword, clearSessionCookie, consumeAuthAttempt, createSession, createUser, findUserByLogin, loadAuth, normalizeEmail, normalizeUsername, resetPassword, revokeSession, setSessionCookie, verifyPassword, type AuthThrottleScope } from "../auth";

const router: IRouter = Router();
const usernamePattern = /^[A-Za-z0-9_]{3,20}$/;
const emailSchema = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const THROTTLED_RESPONSE = { error: "Too many attempts. Please try again later." };

function authResponse(user: { id: number; username: string; email: string }, token?: string) {
  return { user: { id: user.id, username: user.username, email: user.email }, ...(token ? { token } : {}) };
}

async function rejectThrottled(
  req: Parameters<typeof authThrottleSubject>[0],
  res: { status: (code: number) => { json: (body: typeof THROTTLED_RESPONSE) => void } },
  scope: AuthThrottleScope,
  identity: string,
) {
  if (await consumeAuthAttempt(scope, authThrottleSubject(req, identity))) return false;
  res.status(429).json(THROTTLED_RESPONSE);
  return true;
}

router.post("/auth/signup", async (req, res): Promise<void> => {
  const username = normalizeUsername(String(req.body?.username ?? ""));
  const email = normalizeEmail(String(req.body?.email ?? ""));
  const password = String(req.body?.password ?? "");
  if (await rejectThrottled(req, res, "signup", `${username}\0${email}`)) return;
  if (!usernamePattern.test(username)) {
    res.status(400).json({ error: "Username must be 3–20 characters using letters, numbers, or underscores." });
    return;
  }
  if (!emailSchema.test(email) || email.length > 254) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (password.length < 8 || password.length > 128) {
    res.status(400).json({ error: "Password must be between 8 and 128 characters." });
    return;
  }
  try {
    const account = await createUser({ username, email, password });
    setSessionCookie(res, account.token);
    res.status(201).json(authResponse(account.user, account.token));
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "That username or email is already in use." });
      return;
    }
    res.status(500).json({ error: "We couldn't create your account. Please try again." });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const login = String(req.body?.login ?? req.body?.email ?? "").trim();
  const password = String(req.body?.password ?? "");
  if (await rejectThrottled(req, res, "login", login)) return;
  if (!login || !password) {
    res.status(400).json({ error: "Enter your username or email and password." });
    return;
  }
  try {
    const user = await findUserByLogin(login);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Those credentials don't match." });
      return;
    }
    const session = await createSession(user);
    setSessionCookie(res, session.token);
    res.json(authResponse(user, session.token));
  } catch {
    res.status(500).json({ error: "We couldn't sign you in. Please try again." });
  }
});

router.get("/auth/me", loadAuth, async (req, res): Promise<void> => {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json(authResponse(req.auth));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  try {
    await revokeSession(req);
    clearSessionCookie(res);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "We couldn't sign you out. Please try again." });
  }
});

router.put("/auth/password", loadAuth, async (req, res): Promise<void> => {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (await rejectThrottled(req, res, "password-change", String(req.auth.id))) return;

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password must be between 8 and 128 characters." });
    return;
  }

  try {
    const session = await changePassword(req.auth, parsed.data.password);
    setSessionCookie(res, session.token);
    res.json(authResponse(req.auth, session.token));
  } catch {
    res.status(500).json({ error: "We couldn't change your password. Please try again." });
  }
});

router.get("/auth/password-reset/config", (_req, res): void => {
  res.json({ enabled: false });
});

router.post("/auth/password-reset/request", async (req, res): Promise<void> => {
  const email = normalizeEmail(String(req.body?.email ?? ""));
  if (await rejectThrottled(req, res, "password-reset-request", email)) return;
  res.status(503).json({ error: "Password recovery is not available yet." });
});

router.post("/auth/password-reset/confirm", async (req, res): Promise<void> => {
  const token = String(req.body?.token ?? "");
  if (await rejectThrottled(req, res, "password-reset-confirm", token)) return;
  const parsed = ConfirmPasswordResetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid reset link and a password between 8 and 128 characters." });
    return;
  }

  const changed = await resetPassword(parsed.data.token, parsed.data.password);
  if (!changed) {
    res.status(400).json({ error: "That reset link is invalid or has expired." });
    return;
  }
  clearSessionCookie(res);
  res.status(204).send();
});

router.get("/account/export", loadAuth, async (req, res): Promise<void> => {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const userId = req.auth.id;
  const [accountRows, profileRows, programmeRows, workoutRows, movementRows] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)),
    db.select().from(athleteProfilesTable).where(eq(athleteProfilesTable.userId, userId)),
    db.select().from(programmesTable).where(eq(programmesTable.userId, userId)).orderBy(asc(programmesTable.createdAt)),
    db.select().from(workoutsTable).where(eq(workoutsTable.userId, userId)).orderBy(asc(workoutsTable.startedAt)),
    db.select().from(movementsTable).where(eq(movementsTable.ownerUserId, userId)).orderBy(asc(movementsTable.createdAt)),
  ]);
  const account = accountRows[0];
  if (!account) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const profile = profileRows[0];
  const response = {
    exportedAt: new Date().toISOString(),
    account: {
      username: account.username,
      email: account.email,
      createdAt: account.createdAt.toISOString(),
    },
    profile: profile ? {
      id: profile.id,
      name: profile.name,
      snatchPb: Number(profile.snatchPb),
      cleanJerkPb: Number(profile.cleanJerkPb),
      backSquatPb: Number(profile.backSquatPb),
      frontSquatPb: Number(profile.frontSquatPb),
      roundingIncrement: Number(profile.roundingIncrement),
      updatedAt: profile.updatedAt.toISOString(),
    } : null,
    programmes: programmeRows.map((programme) => ({
      id: programme.id,
      name: programme.name,
      sessionsPerWeek: programme.sessionsPerWeek,
      lengthWeeks: programme.lengthWeeks,
      sessions: (programme.sessions as ProgrammeSession[]).map((session, sessionIndex) => ({
        ...session,
        id: programme.id * 100 + sessionIndex + 1,
        exercises: session.exercises.map((exercise: ProgrammeExercise, exerciseIndex: number) => ({
          ...exercise,
          movementId: exercise.movementId || exercise.exercise || "snatch",
          exercise: exercise.movementId || exercise.exercise || "snatch",
          id: programme.id * 10000 + (sessionIndex + 1) * 100 + exerciseIndex + 1,
          order: exerciseIndex + 1,
        })),
      })),
      createdAt: programme.createdAt.toISOString(),
      updatedAt: programme.updatedAt.toISOString(),
    })),
    workouts: workoutRows.map((workout) => ({
      id: workout.id,
      programmeId: workout.programmeId,
      programmeName: workout.programmeName,
      sessionNumber: workout.sessionNumber,
      sessionName: workout.sessionName,
      status: workout.status,
      startedAt: workout.startedAt.toISOString(),
      completedAt: workout.completedAt?.toISOString() ?? null,
      completedSets: workout.completedSets,
      missedSets: workout.missedSets,
      attempts: workout.attempts,
      sets: workout.sets as WorkoutSet[],
    })),
    customMovements: movementRows.map((movement) => ({
      id: movement.id,
      name: movement.name,
      category: movement.category,
      description: movement.description,
      isCustom: movement.isCustom,
      userId: String(userId),
    })),
  };

  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Disposition", `attachment; filename="lofte-data-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(ExportAccountDataResponse.parse(response));
});

router.delete("/account", loadAuth, async (req, res): Promise<void> => {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const parsed = DeleteAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter your current password and type DELETE to confirm." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.auth.id));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(403).json({ error: "Your current password is incorrect." });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, req.auth.id));
  clearSessionCookie(res);
  res.status(204).send();
});

export default router;