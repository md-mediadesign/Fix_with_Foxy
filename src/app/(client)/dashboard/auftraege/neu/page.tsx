"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { createJobSchema, type CreateJobInput } from "@/lib/validations/job";
import { createJob, publishJob } from "@/actions/jobs";

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  { ssr: false }
);
import { getCategories } from "@/actions/categories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ImagePlus,
  X,
  Wrench,
} from "lucide-react";
import { useTranslations } from "@/components/locale-provider";

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

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export default function NewJobPage() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const urgencyLabels: Record<string, string> = {
    low: t.jobs.urgencyLow,
    normal: t.jobs.urgencyMedium,
    high: t.jobs.urgencyHigh,
    urgent: t.jobs.urgencyUrgent,
  };

  const form = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      city: "",
      zipCode: "",
      budgetMin: undefined,
      budgetMax: undefined,
      desiredDate: undefined,
      urgency: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats.filter((c) => c.slug !== "marketing" && c.slug !== "mediadesign"));
      setLoadingCategories(false);
    });
  }, []);

  async function goToStep2() {
    const valid = await trigger("categoryId");
    if (valid) setStep(2);
  }

  async function goToStep3() {
    const valid = await trigger(["title", "description", "city", "zipCode"]);
    if (valid) setStep(3);
  }

  function onSubmit(data: CreateJobInput) {
    startTransition(async () => {
      try {
        const result = await createJob(data, imageUrls);

        if (result.error) {
          toast.error(result.error);
          return;
        }

        if (!result.jobId) {
          toast.error(t.jobs.publishError);
          return;
        }

        const publishResult = await publishJob(result.jobId);

        if (publishResult.error) {
          toast.error(publishResult.error);
          return;
        }

        toast.success(t.jobs.publishSuccess);
        router.push(`/dashboard/auftraege/${result.jobId}`);
      } catch {
        toast.error(t.jobs.publishError);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.jobs.createTitle}</h2>
        <p className="text-muted-foreground">
          {t.jobs.stepCategory} &rarr; {t.jobs.stepDetails} &rarr; {t.jobs.stepConfirm}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                    ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span
              className={`hidden text-sm sm:block ${
                s === step ? "font-medium" : "text-muted-foreground"
              }`}
            >
              {s === 1 ? t.jobs.stepCategory : s === 2 ? t.jobs.stepDetails : t.jobs.stepConfirm}
            </span>
            {s < 3 && (
              <Separator className="mx-2 w-8" orientation="horizontal" />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Category selection */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.jobs.stepCategory}</CardTitle>
              <CardDescription>
                {t.jobs.selectCategory}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {categories.map((category) => {
                    const img = CATEGORY_IMAGES[category.slug];
                    const isSelected = selectedCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setValue("categoryId", category.id)}
                        className={`overflow-hidden rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-primary shadow-md"
                            : "border-transparent bg-muted/30 hover:border-muted-foreground/30"
                        }`}
                      >
                        {img ? (
                          <div className="relative aspect-video bg-muted/20">
                            <Image src={img} alt={category.name} fill className="object-contain p-1" />
                          </div>
                        ) : (
                          <div className="flex aspect-video items-center justify-center bg-muted/30 text-2xl">
                            <Wrench className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="p-2.5">
                          <p className="text-xs font-semibold">{category.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {errors.categoryId && (
                <p className="mt-2 text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
              <div className="mt-6 flex justify-end">
                <Button
                  type="button"
                  onClick={goToStep2}
                  disabled={!selectedCategoryId}
                >
                  {t.common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Job details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.jobs.stepDetails}</CardTitle>
              <CardDescription>
                {t.jobs.descriptionPlaceholder}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t.jobs.title} *</Label>
                <Input
                  id="title"
                  placeholder={t.jobs.titlePlaceholder}
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.jobs.description} *</Label>
                <Textarea
                  id="description"
                  placeholder={t.jobs.descriptionPlaceholder}
                  rows={5}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.jobs.city} / {t.jobs.zipCode} *</Label>
                <LocationPicker
                  onLocationChange={({ city, zipCode }) => {
                    if (city) setValue("city", city);
                    if (zipCode) setValue("zipCode", zipCode);
                  }}
                />
                {/* Hidden fallback inputs for manual entry */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <Input
                      placeholder={t.auth.cityPlaceholder}
                      {...register("city")}
                    />
                    {errors.city && (
                      <p className="text-xs text-destructive">{errors.city.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder={t.auth.zipCodePlaceholder}
                      {...register("zipCode")}
                    />
                    {errors.zipCode && (
                      <p className="text-xs text-destructive">{errors.zipCode.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.jobs.projectImages}</Label>
                <div className="flex flex-wrap gap-2">
                  {imageUrls.map((url, i) => (
                    <div key={url} className="relative h-20 w-20">
                      <Image
                        src={url}
                        alt={`Bild ${i + 1}`}
                        fill
                        className="rounded-lg border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length < 5 && (
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50">
                      {uploadingImages ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-5 w-5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingImages}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImages(true);
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          const json = await res.json();
                          if (json.url) setImageUrls((prev) => [...prev, json.url]);
                          else toast.error(json.error ?? "Upload fehlgeschlagen.");
                          setUploadingImages(false);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t.jobs.projectImagesHint}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetMin">{t.jobs.budgetMin}</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    min={0}
                    placeholder="z.B. 500"
                    {...register("budgetMin", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetMax">{t.jobs.budgetMax}</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    min={0}
                    placeholder="z.B. 2000"
                    {...register("budgetMax", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desiredDate">{t.jobs.desiredDate}</Label>
                <Input
                  id="desiredDate"
                  type="date"
                  {...register("desiredDate")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.jobs.urgency}</Label>
                <Select
                  value={watch("urgency") ?? ""}
                  onValueChange={(val) =>
                    setValue("urgency", val as CreateJobInput["urgency"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.jobs.urgency} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(urgencyLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button type="button" onClick={goToStep3}>
                  {t.common.next}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t.jobs.stepConfirm}</CardTitle>
              <CardDescription>
                {t.jobs.review}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedCategory?.name ?? t.jobs.category}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold">{watch("title")}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {watch("description")}
                </p>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t.jobs.city}:</span>{" "}
                    {watch("city")}
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t.jobs.zipCode}:</span>{" "}
                    {watch("zipCode")}
                  </div>
                  {(watch("budgetMin") || watch("budgetMax")) && (
                    <div>
                      <span className="text-muted-foreground">{t.jobs.budget}:</span>{" "}
                      {watch("budgetMin")
                        ? `${watch("budgetMin")} ${t.common.euro}`
                        : "k.A."}{" "}
                      -{" "}
                      {watch("budgetMax")
                        ? `${watch("budgetMax")} ${t.common.euro}`
                        : "k.A."}
                    </div>
                  )}
                  {watch("desiredDate") && (
                    <div>
                      <span className="text-muted-foreground">
                        {t.jobs.desiredDate}:
                      </span>{" "}
                      {watch("desiredDate")}
                    </div>
                  )}
                  {watch("urgency") && (
                    <div>
                      <span className="text-muted-foreground">
                        {t.jobs.urgency}:
                      </span>{" "}
                      {urgencyLabels[watch("urgency")!]}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.common.back}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.jobs.publishing}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {t.jobs.publishJob}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
