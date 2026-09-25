import { boolean, index, jsonb, numeric, pgTable, serial, text, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const athleteProfilesTable = pgTable("athlete_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  snatchPb: numeric("snatch_pb", { precision: 7, scale: 2 }).notNull(),
  cleanJerkPb: numeric("clean_jerk_pb", { precision: 7, scale: 2 }).notNull(),
  backSquatPb: numeric("back_squat_pb", { precision: 7, scale: 2 }).notNull(),
  frontSquatPb: numeric("front_squat_pb", { precision: 7, scale: 2 }).notNull(),
  roundingIncrement: numeric("rounding_increment", { precision: 3, scale: 1 }).notNull().default("1"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({ userIndex: uniqueIndex("athlete_profiles_user_id_unique").on(table.userId) }));

export const programmesTable = pgTable("programmes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sessionsPerWeek: integer("sessions_per_week").notNull(),
  lengthWeeks: integer("length_weeks").notNull().default(4),
  sessions: jsonb("sessions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => ({ userIndex: index("programmes_user_id_idx").on(table.userId) }));

export const workoutsTable = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  programmeId: integer("programme_id").notNull(),
  programmeName: text("programme_name").notNull(),
  sessionNumber: integer("session_number").notNull(),
  sessionName: text("session_name").notNull(),
  status: text("status").notNull().default("in_progress"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  completedSets: integer("completed_sets").notNull().default(0),
  missedSets: integer("missed_sets").notNull().default(0),
  attempts: integer("attempts").notNull().default(0),
  sets: jsonb("sets").notNull(),
}, (table) => ({ userIndex: index("workouts_user_id_idx").on(table.userId) }));

export const movementsTable = pgTable("movements", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  isCustom: boolean("is_custom").notNull().default(false),
  ownerProfileId: integer("owner_profile_id"),
  ownerUserId: integer("owner_user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ ownerUserIndex: index("movements_owner_user_id_idx").on(table.ownerUserId) }));

export const insertAthleteProfileSchema = createInsertSchema(athleteProfilesTable).omit({ id: true });
export const insertProgrammeSchema = createInsertSchema(programmesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorkoutSchema = createInsertSchema(workoutsTable).omit({ id: true });

export type AthleteProfileRow = typeof athleteProfilesTable.$inferSelect;
export type ProgrammeRow = typeof programmesTable.$inferSelect;
export type WorkoutRow = typeof workoutsTable.$inferSelect;
export type ExerciseName = string;
export type AccessoryEquipment = "kettlebell" | "bands" | "barbell" | "dumbbell";

export type ProgrammeExercise = {
  id?: number;
  order?: number;
  movementId: string;
  exercise?: ExerciseName;
  sets: number;
  reps: number;
  percentage?: number;
  weight?: number;
  equipment?: AccessoryEquipment;
};

export type ProgrammeSession = {
  id?: number;
  sessionNumber: number;
  name: string;
  exercises: ProgrammeExercise[];
};

export type WorkoutSet = {
  id: number;
  exercise: ExerciseName;
  movementId?: string;
  setNumber: number;
  totalSets: number;
  reps: number;
  percentage?: number;
  weight: number;
  equipment?: AccessoryEquipment;
  status: "pending" | "completed" | "missed" | "skipped";
  attemptNumber: number;
  completedAt: string | null;
};

export type ProgrammeData = {
  name: string;
  sessionsPerWeek: number;
  sessions: ProgrammeSession[];
};

export type ProfileData = {
  id: number;
  name: string;
  snatchPb: number;
  cleanJerkPb: number;
  backSquatPb: number;
  frontSquatPb: number;
  roundingIncrement: 1 | 2 | 2.5;
  updatedAt: string | null;
};

export type WorkoutData = {
  id: number;
  programmeId: number;
  programmeName: string;
  sessionNumber: number;
  sessionName: string;
  status: "in_progress" | "completed";
  startedAt: string;
  completedAt: string | null;
  completedSets: number;
  missedSets: number;
  attempts: number;
  sets: WorkoutSet[];
};

export const exerciseNameSchema = z.string().min(1);