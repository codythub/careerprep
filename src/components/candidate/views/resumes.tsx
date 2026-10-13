"use client";

import Link from "next/link";
import { ChevronRight, FileText, Lock } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import type { Resume } from "@/lib/laravel/types";
import { Button } from "@/components/ui/button";
import { Alert, Badge, Card, CardBody, EmptyState, IconTile, PageHeader } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { UploadResume } from "@/components/candidate/upload-resume";
import { DeleteResumeButton } from "@/components/candidate/actions";
import { useApi } from "@/components/candidate/auth";
import { usePageParam } from "@/components/candidate/use-page";
import { ListSkeleton } from "@/components/candidate/views/loading";

export function ExtractionBadge({ status }: { status: Resume["extractionStatus"] }) {
  if (status === "succeeded") return <Badge tone="success">Text readable</Badge>;
  if (status === "failed") return <Badge tone="danger">Text unreadable</Badge>;
  if (status === "pending") return <Badge tone="warning">Reading…</Badge>;
  return null;
}

export function ResumesView() {
  const page = usePageParam();
  const resumes = useApi((t) => api.listResumes(t, page), [page]);
  const list = resumes.data?.items ?? [];

  return (
    <>
      <PageHeader title="My resumes" description="Upload a PDF, then pay to unlock an automated assessment for it." />

      <Card className="mb-8">
        <CardBody>
          <h2 className="mb-4 font-semibold">Upload a resume</h2>
          <UploadResume onUploaded={resumes.reload} />
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Lock className="size-3.5" aria-hidden /> Stored privately and only used to generate your assessment.
          </p>
        </CardBody>
      </Card>

      <h2 className="eyebrow mb-3">Uploaded resumes{resumes.data ? ` · ${resumes.data.total}` : ""}</h2>
      {resumes.loading ? (
        <ListSkeleton label="Loading your resumes…" />
      ) : resumes.error ? (
        <Alert tone="error" title="We couldn't load your resumes" action={<Button variant="outline" size="sm" onClick={resumes.reload}>Try again</Button>}>
          {resumes.error}
        </Alert>
      ) : list.length === 0 ? (
        <EmptyState icon={<FileText />} title="No resumes yet">
          Upload your current resume as a PDF to get started.
        </EmptyState>
      ) : (
        <>
          <ul className="card divide-y divide-line">
            {list.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/dashboard/resumes/${r.id}`} className="group flex min-w-0 items-center gap-3">
                  <IconTile>
                    <FileText />
                  </IconTile>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900 group-hover:text-brand-700">{r.fileName}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      {r.uploadedAt && <span>Uploaded {formatDate(r.uploadedAt)}</span>}
                      {r.sizeBytes !== null && <span>· {formatBytes(r.sizeBytes)}</span>}
                      <ExtractionBadge status={r.extractionStatus} />
                    </span>
                  </span>
                </Link>
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <DeleteResumeButton resumeId={r.id} onDeleted={resumes.reload} />
                  <Link
                    href={`/dashboard/resumes/${r.id}`}
                    className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-700"
                  >
                    Open <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={resumes.data!.currentPage} pageCount={resumes.data!.lastPage} basePath="/dashboard/resumes" params={{}} />
        </>
      )}
    </>
  );
}
