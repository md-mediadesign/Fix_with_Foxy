import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { searchProviders } from "@/actions/profile";
import { Star, MapPin, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function HandwerkerSuchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ort?: string }>;
}) {
  const { q = "", ort = "" } = await searchParams;
  const providers = await searchProviders(q, ort);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        {/* Search header */}
        <div className="bg-blue-900 py-10">
          <div className="mx-auto max-w-3xl px-4">
            <h1 className="mb-6 text-center text-3xl font-extrabold text-white">
              Handwerker & Dienstleister finden
            </h1>
            <form method="GET" className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="z.B. Elektriker, Maler, Klempner…"
                className="flex-1 rounded-full px-5 py-3 text-sm outline-none"
              />
              <input
                type="text"
                name="ort"
                defaultValue={ort}
                placeholder="Ort / Stadt"
                className="w-full rounded-full px-5 py-3 text-sm outline-none sm:w-48"
              />
              <button
                type="submit"
                className="rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Suchen
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {providers.length === 0 ? (
            <p className="text-center text-gray-500">
              Keine Dienstleister gefunden. Versuche andere Suchbegriffe.
            </p>
          ) : (
            <>
              <p className="mb-6 text-sm text-gray-500">
                {providers.length} Dienstleister gefunden
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((p) => {
                  const isPremium =
                    p.subscription?.tier === "PREMIUM" &&
                    (p.subscription?.status === "ACTIVE" || p.subscription?.status === "TRIALING");

                  return (
                    <Link
                      key={p.id}
                      href={`/handwerker/${p.id}`}
                      className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-900">
                          {(p.companyName || p.user.name).charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h2 className="truncate font-bold text-blue-900 group-hover:text-orange-500 transition-colors">
                              {p.companyName || p.user.name}
                            </h2>
                            {p.isVerified && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {p.city}
                          </div>
                          <div className="mt-1.5 flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= Math.round(p.averageRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-200"
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-xs text-gray-500">
                              ({p.totalReviews})
                            </span>
                            {isPremium && (
                              <Badge className="ml-auto bg-yellow-100 text-yellow-800 text-xs">
                                Premium
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.categories.slice(0, 3).map((pc) => (
                          <span
                            key={pc.category.name}
                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                          >
                            {pc.category.name}
                          </span>
                        ))}
                        {p.categories.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400">
                            +{p.categories.length - 3}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-xs font-medium text-orange-500 group-hover:underline">
                        Profil ansehen →
                      </p>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
