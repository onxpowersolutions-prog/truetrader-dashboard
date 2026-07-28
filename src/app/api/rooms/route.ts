import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms, participants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureInitialSeed } from "@/lib/seed";
import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureInitialSeed();

    const allRooms = await db
      .select()
      .from(rooms)
      .orderBy(desc(rooms.createdAt));

    // Get active participant count for each room
    const roomsWithCount = await Promise.all(
      allRooms.map(async (room) => {
        const activeParticipants = await db
          .select()
          .from(participants)
          .where(eq(participants.roomId, room.roomId));
        return {
          ...room,
          activeCount: activeParticipants.filter((p) => p.isOnline).length,
          totalParticipants: activeParticipants.length,
        };
      })
    );

    return NextResponse.json({ success: true, rooms: roomsWithCount });
  } catch (error: any) {
    console.error("GET /api/rooms error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      hostName = "Alex Rivera (Host)",
      description = "Live Interactive Meeting Room",
      pinCode = "",
      isLocked = false,
      maxParticipants = 50,
      customRoomId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Room title is required" },
        { status: 400 }
      );
    }

    // Generate readable roomId slug from title if not custom
    let roomId =
      customRoomId && customRoomId.trim()
        ? customRoomId
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-_]/g, "-")
        : title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          Math.random().toString(36).substring(2, 6);

    const [createdRoom] = await db
      .insert(rooms)
      .values({
        roomId,
        title: title.trim(),
        hostName: hostName.trim(),
        description: description.trim(),
        pinCode: pinCode || "",
        isLocked: Boolean(isLocked),
        maxParticipants: Number(maxParticipants) || 50,
      })
      .returning();

    // Broadcast event to refresh rooms list
    eventBus.publish({
      type: "room-updated",
      payload: { action: "create", room: createdRoom },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, room: { ...createdRoom, activeCount: 0 } });
  } catch (error: any) {
    console.error("POST /api/rooms error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create room" },
      { status: 500 }
    );
  }
}
