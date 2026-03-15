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
import {
  MapPin,
  Calendar,
  Euro,
  Star,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { PlaceBidForm, ProviderJobActions } from "./provider-actions";
import Link from "next/link";
import type { Metadata } from "next";
import { getServerTranslations } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Auftragsdetails",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-700",
  AWARDED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-purple-100 text-purple-700",
  REVIEWED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

const bidStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  AWARDED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export default async function ProviderJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const t = await getServerTranslations();

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

  const { jobId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  const providerProfile = await db.providerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!providerProfile) {
    redirect("/anmelden");
  }

  const job = await getJobById(jobId);

  if (!job) {
    notFound();
  }

  const existingBid = job.bids.find(
    (b) => b.providerId === providerProfile.id
  );

  const isAwarded =
    job.awardedBid?.providerId === providerProfile.id;

  return (
    <div className="space-y-6">
      {/* Header */}
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
            {formatDistanceToNow(new Date(job.createdAt), {
              addSuffix: true,
              locale: de,
            })}
          </span>
        </div>
      </div>

      {/* Job details */}
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
                  {job.budgetMin
                    ? `${job.budgetMin.toFixed(0)} ${t.common.euro}`
                    : "k.A."}{" "}
                  -{" "}
                  {job.budgetMax
                    ? `${job.budgetMax.toFixed(0)} ${t.common.euro}`
                    : "k.A."}
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

          {/* Client info */}
          <Separator />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {job.client.user.name}
              </p>
              <p className="text-xs text-muted-foreground">{t.admin.client}</p>
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

      {/* Bid section */}
      {job.status === "OPEN" && !existingBid && (
        <Card>
          <CardHeader>
            <CardTitle>{t.bids.placeBid}</CardTitle>
            <CardDescription>
              {t.bids.placeBid}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceBidForm jobId={job.id} />
          </CardContent>
        </Card>
      )}

      {/* Chat access when bid exists */}
      {existingBid && (
        <div className="flex justify-end">
          <Button asChild variant="outline">
            <Link href={`/anbieter/auftraege/${job.id}/nachrichten`}>
              <MessageSquare className="mr-2 h-4 w-4" />
              {t.jobs.messages}
              {job._count.messages > 0 && (
                <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  {job._count.messages}
                </span>
              )}
            </Link>
          </Button>
        </div>
      )}

      {/* Existing bid status */}
      {existingBid && (
        <Card>
          <CardHeader>
            <CardTitle>{t.bids.yourBid}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">
                  {existingBid.amount.toFixed(2)} {t.common.euro}
                </p>
                {existingBid.estimatedDays && (
                  <p className="text-sm text-muted-foreground">
                    {t.jobs.estimatedDays}: {existingBid.estimatedDays} {t.common.days}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bidStatusColors[existingBid.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {bidStatusLabels[existingBid.status] ?? existingBid.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {existingBid.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.bids.submittedOn}{" "}
              {formatDistanceToNow(new Date(existingBid.createdAt), {
                addSuffix: true,
                locale: de,
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Provider actions when awarded */}
      {isAwarded &&
        (job.status === "AWARDED" || job.status === "IN_PROGRESS") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {job.status === "AWARDED"
                  ? t.jobs.awarded
                  : t.jobs.statusInProgress}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm space-y-1">
                <p className="font-medium text-green-800">📍 Projektadresse</p>
                <p className="text-green-700">{job.city}, {job.zipCode}</p>
              </div>
              <ProviderJobActions
                jobId={job.id}
                jobStatus={job.status}
              />
            </CardContent>
          </Card>
        )}
    </div>
  );
}
