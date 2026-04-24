"use client";

import { ArticleDetailView } from "@/components/articles/article-detail-view";

export default function Page({ params }: { params: { slug: string[] } }) {
  return <ArticleDetailView slug={params.slug} />;
}
