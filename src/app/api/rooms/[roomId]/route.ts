import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, participants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.roomId, roomId));

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    const activeParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.roomId, roomId));

    return NextResponse.json({
      success: true,
      room: {
        ...room,
        activeCount: activeParticipants.filter((p) => p.isOnline).length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/rooms/[roomId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get room" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { title, description, isLocked, pinCode, maxParticipants } = body;

    const updates: Partial<typeof rooms.$inferInsert> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (isLocked !== undefined) updates.isLocked = Boolean(isLocked);
    if (pinCode !== undefined) updates.pinCode = pinCode;
    if (maxParticipants !== undefined)
      updates.maxParticipants = Number(maxParticipants);

    const [updated] = await db
      .update(rooms)
      .set(updates)
      .where(eq(rooms.roomId, roomId))
      .returning();

    eventBus.publish({
      type: "room-updated",
      roomId,
      payload: { action: "update", room: updated },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, room: updated });
  } catch (error: any) {
    console.error("PATCH /api/rooms/[roomId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    await db.delete(rooms).where(eq(rooms.roomId, roomId));
    await db.delete(participants).where(eq(participants.roomId, roomId));

    eventBus.publish({
      type: "room-updated",
      roomId,
      payload: { action: "delete", roomId },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error("DELETE /api/rooms/[roomId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
