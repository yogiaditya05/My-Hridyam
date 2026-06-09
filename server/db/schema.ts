import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Users table backing auth flow and personalized memory.
 * Uses PostgreSQL dialect.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  passwordHash: text("passwordHash"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(), // 'user' | 'admin'
  userContext: text("userContext"), // stores a RAG-ready emotional / goals summary
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { mode: "date" }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Chat messages table for storing conversation history.
 * Uses PostgreSQL dialect.
 */
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  isCrisisDetected: boolean("isCrisisDetected").default(false).notNull(),
  emotion: text("emotion"), // stores detected emotion (e.g. sadness, anxiety, neutral)
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));
