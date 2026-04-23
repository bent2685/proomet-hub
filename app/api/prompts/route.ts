import { NextResponse } from "next/server";
import { fetchAllSources, invalidateCache } from "@/lib/github";
import type { Settings, Source } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { sources: Source[]; settings?: Settings; refresh?: boolean };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (body.refresh) invalidateCache();
    const { items, readmes } = await fetchAllSources(body.sources ?? [], {
      github: body.settings?.githubToken,
      gitee: body.settings?.giteeToken,
    });
    return NextResponse.json({ items, readmes });
  } catch (err) {
    return NextResponse.json(
      { items: [], readmes: {}, error: err instanceof Error ? err.message : "unknown" },
      { status: 200 },
    );
  }
}
