import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicPaths = [
  "/",
  "/anmelden",
  "/registrieren",
  "/preise",
  "/so-funktionierts",
  "/kategorien",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/handwerker",
];

function isPublicPath(pathname: string) {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow API routes, static files, and public paths
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    isPublicPath(pathname)
  ) {
    return NextResponse.next();
  }

  const session = req.auth;

  // Redirect unauthenticated users to login
  if (!session) {
    const loginUrl = new URL("/anmelden", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const role = session.user?.role as string;

  if (pathname.startsWith("/dashboard") && role !== "CLIENT" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/anbieter/dashboard", req.url));
  }

  if (pathname.startsWith("/anbieter") && role !== "PROVIDER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
