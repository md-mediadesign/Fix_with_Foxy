"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { editReview } from "@/actions/admin";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

interface ReviewEditFormProps {
  reviewId: string;
  initialRating: number;
  initialTitle: string | null;
  initialComment: string | null;
  providerName: string;
  jobTitle: string;
}

export function ReviewEditForm({
  reviewId,
  initialRating,
  initialTitle,
  initialComment,
  providerName,
  jobTitle,
}: ReviewEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(String(initialRating));
  const [title, setTitle] = useState(initialTitle ?? "");
  const [comment, setComment] = useState(initialComment ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      toast.error("Bewertung muss zwischen 1 und 5 liegen.");
      return;
    }

    startTransition(async () => {
      try {
        await editReview(reviewId, {
          rating: ratingNum,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        });
        toast.success("Bewertung erfolgreich gespeichert.");
        router.push("/admin/bewertungen");
      } catch {
        toast.error("Fehler beim Speichern der Bewertung.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-1 text-sm text-muted-foreground">
        <p>
          <strong>Anbieter:</strong> {providerName}
        </p>
        <p>
          <strong>Auftrag:</strong> {jobTitle}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rating">Bewertung (1–5)</Label>
        <Input
          id="rating"
          type="number"
          min={1}
          max={5}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="w-24"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Titel</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kurze Zusammenfassung"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Kommentar</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Beschreibung der Erfahrung..."
          rows={4}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/bewertungen")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Zurück
        </Button>
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4 mr-1" />
          {isPending ? "Wird gespeichert..." : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
