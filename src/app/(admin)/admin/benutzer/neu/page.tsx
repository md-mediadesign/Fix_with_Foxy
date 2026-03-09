"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { createUser } from "@/actions/admin";
import type { UserRole } from "@prisma/client";

const roles: { value: UserRole; label: string }[] = [
  { value: "CLIENT", label: "Auftraggeber" },
  { value: "PROVIDER", label: "Dienstleister" },
  { value: "ADMIN", label: "Admin" },
];

export default function NeuerBenutzerPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("CLIENT");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
      role,
      phone: (form.elements.namedItem("phone") as HTMLInputElement)?.value || undefined,
      city: (form.elements.namedItem("city") as HTMLInputElement)?.value || undefined,
      zipCode: (form.elements.namedItem("zipCode") as HTMLInputElement)?.value || undefined,
    };

    try {
      const result = await createUser(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Benutzer wurde erfolgreich erstellt.");
        router.push("/admin/benutzer");
      }
    } catch {
      toast.error("Ein Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/benutzer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight">Benutzer anlegen</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Neues Benutzerkonto erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input name="name" placeholder="Max Mustermann" required disabled={isLoading} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">E-Mail</label>
              <Input name="email" type="email" placeholder="max@example.de" required disabled={isLoading} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Passwort</label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sicheres Passwort"
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
              <label className="mb-1.5 block text-sm font-medium">Rolle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isLoading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {role === "PROVIDER" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Telefon</label>
                  <Input name="phone" placeholder="+49 123 456789" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Stadt</label>
                    <Input name="city" placeholder="München" required disabled={isLoading} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">PLZ</label>
                    <Input name="zipCode" placeholder="80331" required disabled={isLoading} />
                  </div>
                </div>
              </>
            )}

            {role === "CLIENT" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Stadt (optional)</label>
                <Input name="city" placeholder="München" disabled={isLoading} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Wird erstellt…" : "Benutzer erstellen"}
              </Button>
              <Link href="/admin/benutzer">
                <Button type="button" variant="outline" disabled={isLoading}>
                  Abbrechen
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
