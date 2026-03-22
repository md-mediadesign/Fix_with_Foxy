"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { addHours } from "date-fns";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isActive: true },
  });

  // Always return success to prevent email enumeration
  if (!user || !user.isActive) {
    return { success: true };
  }

  // Invalidate existing tokens
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");

  await db.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: addHours(new Date(), 2),
    },
  });

  await sendPasswordResetEmail(user.email, user.name, token);

  return { success: true };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { error: "Passwort muss mindestens 8 Zeichen lang sein." };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "Dieser Link ist ungültig oder abgelaufen." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: record.userId },
    data: { passwordHash, mustChangePassword: false },
  });

  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { success: true };
}

export async function validateResetToken(token: string) {
  const record = await db.passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { valid: false };
  }

  return { valid: true };
}
