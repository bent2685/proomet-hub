import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    hasEnvGithub: !!process.env.GITHUB_TOKEN,
    hasEnvGitee: !!process.env.GITEE_TOKEN,
  });
}
