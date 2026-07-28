import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = Date.now();
  return NextResponse.json({
    status: "ok",
    timestamp,
    serverTime: new Date().toISOString(),
    serverRegion: process.env.VERCEL_REGION || "local-dev-us-east",
    version: "2.4.0-ConnectHub-Enterprise",
  });
}
