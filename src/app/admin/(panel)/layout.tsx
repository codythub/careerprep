import type { Metadata } from "next";
import { db } from "@/lib/db";
import { AppShell } from "@/components/dashboard/app-shell";
import type { NavItem } from "@/components/dashboard/side-nav";
import { requireAdmin } from "@/server/session";
import { adminSignOutAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [pendingSubs, openReports, pendingTestimonials, activeOrders] = await Promise.all([
    db.employerSubmission.count({ where: { status: "PENDING" } }),
    db.jobReport.count({ where: { status: "OPEN" } }),
    db.testimonial.count({ where: { status: "PENDING" } }),
    db.resumeOrder.count({ where: { status: { in: ["PAID", "RECEIVED", "IN_REVIEW", "PROCESSING", "COMPLETED"] } } }),
  ]);
  const nav: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "LayoutDashboard", exact: true },
    { href: "/admin/orders", label: "Resume Orders", icon: "ClipboardList", badge: activeOrders },
    { href: "/admin/users", label: "Users", icon: "Users" },
    { href: "/admin/jobs", label: "Jobs", icon: "Briefcase" },
    { href: "/admin/submissions", label: "Employer Submissions", icon: "Inbox", badge: pendingSubs },
    { href: "/admin/reports", label: "Job Reports", icon: "Flag", badge: openReports },
    { href: "/admin/testimonials", label: "Testimonials", icon: "MessageSquareQuote", badge: pendingTestimonials },
    { href: "/admin/stories", label: "Success Stories", icon: "Star" },
    { href: "/admin/guides", label: "Career Guides", icon: "BookOpen" },
    { href: "/admin/payments", label: "Payments", icon: "CreditCard" },
    { href: "/admin/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/admin/audit-log", label: "Audit Log", icon: "ScrollText" },
    { href: "/admin/settings", label: "Settings", icon: "Settings" },
  ];
  return (
    <AppShell nav={nav} navLabel="Admin" user={admin} homeHref="/admin" extraLink={{ href: "/", label: "View site" }} signOutAction={adminSignOutAction}>
      {children}
    </AppShell>
  );
}
