"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold text-destructive">Fehler auf Admin-Seite</h2>
      <pre className="rounded bg-muted p-4 text-sm overflow-auto whitespace-pre-wrap">
        {error.message}
        {"\n\n"}
        {error.stack}
      </pre>
      <button
        onClick={reset}
        className="w-fit rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Neu laden
      </button>
    </div>
  );
}
