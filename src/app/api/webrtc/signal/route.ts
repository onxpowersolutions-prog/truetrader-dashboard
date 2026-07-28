import { NextResponse } from "next/server";
import { db } from "@/db";
import { webrtcSignals } from "@/db/schema";
import { eventBus } from "@/lib/event-bus";
import { desc, eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      fromPeerId,
      toPeerId,
      type, // 'webrtc-offer' | 'webrtc-answer' | 'webrtc-ice-candidate'
      payload,
    } = body;

    if (!roomId || !fromPeerId || !type || !payload) {
      return NextResponse.json(
        {
          success: false,
          error: "roomId, fromPeerId, type, and payload are required",
        },
        { status: 400 }
      );
    }

    // Persist signal to DB for resilience
    const [saved] = await db
      .insert(webrtcSignals)
      .values({
        roomId,
        fromPeerId,
        toPeerId: toPeerId || "ALL",
        type,
        payload:
          typeof payload === "string" ? payload : JSON.stringify(payload),
      })
      .returning();

    // Broadcast via EventBus to the target peer (or room)
    eventBus.publish({
      type: type as any,
      roomId,
      fromPeerId,
      toPeerId: toPeerId || undefined,
      payload:
        typeof payload === "string" ? JSON.parse(payload) : payload,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, signal: saved });
  } catch (error: any) {
    console.error("POST /api/webrtc/signal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process WebRTC signal" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const peerId = searchParams.get("peerId");

    if (!roomId || !peerId) {
      return NextResponse.json(
        { success: false, error: "roomId and peerId are required" },
        { status: 400 }
      );
    }

    // Fetch recent signals addressed to this peer
    const signals = await db
      .select()
      .from(webrtcSignals)
      .where(
        and(
          eq(webrtcSignals.roomId, roomId),
          eq(webrtcSignals.toPeerId, peerId)
        )
      )
      .orderBy(desc(webrtcSignals.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      signals: signals.map((s) => ({
        ...s,
        payload: (() => {
          try {
            return JSON.parse(s.payload);
          } catch (e) {
            return s.payload;
          }
        })(),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/webrtc/signal error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get WebRTC signals" },
      { status: 500 }
    );
  }
}
