import Link from "next/link";
import Image from "next/image";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getServerTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image
          src="/foxy-head.png"
          alt="Foxy Logo"
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
          unoptimized
        />
        <span className="text-2xl font-bold">
          <span className="text-blue-900">Fix it with </span>
          <span className="text-orange-500">Foxy</span>
        </span>
      </Link>

      <div className="w-full max-w-lg">{children}</div>

      <p className="mt-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Fix it with Foxy. {t.footer.allRightsReserved}
      </p>
    </div>
  );
}
