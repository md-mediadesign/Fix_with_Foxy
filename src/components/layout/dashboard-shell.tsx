import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Wrench, LogOut, LayoutDashboard, Briefcase, PlusCircle, UserCircle,
  Search, FileText, Star, User, CreditCard, Shield, Users, FolderOpen,
  Tags, ScrollText, ClipboardList, Globe,
} from "lucide-react";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getServerTranslations } from "@/lib/i18n/server";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Briefcase, PlusCircle, UserCircle, Search, FileText,
  Star, User, CreditCard, Shield, Users, FolderOpen, Tags, ScrollText,
  ClipboardList, LogOut, Wrench, Globe,
};

export interface NavigationItem {
  href: string;
  label: string;
  icon: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  title: string;
}

export async function DashboardShell({
  children,
  navigation,
  title,
}: DashboardShellProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/anmelden");
  }

  const t = await getServerTranslations();
  const logoutLabel = t.nav.logout;

  const user = session.user;
  const initials = (user.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Fix it with Foxy Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              unoptimized
            />
            <span className="text-lg font-bold tracking-tight">Fix it with Foxy</span>
          </Link>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = ICON_MAP[item.icon] || Briefcase;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/anmelden" });
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {logoutLabel}
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileSidebar
              navigation={navigation}
              userName={user.name ?? "User"}
              userEmail={user.email ?? ""}
              userImage={user.image ?? undefined}
              initials={initials}
            />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <Avatar className="h-8 w-8">
              {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/anmelden" });
              }}
            >
              <Button type="submit" variant="ghost" size="icon">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">{logoutLabel}</span>
              </Button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
