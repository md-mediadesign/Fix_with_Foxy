"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  registerClientSchema,
  registerProviderSchema,
  type RegisterClientInput,
  type RegisterProviderInput,
} from "@/lib/validations/auth";
import { signIn } from "next-auth/react";
import { registerClient, registerProvider } from "@/actions/auth";
import { getCategories } from "@/actions/categories";
import { useTranslations } from "@/components/locale-provider";

type Category = { id: string; name: string; slug: string; icon: string | null };

const CATEGORY_IMAGES: Record<string, string> = {
  reinigung: "/categories/cleaner.png",
  "garten-landschaft": "/categories/gaertner.png",
  "malerei-lackierung": "/categories/maler.png",
  "montage-aufbau": "/categories/montage.png",
  elektrik: "/categories/elektrik.png",
  "sanitaer-heizung": "/categories/sanitaer.png",
  "dach-fassade": "/categories/dach.png",
  schluesseldienst: "/categories/schluesseldienst.png",
  "umzug-transport": "/categories/umzug.png",
  "schreiner-tischler": "/categories/schreiner.png",
  "fliesen-boden": "/categories/fliesen-boden.png",
};


function RegistrierenInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "handwerker" ? "handwerker" : "auftraggeber";
  const [activeTab, setActiveTab] = useState<"auftraggeber" | "handwerker">(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordClient, setShowPasswordClient] = useState(false);
  const [showPasswordProvider, setShowPasswordProvider] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const t = useTranslations();

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const {
    register: registerC,
    handleSubmit: handleSubmitC,
    formState: { errors: errorsC },
  } = useForm<RegisterClientInput>({ resolver: zodResolver(registerClientSchema) });

  const {
    register: registerP,
    handleSubmit: handleSubmitP,
    setValue: setValueP,
    formState: { errors: errorsP },
  } = useForm<RegisterProviderInput>({
    resolver: zodResolver(registerProviderSchema),
    defaultValues: { serviceRadius: 25, categoryIds: [], phone: "0000", zipCode: "00000" },
  });

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setValueP("categoryIds", next);
      return next;
    });
  }

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

  async function onSubmitProvider(data: RegisterProviderInput) {
    if (selectedCategories.length === 0) { toast.error(t.auth.categoriesMin); return; }
    setIsLoading(true);
    try {
      const result = await registerProvider({ ...data, categoryIds: selectedCategories });
      if (result.error) { toast.error(result.error); setIsLoading(false); return; }
      await signIn("credentials", { email: data.email, password: data.password, callbackUrl: "/anbieter/auftraege" });
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

      {/* Handwerker Form */}
      {activeTab === "handwerker" && (
        <form onSubmit={handleSubmitP(onSubmitProvider)} className="space-y-5 px-8 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.auth.nameOrCompany}</label>
              <input type="text" placeholder={t.auth.namePlaceholder} autoComplete="name" disabled={isLoading} className={inputCls} {...registerP("name")} />
              {errorsP.name && <p className={errorCls}>{errorsP.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>{t.auth.email}</label>
              <input type="email" placeholder={t.auth.emailPlaceholder} autoComplete="email" disabled={isLoading} className={inputCls} {...registerP("email")} />
              {errorsP.email && <p className={errorCls}>{errorsP.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t.auth.password}</label>
              <div className="relative">
                <input type={showPasswordProvider ? "text" : "password"} placeholder={t.auth.passwordMinHint} autoComplete="new-password" disabled={isLoading} className={`${inputCls} pr-10`} {...registerP("password")} />
                <button type="button" tabIndex={-1} onClick={() => setShowPasswordProvider((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                  {showPasswordProvider ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errorsP.password && <p className={errorCls}>{errorsP.password.message}</p>}
            </div>
            <div>
              <label className={labelCls}>{t.auth.cityArea}</label>
              <input type="text" placeholder={t.auth.cityPlaceholder} disabled={isLoading} className={inputCls} {...registerP("city")} />
              {errorsP.city && <p className={errorCls}>{errorsP.city.message}</p>}
            </div>
          </div>

          {/* Category selection */}
          <div>
            <h3 className="mb-1 text-base font-bold text-blue-900">{t.auth.categoriesTitle}</h3>
            <p className="mb-4 text-sm text-gray-500">{t.auth.categoriesDesc}</p>
            {errorsP.categoryIds && (
              <p className="mb-3 text-sm text-orange-500">{t.auth.categoriesMin}</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const img = CATEGORY_IMAGES[cat.slug];
                const desc = (t.categoryDescs as Record<string, string>)[cat.slug];
                const isSelected = selectedCategories.includes(cat.id);
                const translatedName = (t.categoryNames as Record<string, string>)[cat.slug] ?? cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`overflow-hidden rounded-xl border-2 text-left transition-all ${
                      isSelected ? "border-blue-500 shadow-md" : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {img ? (
                      <div className="relative aspect-video bg-gray-50">
                        <Image src={img} alt={cat.name} fill className="object-contain p-1" />
                      </div>
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-blue-50 text-3xl">🔧</div>
                    )}
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-blue-900">{translatedName}</p>
                      {desc && <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{desc}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-blue-900 py-3.5 text-base font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? t.auth.creating : t.auth.registerProviderBtn}
          </button>
        </form>
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
