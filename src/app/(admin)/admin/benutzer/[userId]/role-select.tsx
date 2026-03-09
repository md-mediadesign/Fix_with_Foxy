"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changeUserRole } from "@/actions/admin";
import type { UserRole } from "@prisma/client";

const roles: { value: UserRole; label: string }[] = [
  { value: "CLIENT", label: "Auftraggeber" },
  { value: "PROVIDER", label: "Dienstleister" },
  { value: "ADMIN", label: "Admin" },
];

export function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: UserRole;
}) {
  const [selected, setSelected] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (selected === currentRole) return;
    startTransition(async () => {
      try {
        await changeUserRole(userId, selected);
        toast.success("Rolle wurde geändert.");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Ändern der Rolle.");
        setSelected(currentRole);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as UserRole)}
        disabled={isPending}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {roles.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {selected !== currentRole && (
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Speichern…" : "Speichern"}
        </Button>
      )}
    </div>
  );
}
