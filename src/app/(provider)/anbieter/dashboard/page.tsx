import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Award,
  FileText,
  Star,
  CheckCircle,
  ArrowRight,
  MapPin,
  Search,
} from "lucide-react";
import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Anbieter-Dashboard",
};

const subscriptionStatusVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  TRIALING: "outline",
  ACTIVE: "default",
  PAST_DUE: "destructive",
  CANCELLED: "destructive",
  EXPIRED: "outline",
};

export default async function ProviderDashboardPage() {
  const t = await getServerTranslations();

  const subscriptionStatusLabels: Record<string, string> = {
    TRIALING: t.provider.trialing,
    ACTIVE: t.provider.active,
    PAST_DUE: t.provider.pastDue,
    CANCELLED: t.provider.cancelled,
    EXPIRED: t.provider.expired,
  };

  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  const providerProfile = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      subscription: true,
      categories: {
        include: { category: true },
      },
    },
  });

  if (!providerProfile) {
    redirect("/anmelden");
  }

  const subscription = providerProfile.subscription;
  const categoryIds = providerProfile.categories.map((pc) => pc.categoryId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthlyBids, completedJobs, recentAvailableJobs] = await Promise.all([
    db.bid.count({
      where: { providerId: providerProfile.id, createdAt: { gte: startOfMonth } },
    }),
    db.job.count({
      where: {
        bids: {
          some: {
            providerId: providerProfile.id,
            status: "AWARDED",
          },
        },
        status: { in: ["COMPLETED", "REVIEWED"] },
      },
    }),
    db.job.findMany({
      where: {
        status: "OPEN",
        deletedAt: null,
        categoryId: categoryIds.length > 0 ? { in: categoryIds } : undefined,
        bids: {
          none: {
            providerId: providerProfile.id,
          },
        },
      },
      include: {
        category: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const awardsUsed = subscription?.monthlyAwardsUsed ?? 0;
  const awardsLimit = subscription?.monthlyAwardsLimit ?? 0;
  const avgRating = providerProfile.averageRating;

  const stats = [
    {
      label: t.provider.awardsUsed,
      value: `${awardsUsed} / ${awardsLimit}`,
      icon: Award,
      color: "text-blue-600",
    },
    {
      label: t.provider.totalBids,
      value: `${monthlyBids} / ${awardsLimit === 999999 ? "∞" : awardsLimit}`,
      icon: FileText,
      color: "text-amber-600",
    },
    {
      label: t.provider.avgRating,
      value: avgRating > 0 ? avgRating.toFixed(1) : "--",
      icon: Star,
      color: "text-yellow-500",
    },
    {
      label: t.provider.completedJobs,
      value: completedJobs,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome + Subscription Status */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t.dashboard.welcome}, {session.user.name}!
          </h2>
          <p className="text-muted-foreground">
            {t.dashboard.overview}
          </p>
        </div>
        {subscription && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t.provider.subStatus}:</span>
            <Badge
              variant={
                subscriptionStatusVariants[subscription.status] ?? "outline"
              }
            >
              {subscriptionStatusLabels[subscription.status] ??
                subscription.status}
            </Badge>
            <Badge variant="secondary">{subscription.tier}</Badge>
          </div>
        )}
      </div>

      {/* Stats Cards */}
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

      {/* Recent Available Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>{t.provider.recentJobs}</CardTitle>
          <CardDescription>
            {t.provider.availableJobs}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAvailableJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t.provider.noAvailableJobs}
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/anbieter/auftraege">{t.provider.browseAll}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAvailableJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/anbieter/auftraege/${job.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{job.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {job.category.name}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.city}
                      </span>
                      <span>&middot;</span>
                      <span>
                        {job._count.bids}{" "}
                        {job._count.bids === 1 ? t.dashboard.bid : t.dashboard.bids}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
              <div className="pt-2 text-center">
                <Button variant="ghost" asChild>
                  <Link href="/anbieter/auftraege">
                    {t.provider.browseAll}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
