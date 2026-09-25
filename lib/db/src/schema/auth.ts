import { integer, index, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  usernameLowerUnique: uniqueIndex("users_username_lower_unique").on(sql`lower(${table.username})`),
  emailLowerUnique: uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
}));

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenHashUnique: uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
  userIndex: index("sessions_user_id_idx").on(table.userId),
  expiryIndex: index("sessions_expires_at_idx").on(table.expiresAt),
}));

export const passwordResetTokensTable = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tokenHashUnique: uniqueIndex("password_reset_tokens_token_hash_unique").on(table.tokenHash),
  userIndex: index("password_reset_tokens_user_id_idx").on(table.userId),
  expiryIndex: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
}));

export const authThrottleTable = pgTable("auth_throttle", {
  scope: text("scope").notNull(),
  keyHash: text("key_hash").notNull(),
  attemptCount: integer("attempt_count").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.scope, table.keyHash] }),
  expiryIndex: index("auth_throttle_expires_at_idx").on(table.expiresAt),
}));

export type UserRow = typeof usersTable.$inferSelect;
export type SessionRow = typeof sessionsTable.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokensTable.$inferSelect;
export type AuthThrottleRow = typeof authThrottleTable.$inferSelect;