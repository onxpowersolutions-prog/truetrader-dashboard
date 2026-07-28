import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { eventBus } from "@/lib/event-bus";
import { ensureInitialSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureInitialSeed();

    const list = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));

    return NextResponse.json({ success: true, announcements: list });
  } catch (error: any) {
    console.error("GET /api/announcements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      category = "general",
      voiceUrl,
      voiceDuration,
      priority = "normal",
      isPinned = false,
      authorName = "Alex Rivera (Senior Staff Architect)",
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(announcements)
      .values({
        title: title.trim(),
        content: content.trim(),
        category,
        voiceUrl: voiceUrl || null,
        voiceDuration: voiceDuration ? Number(voiceDuration) : null,
        priority,
        isPinned: Boolean(isPinned),
        authorName: authorName || "Alex Rivera (Host)",
        reactions: "{}",
      })
      .returning();

    eventBus.publish({
      type: "new-announcement",
      payload: { announcement: created },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, announcement: created });
  } catch (error: any) {
    console.error("POST /api/announcements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isPinned, reactionEmoji, reactionDelta } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "announcement id is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, Number(id)));

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Announcement not found" },
        { status: 404 }
      );
    }

    let updatedReactionsStr = existing.reactions;
    if (reactionEmoji) {
      let currentMap: Record<string, number> = {};
      try {
        currentMap = JSON.parse(existing.reactions || "{}");
      } catch (e) {
        currentMap = {};
      }
      const currentVal = currentMap[reactionEmoji] || 0;
      const nextVal = Math.max(0, currentVal + (reactionDelta ?? 1));
      if (nextVal === 0) {
        delete currentMap[reactionEmoji];
      } else {
        currentMap[reactionEmoji] = nextVal;
      }
      updatedReactionsStr = JSON.stringify(currentMap);
    }

    const updates: Partial<typeof announcements.$inferInsert> = {
      reactions: updatedReactionsStr,
    };
    if (isPinned !== undefined) {
      updates.isPinned = Boolean(isPinned);
    }

    const [updated] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, Number(id)))
      .returning();

    eventBus.publish({
      type: "announcement-updated",
      payload: { announcement: updated },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: any) {
    console.error("PATCH /api/announcements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "announcement id is required" },
        { status: 400 }
      );
    }

    await db.delete(announcements).where(eq(announcements.id, Number(id)));

    eventBus.publish({
      type: "announcement-deleted",
      payload: { id: Number(id) },
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error: any) {
    console.error("DELETE /api/announcements error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
