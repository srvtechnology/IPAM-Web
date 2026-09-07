import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";

  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json(
    {
      status: "ok",
      app: "IPAM Alumni Unified",
      timestamp: new Date().toISOString(),
      framework: "Next.js App Router",
      db: dbStatus,
    },
    { status: 200 }
  );
}
