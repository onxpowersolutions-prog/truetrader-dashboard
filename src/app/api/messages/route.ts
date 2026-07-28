import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { eventBus } from "@/lib/event-bus";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 }
      );
    }

    const list = await db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ success: true, messages: list });
  } catch (error: any) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      roomId,
      senderId,
      senderName,
      senderRole = "guest",
      content,
      type = "text",
      fileUrl,
      fileName,
      fileSize,
      replyToId,
      replyToText,
      replyToSender,
    } = body;

    if (!roomId || !senderId || !content) {
      return NextResponse.json(
        { success: false, error: "roomId, senderId and content are required" },
        { status: 400 }
      );
    }

    const [createdMessage] = await db
      .insert(messages)
      .values({
        roomId,
        senderId,
        senderName: senderName || "Guest User",
        senderRole,
        content,
        type,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        replyToId: replyToId ? Number(replyToId) : null,
        replyToText: replyToText || null,
        replyToSender: replyToSender || null,
      })
      .returning();

    eventBus.publish({
      type: "new-message",
      roomId,
      fromPeerId: senderId,
      payload: { message: createdMessage },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, message: createdMessage });
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to post message" },
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
        { success: false, error: "message id is required" },
        { status: 400 }
      );
    }

    await db.delete(messages).where(eq(messages.id, Number(id)));

    if (roomId) {
      eventBus.publish({
        type: "message-deleted",
        roomId,
        payload: { id: Number(id) },
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error("DELETE /api/messages error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
