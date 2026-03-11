import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendBulkWhatsApp } from "@/lib/whatsapp";

let lastSentAt = 0;
const THROTTLE_MS = 60_000;

export async function POST(req: NextRequest) {
  const now = Date.now();
  if (now - lastSentAt < THROTTLE_MS) {
    return NextResponse.json({ ok: false, reason: "throttled" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { message = "Unbekannter Fehler", url = "–", timestamp = new Date().toISOString() } = body;

  const admins = await db.user.findMany({
    where: { role: "ADMIN", isActive: true, phone: { not: null } },
    select: { phone: true },
  });

  const phones = admins.map((a) => a.phone!).filter(Boolean);
  if (phones.length === 0) {
    return NextResponse.json({ ok: false, reason: "no_admin_phones" });
  }

  const text = `🚨 Werkspot Fehler\n\n📍 Seite: ${url}\n🕐 Zeit: ${timestamp}\n❌ Fehler: ${message}`;

  await sendBulkWhatsApp(phones, text);
  lastSentAt = now;

  return NextResponse.json({ ok: true, sent: phones.length });
}
