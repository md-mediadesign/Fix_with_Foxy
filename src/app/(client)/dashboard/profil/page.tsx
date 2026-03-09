"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateClientProfile, changePassword } from "@/actions/profile";
import { toast } from "sonner";
import { Save, Eye, EyeOff } from "lucide-react";

export default function ClientProfilePage() {
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", zipCode: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }
    setPwLoading(true);
    try {
      const result = await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Passwort erfolgreich geändert.");
        setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
      }
    } catch {
      toast.error("Passwort konnte nicht geändert werden.");
    } finally {
      setPwLoading(false);
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

      {/* Password change */}
      <form onSubmit={handlePasswordChange} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Passwort ändern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Ihr aktuelles Passwort"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  placeholder="Mindestens 8 Zeichen"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  placeholder="Passwort wiederholen"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={pwLoading || pwForm.newPassword.length < 8} variant="outline">
          <Save className="mr-2 h-4 w-4" />
          {pwLoading ? "Wird gespeichert…" : "Passwort ändern"}
        </Button>
      </form>
    </div>
  );
}
