import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getServerTranslations } from "@/lib/i18n/server";
import {
  Zap,
  Droplets,
  Paintbrush,
  TreePine,
  Sparkles,
  Truck,
  Hammer,
  Home,
  LayoutGrid,
  KeyRound,
  Wrench,
  MoreHorizontal,
  ArrowRight,
  CheckCircle2,
  Star,
  Shield,
  Clock,
  Users,
} from "lucide-react";

const CATEGORIES = [
  { name: "Elektrik", slug: "elektrik", icon: Zap, color: "bg-yellow-50 text-yellow-700" },
  { name: "Sanitär & Heizung", slug: "sanitaer-heizung", icon: Droplets, color: "bg-blue-50 text-blue-700" },
  { name: "Malerei", slug: "malerei-lackierung", icon: Paintbrush, color: "bg-pink-50 text-pink-700" },
  { name: "Garten", slug: "garten-landschaft", icon: TreePine, color: "bg-green-50 text-green-700" },
  { name: "Reinigung", slug: "reinigung", icon: Sparkles, color: "bg-purple-50 text-purple-700", image: "/categories/cleaner.png" },
  { name: "Umzug", slug: "umzug-transport", icon: Truck, color: "bg-orange-50 text-orange-700" },
  { name: "Schreiner", slug: "schreiner-tischler", icon: Hammer, color: "bg-amber-50 text-amber-700" },
  { name: "Dach & Fassade", slug: "dach-fassade", icon: Home, color: "bg-red-50 text-red-700" },
  { name: "Fliesen & Boden", slug: "fliesen-boden", icon: LayoutGrid, color: "bg-teal-50 text-teal-700" },
  { name: "Schlüsseldienst", slug: "schluesseldienst", icon: KeyRound, color: "bg-indigo-50 text-indigo-700" },
  { name: "Montage", slug: "montage-aufbau", icon: Wrench, color: "bg-slate-50 text-slate-700" },
  { name: "Sonstiges", slug: "sonstiges", icon: MoreHorizontal, color: "bg-gray-50 text-gray-700" },
];

export default async function LandingPage() {
  const t = await getServerTranslations();

  const STEPS = [
    {
      step: "1",
      title: t.landing.step1Title,
      description: t.landing.step1Desc,
      icon: "📝",
    },
    {
      step: "2",
      title: t.landing.step2Title,
      description: t.landing.step2Desc,
      icon: "📬",
    },
    {
      step: "3",
      title: t.landing.step3Title,
      description: t.landing.step3Desc,
      icon: "🤝",
    },
  ];

  const STATS = [
    { value: "1.000+", label: t.landing.statsProviders, icon: Users },
    { value: "5.000+", label: t.landing.statsJobs, icon: CheckCircle2 },
    { value: "4.8", label: t.landing.statsReviews, icon: Star },
    { value: "< 2h", label: t.landing.firstBid, icon: Clock },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              {t.landing.badgeFree}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t.landing.heroTitle}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {t.landing.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/registrieren/kunde">
                  {t.landing.ctaButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/registrieren/anbieter">{t.landing.becomeProvider}</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t.common.free}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-600" />
                {t.landing.badgeIn60Seconds}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-purple-600" />
                {t.landing.badgeVerifiedProviders}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t.landing.popularCategories}</h2>
            <p className="mt-3 text-muted-foreground">{t.landing.viewAll}</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.slug} href={`/registrieren/kunde?kategorie=${cat.slug}`}>
                  <Card className="group cursor-pointer border transition-all hover:border-primary/30 hover:shadow-md">
                    <CardContent className="flex flex-col items-center gap-3 p-4 text-center">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.color} transition-transform group-hover:scale-110 overflow-hidden`}
                      >
                        {"image" in cat && cat.image ? (
                          <Image src={cat.image} alt={cat.name} width={48} height={48} className="h-12 w-12 object-cover" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{cat.name}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t.landing.howItWorksTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.howItWorks.subtitle}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
                  {step.icon}
                </div>
                <div className="absolute -top-2 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className="mx-auto h-6 w-6 text-primary" />
                  <div className="mt-2 text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA for providers */}
      <section className="bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">{t.landing.pricingTitle}</h2>
            <p className="mt-3 text-muted-foreground">{t.landing.pricingSubtitle}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/registrieren/anbieter">
                  {t.pricing.startTrial}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/preise">{t.landing.pricingCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground sm:px-16 sm:py-16">
            <h2 className="text-3xl font-bold tracking-tight">{t.landing.ctaTitle}</h2>
            <p className="mt-3 text-lg opacity-90">
              {t.landing.ctaSubtitle}
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/registrieren/kunde">
                {t.landing.ctaButton}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
