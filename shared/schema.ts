import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: text("host_id").notNull(),
  status: text("status").notNull(), // 'waiting', 'countdown', 'playing', 'finished'
  currentRound: integer("current_round").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  name: text("name").notNull(),
  socketId: text("socket_id").notNull(),
  cards: text("cards").array(), // JSON array of card types
  currentCardIndex: integer("current_card_index").default(0),
  isReady: boolean("is_ready").default(false),
  isHost: boolean("is_host").default(false),
  cardsCompleted: integer("cards_completed").default(0),
});

export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => rooms.id),
  countdownStarted: boolean("countdown_started").default(false),
  countdownEnd: timestamp("countdown_end"),
  allPlayersSwipedLeft: boolean("all_players_swiped_left").default(false),
  winnerId: integer("winner_id").references(() => players.id),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const insertGameStateSchema = createInsertSchema(gameState).omit({
  id: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type GameState = typeof gameState.$inferSelect;

export const CARD_TYPES = [
  { id: 'high-five', name: 'High Five', emoji: '🙏', description: 'Find someone else with a "High Five" card and give them a high five!' },
  { id: 'dab-me', name: 'Dab Me', emoji: '💃', description: 'Find someone with a "Dab Me" card and do a synchronized dab!' },
  { id: 'swap-places', name: 'Swap Places', emoji: '🔄', description: 'Find your match and physically swap places with them!' },
  { id: 'kick-it', name: 'Kick It', emoji: '🦵', description: 'Find your match and do a synchronized leg kick!' },
  { id: 'awkward-turtle', name: 'Awkward Turtle', emoji: '🐢', description: 'Find your match and make the awkward turtle gesture together!' },
] as const;

export type CardType = typeof CARD_TYPES[number];
