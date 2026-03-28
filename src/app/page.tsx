import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Search, MessageCircle, ShieldCheck, Star, ClipboardList, FileText } from "lucide-react";
import { getServerTranslations } from "@/lib/i18n/server";

const FEATURED_CATEGORIES = [
  { slugKey: "reinigung", image: "/categories/cleaner.png" },
  { slugKey: "garten-landschaft", image: "/categories/gaertner.png" },
  { slugKey: "malerei-lackierung", image: "/categories/maler.png" },
  { slugKey: "montage-aufbau", image: "/categories/montage.png" },
  { slugKey: "elektrik", image: "/categories/elektrik.png" },
  { slugKey: "sanitaer-heizung", image: "/categories/sanitaer.png" },
  { slugKey: "dach-fassade", image: "/categories/dach.png" },
  { slugKey: "schluesseldienst", image: "/categories/schluesseldienst.png" },
  { slugKey: "umzug-transport", image: "/categories/umzug.png" },
];

export default async function LandingPage() {
  const t = await getServerTranslations();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="relative bg-blue-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl text-center md:text-left">
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                {t.landing.heroTitle}
              </h1>
              <p className="mt-5 text-lg text-blue-100">
                {t.landing.heroSubtitle}
              </p>
              <form
                method="GET"
                action="/handwerker"
                className="mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
              >
                <input
                  type="text"
                  name="q"
                  placeholder={t.landing.searchPlaceholder}
                  className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-gray-900 shadow outline-none"
                />
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  🔍 {t.landing.searchButton}
                </button>
              </form>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/registrieren?tab=handwerker"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white px-7 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  📋 {t.landing.registerAsHandwerker}
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/foxy-head.png"
                alt="Foxy Maskottchen"
                width={280}
                height={280}
                className="h-56 w-56 object-contain drop-shadow-2xl sm:h-64 sm:w-64 lg:h-72 lg:w-72"
                priority
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="w-full fill-white">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-blue-900 sm:text-4xl">
              {t.landing.ourCategories}
            </h2>
            <p className="mt-3 text-gray-500">{t.landing.categoriesSubtitle}</p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {FEATURED_CATEGORIES.map((cat) => {
              const name = (t.categoryNames as Record<string, string>)[cat.slugKey] ?? cat.slugKey;
              const desc = (t.categoryDescs as Record<string, string>)[cat.slugKey];
              return (
              <Link
                key={cat.slugKey}
                href={`/registrieren?kategorie=${cat.slugKey}`}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-50">
                  <Image
                    src={cat.image}
                    alt={name}
                    fill
                    className="object-contain p-2 transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-3 lg:p-2.5">
                  <h3 className="font-bold text-blue-900 text-sm lg:text-sm">{name}</h3>
                  {desc && <p className="mt-1 text-xs text-gray-500 hidden lg:block">{desc}</p>}
                </div>
              </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/kategorien"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:border-blue-900 hover:text-blue-900 transition-colors"
            >
              {t.landing.viewAllJobs} →
            </Link>
          </div>
        </div>
      </section>

      {/* How Foxy helps */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-blue-900 sm:text-4xl">
              {t.landing.howFoxyHelps}
            </h2>
            <p className="mt-3 text-gray-500">{t.landing.howFoxyHelpsSubtitle}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-orange-100 bg-orange-50 px-6 py-4">
                <span className="text-2xl">🏠</span>
                <div>
                  <h3 className="font-bold text-blue-900">{t.landing.forClients}</h3>
                  <p className="text-sm text-gray-500">{t.landing.forClientsSubtitle}</p>
                </div>
              </div>
              <ul className="space-y-5 p-6">
                <li className="flex items-start gap-4">
                  <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <div>
                    <p className="font-semibold text-blue-900">{t.landing.stepCreateJob}</p>
                    <p className="text-sm text-gray-500">{t.landing.stepCreateJobDesc}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <div>
                    <p className="font-semibold text-blue-900">{t.landing.stepCompareOffers}</p>
                    <p className="text-sm text-gray-500">{t.landing.stepCompareOffersDesc}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <div>
                    <p className="font-semibold text-blue-900">{t.landing.stepChoose}</p>
                    <p className="text-sm text-gray-500">{t.landing.stepChooseDesc}</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50 px-6 py-4">
                <span className="text-2xl">🦊</span>
                <div>
                  <h3 className="font-bold text-blue-900">{t.landing.forHandwerker}</h3>
                  <p className="text-sm text-gray-500">{t.landing.forHandwerkerSubtitle}</p>
                </div>
              </div>
              <ul className="space-y-5 p-6">
                <li className="flex items-start gap-4">
                  <Search className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">{t.landing.stepBrowseJobs}</p>
                    <p className="text-sm text-gray-500">{t.landing.stepBrowseJobsDesc}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">{t.landing.stepCreateOffer}</p>
                    <p className="text-sm text-gray-500">{t.landing.stepCreateOfferDesc}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Star className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">{t.landing.stepCollectReviews}</p>
                    <p className="text-sm text-gray-500">{t.landing.stepCollectReviewsDesc}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-900 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            {t.landing.ctaTitle}
          </h2>
          <p className="mt-4 text-lg text-blue-200">
            {t.landing.ctaSubtitle}
          </p>
          <Link
            href="/registrieren"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-orange-500 px-10 py-3.5 text-base font-semibold text-white shadow hover:bg-orange-600 transition-colors"
          >
            {t.landing.ctaButton}
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
