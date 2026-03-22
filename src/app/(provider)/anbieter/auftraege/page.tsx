import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAvailableJobsForProvider } from "@/lib/queries/jobs";
import { getCategories } from "@/actions/categories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  MapPin,
  Euro,
  Calendar,
  MessageSquare,
  Search,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ProviderJobFilters } from "./provider-job-filters";
import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Auftraege finden",
};

export default async function ProviderJobFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; city?: string }>;
}) {
  const t = await getServerTranslations();
  const resolvedParams = await searchParams;
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  const providerProfile = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      categories: { include: { category: true } },
    },
  });

  if (!providerProfile) {
    redirect("/anmelden");
  }

  const categoryIds = providerProfile.categories.map((pc) => pc.categoryId);
  const categories = await getCategories();

  const jobs = await getAvailableJobsForProvider(
    providerProfile.id,
    categoryIds,
    {
      categoryId: resolvedParams.categoryId || undefined,
      city: resolvedParams.city || undefined,
    }
  );

  return (
    <div className="space-y-6">
      {/* Hero search banner */}
      <div className="rounded-xl bg-primary/5 border border-primary/10 px-6 py-5">
        <h2 className="text-2xl font-bold tracking-tight mb-1">
          {t.provider.availableJobs}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          {t.provider.findJobsDesc ?? "Finde passende Aufträge in deiner Region und biete direkt an."}
        </p>
        <ProviderJobFilters
          categories={categories}
          currentCategoryId={resolvedParams.categoryId}
          currentCity={resolvedParams.city}
        />
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t.provider.noMatchingJobs}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.provider.resetFilters}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {jobs.length} {t.provider.results}
          </p>
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/anbieter/auftraege/${job.id}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold">
                          {job.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {job.category.name}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {job.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.city}
                    </span>
                    {(job.budgetMin || job.budgetMax) && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3.5 w-3.5" />
                        {job.budgetMin
                          ? `${job.budgetMin.toFixed(0)} ${t.common.euro}`
                          : "k.A."}{" "}
                        -{" "}
                        {job.budgetMax
                          ? `${job.budgetMax.toFixed(0)} ${t.common.euro}`
                          : "k.A."}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {job._count.bids}{" "}
                      {job._count.bids === 1 ? t.dashboard.bid : t.dashboard.bids}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(job.createdAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
