"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Eye, EyeOff, X, Upload, Plus } from "lucide-react";
import { useTranslations } from "@/components/locale-provider";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

const SERVICE_RADIUS_OPTIONS = [5, 10, 20, 25, 30, 50, 100];
const TOTAL_STEPS = 6;

export default function AnbieterRegistrierenPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customRadius, setCustomRadius] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [qualificationInput, setQualificationInput] = useState("");
  const [portfolioImages, setPortfolioImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      services: [],
      qualifications: [],
      portfolioImageUrls: [],
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

  useEffect(() => {
    return () => {
      portfolioImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [portfolioImages]);

  function toggleCategory(categoryId: string) {
    setSelectedCategories((prev) => {
      const next = prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId];
      setValue("categoryIds", next, { shouldValidate: step === 6 });
      return next;
    });
  }

  function addService() {
    const trimmed = serviceInput.trim();
    if (!trimmed || services.includes(trimmed)) return;
    const next = [...services, trimmed];
    setServices(next);
    setValue("services", next);
    setServiceInput("");
  }

  function removeService(s: string) {
    const next = services.filter((x) => x !== s);
    setServices(next);
    setValue("services", next);
  }

  function addQualification() {
    const trimmed = qualificationInput.trim();
    if (!trimmed || qualifications.includes(trimmed)) return;
    const next = [...qualifications, trimmed];
    setQualifications(next);
    setValue("qualifications", next);
    setQualificationInput("");
  }

  function removeQualification(q: string) {
    const next = qualifications.filter((x) => x !== q);
    setQualifications(next);
    setValue("qualifications", next);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 10 - portfolioImages.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPortfolioImages((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePortfolioImage(index: number) {
    setPortfolioImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function nextStep() {
    if (step === 1) {
      const valid = await trigger(["name", "email", "password", "phone"]);
      if (valid) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      const valid = await trigger(["city", "zipCode", "serviceRadius"]);
      if (valid) setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      setStep(6);
    }
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  async function uploadImages(): Promise<string[]> {
    const urls: string[] = [];
    for (const img of portfolioImages) {
      const formData = new FormData();
      formData.append("file", img.file);
      const res = await fetch("/api/upload/register", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        urls.push(data.url);
      }
    }
    return urls;
  }

  async function onSubmit(data: RegisterProviderInput) {
    if (selectedCategories.length === 0) {
      toast.error(t.auth.categoriesMin);
      return;
    }

    setIsLoading(true);

    try {
      const portfolioImageUrls = portfolioImages.length > 0 ? await uploadImages() : [];

      const result = await registerProvider({
        ...data,
        categoryIds: selectedCategories,
        services,
        qualifications,
        portfolioImageUrls,
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
        <div className="mt-4 flex items-center justify-center gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s}
              </div>
              {s < TOTAL_STEPS && (
                <div
                  className={`h-0.5 w-5 transition-colors ${
                    s < step ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          {step === 1 && "Konto & Kontakt"}
          {step === 2 && "Über mich"}
          {step === 3 && "Standort & Einsatzgebiet"}
          {step === 4 && "Portfolio-Bilder"}
          {step === 5 && "Dienstleistungen"}
          {step === 6 && "Qualifikationen & Kategorien"}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Step 1: Account & Contact */}
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
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

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
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.auth.passwordMinHint}
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="pr-10"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
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
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappPhone">
                  WhatsApp{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <Input
                  id="whatsappPhone"
                  type="tel"
                  placeholder="+49 151 12345678"
                  disabled={isLoading}
                  {...register("whatsappPhone")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxNumber">
                  Steuernummer / USt-IdNr.{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <Input
                  id="taxNumber"
                  type="text"
                  placeholder="DE123456789"
                  disabled={isLoading}
                  {...register("taxNumber")}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Telefon und WhatsApp sind nur für Kunden sichtbar, denen du ein Angebot gemacht hast.
              </p>

              <Button type="button" className="w-full" onClick={nextStep} disabled={isLoading}>
                {t.common.next}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {/* Step 2: About me */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="description">
                  {t.auth.description}{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={t.auth.descriptionPlaceholder}
                  rows={6}
                  disabled={isLoading}
                  {...register("description")}
                />
                <p className="text-xs text-muted-foreground">
                  Beschreibe deine Erfahrung, Stärken und was dich als Handwerker auszeichnet.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={prevStep} disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button type="button" className="flex-1" onClick={nextStep} disabled={isLoading}>
                  {t.common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <>
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
                <Label>{t.auth.serviceRadius}</Label>
                <Select
                  disabled={isLoading}
                  defaultValue="25"
                  onValueChange={(val) => {
                    if (val === "custom") {
                      setCustomRadius(true);
                    } else {
                      setCustomRadius(false);
                      setValue("serviceRadius", Number(val), { shouldValidate: true });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Einsatzradius wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_RADIUS_OPTIONS.map((r) => (
                      <SelectItem key={r} value={String(r)}>
                        {r} km
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Individuell</SelectItem>
                  </SelectContent>
                </Select>
                {customRadius && (
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    placeholder="Radius in km"
                    disabled={isLoading}
                    {...register("serviceRadius", { valueAsNumber: true })}
                  />
                )}
                {errors.serviceRadius && (
                  <p className="text-sm text-destructive">{errors.serviceRadius.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={prevStep} disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button type="button" className="flex-1" onClick={nextStep} disabled={isLoading}>
                  {t.common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 4: Portfolio images */}
          {step === 4 && (
            <>
              <div className="space-y-2">
                <Label>
                  Portfolio-Bilder{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Lade bis zu 10 Bilder deiner Arbeit hoch (max. 5 MB pro Bild).
                </p>
              </div>

              {portfolioImages.length < 10 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <Upload className="h-5 w-5" />
                    Bilder auswählen
                  </button>
                </div>
              )}

              {portfolioImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {portfolioImages.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                      <Image
                        src={img.preview}
                        alt={`Bild ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePortfolioImage(i)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={prevStep} disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button type="button" className="flex-1" onClick={nextStep} disabled={isLoading}>
                  {t.common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 5: Services */}
          {step === 5 && (
            <>
              <div className="space-y-2">
                <Label>
                  Dienstleistungen{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Füge deine Dienstleistungen als Tags hinzu (Enter zum Bestätigen).
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="z.B. Fliesenlegen, Badezimmer"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addService();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addService} disabled={isLoading}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 pr-1">
                      {s}
                      <button
                        type="button"
                        onClick={() => removeService(s)}
                        className="ml-1 rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={prevStep} disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button type="button" className="flex-1" onClick={nextStep} disabled={isLoading}>
                  {t.common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 6: Qualifications & Categories */}
          {step === 6 && (
            <>
              <div className="space-y-2">
                <Label>
                  Qualifikationen & Zertifikate{" "}
                  <span className="text-muted-foreground">({t.common.optional})</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Füge Qualifikationen, Zertifikate oder Ausbildungen hinzu (Enter zum Bestätigen).
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="z.B. Meister im Fliesenlegerhandwerk"
                    value={qualificationInput}
                    onChange={(e) => setQualificationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addQualification();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addQualification} disabled={isLoading}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {qualifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {qualifications.map((q) => (
                      <Badge key={q} variant="secondary" className="gap-1 pr-1">
                        {q}
                        <button
                          type="button"
                          onClick={() => removeQualification(q)}
                          className="ml-1 rounded-full hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.auth.categoriesLabel}</Label>
                <p className="text-sm text-muted-foreground">{t.auth.categoriesDesc}</p>
                {errors.categoryIds && (
                  <p className="text-sm text-destructive">{errors.categoryIds.message}</p>
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

              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
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
                    <span className="text-sm font-medium">{category.name}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={prevStep} disabled={isLoading}>
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
          <Link href="/anmelden" className="font-medium text-primary hover:underline">
            {t.auth.loginNow}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
