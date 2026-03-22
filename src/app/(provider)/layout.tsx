import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { NavigationItem } from "@/components/layout/dashboard-shell";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  if (session.user.role !== "PROVIDER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const t = await getServerTranslations();

  const navigation: NavigationItem[] = [
    { href: "/anbieter/auftraege", label: t.provider.findJobs, icon: "Search", primary: true },
    { href: "/anbieter/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
    { href: "/anbieter/meine-auftraege", label: t.provider.myJobs, icon: "Briefcase" },
    { href: "/anbieter/angebote", label: t.provider.myBids, icon: "FileText" },
    { href: "/anbieter/bewertungen", label: t.provider.reviews, icon: "Star" },
    { href: "/anbieter/profil", label: t.provider.profile, icon: "UserCircle" },
    { href: "/anbieter/abo", label: t.provider.subscription, icon: "CreditCard" },
  ];

  return (
    <DashboardShell navigation={navigation} title={t.provider.dashboard}>
      {children}
    </DashboardShell>
  );
}
