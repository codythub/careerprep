"use client";

import { api } from "@/lib/laravel/api";
import { Button } from "@/components/ui/button";
import { Alert, Card, CardBody, PageHeader, Skeleton } from "@/components/ui/primitives";
import { ProfileForm } from "@/components/candidate/actions";
import { useApi } from "@/components/candidate/auth";

export function ProfileView() {
  const profile = useApi((t) => api.getProfile(t));
  return (
    <>
      <PageHeader title="Profile" description="Your details as stored in your CareerPrep account." />
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
              <ProfileForm profile={profile.data} />
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
