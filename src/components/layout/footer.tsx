import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/foxy-head.png" alt="Foxy" width={36} height={36} className="h-9 w-9 object-contain" unoptimized />
              <span className="text-lg font-bold">
                <span className="text-blue-900">Fix it with </span>
                <span className="text-orange-500">Foxy</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              Die clevere Plattform für Handwerker und Auftraggeber.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Auftraggeber</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/registrieren" className="text-sm text-gray-500 hover:text-blue-900">Kostenlos registrieren</Link></li>
              <li><Link href="/so-funktionierts" className="text-sm text-gray-500 hover:text-blue-900">So funktioniert&apos;s</Link></li>
              <li><Link href="/kategorien" className="text-sm text-gray-500 hover:text-blue-900">Kategorien</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Dienstleister</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/registrieren?tab=handwerker" className="text-sm text-gray-500 hover:text-blue-900">Als Anbieter starten</Link></li>
              <li><Link href="/preise" className="text-sm text-gray-500 hover:text-blue-900">Preise &amp; Pakete</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Rechtliches</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/impressum" className="text-sm text-gray-500 hover:text-blue-900">Impressum</Link></li>
              <li><Link href="/datenschutz" className="text-sm text-gray-500 hover:text-blue-900">Datenschutz</Link></li>
              <li><Link href="/agb" className="text-sm text-gray-500 hover:text-blue-900">AGB</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Fix it with Foxy. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
