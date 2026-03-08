import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewEditForm } from "./review-edit-form";
import { getServerTranslations } from "@/lib/i18n/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bewertung bearbeiten",
};

export default async function BewertungBearbeitenPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();
  const { reviewId } = await params;

  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      provider: {
        include: {
          user: { select: { name: true } },
        },
      },
      job: { select: { title: true } },
    },
  });

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.admin.editReviewTitle}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.editReviewTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewEditForm
            reviewId={review.id}
            initialRating={review.rating}
            initialTitle={review.title}
            initialComment={review.comment}
            providerName={review.provider.user.name ?? "–"}
            jobTitle={review.job.title}
          />
        </CardContent>
      </Card>
    </div>
  );
}
