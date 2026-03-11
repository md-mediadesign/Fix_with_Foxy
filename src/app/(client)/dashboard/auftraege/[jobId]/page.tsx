import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getJobById } from "@/lib/queries/jobs";
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
  Calendar,
  Euro,
  Clock,
  Star,
  MessageSquare,
  User,
  CheckCircle,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { AwardBidButton, MarkCompletedButton } from "./client-actions";
import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Auftragsdetails",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-700",
  AWARDED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  REVIEWED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
};

export default async function ClientJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const t = await getServerTranslations();
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  const clientProfile = await db.clientProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!clientProfile) {
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
  };

  const bidStatusLabels: Record<string, string> = {
    PENDING: t.bids.pending,
    AWARDED: t.bids.awarded,
    REJECTED: t.bids.rejected,
    WITHDRAWN: t.bids.withdrawn,
  };

  const job = await getJobById(jobId);

  if (!job || job.clientId !== clientProfile.id) {
    notFound();
  }

  const pendingBids = job.bids.filter((b) => b.status === "PENDING");
  const awardedBid = job.awardedBid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">{job.title}</h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[job.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {statusLabels[job.status] ?? job.status}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">{job.category.name}</Badge>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.city}, {job.zipCode}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(job.createdAt), "dd.MM.yyyy", { locale: de })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {["DRAFT", "OPEN"].includes(job.status) && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/auftraege/${job.id}/bearbeiten`}>
                <Pencil className="mr-2 h-4 w-4" />
                Bearbeiten
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/dashboard/auftraege/${job.id}/nachrichten`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              {t.jobs.messages} ({job._count.messages})
            </Link>
          </Button>
        </div>
      </div>

      {/* Job details card */}
      <Card>
        <CardHeader>
          <CardTitle>{t.jobs.description}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm">{job.description}</p>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {(job.budgetMin || job.budgetMax) && (
              <div>
                <p className="text-muted-foreground">{t.jobs.budget}</p>
                <p className="flex items-center gap-1 font-medium">
                  <Euro className="h-3.5 w-3.5" />
                  {job.budgetMin ? `${job.budgetMin.toFixed(0)} ${t.common.euro}` : "k.A."} -{" "}
                  {job.budgetMax ? `${job.budgetMax.toFixed(0)} ${t.common.euro}` : "k.A."}
                </p>
              </div>
            )}
            {job.desiredDate && (
              <div>
                <p className="text-muted-foreground">{t.jobs.desiredDate}</p>
                <p className="font-medium">
                  {format(new Date(job.desiredDate), "dd.MM.yyyy", {
                    locale: de,
                  })}
                </p>
              </div>
            )}
            {job.urgency && (
              <div>
                <p className="text-muted-foreground">{t.jobs.urgency}</p>
                <p className="font-medium capitalize">{job.urgency}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">{t.jobs.bidCount}</p>
              <p className="font-medium">{job._count.bids}</p>
            </div>
          </div>

          {/* Job images */}
          {job.images.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Bilder
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {job.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt="Auftragsbild"
                      className="rounded-lg border object-cover aspect-square"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bids section - when OPEN */}
      {job.status === "OPEN" && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t.jobs.bidCount} ({pendingBids.length})
            </CardTitle>
            <CardDescription>
              {t.jobs.awardConfirm}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingBids.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t.jobs.noBids}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingBids.map((bid) => (
                  <div
                    key={bid.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {bid.provider.companyName ??
                              bid.provider.user.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {bid.provider.averageRating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                {bid.provider.averageRating.toFixed(1)} (
                                {bid.provider.totalReviews})
                              </span>
                            )}
                            <span>
                              {bid.provider.completedJobs} {t.jobs.completedJobs}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {bid.amount.toFixed(2)} {t.common.euro}
                        </p>
                        {bid.estimatedDays && (
                          <p className="text-xs text-muted-foreground">
                            ca. {bid.estimatedDays} {t.common.days}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {bid.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(bid.createdAt), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </span>
                      <AwardBidButton jobId={job.id} bidId={bid.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Awarded provider section */}
      {(job.status === "AWARDED" || job.status === "IN_PROGRESS") &&
        awardedBid && (
          <Card>
            <CardHeader>
              <CardTitle>{t.jobs.awarded}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {awardedBid.provider.companyName ??
                      awardedBid.provider.user.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {t.jobs.amount}: {awardedBid.amount.toFixed(2)} {t.common.euro}
                    </span>
                    {awardedBid.estimatedDays && (
                      <>
                        <span>&middot;</span>
                        <span>
                          {t.jobs.estimatedDays}: {awardedBid.estimatedDays} {t.common.days}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {(job.status === "AWARDED" || job.status === "IN_PROGRESS") && (
                <div className="flex gap-2">
                  <MarkCompletedButton jobId={job.id} />
                  <Button variant="outline" asChild>
                    <Link
                      href={`/dashboard/auftraege/${job.id}/nachrichten`}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t.jobs.messages}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Completed section */}
      {(job.status === "COMPLETED" || job.status === "REVIEWED") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {t.jobs.statusCompleted}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {job.status === "COMPLETED" && job.reviews.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Star className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t.jobs.leaveReview}
                </p>
                <Button asChild>
                  <Link
                    href={`/dashboard/auftraege/${job.id}/bewertung`}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {t.jobs.leaveReview}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        job.reviews[0] && i < job.reviews[0].rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {job.reviews[0]?.title && (
                  <p className="font-medium">{job.reviews[0].title}</p>
                )}
                {job.reviews[0]?.comment && (
                  <p className="text-sm text-muted-foreground">
                    {job.reviews[0].comment}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
