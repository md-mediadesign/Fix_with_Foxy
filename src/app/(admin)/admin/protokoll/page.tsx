import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function ProtokollPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();

  const actionLabel: Record<string, string> = {
    SUSPEND_USER: t.admin.actionSuspendUser,
    ACTIVATE_USER: t.admin.actionActivateUser,
    DELETE_REVIEW: t.admin.actionDeleteReview,
    CREATE_CATEGORY: t.admin.actionCreateCategory,
    ACTIVATE_CATEGORY: t.admin.actionActivateCategory,
    DEACTIVATE_CATEGORY: t.admin.actionDeactivateCategory,
    VERIFY_PROVIDER: t.admin.actionVerifyProvider,
    UNVERIFY_PROVIDER: t.admin.actionUnverifyProvider,
    EDIT_REVIEW: t.admin.actionEditReview,
    RESET_MONTHLY_AWARDS: t.admin.actionResetMonthlyAwards,
    CANCEL_JOB: t.admin.actionCancelJob,
  };

  const targetTypeLabel: Record<string, string> = {
    User: t.admin.targetUser,
    Review: t.admin.targetReview,
    Category: t.admin.targetCategory,
    ProviderProfile: t.admin.targetProviderProfile,
    Subscription: t.admin.targetSubscription,
    Job: t.admin.targetJob,
  };

  const actions = await db.adminAction.findMany({
    include: {
      admin: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.admin.auditLog}</h2>
        <p className="text-muted-foreground">
          {t.admin.auditLogSubtitle}
        </p>
      </div>

      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.admin_col}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.action}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.targetType}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.targetId}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.reason}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.date}</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((action) => (
                  <tr key={action.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{action.admin.name}</td>
                    <td className="py-3">
                      <Badge variant="secondary">
                        {actionLabel[action.action] || action.action}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {targetTypeLabel[action.targetType] || action.targetType}
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground max-w-[140px] truncate">
                      {action.targetId}
                    </td>
                    <td className="py-3 text-muted-foreground max-w-[200px] truncate">
                      {action.reason || "\u2013"}
                    </td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">
                      {format(action.createdAt, "dd.MM.yyyy HH:mm", { locale: de })}
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      {t.admin.noActionsFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {actions.length} {t.admin.actionsShown} ({t.admin.actionsMax})
      </p>
    </div>
  );
}
