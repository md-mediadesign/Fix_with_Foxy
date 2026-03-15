import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { NavigationItem } from "@/components/layout/dashboard-shell";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  if (session.user.role !== "CLIENT" && session.user.role !== "ADMIN") {
    redirect("/anbieter/dashboard");
  }

  const t = await getServerTranslations();

  const navigation: NavigationItem[] = [
    { href: "/dashboard", label: t.dashboard.title, icon: "LayoutDashboard" },
    { href: "/dashboard/auftraege", label: t.dashboard.myJobs, icon: "Briefcase" },
    { href: "/dashboard/auftraege/neu", label: t.dashboard.newJob, icon: "PlusCircle" },
    { href: "/dashboard/aktuelle-auftraege", label: t.dashboard.currentJobs, icon: "Globe" },
    { href: "/dashboard/profil", label: t.dashboard.profile, icon: "UserCircle" },
  ];

  return (
    <DashboardShell navigation={navigation} title={t.dashboard.title}>
      {children}
    </DashboardShell>
  );
}
