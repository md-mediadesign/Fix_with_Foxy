import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Briefcase, CreditCard, Euro, UserPlus, ClipboardList, FlaskConical, MessageSquareWarning } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/constants";
import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Admin-\u00dcbersicht",
};

export default async function AdminOverviewPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalJobs,
    activeSubscriptions,
    subscriptionsByTier,
    newUsersThisWeek,
    newJobsThisWeek,
    providersInTrial,
    reviewsToModerate,
    subscriptionsByStatus,
  ] = await Promise.all([
    db.user.count({ where: { isActive: true, deletedAt: null } }),
    db.job.count({ where: { deletedAt: null } }),
    db.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    db.subscription.groupBy({
      by: ["tier"],
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      _count: { id: true },
    }),
    db.user.count({ where: { createdAt: { gte: oneWeekAgo }, deletedAt: null } }),
    db.job.count({ where: { createdAt: { gte: oneWeekAgo }, deletedAt: null } }),
    db.subscription.count({ where: { status: "TRIALING" } }),
    db.review.count({ where: { isPublic: true, deletedAt: null } }),
    db.subscription.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  // Calculate estimated monthly revenue
  const revenueEstimate = subscriptionsByTier.reduce((sum, group) => {
    const tierKey = group.tier as keyof typeof PLAN_LIMITS;
    const price = PLAN_LIMITS[tierKey]?.price ?? 0;
    return sum + price * group._count.id;
  }, 0);

  const stats = [
    {
      label: t.admin.totalUsers,
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
    },
    {
      label: t.admin.totalJobs,
      value: totalJobs,
      icon: Briefcase,
      color: "text-amber-600",
    },
    {
      label: t.admin.activeSubscriptions,
      value: activeSubscriptions,
      icon: CreditCard,
      color: "text-green-600",
    },
    {
      label: t.admin.monthlyRevenue,
      value: `${revenueEstimate.toLocaleString("de-DE")}\u00a0\u20ac`,
      icon: Euro,
      color: "text-emerald-600",
    },
  ];

  const weekStats = [
    {
      label: t.admin.newUsersThisWeek,
      value: newUsersThisWeek,
      icon: UserPlus,
      color: "text-blue-500",
    },
    {
      label: t.admin.newJobsThisWeek,
      value: newJobsThisWeek,
      icon: ClipboardList,
      color: "text-amber-500",
    },
    {
      label: t.admin.providersInTrial,
      value: providersInTrial,
      icon: FlaskConical,
      color: "text-yellow-600",
    },
    {
      label: t.admin.reviewsToModerate,
      value: reviewsToModerate,
      icon: MessageSquareWarning,
      color: "text-orange-500",
    },
  ];

  const statusColors: Record<string, string> = {
    TRIALING: "bg-yellow-100 text-yellow-800",
    ACTIVE: "bg-green-100 text-green-800",
    PAST_DUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-700",
    EXPIRED: "bg-gray-100 text-gray-700",
  };

  const statusLabels: Record<string, string> = {
    TRIALING: t.admin.subStatusTrialing,
    ACTIVE: t.admin.subStatusActive,
    PAST_DUE: t.admin.subStatusPastDue,
    CANCELLED: t.admin.subStatusCancelled,
    EXPIRED: t.admin.subStatusExpired,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t.admin.title}
        </h2>
        <p className="text-muted-foreground">
          {t.admin.overviewSubtitle}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-3xl">{stat.value}</span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Week stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {weekStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-3xl">{stat.value}</span>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Subscription breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t.admin.subBreakdownTitle}</CardTitle>
          <CardDescription>
            {t.admin.subBreakdownDesc}
          </CardDescription>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {(["BASIC", "PRO", "PREMIUM"] as const).map((tier) => {
              const count =
                subscriptionsByTier.find((g) => g.tier === tier)?._count.id ??
                0;
              return (
                <div
                  key={tier}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {PLAN_LIMITS[tier].name}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {PLAN_LIMITS[tier].price}\u00a0\u20ac{t.common.perMonth}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Subscription status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t.admin.subStatusBreakdownTitle}</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-3">
            {(["TRIALING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const).map((status) => {
              const count =
                subscriptionsByStatus.find((g) => g.status === status)?._count.id ?? 0;
              return (
                <div
                  key={status}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${statusColors[status]}`}
                >
                  <span>{statusLabels[status]}</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
