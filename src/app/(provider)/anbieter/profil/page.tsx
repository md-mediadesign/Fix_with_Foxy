"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { updateProviderProfile, changePassword } from "@/actions/profile";
import { getCategories } from "@/actions/categories";
import { toast } from "sonner";
import { Save, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "@/components/locale-provider";

type Category = { id: string; name: string; slug: string };

export default function ProviderProfilePage() {
  const t = useTranslations();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    companyName: "",
    description: "",
    phone: "",
    whatsappPhone: "",
    city: "",
    zipCode: "",
    serviceRadius: 25,
    categoryIds: [] as string[],
  });

  useEffect(() => {
    async function load() {
      const cats = await getCategories();
      setCategories(cats);

      // Load current profile data
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setForm({
          companyName: data.companyName || "",
          description: data.description || "",
          phone: data.phone || "",
          whatsappPhone: data.whatsappPhone || "",
          city: data.city || "",
          zipCode: data.zipCode || "",
          serviceRadius: data.serviceRadius || 25,
          categoryIds: data.categoryIds || [],
        });
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateProviderProfile(form);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t.provider.profileSaved);
      }
    } catch {
      toast.error(t.provider.profileError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.provider.editProfile}</h1>
        <p className="text-muted-foreground">{t.provider.editProfile}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.auth.companyName}</CardTitle>
            <CardDescription>{t.provider.editProfile}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="companyName">{t.auth.companyName} ({t.common.optional})</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder={t.auth.companyNamePlaceholder}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t.auth.phone}</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder={t.auth.phonePlaceholder}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="whatsappPhone">{t.pricing.whatsappAlerts}</Label>
              <Input
                id="whatsappPhone"
                value={form.whatsappPhone}
                onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })}
                placeholder={t.auth.phonePlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="description">{t.auth.description}</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t.auth.descriptionPlaceholder}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.auth.city} & {t.auth.serviceRadius}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="city">{t.auth.city}</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">{t.auth.zipCode}</Label>
                <Input
                  id="zipCode"
                  value={form.zipCode}
                  onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="serviceRadius">{t.auth.serviceRadius}</Label>
                <Input
                  id="serviceRadius"
                  type="number"
                  min={1}
                  max={200}
                  value={form.serviceRadius}
                  onChange={(e) => setForm({ ...form, serviceRadius: Number(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.auth.categoriesLabel}</CardTitle>
            <CardDescription>{t.auth.categoriesDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Checkbox
                    checked={form.categoryIds.includes(cat.id)}
                    onCheckedChange={(checked) => {
                      setForm({
                        ...form,
                        categoryIds: checked
                          ? [...form.categoryIds, cat.id]
                          : form.categoryIds.filter((id) => id !== cat.id),
                      });
                    }}
                  />
                  <span className="text-sm">{cat.name}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          {loading ? t.provider.saving : t.provider.saveProfile}
        </Button>
      </form>

      {/* Password change */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwörter stimmen nicht überein."); return; }
          setPwLoading(true);
          try {
            const result = await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
            if (result?.error) { toast.error(result.error); }
            else { toast.success("Passwort erfolgreich geändert."); setPwForm({ currentPassword: "", newPassword: "", confirm: "" }); }
          } catch { toast.error("Passwort konnte nicht geändert werden."); }
          finally { setPwLoading(false); }
        }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.profile} – Passwort ändern</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Aktuelles Passwort</label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Ihr aktuelles Passwort"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={() => setShowPasswords((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Neues Passwort</label>
                <input type={showPasswords ? "text" : "password"} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Mindestens 8 Zeichen" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Bestätigen</label>
                <input type={showPasswords ? "text" : "password"} value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="Passwort wiederholen" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
