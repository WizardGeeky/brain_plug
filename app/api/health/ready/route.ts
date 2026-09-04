import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "READY" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "NOT_READY" }, { status: 503 });
  }
}
