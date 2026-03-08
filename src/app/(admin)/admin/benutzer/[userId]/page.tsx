import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  verifyProvider,
  unverifyProvider,
  resetMonthlyAwards,
  deleteReview,
} from "@/actions/admin";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldOff,
  Star,
  RotateCcw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { getServerTranslations } from "@/lib/i18n/server";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

const roleBadgeColor: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-800",
  PROVIDER: "bg-green-100 text-green-800",
  ADMIN: "bg-purple-100 text-purple-800",
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
  EXPIRED: "bg-gray-100 text-gray-700",
};

const jobStatusBadgeColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-blue-100 text-blue-800",
  AWARDED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  REVIEWED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-red-100 text-red-800",
  EXPIRED: "bg-gray-100 text-gray-600",
  DISPUTED: "bg-red-200 text-red-900",
};

export default async function BenutzerDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();
  const { userId } = await params;

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      providerProfile: {
        include: {
          subscription: true,
          categories: { include: { category: true } },
          reviews: {
            include: { job: { select: { title: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          bids: {
            where: { status: "AWARDED" },
            include: {
              job: { select: { title: true, status: true, city: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
      clientProfile: {
        include: {
          jobs: {
            orderBy: { createdAt: "desc" },
            take: 10,
            include: { category: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const sub = user.providerProfile?.subscription;
  const awardsLimit = sub?.monthlyAwardsLimit ?? 0;
  const awardsUsed = sub?.monthlyAwardsUsed ?? 0;
  const awardsPercent = awardsLimit > 0 ? Math.min((awardsUsed / awardsLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/benutzer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.common.back}
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">{t.admin.userDetails}</h2>
      </div>

      {/* User header card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <p className="text-muted-foreground mt-1">{user.email}</p>
              {user.phone && (
                <p className="text-muted-foreground text-sm">{user.phone}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={roleBadgeColor[user.role]}>
                {user.role === "CLIENT"
                  ? t.admin.roleClient
                  : user.role === "PROVIDER"
                  ? t.admin.roleProvider
                  : t.admin.roleAdmin}
              </Badge>
              <Badge
                variant="secondary"
                className={
                  user.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }
              >
                {user.isActive ? t.admin.activeStatus : t.admin.suspended}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.admin.created}: {format(user.createdAt, "dd.MM.yyyy HH:mm", { locale: de })}
          </p>
        </CardHeader>
      </Card>

      {/* Provider section */}
      {user.providerProfile && (
        <>
          {/* Provider info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.admin.providerInfo}</CardTitle>
                <div className="flex gap-2">
                  {user.providerProfile.isVerified ? (
                    <>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {t.admin.verified}
                      </Badge>
                      <form
                        action={async () => {
                          "use server";
                          await unverifyProvider(user.providerProfile!.id, user.id);
                        }}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          <ShieldOff className="h-3 w-3 mr-1" />
                          {t.admin.unverify}
                        </Button>
                      </form>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        {t.admin.unverified}
                      </Badge>
                      <form
                        action={async () => {
                          "use server";
                          await verifyProvider(user.providerProfile!.id, user.id);
                        }}
                      >
                        <Button type="submit" variant="outline" size="sm">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {t.admin.verify}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.auth.city}</p>
                  <p className="font-medium">{user.providerProfile.city || "–"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.serviceRadiusKm}</p>
                  <p className="font-medium">{user.providerProfile.serviceRadius} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.completedJobsCol}</p>
                  <p className="font-medium">{user.providerProfile.completedJobs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.admin.avgRatingLabel}</p>
                  <p className="font-medium">
                    {user.providerProfile.averageRating.toFixed(1)}{" "}
                    <span className="text-muted-foreground text-xs">
                      ({user.providerProfile.totalReviews} {t.admin.totalReviewsLabel})
                    </span>
                  </p>
                </div>
              </div>
              {user.providerProfile.categories.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t.admin.categoriesLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {user.providerProfile.categories.map((pc) => (
                      <Badge key={pc.categoryId} variant="secondary">
                        {pc.category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.admin.subscriptionInfo}</CardTitle>
                {sub && (
                  <form
                    action={async () => {
                      "use server";
                      await resetMonthlyAwards(user.providerProfile!.id, user.id);
                    }}
                  >
                    <Button type="submit" variant="outline" size="sm">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      {t.admin.resetAwards}
                    </Button>
                  </form>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sub ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={tierBadgeColor[sub.tier]}>
                      {sub.tier}
                    </Badge>
                    <Badge variant="secondary" className={subStatusBadgeColor[sub.status]}>
                      {sub.status}
                    </Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sub.trialEndsAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.admin.trialEndsAt}</p>
                        <p className="font-medium">
                          {format(sub.trialEndsAt, "dd.MM.yyyy", { locale: de })}
                        </p>
                      </div>
                    )}
                    {sub.currentPeriodEnd && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t.admin.periodEndsAt}</p>
                        <p className="font-medium">
                          {format(sub.currentPeriodEnd, "dd.MM.yyyy", { locale: de })}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t.admin.awardsUsed}</span>
                      <span className="font-medium">
                        {awardsUsed} / {awardsLimit >= 999999 ? "∞" : awardsLimit}
                      </span>
                    </div>
                    {awardsLimit < 999999 && (
                      <Progress value={awardsPercent} className="h-2" />
                    )}
                  </div>
                  {sub.stripeSubscriptionId && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Stripe: {sub.stripeSubscriptionId}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">{t.admin.noSubscription}</p>
              )}
            </CardContent>
          </Card>

          {/* Accepted jobs */}
          {user.providerProfile.bids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.admin.recentAcceptedJobs}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.jobTitle}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.status}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.cityCol}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.providerProfile.bids.map((bid) => (
                        <tr key={bid.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{bid.job.title}</td>
                          <td className="py-2">
                            <Badge
                              variant="secondary"
                              className={jobStatusBadgeColor[bid.job.status] || ""}
                            >
                              {bid.job.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-muted-foreground">{bid.job.city}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider reviews */}
          {user.providerProfile.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.admin.providerReviews}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.reviewCol}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.commentCol}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.jobCol}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.status}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.date}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground text-right">{t.admin.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.providerProfile.reviews.map((review) => (
                        <tr key={review.id} className="border-b last:border-0">
                          <td className="py-2">
                            <StarRating rating={review.rating} />
                          </td>
                          <td className="py-2 max-w-[200px]">
                            <p className="truncate text-muted-foreground">
                              {review.comment || "–"}
                            </p>
                          </td>
                          <td className="py-2 max-w-[160px]">
                            <p className="truncate text-muted-foreground">{review.job.title}</p>
                          </td>
                          <td className="py-2">
                            {review.isPublic && !review.deletedAt ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {t.admin.visible}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                {t.admin.hidden}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 text-muted-foreground whitespace-nowrap">
                            {format(review.createdAt, "dd.MM.yyyy", { locale: de })}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/admin/bewertungen/${review.id}/bearbeiten`}>
                                <Button variant="outline" size="xs">
                                  {t.admin.editReview}
                                </Button>
                              </Link>
                              {review.isPublic && !review.deletedAt && (
                                <form
                                  action={async () => {
                                    "use server";
                                    await deleteReview(review.id, "Vom Admin ausgeblendet");
                                  }}
                                >
                                  <Button type="submit" variant="destructive" size="xs">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Client section */}
      {user.clientProfile && (
        <>
          {user.clientProfile.jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t.admin.jobsPosted}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.jobTitle}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.categoryCol}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.status}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.cityCol}</th>
                        <th className="pb-3 pt-2 font-medium text-muted-foreground">{t.admin.created}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.clientProfile.jobs.map((job) => (
                        <tr key={job.id} className="border-b last:border-0">
                          <td className="py-2 font-medium">{job.title}</td>
                          <td className="py-2 text-muted-foreground">{job.category.name}</td>
                          <td className="py-2">
                            <Badge
                              variant="secondary"
                              className={jobStatusBadgeColor[job.status] || ""}
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="py-2 text-muted-foreground">{job.city}</td>
                          <td className="py-2 text-muted-foreground whitespace-nowrap">
                            {format(job.createdAt, "dd.MM.yyyy", { locale: de })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
