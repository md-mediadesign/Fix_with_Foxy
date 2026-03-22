"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";
import { Hammer, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "@/components/locale-provider";

export default function AnmeldenPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    try {
      const result = await loginAction(data.email, data.password);
      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
      }
    } catch {
      toast.error(t.auth.unexpectedError);
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

      <h1 className="text-center text-3xl font-bold text-gray-900">{t.auth.loginTitle}</h1>
      <p className="mt-2 text-center text-gray-500">{t.auth.loginDesc}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t.auth.email}</label>
          <input
            type="email"
            placeholder={t.auth.emailPlaceholder}
            autoComplete="email"
            disabled={isLoading}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">{t.auth.password}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              {...register("password")}
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
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          <div className="mt-1 text-right">
            <Link href="/passwort-vergessen" className="text-xs text-blue-600 hover:underline">
              {t.auth.forgotPassword}
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? t.auth.loggingIn : t.auth.loginButton}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t.auth.noAccount}{" "}
        <Link href="/registrieren" className="font-medium text-blue-600 hover:underline">
          {t.auth.registerNow}
        </Link>
      </p>
    </div>
  );
}
