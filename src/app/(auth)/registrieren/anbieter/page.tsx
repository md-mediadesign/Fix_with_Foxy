"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LocationPicker = dynamic(
  () => import("@/components/ui/location-picker").then((m) => m.LocationPicker),
  { ssr: false, loading: () => <div className="h-[280px] animate-pulse rounded-xl bg-muted" /> }
);
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  registerProviderSchema,
  type RegisterProviderInput,
} from "@/lib/validations/auth";
import { registerProvider } from "@/actions/auth";
import { getCategories } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslations } from "@/components/locale-provider";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export default function AnbieterRegistrierenPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<RegisterProviderInput>({
    resolver: zodResolver(registerProviderSchema),
    defaultValues: {
      serviceRadius: 25,
      categoryIds: [],
    },
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch {
        toast.error(t.auth.categoriesError);
      }
    }
    fetchCategories();
  }, [t.auth.categoriesError]);

  function toggleCategory(categoryId: string) {
    setSelectedCategories((prev) => {
      const next = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
      setValue("categoryIds", next, { shouldValidate: step === 3 });
      return next;
    });
  }

  async function nextStep() {
    if (step === 1) {
      const valid = await trigger(["name", "email", "password"]);
      if (valid) setStep(2);
    } else if (step === 2) {
      const valid = await trigger([
        "phone",
        "city",
        "zipCode",
        "serviceRadius",
      ]);
      if (valid) setStep(3);
    }
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function onSubmit(data: RegisterProviderInput) {
    if (selectedCategories.length === 0) {
      toast.error(t.auth.categoriesMin);
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerProvider({
        ...data,
        categoryIds: selectedCategories,
      });

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }

      toast.success(t.auth.registerSuccess);
      router.push("/anbieter/dashboard");
    } catch {
      toast.error(t.auth.registerError);
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {t.auth.registerProviderTitle}
        </CardTitle>
        <CardDescription>
          {t.auth.registerProviderDesc}
        </CardDescription>

        {/* Step indicator */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-8 transition-colors ${
                    s < step ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {step === 1 && t.auth.step1}
          {step === 2 && t.auth.step2}
          {step === 3 && t.auth.step3}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1: Personal information */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">{t.auth.name}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t.auth.namePlaceholder}
                  autoComplete="name"
                  disabled={isLoading}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  autoComplete="email"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.auth.passwordMinHint}
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={nextStep}
                disabled={isLoading}
              >
                {t.common.next}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {/* Step 2: Business information */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  {t.auth.companyName}{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder={t.auth.companyNamePlaceholder}
                  disabled={isLoading}
                  {...register("companyName")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t.auth.phone}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t.auth.phonePlaceholder}
                  autoComplete="tel"
                  disabled={isLoading}
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Standort</Label>
                <LocationPicker
                  disabled={isLoading}
                  onLocationChange={(city, zipCode) => {
                    setValue("city", city, { shouldValidate: true });
                    setValue("zipCode", zipCode, { shouldValidate: true });
                  }}
                />
                {(errors.city || errors.zipCode) && (
                  <p className="text-sm text-destructive">
                    Bitte wähle deinen Standort auf der Karte aus.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t.auth.description}{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t.auth.descriptionPlaceholder}
                  rows={3}
                  disabled={isLoading}
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceRadius">{t.auth.serviceRadius}</Label>
                <Input
                  id="serviceRadius"
                  type="number"
                  min={1}
                  max={200}
                  placeholder="25"
                  disabled={isLoading}
                  {...register("serviceRadius", { valueAsNumber: true })}
                />
                {errors.serviceRadius && (
                  <p className="text-sm text-destructive">
                    {errors.serviceRadius.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={nextStep}
                  disabled={isLoading}
                >
                  {t.common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Category selection */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>{t.auth.categoriesLabel}</Label>
                <p className="text-sm text-muted-foreground">
                  {t.auth.categoriesDesc}
                </p>
                {errors.categoryIds && (
                  <p className="text-sm text-destructive">
                    {errors.categoryIds.message}
                  </p>
                )}
              </div>

              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((id) => {
                    const cat = categories.find((c) => c.id === id);
                    return cat ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => toggleCategory(id)}
                      >
                        {cat.name} &times;
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-3">
                {categories.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {t.auth.categoriesLoading}
                  </p>
                )}
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <span className="text-sm font-medium">
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || selectedCategories.length === 0}
                >
                  {isLoading ? t.auth.creating : t.auth.registerButton}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {t.auth.hasAccount}{" "}
          <Link
            href="/anmelden"
            className="font-medium text-primary hover:underline"
          >
            {t.auth.loginNow}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
