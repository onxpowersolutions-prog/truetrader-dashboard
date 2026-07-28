import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 128 }).notNull().unique(),
  title: text("title").notNull(),
  hostName: text("host_name").notNull(),
  description: text("description").notNull(),
  pinCode: text("pin_code"),
  isLocked: boolean("is_locked").default(false).notNull(),
  maxParticipants: integer("max_participants").default(25).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participants = pgTable("participants", {
  id: varchar("id", { length: 128 }).primaryKey(),
  roomId: varchar("room_id", { length: 128 }).notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("guest"), // 'host' | 'guest'
  avatar: text("avatar"),
  isMuted: boolean("is_muted").default(false).notNull(),
  isVideoOff: boolean("is_video_off").default(false).notNull(),
  isScreenSharing: boolean("is_screen_sharing").default(false).notNull(),
  isOnline: boolean("is_online").default(true).notNull(),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 128 }).notNull(),
  senderId: varchar("sender_id", { length: 128 }).notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull().default("guest"), // 'host' | 'guest'
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // 'text' | 'image' | 'file' | 'system'
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: text("file_size"),
  replyToId: integer("reply_to_id"),
  replyToText: text("reply_to_text"),
  replyToSender: text("reply_to_sender"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"), // 'general' | 'update' | 'alert' | 'voice_note'
  voiceUrl: text("voice_url"),
  voiceDuration: integer("voice_duration"),
  priority: text("priority").notNull().default("normal"), // 'normal' | 'high' | 'urgent'
  isPinned: boolean("is_pinned").default(false).notNull(),
  authorName: text("author_name").notNull().default("Alex (Host)"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  reactions: text("reactions").default("{}").notNull(), // JSON string e.g. {"👍": 4, "❤️": 2}
});

export const webrtcSignals = pgTable("webrtc_signals", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 128 }).notNull(),
  fromPeerId: varchar("from_peer_id", { length: 128 }).notNull(),
  toPeerId: varchar("to_peer_id", { length: 128 }).notNull(),
  type: text("type").notNull(), // 'offer' | 'answer' | 'ice-candidate' | 'peer-join' | 'peer-leave' | 'peer-state'
  payload: text("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type WebRTCSignal = typeof webrtcSignals.$inferSelect;
export type NewWebRTCSignal = typeof webrtcSignals.$inferInsert;
