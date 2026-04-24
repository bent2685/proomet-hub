export type Source = {
  id: string;
  url: string;
  owner: string;
  repo: string;
  branch?: string;
  subdir?: string;
  label?: string;
  addedAt: number;
};

export type Settings = {
  githubToken?: string;
  giteeToken?: string;
};

export type Favorite = {
  id: string;
  addedAt: number;
};

export type FrontMatter = {
  title?: string;
  tags?: string[];
  author?: string;
  desc?: string;
  [key: string]: unknown;
};

export type PromptItem = {
  id: string;
  sourceId: string;
  sourceLabel: string;
  path: string;
  title: string;
  tags: string[];
  author?: string;
  desc?: string;
  meta: FrontMatter;
  body: string;
  sha?: string;
  updatedAt?: number;
  datetime?: string;
  datetimeMs?: number;
};

export type StorageMode = "fs" | "client";

export const UNCATEGORIZED_TAG = "其他";

export const ARTICLES_SUBDIR = "hub_posts";
export const ARTICLE_CATEGORY_NONE = "__none__";

export type ArticleItem = PromptItem & {
  category: string[];
  categoryKey: string;
};
