import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(0),
  gamecoins: integer("gamecoins").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const collectibleSchema = z.object({
  type: z.enum(["credit", "gamecoin"]),
  amount: z.number(),
  latitude: z.number(),
  longitude: z.number(),
});

export type Collectible = z.infer<typeof collectibleSchema>;
