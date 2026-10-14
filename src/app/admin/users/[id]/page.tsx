import type { Metadata } from "next";
import { AdminUserDetailView } from "@/components/admin/views/users";

export const metadata: Metadata = { title: "User" };

export default async function Page({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  return <AdminUserDetailView id={id} />;
}
