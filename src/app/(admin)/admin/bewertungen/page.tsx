import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteReview } from "@/actions/admin";
import { Star, Trash2, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { getServerTranslations } from "@/lib/i18n/server";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default async function BewertungenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();
  const { q } = await searchParams;
  const search = q?.trim() || "";

  const reviews = await db.review.findMany({
    where: search
      ? {
          provider: {
            user: { name: { contains: search, mode: "insensitive" } },
          },
        }
      : undefined,
    include: {
      provider: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      job: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.admin.reviews}</h2>
        <p className="text-muted-foreground">
          {t.admin.reviewsSubtitle}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.usersSearchTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder={t.admin.searchByProvider}
                defaultValue={search}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              {t.common.search}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.reviewCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.commentCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.providerCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.jobCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.status}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.date}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground text-right">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} />
                        <span className="text-xs text-muted-foreground">
                          {review.rating}/5
                        </span>
                      </div>
                    </td>
                    <td className="py-3 max-w-[250px]">
                      <p className="truncate text-muted-foreground">
                        {review.comment || "\u2013"}
                      </p>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {review.provider.user.name}
                    </td>
                    <td className="py-3 max-w-[180px]">
                      <p className="truncate text-muted-foreground">
                        {review.job.title}
                      </p>
                    </td>
                    <td className="py-3">
                      {review.isPublic && !review.deletedAt ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {t.admin.visible}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          {t.admin.hidden}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {format(review.createdAt, "dd.MM.yyyy", { locale: de })}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/bewertungen/${review.id}/bearbeiten`}>
                          <Button variant="outline" size="xs">
                            <Pencil className="h-3 w-3 mr-1" />
                            {t.admin.editReview}
                          </Button>
                        </Link>
                        {review.isPublic && !review.deletedAt ? (
                          <form
                            action={async () => {
                              "use server";
                              await deleteReview(review.id, "Vom Admin ausgeblendet");
                            }}
                          >
                            <Button type="submit" variant="destructive" size="xs">
                              <Trash2 className="h-3 w-3 mr-1" />
                              {t.admin.hide}
                            </Button>
                          </form>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t.admin.alreadyHidden}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {reviews.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      {t.admin.noReviewsFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {reviews.length} {t.admin.reviewsTotal}
      </p>
    </div>
  );
}
