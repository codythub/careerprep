"use client";

import { useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, FileUp, ScanLine } from "lucide-react";
import { RESUME_ACCEPT, RESUME_MAX_BYTES } from "@/lib/laravel/config";
import { uploadResume } from "@/lib/laravel/api";
import { ApiError } from "@/lib/laravel/client";
import type { Resume } from "@/lib/laravel/types";
import { buttonClass } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { ProgressBar } from "@/components/ui/progress";
import { cn, formatBytes } from "@/lib/format";
import { useCandidateAuth } from "@/components/candidate/auth";
import { PayForReviewButton } from "@/components/candidate/actions";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number; name: string; size: number }
  | { kind: "done"; resume: Resume | null }
  | { kind: "error"; message: string };

/**
 * PDF upload with real progress: POST /resumes (multipart field "resume") straight to Laravel
 * with the bearer token. Once the bytes are sent, Laravel extracts the text before it responds,
 * so 100% switches to an indeterminate "Reading your resume…" state.
 * Client checks are for instant feedback only; Laravel validates the file.
 */
export function UploadResume({ onUploaded }: { onUploaded?: () => void }) {
  const { state: auth, handleUnauthorized } = useCandidateAuth();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);

  function upload(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return setState({ kind: "error", message: "Please choose a PDF file. Other formats aren't supported." });
    if (file.size > RESUME_MAX_BYTES) return setState({ kind: "error", message: "That PDF is larger than 5 MB. Please upload a smaller file." });
    if (auth.status !== "authenticated") return handleUnauthorized();

    setState({ kind: "uploading", progress: 0, name: file.name, size: file.size });
    uploadResume(auth.token, file, (progress) => setState({ kind: "uploading", progress, name: file.name, size: file.size })).then(
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

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && state.kind !== "uploading") upload(f);
  }

  const busy = state.kind === "uploading";
  const reading = busy && state.progress >= 100;

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600",
          busy && "pointer-events-none border-line bg-surface",
          !busy && (dragging ? "border-brand-500 bg-brand-50" : "border-line-strong bg-surface hover:border-brand-300 hover:bg-brand-50/50"),
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-white text-brand-700 shadow-xs ring-1 ring-line" aria-hidden>
          <FileUp className="size-5" />
        </span>
        <span className="mt-1 font-semibold text-slate-900">
          <span className="text-brand-700">Choose a PDF</span>
          <span className="hidden sm:inline"> or drag it here</span>
        </span>
        <span className="text-sm text-slate-500">Text-based PDF · up to 5 MB</span>
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

      {/* Upload status, announced politely as it changes. */}
      <div aria-live="polite">
        {state.kind === "uploading" && (
          <div className="tile p-4">
            <div className="flex items-center gap-3">
              <FileText className="size-5 shrink-0 text-slate-400" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{state.name}</p>
                <p className="text-xs text-slate-500">
                  {formatBytes(state.size)} · {reading ? "Reading your resume…" : `Uploading ${state.progress}%`}
                </p>
              </div>
              {!reading && <span className="text-sm font-semibold tabular-nums text-slate-700">{state.progress}%</span>}
            </div>
            <ProgressBar value={reading ? undefined : state.progress} label={reading ? "Reading your resume" : "Upload progress"} className="mt-3" />
          </div>
        )}

        {state.kind === "error" && <Alert tone="error">{state.message}</Alert>}

        {state.kind === "done" && state.resume?.extractionStatus === "failed" && (
          <Alert tone="warning" title="We couldn't read the text in this PDF">
            <p>{state.resume.extractionError ?? "The assessment needs selectable text."}</p>
            <p className="mt-2 flex items-start gap-2">
              <ScanLine className="mt-0.5 size-4 shrink-0" aria-hidden />
              Scanned pages and images can&apos;t be assessed. Export your resume from Word or Google Docs as a PDF
              (File → Download → PDF) and upload that instead.
            </p>
          </Alert>
        )}

        {state.kind === "done" && state.resume && state.resume.extractionStatus !== "failed" && (
          <div className="animate-fade-up rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-950">Resume uploaded and ready</p>
                <p className="mt-0.5 truncate text-sm text-emerald-900">
                  {state.resume.fileName}
                  {state.resume.sizeBytes !== null && ` · ${formatBytes(state.resume.sizeBytes)}`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start">
              <PayForReviewButton resumeId={state.resume.id} />
              <Link href={`/dashboard/resumes/${state.resume.id}`} className={buttonClass("ghost", "lg")}>
                View details
              </Link>
            </div>
          </div>
        )}

        {state.kind === "done" && !state.resume && <Alert tone="success">Your resume was uploaded.</Alert>}
      </div>
    </div>
  );
}
