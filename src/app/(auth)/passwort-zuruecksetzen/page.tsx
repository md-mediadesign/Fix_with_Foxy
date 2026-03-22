"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Hammer, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { resetPasswordWithToken, validateResetToken } from "@/actions/password-reset";
import { useTranslations } from "@/components/locale-provider";

function ResetForm() {
  const t = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!token) { setIsValid(false); return; }
    validateResetToken(token).then((r) => setIsValid(r.valid));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await resetPasswordWithToken(token, password);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t.auth.resetPasswordSuccess);
        router.push("/anmelden");
      }
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

      <h1 className="text-center text-3xl font-bold text-gray-900">{t.auth.resetPasswordTitle}</h1>
      <p className="mt-2 text-center text-gray-500">{t.auth.resetPasswordDesc}</p>

      {isValid === null && (
        <p className="mt-7 text-center text-sm text-gray-400">{t.common.loading}</p>
      )}

      {isValid === false && (
        <div className="mt-7 space-y-4">
          <p className="rounded-xl bg-red-50 px-4 py-4 text-center text-sm text-red-600">
            {t.auth.resetTokenInvalid}
          </p>
          <Link
            href="/passwort-vergessen"
            className="block w-full rounded-full bg-orange-500 py-3.5 text-center text-base font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            {t.auth.forgotPasswordButton}
          </Link>
        </div>
      )}

      {isValid === true && (
        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{t.auth.newPassword}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">{t.auth.passwordMinHint}</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? t.auth.resetPasswordSaving : t.auth.resetPasswordButton}
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

export default function PasswortZuruecksetzenPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
