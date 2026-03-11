"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { updateJob } from "@/actions/jobs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { use } from "react";

const LocationPicker = dynamic(
  () => import("@/components/map/location-picker").then((m) => m.LocationPicker),
  { ssr: false }
);

const editJobSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  city: z.string().min(2),
  zipCode: z.string().min(4),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  desiredDate: z.string().optional(),
  urgency: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

type EditJobInput = z.infer<typeof editJobSchema>;

export default function EditJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [jobLoaded, setJobLoaded] = useState(false);

  const form = useForm<EditJobInput>({
    resolver: zodResolver(editJobSchema),
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((job) => {
        setValue("title", job.title);
        setValue("description", job.description);
        setValue("city", job.city);
        setValue("zipCode", job.zipCode);
        if (job.budgetMin) setValue("budgetMin", job.budgetMin);
        if (job.budgetMax) setValue("budgetMax", job.budgetMax);
        if (job.desiredDate) setValue("desiredDate", job.desiredDate.substring(0, 10));
        if (job.urgency) setValue("urgency", job.urgency);
        setJobLoaded(true);
      })
      .catch(() => {
        toast.error("Auftrag konnte nicht geladen werden.");
        router.push(`/dashboard/auftraege/${jobId}`);
      });
  }, [jobId]);

  function onSubmit(data: EditJobInput) {
    startTransition(async () => {
      const result = await updateJob(jobId, {
        ...data,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        desiredDate: data.desiredDate || null,
        urgency: data.urgency ?? null,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Auftrag aktualisiert.");
      router.push(`/dashboard/auftraege/${jobId}`);
    });
  }

  if (!jobLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/auftraege/${jobId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Auftrag bearbeiten</h2>
          <p className="text-muted-foreground">Ändere Beschreibung, Standort, Budget oder Zeitraum.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea id="description" rows={5} {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Standort</Label>
              <LocationPicker
                onLocationChange={({ city, zipCode }) => {
                  if (city) setValue("city", city);
                  if (zipCode) setValue("zipCode", zipCode);
                }}
              />
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1">
                  <Input placeholder="Stadt" {...register("city")} />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input placeholder="PLZ" {...register("zipCode")} />
                  {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode.message}</p>}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Budget von (€)</Label>
                <Input id="budgetMin" type="number" min={0} placeholder="z.B. 500" {...register("budgetMin", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Budget bis (€)</Label>
                <Input id="budgetMax" type="number" min={0} placeholder="z.B. 2000" {...register("budgetMax", { valueAsNumber: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desiredDate">Wunschdatum</Label>
              <Input id="desiredDate" type="date" {...register("desiredDate")} />
            </div>

            <div className="space-y-2">
              <Label>Dringlichkeit</Label>
              <Select
                value={watch("urgency") ?? ""}
                onValueChange={(val) => setValue("urgency", val as EditJobInput["urgency"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Dringlichkeit wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/auftraege/${jobId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Abbrechen
                </Link>
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichern…</>
                ) : (
                  <><Save className="mr-2 h-4 w-4" /> Speichern</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
