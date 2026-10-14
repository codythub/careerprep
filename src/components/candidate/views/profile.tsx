"use client";

import { useState } from "react";
import { api } from "@/lib/laravel/api";
import type { Candidate } from "@/lib/laravel/types";
import { Button } from "@/components/ui/button";
import { Alert, Card, CardBody, PageHeader, Skeleton } from "@/components/ui/primitives";
import { ProfileForm } from "@/components/candidate/actions";
import { useApi } from "@/components/candidate/auth";

/** Your own account details (GET/PATCH /profile). Used by the candidate dashboard and the admin area. */
export function ProfileView({ eyebrow }: { eyebrow?: string } = {}) {
  const profile = useApi((t) => api.getProfile(t));
  // The saved profile from PATCH /profile. React resets a form to its default values after a successful
  // action, so the defaults must be the saved values — otherwise the fields snap back to the old ones.
  const [saved, setSaved] = useState<Candidate | null>(null);
  return (
    <>
      <PageHeader eyebrow={eyebrow} title="Profile" description="Your details as stored in your CareerPrep account." />
      <div className="max-w-3xl">
        {profile.loading ? (
          <Card aria-busy="true">
            <CardBody className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11" />
                </div>
              ))}
              <span className="sr-only" role="status">
                Loading profile…
              </span>
            </CardBody>
          </Card>
        ) : profile.data ? (
          <Card>
            <CardBody>
              <h2 className="mb-5 font-semibold">Personal details</h2>
              <ProfileForm profile={saved ?? profile.data} onSaved={setSaved} />
            </CardBody>
          </Card>
        ) : (
          <Alert tone="error" title="We couldn't load your profile" action={<Button variant="outline" size="sm" onClick={profile.reload}>Try again</Button>}>
            {profile.error}
          </Alert>
        )}
      </div>
    </>
  );
}
