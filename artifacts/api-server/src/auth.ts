import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Request, RequestHandler } from "express";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { authThrottleTable, db, athleteProfilesTable, passwordResetTokensTable, sessionsTable, usersTable, type UserRow } from "@workspace/db";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "lofte_session";
const SESSION_DAYS = 30;
const PASSWORD_RESET_MINUTES = 30;
const AUTH_THROTTLE_LIMIT = 10;
const AUTH_THROTTLE_WINDOW_MINUTES = 15;
const AUTH_THROTTLE_MAX_ROWS = 50_000;

export type AuthUser = Pick<UserRow, "id" | "username" | "email">;
export type AuthThrottleScope = "login" | "signup" | "password-reset-request" | "password-reset-confirm" | "password-change";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export function normalizeUsername(value: string) {
  return value.trim();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function consumeAuthAttempt(scope: AuthThrottleScope, subject: string) {
  const keyHash = createHash("sha256").update(`${scope}\0${subject}`).digest("hex");
  const result = await db.transaction(async (tx) => {
    await tx.delete(authThrottleTable).where(sql`${authThrottleTable.expiresAt} <= now()`);
    const [row] = await tx.insert(authThrottleTable).values({
      scope,
      keyHash,
      attemptCount: 1,
      expiresAt: sql`now() + (${AUTH_THROTTLE_WINDOW_MINUTES} * interval '1 minute')`,
    }).onConflictDoUpdate({
      target: [authThrottleTable.scope, authThrottleTable.keyHash],
      set: {
        attemptCount: sql`case
          when ${authThrottleTable.expiresAt} <= now() then 1
          else ${authThrottleTable.attemptCount} + 1
        end`,
        expiresAt: sql`case
          when ${authThrottleTable.expiresAt} <= now()
            then now() + (${AUTH_THROTTLE_WINDOW_MINUTES} * interval '1 minute')
          else ${authThrottleTable.expiresAt}
        end`,
      },
    }).returning({ attemptCount: authThrottleTable.attemptCount });
    await tx.execute(sql`
      delete from ${authThrottleTable}
      where (${authThrottleTable.scope}, ${authThrottleTable.keyHash}) in (
        select ${authThrottleTable.scope}, ${authThrottleTable.keyHash}
        from ${authThrottleTable}
        order by ${authThrottleTable.expiresAt} desc
        offset ${AUTH_THROTTLE_MAX_ROWS}
      )
    `);
    return row?.attemptCount ?? AUTH_THROTTLE_LIMIT + 1;
  });
  return result <= AUTH_THROTTLE_LIMIT;
}

export function authThrottleSubject(req: Request, identity: string) {
  return `${req.ip ?? req.socket.remoteAddress ?? "unknown"}\0${identity.trim().toLowerCase()}`;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [, salt, expectedHex] = encoded.split("$");
  if (!salt || !expectedHex) return false;
  const actual = await scrypt(password, salt, 64) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_MINUTES * 60 * 1000);
  await db.transaction(async (tx) => {
    await tx.update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokensTable.userId, userId), isNull(passwordResetTokensTable.usedAt)));
    await tx.insert(passwordResetTokensTable).values({
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    });
  });
  return { token, expiresAt };
}

export async function resetPassword(token: string, password: string) {
  const now = new Date();
  const passwordHash = await hashPassword(password);
  return db.transaction(async (tx) => {
    const [claimed] = await tx.update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(and(
        eq(passwordResetTokensTable.tokenHash, hashToken(token)),
        isNull(passwordResetTokensTable.usedAt),
        gt(passwordResetTokensTable.expiresAt, now),
      ))
      .returning({ userId: passwordResetTokensTable.userId });
    if (!claimed) return false;

    await tx.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, claimed.userId));
    await tx.update(sessionsTable)
      .set({ revokedAt: now })
      .where(and(eq(sessionsTable.userId, claimed.userId), isNull(sessionsTable.revokedAt)));
    await tx.update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokensTable.userId, claimed.userId), isNull(passwordResetTokensTable.usedAt)));
    return true;
  });
}

export async function changePassword(user: AuthUser, password: string) {
  const now = new Date();
  const passwordHash = await hashPassword(password);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.transaction(async (tx) => {
    await tx.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, user.id));
    await tx.update(sessionsTable)
      .set({ revokedAt: now })
      .where(and(eq(sessionsTable.userId, user.id), isNull(sessionsTable.revokedAt)));
    await tx.update(passwordResetTokensTable)
      .set({ usedAt: now })
      .where(and(eq(passwordResetTokensTable.userId, user.id), isNull(passwordResetTokensTable.usedAt)));
    await tx.insert(sessionsTable).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    });
  });

  return { token, expiresAt };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export async function createSession(user: AuthUser) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessionsTable).values({ userId: user.id, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export function setSessionCookie(res: { cookie: Function }, token: string) {
  res.cookie(SESSION_COOKIE, token, cookieOptions());
}

export function clearSessionCookie(res: { clearCookie: Function }) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
}

function requestSessionToken(req: Request): string | undefined {
  const authorization = req.headers.authorization;
  return authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : req.cookies?.[SESSION_COOKIE];
}

export async function getAuthUser(req: Request): Promise<AuthUser | undefined> {
  const token = requestSessionToken(req);
  if (!token) return undefined;
  const [row] = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    email: usersTable.email,
  }).from(sessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, sessionsTable.userId))
    .where(and(eq(sessionsTable.tokenHash, hashToken(token)), isNull(sessionsTable.revokedAt), gt(sessionsTable.expiresAt, new Date())));
  return row;
}

export const loadAuth: RequestHandler = async (req, _res, next) => {
  try {
    req.auth = await getAuthUser(req);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.auth) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

export async function revokeSession(req: Request) {
  const token = requestSessionToken(req);
  if (token) await db.update(sessionsTable).set({ revokedAt: new Date() }).where(eq(sessionsTable.tokenHash, hashToken(token)));
}

export async function createUser(user: { username: string; email: string; password: string }) {
  const passwordHash = await hashPassword(user.password);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const created = await db.transaction(async (tx) => {
    const [userRow] = await tx.insert(usersTable).values({
      username: normalizeUsername(user.username),
      email: normalizeEmail(user.email),
      passwordHash,
    }).returning({ id: usersTable.id, username: usersTable.username, email: usersTable.email });
    await tx.insert(athleteProfilesTable).values({
      userId: userRow.id,
      name: userRow.username,
      snatchPb: "0",
      cleanJerkPb: "0",
      backSquatPb: "0",
      frontSquatPb: "0",
      roundingIncrement: "2.5",
    });
    await tx.insert(sessionsTable).values({
      userId: userRow.id,
      tokenHash: hashToken(token),
      expiresAt,
    });
    return userRow;
  });
  return { user: created, token, expiresAt };
}

export async function findUserByLogin(login: string) {
  const normalized = login.trim().toLowerCase();
  const [user] = await db.select().from(usersTable).where(
    normalized.includes("@")
      ? eq(usersTable.email, normalized)
      : sql`lower(${usersTable.username}) = ${normalized}`,
  );
  return user;
}

export { SESSION_COOKIE };