import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getProviderPublicProfile } from "@/actions/profile";
import { Star, MapPin, Phone, Globe, CheckCircle2, Calendar, Briefcase, Lock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getServerTranslations } from "@/lib/i18n/server";
import { auth } from "@/lib/auth";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const provider = await getProviderPublicProfile(providerId);
  const t = await getServerTranslations();
  const session = await auth();
  const isLoggedIn = !!session?.user;

  if (!provider) notFound();

  const isPremium = provider.subscription?.tier === "PREMIUM" &&
    (provider.subscription?.status === "ACTIVE" || provider.subscription?.status === "TRIALING");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold text-primary">
              {provider.user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{provider.companyName || provider.user.name}</h1>
                {provider.isVerified && (
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                )}
                {isPremium && (
                  <Badge className="bg-yellow-100 text-yellow-800">Premium</Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {provider.city}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {provider.completedJobs} {t.publicProfile.completedJobs}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t.publicProfile.memberSince} {format(provider.user.createdAt, "MMMM yyyy", { locale: de })}
                </span>
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(provider.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{provider.averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({provider.totalReviews} {t.publicProfile.reviewsTitle})
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Login Gate */}
          {!isLoggedIn && (
            <div className="relative mb-6 overflow-hidden rounded-2xl border border-orange-100">
              {/* Blurred preview */}
              <div className="select-none blur-sm pointer-events-none px-6 py-4 space-y-2">
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-4 w-64 rounded bg-gray-200" />
                <div className="h-4 w-36 rounded bg-gray-200" />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                <Lock className="mb-3 h-8 w-8 text-orange-500" />
                <p className="mb-4 text-center font-semibold text-blue-900">
                  Melde dich an, um das vollständige Profil zu sehen
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/anmelden?callbackUrl=/handwerker/${providerId}`}
                    className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                  >
                    Anmelden
                  </Link>
                  <Link
                    href={`/registrieren?callbackUrl=/handwerker/${providerId}`}
                    className="rounded-full border-2 border-blue-900 px-6 py-2.5 text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                  >
                    Registrieren
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {provider.categories.map((pc) => (
              <Badge key={pc.id} variant="secondary">
                {pc.category.name}
              </Badge>
            ))}
          </div>

          {/* Description */}
          {provider.description && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t.publicProfile.about}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">{provider.description}</p>
              </CardContent>
            </Card>
          )}

          {isLoggedIn && (
            <>
              {/* Contact */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Kontakt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {provider.city}, {provider.zipCode}
                    {provider.serviceRadius && ` (${t.publicProfile.serviceArea}: ${provider.serviceRadius} ${t.publicProfile.kmRadius})`}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {provider.phone}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio */}
              {provider.portfolioImages.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {provider.portfolioImages.map((img) => (
                        <div key={img.id} className="overflow-hidden rounded-lg">
                          <img
                            src={img.url}
                            alt={img.caption || "Portfolio"}
                            className="aspect-square w-full object-cover"
                          />
                          {img.caption && (
                            <p className="mt-1 text-xs text-muted-foreground">{img.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>
                    {t.publicProfile.reviewsTitle} ({provider.totalReviews})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {provider.reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t.publicProfile.noReviews}</p>
                  ) : (
                    <div className="space-y-4">
                      {provider.reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(review.createdAt, "dd. MMM yyyy", { locale: de })}
                            </span>
                          </div>
                          {review.title && <h4 className="mt-1 font-medium">{review.title}</h4>}
                          {review.comment && (
                            <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
