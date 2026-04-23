import { NextResponse } from "next/server";
import { serverStorage, getStorageMode } from "@/lib/storage/server";
import type { Favorite } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (getStorageMode() !== "fs") return NextResponse.json({ error: "client-mode" }, { status: 410 });
  return NextResponse.json(await serverStorage.getFavorites());
}

export async function POST(req: Request) {
  if (getStorageMode() !== "fs") return NextResponse.json({ error: "client-mode" }, { status: 410 });
  const data = (await req.json()) as Favorite[];
  await serverStorage.setFavorites(data);
  return NextResponse.json({ ok: true });
}
