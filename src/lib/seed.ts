import { db } from "@/db";
import { rooms, participants, messages, announcements } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function ensureInitialSeed() {
  try {
    const existingRoom = await db
      .select()
      .from(rooms)
      .where(eq(rooms.roomId, "truetrader-main"))
      .limit(1);

    if (existingRoom.length === 0) {
      console.log("Seeding True Trader initial demo data...");

      await db.insert(rooms).values([
        {
          roomId: "truetrader-main",
          title: "True Trader — Live Main Lounge",
          hostName: "True Trader (Admin Host)",
          description:
            "Open office hours & live video Q&A with True Trader. Connect via camera, mic, or screen share to discuss markets, trading strategies, and live analysis.",
          isLocked: false,
          maxParticipants: 100,
          pinCode: "",
        },
        {
          roomId: "truetrader-markets",
          title: "Live Market Analysis & Strategy Room",
          hostName: "True Trader (Admin Host)",
          description:
            "Dedicated room for live chart reviews, trade setups, market structure analysis, and real-time commentary from True Trader.",
          isLocked: false,
          maxParticipants: 50,
          pinCode: "",
        },
        {
          roomId: "truetrader-vip",
          title: "VIP Private Mentorship Session",
          hostName: "True Trader (Admin Host)",
          description:
            "Exclusive one-on-one and small-group mentorship sessions with True Trader. PIN required — for verified members only.",
          isLocked: true,
          maxParticipants: 10,
          pinCode: "1234",
        },
      ]);

      await db.insert(announcements).values([
        {
          title: "🚀 Welcome to the True Trader Communication Dashboard!",
          content:
            "Welcome to the official True Trader Interactive Dashboard! This is your hub for:\n\n• **Live Video & Audio Sessions** — Join the call room to connect face-to-face with True Trader.\n• **WhatsApp-style Chat** — Send real-time messages, emojis, and file attachments directly to the host.\n• **Announcement Channel** — Receive priority broadcasts, market alerts, and voice notes from True Trader.\n\nSwitch to **Admin (Host)** mode in the top navigation to test host privileges. All clients are hidden from each other — only True Trader can see who is online.",
          category: "update",
          priority: "urgent",
          isPinned: true,
          authorName: "True Trader (Admin Host)",
          reactions: JSON.stringify({ "🚀": 24, "❤️": 18, "🔥": 31, "👏": 16 }),
        },
        {
          title: "🎙️ Voice Briefing: Today's Market Outlook & Key Levels",
          content:
            "Listen to True Trader's daily voice briefing covering key support and resistance levels, today's high-probability trade setups, and risk management guidelines for the current market session.",
          category: "voice_note",
          priority: "high",
          isPinned: true,
          authorName: "True Trader (Admin Host)",
          voiceUrl:
            "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
          voiceDuration: 58,
          reactions: JSON.stringify({ "🎧": 22, "💡": 17, "📈": 29 }),
        },
        {
          title: "⚡ ALERT: High-Impact News Event — Adjust Risk Accordingly",
          content:
            "Heads up traders! A high-impact economic news event is scheduled for today. True Trader recommends reducing position sizes or sitting out during the immediate release window. Stay disciplined and protect your capital.",
          category: "alert",
          priority: "urgent",
          isPinned: false,
          authorName: "True Trader (Admin Host)",
          reactions: JSON.stringify({ "⚠️": 14, "👍": 19, "💯": 11 }),
        },
        {
          title: "📅 Next Live Session: Forex & Crypto Deep Dive",
          content:
            "Join True Trader live this weekend for an in-depth session covering Forex major pairs and top crypto setups. We will be reviewing weekly charts, identifying institutional order blocks, and planning our trade entries for next week.",
          category: "general",
          priority: "normal",
          isPinned: false,
          authorName: "True Trader (Admin Host)",
          reactions: JSON.stringify({ "📅": 12, "🙌": 21, "🔥": 9 }),
        },
      ]);

      await db.insert(messages).values([
        {
          roomId: "truetrader-main",
          senderId: "host-truetrader-01",
          senderName: "True Trader (Host)",
          senderRole: "host",
          content:
            "Welcome to the True Trader Live Room! 👋 I'm live and ready to connect. Feel free to turn on your camera/mic or drop a message below. Let's go! 📈",
          type: "text",
        },
        {
          roomId: "truetrader-main",
          senderId: "guest-trader-02",
          senderName: "James K. (Trader)",
          senderRole: "guest",
          content:
            "Hey True Trader! Thanks for setting this up. Really loving the dashboard 🔥 Quick question — are we reviewing the GBPUSD setup today?",
          type: "text",
          replyToId: 1,
          replyToText: "Welcome to the True Trader Live Room!",
          replyToSender: "True Trader (Host)",
        },
        {
          roomId: "truetrader-main",
          senderId: "host-truetrader-01",
          senderName: "True Trader (Host)",
          senderRole: "host",
          content:
            "Yes! GBPUSD is on the watchlist for today. I will be sharing my screen shortly to walk through the setup. Watch out for the announcement channel for a voice note briefing first! 🎙️",
          type: "text",
        },
        {
          roomId: "truetrader-main",
          senderId: "host-truetrader-01",
          senderName: "True Trader (Host)",
          senderRole: "host",
          content:
            "Here is the current GBPUSD daily chart I was referencing:",
          type: "file",
          fileUrl:
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&auto=format&fit=crop&q=80",
          fileName: "GBPUSD_Daily_Setup_Analysis.png",
          fileSize: "1.2 MB",
        },
      ]);

      await db.insert(participants).values([
        {
          id: "host-truetrader-01",
          roomId: "truetrader-main",
          name: "True Trader (Host)",
          role: "host",
          avatar:
            "/images/truetrader-logo.png",
          isMuted: false,
          isVideoOff: false,
          isScreenSharing: false,
          isOnline: true,
        },
        {
          id: "guest-trader-02",
          roomId: "truetrader-main",
          name: "James K. (Trader)",
          role: "guest",
          avatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          isMuted: true,
          isVideoOff: false,
          isScreenSharing: false,
          isOnline: true,
        },
      ]);

      console.log("True Trader initial seed completed!");
    }
  } catch (error) {
    console.error("Error during True Trader seed:", error);
  }
}
