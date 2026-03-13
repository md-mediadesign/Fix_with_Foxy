import Link from "next/link";
import Image from "next/image";
import { getServerTranslations } from "@/lib/i18n/server";

export async function Footer() {
  const t = await getServerTranslations();

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
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t.footer.clients}</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/registrieren" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.registerFree}</Link></li>
              <li><Link href="/so-funktionierts" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.howItWorks}</Link></li>
              <li><Link href="/kategorien" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.categories}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t.footer.providers}</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/registrieren?tab=handwerker" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.startAsProvider}</Link></li>
              <li><Link href="/preise" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.pricingPackages}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t.footer.legal}</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/impressum" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.imprint}</Link></li>
              <li><Link href="/datenschutz" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.privacy}</Link></li>
              <li><Link href="/agb" className="text-sm text-gray-500 hover:text-blue-900">{t.footer.terms}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Fix it with Foxy. {t.footer.allRightsReserved}
        </div>
      </div>
    </footer>
  );
}
