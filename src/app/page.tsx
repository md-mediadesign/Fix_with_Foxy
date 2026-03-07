import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MapPin, Clock, Star, ShieldCheck } from "lucide-react";

const FEATURED_CATEGORIES = [
  {
    name: "Putzen",
    slug: "reinigung",
    image: "/categories/cleaner.png",
    desc: "Professionelle Reinigungsdienste für Ihr Zuhause oder Büro.",
  },
  {
    name: "Gartenarbeit",
    slug: "garten-landschaft",
    image: "/categories/gaertner.png",
    desc: "Gartenpflege, Landschaftsbau und Außenanlagen.",
  },
  {
    name: "Malerarbeiten",
    slug: "malerei-lackierung",
    image: "/categories/maler.png",
    desc: "Innen- und Außenanstriche, Tapezieren und Lackieren.",
  },
  {
    name: "Reparaturen",
    slug: "montage-aufbau",
    image: "/categories/montage.jpg",
    desc: "Allgemeine Reparaturen und Instandhaltung im Haus.",
  },
  {
    name: "Elektrik",
    slug: "elektrik",
    image: "/categories/elektrik.png",
    desc: "Elektroinstallationen, Reparaturen und Wartung.",
  },
  {
    name: "Klempnerei",
    slug: "sanitaer-heizung",
    image: "/categories/sanitaer.png",
    desc: "Sanitärinstallationen, Rohrreinigung und Reparaturen.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero */}
      <section className="relative bg-blue-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:justify-between">
            {/* Text */}
            <div className="max-w-xl text-center md:text-left">
              <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                Schlau repariert<br />
                mit{" "}
                <span className="text-orange-400">Foxy</span>
              </h1>
              <p className="mt-5 text-lg text-blue-100">
                Die clevere Plattform, die zuverlässige Handwerker und Auftraggeber zusammenbringt. Schnell, transparent und fuchs-schlau!
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Link
                  href="/registrieren"
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 px-7 py-3 text-base font-semibold text-white shadow hover:bg-orange-600 transition-colors"
                >
                  🔨 Handwerker finden
                </Link>
                <Link
                  href="/registrieren?tab=handwerker"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white px-7 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  📋 Aufträge erhalten
                </Link>
              </div>
            </div>
            {/* Fox mascot */}
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
        {/* Wave divider */}
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
              Unsere Kategorien
            </h2>
            <p className="mt-3 text-gray-500">
              Finden Sie den richtigen Experten für jedes Projekt
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/registrieren?kategorie=${cat.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-50">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-contain p-2 transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-blue-900">{cat.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{cat.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/kategorien"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:border-blue-900 hover:text-blue-900 transition-colors"
            >
              Alle Aufträge ansehen →
            </Link>
          </div>
        </div>
      </section>

      {/* How Foxy helps */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-blue-900 sm:text-4xl">
              Wie <span className="text-orange-500">Foxy</span> hilft
            </h2>
            <p className="mt-3 text-gray-500">Einfach, transparent und effizient</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {/* Für Auftraggeber */}
            <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-orange-100 bg-orange-50 px-6 py-4">
                <span className="text-2xl">🏠</span>
                <div>
                  <h3 className="font-bold text-blue-900">Für Auftraggeber</h3>
                  <p className="text-sm text-gray-500">Finden Sie den perfekten Handwerker für Ihr Projekt</p>
                </div>
              </div>
              <ul className="space-y-5 p-6">
                <li className="flex items-start gap-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <div>
                    <p className="font-semibold text-blue-900">Auftrag erstellen</p>
                    <p className="text-sm text-gray-500">Beschreiben Sie Ihr Projekt mit Details und Budget</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <div>
                    <p className="font-semibold text-blue-900">Angebote vergleichen</p>
                    <p className="text-sm text-gray-500">Erhalten Sie Angebote von qualifizierten Handwerkern</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Star className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                  <div>
                    <p className="font-semibold text-blue-900">Handwerker wählen</p>
                    <p className="text-sm text-gray-500">Wählen Sie basierend auf Preis, Bewertungen und Erfahrung</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Für Handwerker */}
            <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50 px-6 py-4">
                <span className="text-2xl">🦊</span>
                <div>
                  <h3 className="font-bold text-blue-900">Für Handwerker</h3>
                  <p className="text-sm text-gray-500">Erhalten Sie neue Aufträge in Ihrer Region</p>
                </div>
              </div>
              <ul className="space-y-5 p-6">
                <li className="flex items-start gap-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Aufträge durchsuchen</p>
                    <p className="text-sm text-gray-500">Finden Sie passende Projekte in Ihrer Nähe</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Angebot erstellen</p>
                    <p className="text-sm text-gray-500">Senden Sie Ihr Angebot mit Preis und Zeitrahmen</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Bewertungen sammeln</p>
                    <p className="text-sm text-gray-500">Bauen Sie Ihren Ruf durch positive Bewertungen auf</p>
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
            Bereit loszulegen?
          </h2>
          <p className="mt-4 text-lg text-blue-200">
            Registrieren Sie sich jetzt kostenlos und starten Sie noch heute mit Foxy
          </p>
          <Link
            href="/registrieren"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-orange-500 px-10 py-3.5 text-base font-semibold text-white shadow hover:bg-orange-600 transition-colors"
          >
            Jetzt registrieren
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
