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
import { Briefcase, Clock, CheckCircle, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

const statusVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "outline",
  OPEN: "default",
  AWARDED: "secondary",
  IN_PROGRESS: "secondary",
  COMPLETED: "default",
  REVIEWED: "default",
  CANCELLED: "destructive",
  EXPIRED: "outline",
  DISPUTED: "destructive",
};

export default async function ClientDashboardPage() {
  const t = await getServerTranslations();
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!clientProfile) {
    // Admin users may not have a client profile - redirect to admin
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    }
    redirect("/anmelden");
  }

  const statusLabels: Record<string, string> = {
    DRAFT: t.jobs.statusDraft,
    OPEN: t.jobs.statusOpen,
    AWARDED: t.jobs.statusAwarded,
    IN_PROGRESS: t.jobs.statusInProgress,
    COMPLETED: t.jobs.statusCompleted,
    REVIEWED: t.jobs.statusReviewed,
    CANCELLED: t.jobs.statusCancelled,
    EXPIRED: t.jobs.statusExpired,
    DISPUTED: t.jobs.statusDisputed,
  };

  const [activeJobs, pendingBids, completedJobs, recentJobs, publicJobExamples] =
    await Promise.all([
      db.job.count({
        where: {
          clientId: clientProfile.id,
          status: { in: ["OPEN", "AWARDED", "IN_PROGRESS"] },
          deletedAt: null,
        },
      }),
      db.bid.count({
        where: {
          job: {
            clientId: clientProfile.id,
            deletedAt: null,
          },
          status: "PENDING",
        },
      }),
      db.job.count({
        where: {
          clientId: clientProfile.id,
          status: { in: ["COMPLETED", "REVIEWED"] },
          deletedAt: null,
        },
      }),
      db.job.findMany({
        where: {
          clientId: clientProfile.id,
          deletedAt: null,
        },
        include: {
          category: true,
          _count: { select: { bids: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.job.findMany({
        where: {
          status: "OPEN",
          deletedAt: null,
          clientId: { not: clientProfile.id },
        },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
    ]);

  const stats = [
    {
      label: t.dashboard.activeJobs,
      value: activeJobs,
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      label: t.dashboard.pendingBids,
      value: pendingBids,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: t.dashboard.completed,
      value: completedJobs,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t.dashboard.welcome}, {session.user.name}!
        </h2>
        <p className="text-muted-foreground">
          {t.dashboard.overview}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.recentJobs}</CardTitle>
          <CardDescription>
            {t.dashboard.recentJobsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Briefcase className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t.dashboard.noJobs}
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/auftraege/neu">
                  {t.dashboard.createFirst}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/auftraege/${job.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{job.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{job.category.name}</span>
                      <span>&middot;</span>
                      <span>
                        {job._count.bids}{" "}
                        {job._count.bids === 1 ? t.dashboard.bid : t.dashboard.bids}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusVariants[job.status] ?? "outline"}>
                      {statusLabels[job.status] ?? job.status}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              <div className="pt-2 text-center">
                <Button variant="ghost" asChild>
                  <Link href="/dashboard/auftraege">
                    {t.dashboard.viewAll}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Public jobs for inspiration */}
      {publicJobExamples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Inspiration – Aktuelle Aufträge anderer Nutzer
            </CardTitle>
            <CardDescription>
              Sieh dir an, wie andere Auftraggeber ihre Projekte beschreiben.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {publicJobExamples.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border p-4 space-y-1 bg-muted/30"
                >
                  <p className="font-medium truncate">{job.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{job.category.name}</span>
                    <span>&middot;</span>
                    <span>{job.city}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {job.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="pt-4 text-center">
              <Button variant="outline" asChild>
                <Link href="/dashboard/auftraege/neu">
                  Eigenen Auftrag erstellen →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
