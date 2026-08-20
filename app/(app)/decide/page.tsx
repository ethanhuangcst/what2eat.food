import { Suspense } from "react";
import DecidePageClient from "@/src/ui/decide-page";

export default function DecidePage() {
  return (
    <Suspense fallback={null}>
      <DecidePageClient />
    </Suspense>
  );
}
