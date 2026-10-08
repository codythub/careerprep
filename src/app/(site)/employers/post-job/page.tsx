import type { Metadata } from "next";
import { PostJobForm } from "@/components/jobs/post-job-form";

export const metadata: Metadata = {
  title: "Post a Job",
  description: "Submit a job for review. Listings are published after our team checks them.",
  alternates: { canonical: "/employers/post-job" },
};

export default function PostJobPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">Post a job</h1>
        <p className="mt-2 text-slate-600">
          Your submission will be <strong>pending review</strong>. Nothing is published until our team has checked it.
        </p>
        <div className="mt-8 card p-5 sm:p-8">
          <PostJobForm />
        </div>
      </div>
    </div>
  );
}
