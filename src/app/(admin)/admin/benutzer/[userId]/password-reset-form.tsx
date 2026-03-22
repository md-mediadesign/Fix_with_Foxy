"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resetUserPassword } from "@/actions/admin";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export function PasswordResetForm({ userId }: { userId: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await resetUserPassword(userId, password);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Passwort wurde erfolgreich zurückgesetzt.");
        setPassword("");
        setConfirm("");
      }
    } catch {
      toast.error("Fehler beim Zurücksetzen des Passworts.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Passwort zurücksetzen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
          <div>
            <label className="mb-1 block text-sm font-medium">Neues Passwort</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Passwort bestätigen</label>
            <Input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Passwort wiederholen"
              required
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Der Benutzer kann sich danach direkt mit dem neuen Passwort anmelden.
          </p>
          <Button type="submit" disabled={isLoading || password.length < 8}>
            {isLoading ? "Wird gesetzt…" : "Passwort zurücksetzen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
