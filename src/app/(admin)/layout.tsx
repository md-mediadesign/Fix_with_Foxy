import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { NavigationItem } from "@/components/layout/dashboard-shell";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();

  const navigation: NavigationItem[] = [
    { href: "/admin", label: t.admin.overview, icon: "LayoutDashboard" },
    { href: "/admin/benutzer", label: t.admin.users, icon: "Users" },
    { href: "/admin/auftraege", label: t.admin.jobs, icon: "Briefcase" },
    { href: "/admin/abonnements", label: t.admin.subscriptions, icon: "CreditCard" },
    { href: "/admin/kategorien", label: t.admin.categories, icon: "Tags" },
    { href: "/admin/bewertungen", label: t.admin.reviews, icon: "Star" },
    { href: "/admin/protokoll", label: t.admin.auditLog, icon: "ScrollText" },
  ];

  return (
    <DashboardShell navigation={navigation} title={t.admin.title}>
      {children}
    </DashboardShell>
  );
}
