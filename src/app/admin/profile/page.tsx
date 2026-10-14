import type { Metadata } from "next";
import { ProfileView } from "@/components/candidate/views/profile";

export const metadata: Metadata = { title: "Profile" };

/** The admin's own account details, inside the admin shell (same PATCH /profile as candidates). */
export default function AdminProfilePage() {
  return <ProfileView eyebrow="Admin" />;
}
