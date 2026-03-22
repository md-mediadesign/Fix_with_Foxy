"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteUserAccount } from "@/actions/admin";

export function DeleteUserButton({
  userId,
  userName,
  targetRole,
  currentAdminId,
}: {
  userId: string;
  userName: string;
  targetRole: string;
  currentAdminId: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSelf = userId === currentAdminId;
  const isTargetAdmin = targetRole === "ADMIN";

  // Other admins can't delete admin accounts (only themselves)
  if (isTargetAdmin && !isSelf) return null;

  async function handleDelete() {
    setIsLoading(true);
    try {
      const result = await deleteUserAccount(userId);
      if (result?.error) {
        toast.error(result.error);
        setIsLoading(false);
        return;
      }
      toast.success("Account wurde gelöscht.");
      if (result?.selfDeleted) {
        await signOut({ callbackUrl: "/" });
      } else {
        router.push("/admin/benutzer");
      }
    } catch {
      toast.error("Fehler beim Löschen des Accounts.");
      setIsLoading(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
        <p className="text-sm text-destructive">
          {isSelf
            ? "Eigenen Account wirklich löschen? Du wirst ausgeloggt."
            : `„${userName}" wirklich permanent löschen?`}
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isLoading}
        >
          {isLoading ? "Wird gelöscht…" : "Ja, löschen"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setShowConfirm(true)}
    >
      <Trash2 className="h-4 w-4 mr-1" />
      {isSelf ? "Eigenen Account löschen" : "Account löschen"}
    </Button>
  );
}
