import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { suspendUser, activateUser, verifyProvider, unverifyProvider } from "@/actions/admin";
import { Search, ExternalLink, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { getServerTranslations } from "@/lib/i18n/server";
import Link from "next/link";

const roleBadgeColor: Record<string, string> = {
  CLIENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PROVIDER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

export default async function BenutzerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const t = await getServerTranslations();

  const roleLabel: Record<string, string> = {
    CLIENT: t.admin.roleClient,
    PROVIDER: t.admin.roleProvider,
    ADMIN: t.admin.roleAdmin,
  };

  const tierBadgeColor: Record<string, string> = {
    BASIC: "bg-gray-100 text-gray-700",
    PRO: "bg-blue-100 text-blue-800",
    PREMIUM: "bg-purple-100 text-purple-800",
  };

  const { q, role } = await searchParams;
  const search = q?.trim() || "";
  const filterRole = role && ["CLIENT", "PROVIDER", "ADMIN"].includes(role) ? role : "";

  const usersResult = await db.user.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filterRole ? { role: filterRole as "CLIENT" | "PROVIDER" | "ADMIN" } : {}),
    },
    include: {
      providerProfile: {
        include: { subscription: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }).catch((e: unknown) => e instanceof Error ? e : new Error(String(e)));

  if (usersResult instanceof Error) {
    return (
      <div className="space-y-4 p-6">
        <h2 className="text-xl font-bold text-destructive">Datenbankfehler – Benutzer laden</h2>
        <pre className="rounded bg-muted p-4 text-sm overflow-auto whitespace-pre-wrap">
          {usersResult.name}: {usersResult.message}
        </pre>
      </div>
    );
  }

  const users = usersResult;

  const roles = [
    { value: "", label: t.admin.allRoles },
    { value: "CLIENT", label: t.admin.roleClient },
    { value: "PROVIDER", label: t.admin.roleProvider },
    { value: "ADMIN", label: t.admin.roleAdmin },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.admin.users}</h2>
          <p className="text-muted-foreground">{t.admin.usersSubtitle}</p>
        </div>
        <Link href="/admin/benutzer/neu">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            {t.admin.createUser}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.usersSearchTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder={t.admin.userSearch}
                defaultValue={search}
                className="pl-9"
              />
              {filterRole && <input type="hidden" name="role" value={filterRole} />}
            </div>
            <Button type="submit" variant="secondary">
              {t.common.search}
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <Link
                key={r.value}
                href={`/admin/benutzer?${search ? `q=${encodeURIComponent(search)}&` : ""}${r.value ? `role=${r.value}` : ""}`}
              >
                <Button
                  variant={filterRole === r.value ? "default" : "outline"}
                  size="sm"
                >
                  {r.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.auth.name}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.auth.email}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.role}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.subscriptionTier}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.completedJobsCol}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.status}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground">{t.admin.created}</th>
                  <th className="pb-3 pt-4 font-medium text-muted-foreground text-right">{t.admin.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">
                      <Link
                        href={`/admin/benutzer/${user.id}`}
                        className="hover:underline"
                      >
                        {user.name}
                      </Link>
                    </td>
                    <td className="py-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3">
                      <Badge
                        variant="secondary"
                        className={roleBadgeColor[user.role] || ""}
                      >
                        {roleLabel[user.role] || user.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {user.providerProfile?.subscription ? (
                        <Badge
                          variant="secondary"
                          className={tierBadgeColor[user.providerProfile.subscription.tier] || ""}
                        >
                          {user.providerProfile.subscription.tier}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {user.providerProfile ? user.providerProfile.completedJobs : "–"}
                    </td>
                    <td className="py-3">
                      {user.isActive ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {t.admin.activeStatus}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          {t.admin.suspended}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {format(user.createdAt, "dd.MM.yyyy", { locale: de })}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.role === "PROVIDER" && user.providerProfile && (
                          user.providerProfile.isVerified ? (
                            <form
                              action={async () => {
                                "use server";
                                await unverifyProvider(user.providerProfile!.id, user.id);
                              }}
                            >
                              <Button type="submit" variant="outline" size="xs" title={t.admin.unverify}>
                                <ShieldOff className="h-3 w-3" />
                              </Button>
                            </form>
                          ) : (
                            <form
                              action={async () => {
                                "use server";
                                await verifyProvider(user.providerProfile!.id, user.id);
                              }}
                            >
                              <Button type="submit" variant="outline" size="xs" title={t.admin.verify}>
                                <ShieldCheck className="h-3 w-3" />
                              </Button>
                            </form>
                          )
                        )}
                        {user.role !== "ADMIN" && (
                          user.isActive ? (
                            <form
                              action={async () => {
                                "use server";
                                await suspendUser(user.id, "Vom Admin gesperrt");
                              }}
                            >
                              <Button type="submit" variant="destructive" size="xs">
                                {t.admin.suspend}
                              </Button>
                            </form>
                          ) : (
                            <form
                              action={async () => {
                                "use server";
                                await activateUser(user.id);
                              }}
                            >
                              <Button type="submit" variant="outline" size="xs">
                                {t.admin.activate}
                              </Button>
                            </form>
                          )
                        )}
                        <Link href={`/admin/benutzer/${user.id}`}>
                          <Button variant="ghost" size="xs">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      {t.admin.noUsersFound}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {users.length} {t.admin.usersTotal}
      </p>
    </div>
  );
}
