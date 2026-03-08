import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resetMonthlyAwards } from "@/actions/admin";
import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { getServerTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abonnements",
};

const tierBadgeColor: Record<string, string> = {
  BASIC: "bg-gray-100 text-gray-700",
  PRO: "bg-blue-100 text-blue-800",
  PREMIUM: "bg-purple-100 text-purple-800",
};

const subStatusBadgeColor: Record<string, string> = {
  TRIALING: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAST_DUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-700",
  EXPIRED: "bg-gray-100 text-gray-600",
};

export default async function AbonnementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tier?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();

  const { status, tier } = await searchParams;
  const validStatuses = ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"];
  const validTiers = ["BASIC", "PRO", "PREMIUM"];
  const filterStatus = status && validStatuses.includes(status) ? status : "";
  const filterTier = tier && validTiers.includes(tier) ? tier : "";

  const subscriptions = await db.subscription.findMany({
    where: {
      ...(filterStatus ? { status: filterStatus as "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" } : {}),
      ...(filterTier ? { tier: filterTier as "BASIC" | "PRO" | "PREMIUM" } : {}),
    },
    include: {
      provider: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabels: Record<string, string> = {
    TRIALING: t.admin.subStatusTrialing,
    ACTIVE: t.admin.subStatusActive,
    PAST_DUE: t.admin.subStatusPastDue,
    CANCELLED: t.admin.subStatusCancelled,
    EXPIRED: t.admin.subStatusExpired,
  };

  const statusFilters = [
    { value: "", label: t.common.all },
    { value: "TRIALING", label: t.admin.subStatusTrialing },
    { value: "ACTIVE", label: t.admin.subStatusActive },
    { value: "PAST_DUE", label: t.admin.subStatusPastDue },
    { value: "CANCELLED", label: t.admin.subStatusCancelled },
    { value: "EXPIRED", label: t.admin.subStatusExpired },
  ];

  const tierFilters = [
    { value: "", label: t.common.all },
    { value: "BASIC", label: "Basic" },
    { value: "PRO", label: "Pro" },
    { value: "PREMIUM", label: "Premium" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.admin.subscriptions}</h2>
        <p className="text-muted-foreground">{t.admin.subscriptionsSubtitle}</p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{t.admin.filterByStatus}:</span>
          {statusFilters.map((f) => (
            <Link
              key={f.value}
              href={`/admin/abonnements?${f.value ? `status=${f.value}` : ""}${filterTier ? `&tier=${filterTier}` : ""}`}
            >
              <Button
                variant={filterStatus === f.value ? "default" : "outline"}
                size="sm"
              >
                {f.label}
              </Button>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{t.admin.filterByTier}:</span>
          {tierFilters.map((f) => (
            <Link
              key={f.value}
              href={`/admin/abonnements?${filterStatus ? `status=${filterStatus}&` : ""}${f.value ? `tier=${f.value}` : ""}`}
            >
              <Button
                variant={filterTier === f.value ? "default" : "outline"}
                size="sm"
              >
                {f.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.providerCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.auth.email}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.subscriptionTier}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.status}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.trialEndsCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.periodEndCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.awardsCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground text-right">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const awardsLimit = sub.monthlyAwardsLimit;
                  const awardsDisplay =
                    awardsLimit >= 999999
                      ? `${sub.monthlyAwardsUsed} / ∞`
                      : `${sub.monthlyAwardsUsed} / ${awardsLimit}`;

                  return (
                    <tr key={sub.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">
                        <Link
                          href={`/admin/benutzer/${sub.provider.user.id}`}
                          className="hover:underline"
                        >
                          {sub.provider.user.name}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{sub.provider.user.email}</td>
                      <td className="py-3">
                        <Badge variant="secondary" className={tierBadgeColor[sub.tier]}>
                          {sub.tier}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className={subStatusBadgeColor[sub.status]}>
                          {statusLabels[sub.status] || sub.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">
                        {sub.trialEndsAt
                          ? format(sub.trialEndsAt, "dd.MM.yyyy", { locale: de })
                          : "–"}
                      </td>
                      <td className="py-3 text-muted-foreground whitespace-nowrap">
                        {sub.currentPeriodEnd
                          ? format(sub.currentPeriodEnd, "dd.MM.yyyy", { locale: de })
                          : "–"}
                      </td>
                      <td className="py-3 text-muted-foreground font-mono text-xs">
                        {awardsDisplay}
                      </td>
                      <td className="py-3 text-right">
                        <form
                          action={async () => {
                            "use server";
                            await resetMonthlyAwards(sub.providerId, sub.provider.user.id);
                          }}
                        >
                          <Button type="submit" variant="outline" size="xs" title={t.admin.resetAwards}>
                            <RotateCcw className="h-3 w-3 mr-1" />
                            {t.admin.resetAwards}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      {t.admin.noSubscriptionsFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {subscriptions.length} {t.admin.subscriptionsTotal}
      </p>
    </div>
  );
}
