"use client";

import { api } from "@/lib/laravel/api";
import { Alert, Card, CardBody, PageHeader } from "@/components/ui/primitives";
import { ProfileForm } from "@/components/candidate/actions";
import { useApi } from "@/components/candidate/auth";
import { Loading } from "@/components/candidate/views/loading";

export function ProfileView() {
  const profile = useApi((t) => api.getProfile(t));
  return (
    <>
      <PageHeader title="Profile" description="Your details as stored in your CareerPrep account." />
      {profile.loading ? (
        <Loading />
      ) : profile.data ? (
        <Card>
          <CardBody>
            <ProfileForm profile={profile.data} />
          </CardBody>
        </Card>
      ) : (
        <Alert tone="error" title="We couldn't load your profile">
          {profile.error}
        </Alert>
      )}
    </>
  );
}
