"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { changePassword } from "@/actions/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export default function PasswortAendernPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const isForced = session?.user?.mustChangePassword ?? false;

  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      toast.error("Passwörter stimmen nicht überein.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await changePassword({
        currentPassword: isForced ? undefined : form.currentPassword,
        newPassword: form.newPassword,
        skipCurrentCheck: isForced,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Passwort erfolgreich geändert.");
        // Update session so mustChangePassword = false
        await update({ mustChangePassword: false });
        // Navigate to appropriate dashboard
        const role = session?.user?.role;
        router.push(role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/anbieter/dashboard" : "/dashboard");
      }
    } catch {
      toast.error("Fehler beim Ändern des Passworts.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
              <KeyRound className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">
              {isForced ? "Neues Passwort setzen" : "Passwort ändern"}
            </CardTitle>
            {isForced && (
              <p className="text-sm text-muted-foreground">
                Ihr Passwort wurde zurückgesetzt. Bitte setzen Sie ein neues Passwort, bevor Sie fortfahren.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isForced && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Aktuelles Passwort</label>
                  <div className="relative">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={form.currentPassword}
                      onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                      placeholder="Ihr aktuelles Passwort"
                      required
                      disabled={isLoading}
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
              )}
              <div>
                <label className="mb-1 block text-sm font-medium">Neues Passwort</label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    placeholder="Mindestens 8 Zeichen"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  {isForced && (
                    <button
                      type="button"
                      onClick={() => setShowPasswords((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Passwort bestätigen</label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Passwort wiederholen"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || form.newPassword.length < 8}
              >
                {isLoading ? "Wird gespeichert…" : "Passwort speichern"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
