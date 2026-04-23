import type { Source } from "@/lib/types";

export const DEFAULT_SOURCES: Omit<Source, "id" | "addedAt">[] = [
  {
    url: "https://github.com/bent2685/prompts-bent",
    owner: "bent2685",
    repo: "prompts-bent",
    label: "bent2685/prompts-bent",
  },
];
