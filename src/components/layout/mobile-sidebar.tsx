"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Menu, LogOut, LayoutDashboard, Briefcase, PlusCircle, UserCircle,
  Search, FileText, Star, User, CreditCard, Shield, Users, FolderOpen,
  Tags, ScrollText, ClipboardList, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/locale-provider";
import type { NavigationItem } from "@/components/layout/dashboard-shell";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Briefcase, PlusCircle, UserCircle, Search, FileText,
  Star, User, CreditCard, Shield, Users, FolderOpen, Tags, ScrollText,
  ClipboardList, LogOut, Globe,
};

interface MobileSidebarProps {
  navigation: NavigationItem[];
  userName: string;
  userEmail: string;
  userImage?: string;
  initials: string;
}

export function MobileSidebar({
  navigation,
  userName,
  userEmail,
  userImage,
  initials,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <Image
                src="/logo.png"
                alt="Fix it with Foxy Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                unoptimized
              />
              <span className="text-lg font-bold tracking-tight">
                Fix it with Foxy
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = ICON_MAP[item.icon] || Briefcase;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8">
              {userImage && <AvatarImage src={userImage} alt={userName} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t.nav.logout}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
