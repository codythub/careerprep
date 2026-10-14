"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { adminApi } from "@/lib/laravel/admin";
import { saveBlob } from "@/lib/download";
import { formatBytes, formatDateTime } from "@/lib/format";
import { Button, LinkButton } from "@/components/ui/button";
import { Alert, Card, CardBody, DefinitionList, PageHeader, Skeleton } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { BreakableText } from "@/components/ui/breakable";
import { useApi } from "@/components/candidate/auth";
import { ExtractionBadge } from "@/components/candidate/views/resumes";
import { ListSkeleton } from "@/components/candidate/views/loading";
import { useAdminRunner } from "@/components/admin/admin-shell";
import { DataList, FilterBar, UserCell, useListQuery } from "@/components/admin/ui";

export function AdminResumesView() {
  const { filters, page, key } = useListQuery(["extraction_status", "user_id"]);
  const resumes = useApi((t) => adminApi.resumes(t, { ...filters, page }), [key]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Resumes" description={resumes.data ? `${resumes.data.total} resumes` : "Uploaded PDFs (metadata only)."} />
      <FilterBar
        fields={[
          {
            name: "extraction_status",
            label: "Text extraction",
            type: "select",
            options: [
              { value: "succeeded", label: "Readable" },
              { value: "failed", label: "Unreadable" },
              { value: "pending", label: "Pending" },
            ],
          },
        ]}
      />
      {filters.user_id && (
        <p className="mb-4 text-sm text-slate-600">
          Showing resumes for user {filters.user_id}.{" "}
          <Link href="/admin/resumes" className="font-medium text-brand-700 underline underline-offset-2">
            Show all
          </Link>
        </p>
      )}
      {resumes.loading ? (
        <ListSkeleton label="Loading resumes…" />
      ) : resumes.error ? (
        <Alert tone="error" title="We couldn't load resumes" action={<Button variant="outline" size="sm" onClick={resumes.reload}>Try again</Button>}>
          {resumes.error}
        </Alert>
      ) : (
        <>
          <DataList
            rows={resumes.data!.items}
            href={(r) => `/admin/resumes/${r.id}`}
            empty={{ title: "No resumes found", icon: <FileText /> }}
            columns={[
              { header: "File", cell: (r) => <span className="block max-w-64 truncate font-medium text-slate-900">{r.fileName}</span> },
              { header: "Candidate", cell: (r) => <UserCell user={r.user} id={r.userId} />, className: "max-w-56" },
              { header: "Text", cell: (r) => <ExtractionBadge status={r.extractionStatus} /> },
              { header: "Size", cell: (r) => (r.sizeBytes !== null ? formatBytes(r.sizeBytes) : "—"), className: "whitespace-nowrap tabular-nums" },
              { header: "Uploaded", cell: (r) => formatDateTime(r.createdAt), className: "whitespace-nowrap text-slate-600" },
            ]}
            card={(r) => (
              <>
                <p className="truncate font-medium text-slate-900">{r.fileName}</p>
                <p className="truncate text-xs text-slate-500">{r.user?.name ?? r.user?.email ?? "—"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ExtractionBadge status={r.extractionStatus} />
                  <span className="text-xs text-slate-500">{formatDateTime(r.createdAt)}</span>
                </div>
              </>
            )}
          />
          <Pagination page={resumes.data!.currentPage} pageCount={resumes.data!.lastPage} basePath="/admin/resumes" params={filters} />
        </>
      )}
    </>
  );
}

const Back = () => (
  <Link href="/admin/resumes" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
    <ArrowLeft className="size-4" aria-hidden /> Resumes
  </Link>
);

export function AdminResumeDetailView({ id }: { id: string }) {
  const resume = useApi((t) => adminApi.resume(t, id), [id]);
  const run = useAdminRunner();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (resume.loading) return (<><Back /><Skeleton className="mt-6 h-64" /></>);
  if (!resume.data) {
    return (
      <>
        <Back />
        <Alert tone="error" title={resume.status === 404 ? "Resume not found" : "We couldn't load this resume"} className="mt-6">
          {resume.status === 404 ? "This resume doesn't exist." : resume.error}
        </Alert>
      </>
    );
  }
  const r = resume.data;

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const { blob, fileName } = await run((t) => adminApi.downloadResume(t, r.id, r.fileName));
      saveBlob(blob, fileName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Back />
      <div className="mt-4">
        <PageHeader
          eyebrow="Resume"
          title={<BreakableText text={r.fileName} />}
          description={<ExtractionBadge status={r.extractionStatus} />}
          actions={
            <Button variant="outline" onClick={() => void download()} loading={busy}>
              {!busy && <Download className="size-4" aria-hidden />} Download PDF
            </Button>
          }
        />
      </div>
      {error && (
        <Alert tone="error" className="mb-6">
          {error}
        </Alert>
      )}
      <Card>
        <CardBody>
          <DefinitionList
            items={[
              ["Candidate", <UserCell key="u" user={r.user} id={r.userId} />],
              ["File name", <BreakableText key="n" text={r.fileName} />],
              ["Size", r.sizeBytes !== null ? formatBytes(r.sizeBytes) : "—"],
              ["Type", r.mimeType ?? "—"],
              ["Uploaded", formatDateTime(r.createdAt)],
              ["Text extraction error", r.extractionError ?? "—"],
            ]}
          />
          <p className="mt-6 border-t border-line pt-4 text-xs text-slate-500">
            Downloads are recorded in the audit log. Only download a resume when you need it to support this candidate.
          </p>
        </CardBody>
      </Card>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <LinkButton href={`/admin/reviews?resume_id=${r.id}`} variant="outline">
          Reviews of this resume
        </LinkButton>
      </div>
    </>
  );
}
