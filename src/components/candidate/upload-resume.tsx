"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { RESUME_ACCEPT, RESUME_MAX_BYTES } from "@/lib/laravel/config";
import { uploadResume } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import type { Resume } from "@/lib/laravel/types";
import { buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { formatBytes, formatDateTime } from "@/lib/format";
import { useCandidateAuth } from "@/components/candidate/auth";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number; name: string }
  | { kind: "done"; resume: Resume | null }
  | { kind: "error"; message: string };

/**
 * PDF upload with real progress: POST /resumes (multipart field "resume") straight to Laravel
 * with the bearer token. Client checks are for instant feedback only; Laravel validates the file.
 */
export function UploadResume({ onUploaded }: { onUploaded?: () => void }) {
  const { state: auth, handleUnauthorized } = useCandidateAuth();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

  function upload(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return setState({ kind: "error", message: "Please choose a PDF file. Other formats aren't supported." });
    if (file.size > RESUME_MAX_BYTES) return setState({ kind: "error", message: "That PDF is larger than 5 MB. Please upload a smaller file." });
    if (auth.status !== "authenticated") return handleUnauthorized();

    setState({ kind: "uploading", progress: 0, name: file.name });
    uploadResume(auth.token, file, (progress) => setState({ kind: "uploading", progress, name: file.name })).then(
      (resume) => {
        setState({ kind: "done", resume });
        if (input.current) input.current.value = "";
        onUploaded?.();
      },
      (err: unknown) => {
        if (err instanceof ApiError && err.isUnauthorized) return handleUnauthorized();
        const fieldMessage = err instanceof ApiError ? err.fieldErrors.resume?.[0] : undefined;
        setState({ kind: "error", message: fieldMessage ?? (err instanceof ApiError ? err.message : "Upload failed. Please try again.") });
      },
    );
  }

  const busy = state.kind === "uploading";
  return (
    <div className="space-y-4">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          busy ? "pointer-events-none border-slate-200 bg-slate-50" : "border-brand-200 bg-brand-50/40 hover:border-brand-400"
        }`}
      >
        <FileUp className="size-7 text-brand-700" aria-hidden />
        <span className="font-semibold text-slate-900">Choose a PDF resume</span>
        <span className="text-sm text-slate-500">PDF only · up to 5 MB</span>
        <input
          ref={input}
          type="file"
          accept={RESUME_ACCEPT}
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </label>

      {state.kind === "uploading" && (
        <div aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex min-w-0 items-center gap-2 font-medium">
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
              <span className="truncate">Uploading {state.name}</span>
            </span>
            <span className="tabular-nums text-slate-600">{state.progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={state.progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${state.progress}%` }} />
          </div>
          {state.progress === 100 && <p className="mt-1 text-xs text-slate-500">Finishing up…</p>}
        </div>
      )}

      {state.kind === "error" && <Alert tone="error">{state.message}</Alert>}

      {state.kind === "done" && (
        <Alert tone="success" title="Resume uploaded">
          {state.resume ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <CheckCircle2 className="size-4" aria-hidden />
              <span className="font-medium">{state.resume.fileName}</span>
              {state.resume.sizeBytes !== null && <span>{formatBytes(state.resume.sizeBytes)}</span>}
              {state.resume.uploadedAt && <span>{formatDateTime(state.resume.uploadedAt)}</span>}
              <Link href={`/dashboard/resumes/${state.resume.id}`} className={buttonClass("outline", "sm", "ml-auto")}>
                Get it reviewed
              </Link>
            </span>
          ) : (
            "Your resume was uploaded."
          )}
        </Alert>
      )}
    </div>
  );
}
