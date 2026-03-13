"use client";

import Link from "next/link";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Header() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const dashboardHref =
    session?.user?.role === "PROVIDER"
      ? "/anbieter/dashboard"
      : session?.user?.role === "ADMIN"
        ? "/admin"
        : "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/foxy-head.png"
            alt="Fix it with Foxy Logo"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            unoptimized
          />
          <span className="text-xl font-bold">
            <span className="text-blue-900">Fix it with </span>
            <span className="text-orange-500">Foxy</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-900 transition-colors">
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link href="/anmelden" className="text-sm font-medium text-gray-600 hover:text-blue-900 transition-colors">
            Anmelden
          </Link>
        </nav>

        {/* Desktop buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          {session ? (
            <Link
              href={dashboardHref}
              className="flex items-center gap-2 rounded-full bg-blue-900 px-5 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/anmelden"
                className="rounded-full border-2 border-blue-900 px-5 py-1.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
              >
                Anmelden
              </Link>
              <Link
                href="/registrieren"
                className="rounded-full bg-orange-500 px-5 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Registrieren
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="rounded-md p-2 text-gray-600 hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <nav className="flex flex-col gap-5 pt-8">
                <Link href="/" className="flex items-center gap-2 font-medium text-blue-900" onClick={() => setOpen(false)}>
                  <Home className="h-4 w-4" /> Home
                </Link>
                <div className="mt-4 flex flex-col gap-3">
                  {session ? (
                    <Link
                      href={dashboardHref}
                      className="flex items-center justify-center gap-2 rounded-full bg-blue-900 px-5 py-2 text-center text-sm font-semibold text-white"
                      onClick={() => setOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/anmelden"
                        className="rounded-full border-2 border-blue-900 px-5 py-2 text-center text-sm font-semibold text-blue-900"
                        onClick={() => setOpen(false)}
                      >
                        Anmelden
                      </Link>
                      <Link
                        href="/registrieren"
                        className="rounded-full bg-orange-500 px-5 py-2 text-center text-sm font-semibold text-white"
                        onClick={() => setOpen(false)}
                      >
                        Registrieren
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
