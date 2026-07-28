import { NextResponse } from "next/server";
import { ensureInitialSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await ensureInitialSeed();
    return NextResponse.json({
      success: true,
      message: "Database seeded with sample rooms, announcements, and messages",
    });
  } catch (error: any) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed database" },
      { status: 500 }
    );
  }
}
