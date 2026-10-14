"use client";

import { ErrorView } from "@/components/ui/error-view";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView digest={error.digest} reset={reset} />;
}
