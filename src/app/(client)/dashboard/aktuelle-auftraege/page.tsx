import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getServerTranslations } from "@/lib/i18n/server";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Clock, Tag } from "lucide-react";

export default async function CurrentJobsPage() {
  const session = await auth();
  if (!session?.user) redirect("/anmelden");

  const t = await getServerTranslations();

  const jobs = await db.job.findMany({
    where: {
      status: "OPEN",
      deletedAt: null,
      client: { userId: { not: session.user.id } },
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.dashboard.currentJobs}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t.dashboard.currentJobsDesc}
        </p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">{t.dashboard.noCurrentJobs}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug line-clamp-2">
                    {job.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  <span>{job.category.name}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {job.description}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(job.createdAt), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
