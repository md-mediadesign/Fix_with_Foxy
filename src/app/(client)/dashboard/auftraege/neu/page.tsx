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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Zap,
  Droplets,
  Paintbrush,
  TreePine,
  Sparkles,
  Truck,
  Hammer,
  Home,
  LayoutGrid,
  KeyRound,
  Wrench,
  MoreHorizontal,
} from "lucide-react";
import { useTranslations } from "@/components/locale-provider";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Droplets,
  Paintbrush,
  TreePine,
  Sparkles,
  Truck,
  Hammer,
  Home,
  LayoutGrid,
  KeyRound,
  Wrench,
  MoreHorizontal,
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
        const result = await createJob(data);

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
                    const IconComp = category.icon
                      ? iconMap[category.icon]
                      : null;
                    const isSelected = selectedCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setValue("categoryId", category.id)}
                        className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors hover:bg-muted/50 ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted/30"
                        }`}
                      >
                        {IconComp && (
                          <IconComp
                            className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                          />
                        )}
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
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
