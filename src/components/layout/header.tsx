"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "@/components/locale-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Header() {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Fix it with Foxy Logo"
            width={36}
            height={36}
            className="h-9 w-9 object-contain"
            unoptimized
          />
          <span className="text-xl font-bold tracking-tight">Fix it with Foxy</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/so-funktionierts"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.howItWorks}
          </Link>
          <Link
            href="/kategorien"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.categories}
          </Link>
          <Link
            href="/preise"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.nav.forCraftsmen}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <Button variant="ghost" className="py-1.5 px-3" asChild>
            <Link href="/anmelden">{t.nav.login}</Link>
          </Button>
          <Button className="py-1.5 px-3" asChild>
            <Link href="/registrieren">{t.nav.register}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <nav className="flex flex-col gap-4 pt-8 items-end pr-4">
                <Link
                  href="/so-funktionierts"
                  className="text-lg font-medium text-right"
                  onClick={() => setOpen(false)}
                >
                  {t.nav.howItWorks}
                </Link>
                <Link
                  href="/kategorien"
                  className="text-lg font-medium text-right"
                  onClick={() => setOpen(false)}
                >
                  {t.nav.categories}
                </Link>
                <Link
                  href="/preise"
                  className="text-lg font-medium text-right"
                  onClick={() => setOpen(false)}
                >
                  {t.nav.forCraftsmen}
                </Link>
                <div className="flex flex-col gap-4 w-full items-end">
                  <Button variant="outline" asChild>
                    <Link href="/anmelden" onClick={() => setOpen(false)}>
                      {t.nav.login}
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/registrieren" onClick={() => setOpen(false)}>
                      {t.nav.register}
                    </Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
