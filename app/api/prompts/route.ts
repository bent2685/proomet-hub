import { NextResponse } from "next/server";
import { fetchAllSources, invalidateCache } from "@/lib/github";
import type { Settings, Source } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { sources: Source[]; settings?: Settings; refresh?: boolean };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (body.refresh) await invalidateCache();
    const { items, readmes, errors } = await fetchAllSources(body.sources ?? [], {
      github: body.settings?.githubToken || process.env.GITHUB_TOKEN || undefined,
      gitee: body.settings?.giteeToken || process.env.GITEE_TOKEN || undefined,
    });
    return NextResponse.json({ items, readmes, errors });
  } catch (err) {
    return NextResponse.json(
      {
        items: [],
        readmes: {},
        errors: {},
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 200 },
    );
  }
}
