"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Server,
  Layers,
  Database,
  Cpu,
  Code2,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Radio,
  Video,
  MessageSquare,
  Network,
} from "lucide-react";

export function ArchitectureDocs() {
  const [activeSection, setActiveSection] = useState<
    "architecture" | "guide" | "schema" | "webrtc"
  >("architecture");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSection(id);
      setTimeout(() => setCopiedSection(null), 2500);
    }
  };

  const schemaCode = `// Database Schema definition (src/db/schema.ts)
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
});`;

  const sseCode = `// Real-time Server-Sent Events (SSE) stream (src/app/api/webrtc/stream/route.ts)
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const payload = \`data: \${JSON.stringify(data)}\\n\\n\`;
        controller.enqueue(new TextEncoder().encode(payload));
      };

      // Subscribe to persistent in-memory/DB EventBus
      const unsubscribe = eventBus.subscribe(clientId, (event) => {
        sendEvent(event);
      });

      request.signal.addEventListener("abort", () => unsubscribe());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}`;

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
              <BookOpen className="h-3.5 w-3.5" /> SENIOR SOFTWARE ENGINEER ARCHITECTURE DOCS
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              ConnectHub System Architecture & Guide
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Complete technical documentation, WebRTC peer signaling diagrams, database
              ERD, and step-by-step implementation guide for both frontend and backend.
            </p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveSection("architecture")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeSection === "architecture"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Network className="h-4 w-4" /> Full-Stack Architecture
          </button>
          <button
            onClick={() => setActiveSection("guide")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeSection === "guide"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" /> Step-by-Step Guide
          </button>
          <button
            onClick={() => setActiveSection("schema")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeSection === "schema"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Database className="h-4 w-4" /> Database Schema & ERD
          </button>
          <button
            onClick={() => setActiveSection("webrtc")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeSection === "webrtc"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Video className="h-4 w-4" /> WebRTC Signaling Flow
          </button>
        </div>
      </div>

      {/* SECTION 1: ARCHITECTURE DIAGRAM */}
      {activeSection === "architecture" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-400" />
              1. True Trader Dashboard — End-to-End System Architecture
            </h2>
            <p className="text-sm text-slate-300">
              The True Trader Dashboard is designed as a hybrid **Next.js App Router (15+)** application
              combining high-fps client-side WebRTC media capture with an integrated
              serverless **Server-Sent Events (SSE)** real-time messaging bus and
              **PostgreSQL** persistence via **Drizzle ORM**.
            </p>

            {/* Visual ASCII / SVG architecture layout */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto">
              <pre className="leading-relaxed whitespace-pre">
                {`+-----------------------------------------------------------------------+
|                    CLIENT BROWSER (React / Next.js)                   |
|  +---------------------+  +--------------------+  +----------------+  |
|  | WebRTC Video & Mic  |  | WhatsApp Chat UI   |  | Announcements  |  |
|  |  (getUserMedia /    |  |  (Instant Message  |  |  (Voice Notes  |  |
|  |   getDisplayMedia)  |  |   + Emojis + Quote)|  |  & MediaRecord)|  |
|  +----------+----------+  +---------+----------+  +--------+-------+  |
+-------------|-----------------------|----------------------|----------+
              | (RTCPeerConnection    | (POST /api/messages) | (POST)
              |  P2P Media Stream)    |                      |
              v                       v                      v
+-----------------------------------------------------------------------+
|                 NEXT.JS APP ROUTER & API ENDPOINTS                   |
|  +-----------------------------------------------------------------+  |
|  |  SSE Realtime Event Bus (/api/webrtc/stream)                    |  |
|  |  - Dispatches: peer-joined, peer-state-changed, new-message,    |  |
|  |    new-announcement, and WebRTC SDP offers/answers < 5ms        |  |
|  +--------------------------------+--------------------------------+  |
+-----------------------------------|-----------------------------------+
                                    | (Drizzle ORM Queries)
                                    v
+-----------------------------------------------------------------------+
|                   POSTGRESQL DATABASE (Drizzle ORM)                   |
|  +-----------+  +--------------+  +----------+  +------------------+  |
|  |   rooms   |  | participants |  | messages |  |  announcements   |  |
|  +-----------+  +--------------+  +----------+  +------------------+  |
+-----------------------------------------------------------------------+`}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 text-xs">
                    1
                  </span>
                  <span>Frontend Layer</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  React 19 + Next.js App Router with Tailwind CSS and Lucide icons.
                  Responsive glassmorphic UI with dynamic grid/spotlight video layouts and
                  real-time WebRTC device access.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 text-xs">
                    2
                  </span>
                  <span>Realtime Signaling</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Server-Sent Events (SSE) replace third-party WebSocket plugins.
                  Provides persistent HTTP/2 channels that push updates for presence, chat,
                  and WebRTC SDP negotiations.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-xs">
                    3
                  </span>
                  <span>Data Layer</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  PostgreSQL managed via Drizzle ORM. Stores meeting rooms, active
                  participant sessions, chat messages with quote replies, and host
                  announcements with audio voice notes.
                </p>
              </div>
            </div>

            {/* Security Shield Policy Documentation */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-950 p-6">
              <div className="flex items-center gap-2 font-bold text-white mb-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span>Security & Confidentiality Shield Policy (Webinar Privacy Mode)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                To guarantee complete privacy and prevent unauthorized user discovery:
                <br />
                • <strong>Client Privacy:</strong> All client/guest participants are invisible to each other in the participant list, video conference grid, and chat panel. Clients only see the Admin/Host and themselves.
                <br />
                • <strong>Online Count Protection:</strong> Total online participant counts are hidden from guest clients.
                <br />
                • <strong>Admin Oversight:</strong> Only the Admin/Host (<code>isHost === true</code>) can watch how many clients are online, view all client video/audio streams, and read private messages.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STEP-BY-STEP IMPLEMENTATION GUIDE */}
      {activeSection === "guide" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              2. True Trader — Step-by-Step Implementation Guide
            </h2>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">
                    Step 1: Database Schema & Drizzle Setup
                  </h3>
                  <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    Backend
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Define tables in <code>src/db/schema.ts</code> for <code>rooms</code>,{" "}
                  <code>participants</code>, <code>messages</code>,{" "}
                  <code>announcements</code>, and <code>webrtc_signals</code>. Use{" "}
                  <code>drizzle-kit push</code> to create tables in PostgreSQL without
                  manual migration files.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">
                    Step 2: Realtime SSE Event Bus
                  </h3>
                  <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                    Realtime / SSE
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Implement an event dispatcher in <code>src/lib/event-bus.ts</code> and
                  expose an SSE stream handler at <code>/api/webrtc/stream</code>. When a
                  user joins or sends a message, <code>eventBus.publish()</code> dispatches
                  the event to all connected listeners instantly.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">
                    Step 3: Google Meet-Like Video & Screen Share
                  </h3>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    WebRTC Media
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Use <code>navigator.mediaDevices.getUserMedia</code> for camera and
                  microphone tracks, and <code>getDisplayMedia</code> for high-fps screen
                  sharing. Implement a Virtual Camera fallback for users without webcam
                  permissions so the multi-peer layout is always functional.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">
                    Step 4: WhatsApp Group Chat with File Preview
                  </h3>
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                    Messaging
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Build instant text messaging in <code>src/components/WhatsAppChat.tsx</code>{" "}
                  with emoji reaction bar, reply quote support (<code>replyToId</code>), and
                  FileReader base64 conversion for image and file attachments up to 5 MB.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-base">
                    Step 5: Host Announcements & Audio Voice Notes
                  </h3>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    Host Admin
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  In <code>src/components/AnnouncementsTab.tsx</code>, add role checking (
                  <code>isHostMode</code>) to allow broadcasting updates. Integrate{" "}
                  <code>MediaRecorder</code> to record live audio voice notes from the
                  user&apos;s microphone and broadcast them with a custom audio waveform
                  player.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: DATABASE SCHEMA & ERD */}
      {activeSection === "schema" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-400" />
              3. Database Schema & ERD Reference
            </h2>
            <p className="text-sm text-slate-300">
              Below is the TypeScript Drizzle ORM schema defining table structures and
              relationships in PostgreSQL.
            </p>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <button
                onClick={() => copyToClipboard(schemaCode, "schema")}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
              >
                {copiedSection === "schema" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Code
                  </>
                )}
              </button>
              <pre className="overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed">
                {schemaCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: WEBRTC SIGNALING FLOW */}
      {activeSection === "webrtc" && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-400" />
              4. WebRTC Signaling Sequence Diagram
            </h2>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 font-mono text-xs sm:text-sm text-slate-300 overflow-x-auto">
              <pre className="leading-relaxed whitespace-pre">
                {`Peer A (Guest)                  Next.js SSE & DB                  Peer B (Host)
     |                                 |                                 |
     |--- 1. POST /api/participants -->|                                 |
     |    (Joined Room "main")         |-- 2. SSE event: peer-joined --->|
     |                                 |                                 |
     |--- 3. Create WebRTC Offer ----->|                                 |
     |    (POST /api/webrtc/signal)    |-- 4. SSE event: webrtc-offer -->|
     |                                 |                                 |
     |                                 |<-- 5. Create WebRTC Answer -----|
     |<-- 6. SSE event: webrtc-answer -|    (POST /api/webrtc/signal)    |
     |                                 |                                 |
     |=== 7. Direct P2P Audio / Video Stream Established (VP8 / Opus) ===|
     |                                                                   |
     |--- 8. getDisplayMedia (Screen Share Track Replaces Video) ------->|
     |=== 9. Spotlight Presenter View Rendered in Remote Dashboard ======|`}
              </pre>
            </div>

            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                SSE Stream Server Implementation snippet
              </div>
              <button
                onClick={() => copyToClipboard(sseCode, "sse")}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
              >
                {copiedSection === "sse" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy Code
                  </>
                )}
              </button>
              <pre className="overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed">
                {sseCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
