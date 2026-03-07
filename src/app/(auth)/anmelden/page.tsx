"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";
import { Hammer } from "lucide-react";

export default function AnmeldenPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      toast.success("Erfolgreich angemeldet!");
      router.refresh();
      const role = result.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "PROVIDER") router.push("/anbieter/dashboard");
      else router.push("/dashboard");
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
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

      <h1 className="text-center text-3xl font-bold text-gray-900">Anmelden</h1>
      <p className="mt-2 text-center text-gray-500">Melden Sie sich mit Ihrem Konto an</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">E-Mail</label>
          <input
            type="email"
            placeholder="ihre@email.de"
            autoComplete="email"
            disabled={isLoading}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Passwort</label>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            {...register("password")}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-full bg-orange-500 py-3.5 text-base font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Wird angemeldet…" : "Anmelden"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Noch kein Konto?{" "}
        <Link href="/registrieren" className="font-medium text-blue-600 hover:underline">
          Jetzt registrieren
        </Link>
      </p>
    </div>
  );
}
