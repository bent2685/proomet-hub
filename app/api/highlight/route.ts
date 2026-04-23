import { NextResponse } from "next/server";
import { codeToHtml } from "shiki";

export const runtime = "nodejs";

type Body = { code: string; lang?: string; theme?: string };

export async function POST(req: Request) {
  const { code, lang, theme } = (await req.json()) as Body;
  try {
    const html = await codeToHtml(code, {
      lang: (lang ?? "text") as string,
      theme: theme ?? "github-dark-default",
    });
    return NextResponse.json({ html });
  } catch {
    const html = await codeToHtml(code, { lang: "text", theme: "github-dark-default" });
    return NextResponse.json({ html });
  }
}
