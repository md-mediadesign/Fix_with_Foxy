"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfDay, endOfDay, subDays, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

type Range = "all" | "today" | "week" | "custom";

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

export default function AktivitaetslogPage() {
  const [range, setRange] = useState<Range>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    let from: string | null = null;
    let to: string | null = null;

    const now = new Date();

    if (range === "all") {
      // no date filter
    } else if (range === "today") {
      from = startOfDay(now).toISOString();
      to = endOfDay(now).toISOString();
    } else if (range === "week") {
      from = startOfWeek(subDays(now, 6), { locale: de }).toISOString();
      from = subDays(now, 6).toISOString();
      to = endOfDay(now).toISOString();
    } else if (range === "custom") {
      if (!customFrom && !customTo) return;
      if (customFrom) from = startOfDay(new Date(customFrom)).toISOString();
      if (customTo) to = endOfDay(new Date(customTo)).toISOString();
    }

    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (range !== "custom") {
      fetchLogs();
    }
  }, [range, fetchLogs]);

  useEffect(() => {
    if (range === "custom") return;
    const id = setInterval(fetchLogs, 60_000);
    return () => clearInterval(id);
  }, [range, fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Aktivitätslog</h2>
        <p className="text-muted-foreground">Alle Benutzeraktivitäten im System</p>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Zeitraum</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={range === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setRange("all")}
            >
              Alle
            </Button>
            <Button
              variant={range === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setRange("today")}
            >
              Heute
            </Button>
            <Button
              variant={range === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setRange("week")}
            >
              Vergangene Woche
            </Button>
            <Button
              variant={range === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setRange("custom")}
            >
              Benutzerdefiniert
            </Button>
          </div>

          {range === "custom" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Von</label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Bis</label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button size="sm" onClick={fetchLogs}>
                Anzeigen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Wird geladen…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pt-4 font-medium text-muted-foreground">Benutzer</th>
                    <th className="pb-3 pt-4 font-medium text-muted-foreground">Rolle</th>
                    <th className="pb-3 pt-4 font-medium text-muted-foreground">Aktion</th>
                    <th className="pb-3 pt-4 font-medium text-muted-foreground">Details</th>
                    <th className="pb-3 pt-4 font-medium text-muted-foreground whitespace-nowrap">Datum & Uhrzeit</th>
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
                      <td className="py-2 text-xs text-muted-foreground">
                        {log.action === "MESSAGE_SENT" && log.meta?.recipientId
                          ? `→ Empfänger: ${String(log.meta.recipientId).slice(0, 8)}…`
                          : log.meta?.jobId
                          ? `Job: ${String(log.meta.jobId).slice(0, 8)}…`
                          : "–"}
                      </td>
                      <td className="py-2 text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                      </td>
                    </tr>
                  ))}
                  {!loading && logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Keine Aktivitäten im gewählten Zeitraum.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <p className="text-xs text-muted-foreground">{logs.length} Einträge</p>
      )}
    </div>
  );
}
