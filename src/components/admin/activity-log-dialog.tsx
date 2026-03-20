"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type LogEntry = {
  id: string;
  action: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

const ACTION_LABELS: Record<string, string> = {
  REGISTER: "Registrierung",
  LOGIN: "Anmeldung",
  PROFILE_UPDATE: "Datenänderung",
  PASSWORD_CHANGE: "Passwortänderung",
  JOB_PUBLISHED: "Auftrag eingestellt",
  BID_AWARDED: "Auftrag vergeben",
  REVIEW_CREATED: "Bewertung abgegeben",
  MESSAGE_SENT: "Nachricht versandt",
};

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  REGISTER: "default",
  LOGIN: "secondary",
  PROFILE_UPDATE: "outline",
  PASSWORD_CHANGE: "destructive",
  JOB_PUBLISHED: "default",
  BID_AWARDED: "default",
  REVIEW_CREATED: "secondary",
  MESSAGE_SENT: "outline",
};

export function ActivityLogDialog() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity-logs?limit=200");
      const data = await res.json();
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (value) fetchLogs();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScrollText className="h-4 w-4" />
          Aktivitätslog
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Benutzeraktivitäten</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Wird geladen…</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left">
                  <th className="pb-3 pt-2 font-medium text-muted-foreground">Benutzer</th>
                  <th className="pb-3 pt-2 font-medium text-muted-foreground">Rolle</th>
                  <th className="pb-3 pt-2 font-medium text-muted-foreground">Aktion</th>
                  <th className="pb-3 pt-2 font-medium text-muted-foreground">Details</th>
                  <th className="pb-3 pt-2 font-medium text-muted-foreground whitespace-nowrap">Datum</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2">
                      <p className="font-medium">{log.user.name}</p>
                      <p className="text-xs text-muted-foreground">{log.user.email}</p>
                    </td>
                    <td className="py-2 text-muted-foreground text-xs">{log.user.role}</td>
                    <td className="py-2">
                      <Badge variant={ACTION_COLORS[log.action] ?? "secondary"}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </td>
                    <td className="py-2 text-xs text-muted-foreground max-w-[200px]">
                      {log.action === "MESSAGE_SENT" && log.meta?.recipientId
                        ? `→ Empfänger-ID: ${String(log.meta.recipientId).slice(0, 8)}…`
                        : log.meta?.jobId
                        ? `Job: ${String(log.meta.jobId).slice(0, 8)}…`
                        : "–"}
                    </td>
                    <td className="py-2 text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd.MM.yy HH:mm", { locale: de })}
                    </td>
                  </tr>
                ))}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Noch keine Aktivitäten vorhanden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {logs.length > 0 && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            {logs.length} Einträge (max. 200)
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
