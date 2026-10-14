import type { Metadata } from "next";
import { AdminAuditLogView } from "@/components/admin/views/audit-log";

export const metadata: Metadata = { title: "Audit log" };

export default function Page() {
  return <AdminAuditLogView />;
}
