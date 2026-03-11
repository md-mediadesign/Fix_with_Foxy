"use client";

import { useState } from "react";
import { sendTestWhatsAppToAdmins } from "@/actions/admin";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function WhatsAppTestSection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTest() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await sendTestWhatsAppToAdmins();
      setResult({ sent: res.sent, total: res.total });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-600" />
          WhatsApp-Test
        </CardTitle>
        <CardDescription>
          Sendet eine Test-Nachricht an alle Admins mit gesetzter Telefonnummer.
        </CardDescription>
      </CardHeader>
      <div className="px-6 pb-6 space-y-3">
        <Button onClick={handleTest} disabled={loading} variant="outline">
          {loading ? "Wird gesendet…" : "WhatsApp-Test senden"}
        </Button>
        {result && (
          <p className="text-sm text-green-700">
            ✅ {result.sent} von {result.total} Admin{result.total !== 1 ? "s" : ""} erreicht.
            {result.sent < result.total && (
              <span className="text-amber-600">
                {" "}
                {result.total - result.sent} Admin{result.total - result.sent !== 1 ? "s haben" : " hat"} keine Telefonnummer hinterlegt.
              </span>
            )}
          </p>
        )}
        {error && <p className="text-sm text-red-600">❌ Fehler: {error}</p>}
      </div>
    </Card>
  );
}
