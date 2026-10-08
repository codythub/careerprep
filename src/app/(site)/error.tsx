"use client";

import { ErrorView } from "@/components/ui/error-view";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page">
      <ErrorView digest={error.digest} reset={reset} />
    </div>
  );
}
