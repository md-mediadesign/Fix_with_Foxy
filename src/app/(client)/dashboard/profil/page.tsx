"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClientProfile } from "@/actions/profile";
import { toast } from "sonner";
import { Save } from "lucide-react";

export default function ClientProfilePage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    zipCode: "",
  });

  useEffect(() => {
    fetch("/api/profile/client")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setForm({ name: data.name || "", city: data.city || "", zipCode: data.zipCode || "" });
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateClientProfile(form);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profil erfolgreich gespeichert!");
      }
    } catch {
      toast.error("Profil konnte nicht gespeichert werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Profil bearbeiten</h1>
        <p className="text-muted-foreground">Ihre persönlichen Angaben verwalten</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Persönliche Daten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ihr vollständiger Name"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="München"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">PLZ</Label>
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                  placeholder="80331"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Wird gespeichert…" : "Profil speichern"}
        </Button>
      </form>
    </div>
  );
}
