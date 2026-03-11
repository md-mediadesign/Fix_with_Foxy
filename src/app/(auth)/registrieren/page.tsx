"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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

type Category = { id: string; name: string; slug: string; icon: string | null };

const CATEGORY_IMAGES: Record<string, string> = {
  reinigung: "/categories/cleaner.png",
  "garten-landschaft": "/categories/gaertner.png",
  "malerei-lackierung": "/categories/maler.png",
  "montage-aufbau": "/categories/montage.jpg",
  elektrik: "/categories/elektrik.png",
  "sanitaer-heizung": "/categories/sanitaer.png",
  "dach-fassade": "/categories/dach.png",
  schluesseldienst: "/categories/schluesseldienst.png",
  "umzug-transport": "/categories/umzug.png",
};

const CATEGORY_DESCS: Record<string, string> = {
  reinigung: "Professionelle Reinigungsdienste für Ihr Zuhause oder Büro.",
  "garten-landschaft": "Gartenpflege, Landschaftsbau und Außenanlagen.",
  "malerei-lackierung": "Innen- und Außenanstriche, Tapezieren und Lackieren.",
  "montage-aufbau": "Allgemeine Reparaturen und Instandhaltung im Haus.",
  elektrik: "Elektroinstallationen, Reparaturen und Wartung.",
  "sanitaer-heizung": "Sanitärinstallationen, Rohrreinigung und Reparaturen.",
  "dach-fassade": "Dachreparaturen, Dachrinnen und Fassadenarbeiten.",
  schluesseldienst: "Türöffnung, Schlossaustausch und Einbruchschutz.",
  "umzug-transport": "Umzugsservice, Möbeltransport und Entrümpelung.",
};

export default function RegistrierenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "handwerker" ? "handwerker" : "auftraggeber";
  const [activeTab, setActiveTab] = useState<"auftraggeber" | "handwerker">(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
    if (selectedCategories.length === 0) { toast.error("Bitte wähle mindestens eine Kategorie."); return; }
    setIsLoading(true);
    try {
      const result = await registerProvider({ ...data, categoryIds: selectedCategories });
      if (result.error) { toast.error(result.error); setIsLoading(false); return; }
      await signIn("credentials", { email: data.email, password: data.password, callbackUrl: "/anbieter/dashboard" });
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
        <h1 className="text-3xl font-bold text-blue-900">Registrieren</h1>
        <p className="mt-2 text-gray-500">Wählen Sie Ihren Kontotyp und werden Sie Teil der Foxy-Community</p>
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
            🏠 Auftraggeber
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("handwerker")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "handwerker" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🦊 Handwerker
          </button>
        </div>
      </div>

      {/* Auftraggeber Form */}
      {activeTab === "auftraggeber" && (
        <form onSubmit={handleSubmitC(onSubmitClient)} className="space-y-5 px-8 py-6">
          <div>
            <label className={labelCls}>Name</label>
            <input type="text" placeholder="Max Mustermann" autoComplete="name" disabled={isLoading} className={inputCls} {...registerC("name")} />
            {errorsC.name && <p className={errorCls}>{errorsC.name.message}</p>}
          </div>
          <div>
            <label className={labelCls}>E-Mail</label>
            <input type="email" placeholder="max@beispiel.de" autoComplete="email" disabled={isLoading} className={inputCls} {...registerC("email")} />
            {errorsC.email && <p className={errorCls}>{errorsC.email.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Passwort</label>
            <input type="password" placeholder="Mindestens 8 Zeichen" autoComplete="new-password" disabled={isLoading} className={inputCls} {...registerC("password")} />
            {errorsC.password && <p className={errorCls}>{errorsC.password.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Stadt</label>
            <input type="text" placeholder="Berlin" disabled={isLoading} className={inputCls} {...registerC("city")} />
            {errorsC.city && <p className={errorCls}>{errorsC.city.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Wird erstellt…" : "Als Auftraggeber registrieren"}
          </button>
        </form>
      )}

      {/* Handwerker Form */}
      {activeTab === "handwerker" && (
        <form onSubmit={handleSubmitP(onSubmitProvider)} className="space-y-5 px-8 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name / Firmenname</label>
              <input type="text" placeholder="Max Mustermann" autoComplete="name" disabled={isLoading} className={inputCls} {...registerP("name")} />
              {errorsP.name && <p className={errorCls}>{errorsP.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>E-Mail</label>
              <input type="email" placeholder="max@beispiel.de" autoComplete="email" disabled={isLoading} className={inputCls} {...registerP("email")} />
              {errorsP.email && <p className={errorCls}>{errorsP.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Passwort</label>
              <input type="password" placeholder="Mindestens 8 Zeichen" autoComplete="new-password" disabled={isLoading} className={inputCls} {...registerP("password")} />
              {errorsP.password && <p className={errorCls}>{errorsP.password.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Stadt / Einsatzgebiet</label>
              <input type="text" placeholder="Berlin" disabled={isLoading} className={inputCls} {...registerP("city")} />
              {errorsP.city && <p className={errorCls}>{errorsP.city.message}</p>}
            </div>
          </div>

          {/* Category selection */}
          <div>
            <h3 className="mb-1 text-base font-bold text-blue-900">Wählen Sie Ihre Handwerkskategorien</h3>
            <p className="mb-4 text-sm text-gray-500">Wählen Sie mindestens eine Kategorie aus, in der Sie Aufträge erhalten möchten.</p>
            {errorsP.categoryIds && (
              <p className="mb-3 text-sm text-orange-500">Bitte wählen Sie mindestens eine Kategorie.</p>
            )}
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const img = CATEGORY_IMAGES[cat.slug];
                const desc = CATEGORY_DESCS[cat.slug];
                const isSelected = selectedCategories.includes(cat.id);
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
                      <p className="text-xs font-bold text-blue-900">{cat.name}</p>
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
            {isLoading ? "Wird erstellt…" : "Als Handwerker registrieren"}
          </button>
        </form>
      )}

      <div className="border-t border-gray-100 px-8 py-5 text-center text-sm text-gray-500">
        Bereits registriert?{" "}
        <Link href="/anmelden" className="font-semibold text-orange-500 hover:underline">
          Jetzt anmelden
        </Link>
      </div>
    </div>
  );
}
