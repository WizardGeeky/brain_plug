import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ALIVE" }, { status: 200 });
}
