"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  registerClientSchema,
  type RegisterClientInput,
} from "@/lib/validations/auth";
import { signIn } from "next-auth/react";
import { registerClient } from "@/actions/auth";
import { useTranslations } from "@/components/locale-provider";

function RegistrierenInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "handwerker" ? "handwerker" : "auftraggeber";
  const [activeTab, setActiveTab] = useState<"auftraggeber" | "handwerker">(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordClient, setShowPasswordClient] = useState(false);
  const t = useTranslations();

  const {
    register: registerC,
    handleSubmit: handleSubmitC,
    formState: { errors: errorsC },
  } = useForm<RegisterClientInput>({ resolver: zodResolver(registerClientSchema) });

  async function onSubmitClient(data: RegisterClientInput) {
    setIsLoading(true);
    try {
      const result = await registerClient(data);
      if (result.error) { toast.error(result.error); setIsLoading(false); return; }
      await signIn("credentials", { email: data.email, password: data.password, callbackUrl: "/dashboard" });
    } catch {
      toast.error("Ein Fehler ist aufgetreten.");
      setIsLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50";
  const labelCls = "mb-1.5 block text-sm font-semibold text-blue-900";
  const errorCls = "mt-1 text-xs text-red-500";

  return (
    <div className="rounded-2xl border-t-4 border-orange-500 bg-white shadow-md">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 text-center">
        <div className="flex justify-center mb-4">
          <Image src="/foxy-head.png" alt="Foxy" width={64} height={64} className="h-16 w-16 object-contain" unoptimized />
        </div>
        <h1 className="text-3xl font-bold text-blue-900">{t.auth.registerTitle}</h1>
        <p className="mt-2 text-gray-500">{t.auth.registerSubtitle}</p>
      </div>

      {/* Tabs */}
      <div className="px-8 pb-2">
        <div className="flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("auftraggeber")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "auftraggeber" ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🏠 {t.auth.clientTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("handwerker")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "handwerker" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🦊 {t.auth.providerTab}
          </button>
        </div>
      </div>

      {/* Auftraggeber Form */}
      {activeTab === "auftraggeber" && (
        <form onSubmit={handleSubmitC(onSubmitClient)} className="space-y-5 px-8 py-6">
          <div>
            <label className={labelCls}>{t.auth.name}</label>
            <input type="text" placeholder={t.auth.namePlaceholder} autoComplete="name" disabled={isLoading} className={inputCls} {...registerC("name")} />
            {errorsC.name && <p className={errorCls}>{errorsC.name.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t.auth.email}</label>
            <input type="email" placeholder={t.auth.emailPlaceholder} autoComplete="email" disabled={isLoading} className={inputCls} {...registerC("email")} />
            {errorsC.email && <p className={errorCls}>{errorsC.email.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t.auth.password}</label>
            <div className="relative">
              <input type={showPasswordClient ? "text" : "password"} placeholder={t.auth.passwordMinHint} autoComplete="new-password" disabled={isLoading} className={`${inputCls} pr-10`} {...registerC("password")} />
              <button type="button" tabIndex={-1} onClick={() => setShowPasswordClient((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                {showPasswordClient ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errorsC.password && <p className={errorCls}>{errorsC.password.message}</p>}
          </div>
          <div>
            <label className={labelCls}>{t.auth.city}</label>
            <input type="text" placeholder={t.auth.cityPlaceholder} disabled={isLoading} className={inputCls} {...registerC("city")} />
            {errorsC.city && <p className={errorCls}>{errorsC.city.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? t.auth.creating : t.auth.registerClientBtn}
          </button>
        </form>
      )}

      {/* Handwerker CTA */}
      {activeTab === "handwerker" && (
        <div className="px-8 py-8 text-center space-y-5">
          <div className="rounded-xl bg-blue-50 p-5">
            <p className="text-sm font-semibold text-blue-900 mb-1">Detailliertes Profil in 6 Schritten</p>
            <p className="text-sm text-gray-500">
              Beschreibung, Portfolio-Bilder, Standort, Dienstleistungen und Qualifikationen – alles was Auftraggeber sehen wollen.
            </p>
          </div>
          <Link
            href="/registrieren/anbieter"
            className="block w-full rounded-full bg-blue-900 py-3.5 text-base font-semibold text-white text-center hover:bg-blue-800 transition-colors"
          >
            Jetzt als Handwerker registrieren →
          </Link>
        </div>
      )}

      <div className="border-t border-gray-100 px-8 py-5 text-center text-sm text-gray-500">
        {t.auth.hasAccount}{" "}
        <Link href="/anmelden" className="font-semibold text-orange-500 hover:underline">
          {t.auth.loginNow}
        </Link>
      </div>
    </div>
  );
}

export default function RegistrierenPage() {
  return (
    <Suspense>
      <RegistrierenInner />
    </Suspense>
  );
}
