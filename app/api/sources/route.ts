import { NextResponse } from "next/server";
import { serverStorage, getStorageMode } from "@/lib/storage/server";
import type { Source } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (getStorageMode() !== "fs") {
    return NextResponse.json({ error: "client-mode" }, { status: 410 });
  }
  return NextResponse.json(await serverStorage.getSources());
}

export async function POST(req: Request) {
  if (getStorageMode() !== "fs") {
    return NextResponse.json({ error: "client-mode" }, { status: 410 });
  }
  const data = (await req.json()) as Source[];
  await serverStorage.setSources(data);
  return NextResponse.json({ ok: true });
}
