import { NextResponse } from "next/server";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId parameter is required" },
        { status: 400 }
      );
    }

    const list = await db
      .select()
      .from(participants)
      .where(eq(participants.roomId, roomId));

    // Sort: host first, then online first
    const sorted = list.sort((a, b) => {
      if (a.role === "host" && b.role !== "host") return -1;
      if (b.role === "host" && a.role !== "host") return 1;
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return 0;
    });

    return NextResponse.json({ success: true, participants: sorted });
  } catch (error: any) {
    console.error("GET /api/participants error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      roomId,
      name = "Guest User",
      role = "guest",
      avatar,
      isMuted = false,
      isVideoOff = false,
      isScreenSharing = false,
    } = body;

    if (!id || !roomId) {
      return NextResponse.json(
        { success: false, error: "id and roomId are required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.id, id), eq(participants.roomId, roomId)));

    let savedParticipant;
    if (existing) {
      const [updated] = await db
        .update(participants)
        .set({
          name,
          role,
          avatar: avatar || existing.avatar,
          isMuted: Boolean(isMuted),
          isVideoOff: Boolean(isVideoOff),
          isScreenSharing: Boolean(isScreenSharing),
          isOnline: true,
          lastSeen: new Date(),
        })
        .where(eq(participants.id, id))
        .returning();
      savedParticipant = updated;
    } else {
      const [created] = await db
        .insert(participants)
        .values({
          id,
          roomId,
          name,
          role,
          avatar:
            avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              name || "User"
            )}`,
          isMuted: Boolean(isMuted),
          isVideoOff: Boolean(isVideoOff),
          isScreenSharing: Boolean(isScreenSharing),
          isOnline: true,
          joinedAt: new Date(),
          lastSeen: new Date(),
        })
        .returning();
      savedParticipant = created;
    }

    eventBus.publish({
      type: "peer-joined",
      roomId,
      fromPeerId: id,
      payload: { participant: savedParticipant },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, participant: savedParticipant });
  } catch (error: any) {
    console.error("POST /api/participants error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register participant" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, roomId, isMuted, isVideoOff, isScreenSharing, name, role } =
      body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    const updates: Partial<typeof participants.$inferInsert> = {
      lastSeen: new Date(),
      isOnline: true,
    };
    if (isMuted !== undefined) updates.isMuted = Boolean(isMuted);
    if (isVideoOff !== undefined) updates.isVideoOff = Boolean(isVideoOff);
    if (isScreenSharing !== undefined)
      updates.isScreenSharing = Boolean(isScreenSharing);
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;

    const [updated] = await db
      .update(participants)
      .set(updates)
      .where(eq(participants.id, id))
      .returning();

    if (updated && roomId) {
      eventBus.publish({
        type: "peer-state-changed",
        roomId,
        fromPeerId: id,
        payload: { participant: updated },
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: true, participant: updated });
  } catch (error: any) {
    console.error("PATCH /api/participants error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update participant state" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const roomId = searchParams.get("roomId");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    // Mark as offline rather than delete so we keep history
    const [updated] = await db
      .update(participants)
      .set({ isOnline: false, lastSeen: new Date() })
      .where(eq(participants.id, id))
      .returning();

    if (roomId) {
      eventBus.publish({
        type: "peer-left",
        roomId,
        fromPeerId: id,
        payload: { peerId: id, participant: updated },
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: true, left: true });
  } catch (error: any) {
    console.error("DELETE /api/participants error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove participant" },
      { status: 500 }
    );
  }
}
