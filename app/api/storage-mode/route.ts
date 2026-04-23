import { NextResponse } from "next/server";
import { getStorageMode } from "@/lib/storage/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ mode: getStorageMode() });
}
