import { Suspense } from "react";
import { ArticlesView } from "@/components/articles/articles-view";

export default function Page() {
  return (
    <Suspense>
      <ArticlesView />
    </Suspense>
  );
}
