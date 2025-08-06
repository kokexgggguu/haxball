import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  totalGoals: integer("total_goals").default(0),
  totalAssists: integer("total_assists").default(0),
  gamesPlayed: integer("games_played").default(0),
  wins: integer("wins").default(0),
  mvpCount: integer("mvp_count").default(0),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  redScore: integer("red_score").default(0),
  blueScore: integer("blue_score").default(0),
  winnerTeam: text("winner_team"), // "red", "blue", or "draw"
  mvpPlayerId: varchar("mvp_player_id"),
  duration: integer("duration"), // in seconds
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerName: text("player_name").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isCommand: boolean("is_command").default(false),
  isSystemMessage: boolean("is_system_message").default(false),
});

export const commands = pgTable("commands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  commandName: text("command_name").notNull(),
  playerName: text("player_name").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  success: boolean("success").default(true),
  parameters: text("parameters"),
});

export const roomStats = pgTable("room_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currentPlayers: integer("current_players").default(0),
  totalPlayersToday: integer("total_players_today").default(0),
  commandsUsedToday: integer("commands_used_today").default(0),
  discordMessagesToday: integer("discord_messages_today").default(0),
  gamesToday: integer("games_today").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const discordActivity = pgTable("discord_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "chat", "game_result", "player_join", "reminder"
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  success: boolean("success").default(true),
});

export const roomSettings = pgTable("room_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminPassword: text("admin_password").notNull().default("1234"),
  discordReminderInterval: integer("discord_reminder_interval").default(180), // seconds
  maxPlayers: integer("max_players").default(16),
  roomName: text("room_name").default("Haxball Room"),
  isPublic: boolean("is_public").default(true),
  lastPasswordChange: timestamp("last_password_change").defaultNow(),
});

// Insert schemas
export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  joinedAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  startedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertCommandSchema = createInsertSchema(commands).omit({
  id: true,
  timestamp: true,
});

export const insertRoomStatsSchema = createInsertSchema(roomStats).omit({
  id: true,
  lastUpdated: true,
});

export const insertDiscordActivitySchema = createInsertSchema(discordActivity).omit({
  id: true,
  timestamp: true,
});

export const insertRoomSettingsSchema = createInsertSchema(roomSettings).omit({
  id: true,
  lastPasswordChange: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;
export type InsertRoomStats = z.infer<typeof insertRoomStatsSchema>;
export type RoomStats = typeof roomStats.$inferSelect;
export type InsertDiscordActivity = z.infer<typeof insertDiscordActivitySchema>;
export type DiscordActivity = typeof discordActivity.$inferSelect;
export type InsertRoomSettings = z.infer<typeof insertRoomSettingsSchema>;
export type RoomSettings = typeof roomSettings.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
