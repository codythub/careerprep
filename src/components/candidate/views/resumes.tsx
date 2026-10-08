"use client";

import Link from "next/link";
import { ChevronRight, FileText, Lock } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import { api } from "@/lib/laravel/api";
import { Alert, Card, CardBody, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { UploadResume } from "@/components/candidate/upload-resume";
import { DeleteResumeButton } from "@/components/candidate/actions";
import { useApi } from "@/components/candidate/auth";
import { usePageParam } from "@/components/candidate/use-page";
import { Loading } from "@/components/candidate/views/loading";

export function ResumesView() {
  const page = usePageParam();
  const resumes = useApi((t) => api.listResumes(t, page), [page]);
  const list = resumes.data?.items ?? [];

  return (
    <>
      <PageHeader title="My Resumes" description="Upload a PDF, then pay to unlock an automated assessment for it." />

      <Card className="mb-6">
        <CardBody>
          <h2 className="mb-4 font-semibold">Upload a resume</h2>
          <UploadResume onUploaded={resumes.reload} />
          <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <Lock className="size-3.5" aria-hidden /> Your files are stored privately and are only used to generate your assessment.
          </p>
        </CardBody>
      </Card>

      {resumes.loading ? (
        <Loading label="Loading your resumes…" />
      ) : resumes.error ? (
        <Alert tone="error" title="We couldn't load your resumes">
          {resumes.error}
        </Alert>
      ) : list.length === 0 ? (
        <EmptyState icon={<FileText className="size-5" />} title="No resumes yet">
          Upload your current resume as a PDF to get started.
        </EmptyState>
      ) : (
        <>
          <Card>
            <CardBody>
              <h2 className="font-semibold">Uploaded resumes</h2>
              <ul className="mt-2 divide-y divide-slate-100">
                {list.map((r) => (
                  <li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/dashboard/resumes/${r.id}`} className="group flex min-w-0 items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                        <FileText className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-brand-700">{r.fileName}</span>
                        <span className="block text-xs text-slate-500">
                          {[r.uploadedAt && `Uploaded ${formatDate(r.uploadedAt)}`, r.sizeBytes !== null && formatBytes(r.sizeBytes), r.status]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/resumes/${r.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white hover:bg-brand-800">
                        Review <ChevronRight className="size-4" aria-hidden />
                      </Link>
                      <DeleteResumeButton resumeId={r.id} onDeleted={resumes.reload} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
          <Pagination page={resumes.data!.currentPage} pageCount={resumes.data!.lastPage} basePath="/dashboard/resumes" params={{}} />
        </>
      )}
    </>
  );
}
