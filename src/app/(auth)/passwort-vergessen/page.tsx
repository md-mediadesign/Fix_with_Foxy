"use client";

import { useState } from "react";
import Link from "next/link";
import { Hammer } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/actions/password-reset";
import { useTranslations } from "@/components/locale-provider";

export default function PasswortVergessenPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const t = useTranslations();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      toast.error(t.auth.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
      <div className="mb-5 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <Hammer className="h-7 w-7 text-blue-600" />
        </div>
      </div>

      <h1 className="text-center text-3xl font-bold text-gray-900">{t.auth.forgotPasswordTitle}</h1>
      <p className="mt-2 text-center text-gray-500">{t.auth.forgotPasswordDesc}</p>

      {sent ? (
        <div className="mt-7 rounded-xl bg-green-50 px-4 py-4 text-center text-sm text-green-700">
          {t.auth.forgotPasswordSuccess}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t.auth.email}</label>
            <input
              type="email"
              placeholder={t.auth.emailPlaceholder}
              autoComplete="email"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? t.auth.forgotPasswordSending : t.auth.forgotPasswordButton}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/anmelden" className="font-medium text-blue-600 hover:underline">
          {t.auth.backToLogin}
        </Link>
      </p>
    </div>
  );
}
