import { HomeView } from "@/components/home-view";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <HomeView />
    </Suspense>
  );
}
