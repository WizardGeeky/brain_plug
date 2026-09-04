import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "UP";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = "DOWN";
  }

  const isHealthy = dbStatus === "UP";

  return NextResponse.json(
    {
      status: isHealthy ? "HEALTHY" : "UNHEALTHY",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
        },
      },
      durationMs: Date.now() - startTime,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
