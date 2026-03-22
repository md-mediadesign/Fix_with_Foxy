import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM ?? "auftrag@fixwithfoxy.com";

async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[email] SMTP-Konfiguration fehlt – E-Mail übersprungen");
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/passwort-zuruecksetzen?token=${token}`;
  await sendMail(
    to,
    "Passwort zurücksetzen – Fix with Foxy",
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Passwort zurücksetzen</h2>
        <p>Hallo ${name},</p>
        <p>wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke auf den Button, um ein neues Passwort zu setzen:</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
          Passwort zurücksetzen
        </a>
        <p style="color:#6b7280;font-size:13px">Dieser Link ist 2 Stunden gültig. Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Fix with Foxy · auftrag@fixwithfoxy.com</p>
      </div>
    `
  );
}

export async function sendWelcomeEmail(to: string, name: string, role: "CLIENT" | "PROVIDER") {
  const isProvider = role === "PROVIDER";
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${isProvider ? "anbieter/auftraege" : "dashboard"}`;

  await sendMail(
    to,
    "Willkommen bei FixWithFoxy 🦊",
    `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#f97316;padding:32px 40px;text-align:center">
      <p style="margin:0;font-size:36px">🦊</p>
      <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700">FixWithFoxy</h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px">
      <p style="margin:0 0 16px;font-size:16px;color:#111827">Hallo ${name},</p>
      <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.6">
        herzlich willkommen bei <strong>FixWithFoxy</strong> – schön, dass du dabei bist!
      </p>
      <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6">
        Deine Registrierung war erfolgreich und du kannst ab sofort alle Funktionen der Plattform nutzen.
      </p>

      <!-- Beta info box -->
      <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:4px;padding:16px 20px;margin-bottom:28px">
        <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
          Als Teil unserer aktuellen <strong>Beta-Phase</strong> kannst du dich komplett kostenlos anmelden und die Plattform testen.
          Nach dem offiziellen Start erhältst du zusätzlich <strong>30 Tage kostenlosen Zugriff</strong>, um alles in Ruhe auszuprobieren.
        </p>
      </div>

      <!-- Plans -->
      <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827">Unsere Modelle im Überblick:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
        <tr>
          <td style="padding:0 6px 12px 0;width:33%">
            <div style="background:#f3f4f6;border-radius:10px;padding:16px;text-align:center">
              <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827">Basic</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">Einstieg in die Plattform · Begrenzte Anfragen pro Monat</p>
            </div>
          </td>
          <td style="padding:0 6px 12px;width:33%">
            <div style="background:#fff7ed;border:1px solid #f97316;border-radius:10px;padding:16px;text-align:center">
              <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#f97316">Pro</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">Mehr Anfragen &amp; bessere Sichtbarkeit · Ideal für aktive Dienstleister</p>
            </div>
          </td>
          <td style="padding:0 0 12px 6px;width:33%">
            <div style="background:#f3f4f6;border-radius:10px;padding:16px;text-align:center">
              <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827">Premium</p>
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5">Maximale Reichweite · Priorisierte Platzierung</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px">
        <a href="${dashboardUrl}"
           style="display:inline-block;background:#f97316;color:#ffffff;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:16px;font-weight:600">
          ${isProvider ? "Aufträge entdecken" : "Zum Dashboard"}
        </a>
      </div>

      <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">
        Wir freuen uns, dich auf der Plattform zu haben und wünschen dir viel Erfolg!
      </p>
      <p style="margin:16px 0 0;font-size:15px;color:#374151">
        Dein FixWithFoxy Team 🦊
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f3f4f6;padding:20px 40px;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">FixWithFoxy · auftrag@fixwithfoxy.com</p>
    </div>
  </div>
</body>
</html>
    `
  );
}

export async function sendJobAwardedEmail(
  to: string,
  providerName: string,
  jobTitle: string,
  jobCity: string,
  amount: number
) {
  await sendMail(
    to,
    `🎉 Du hast den Auftrag erhalten: ${jobTitle}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Glückwunsch, ${providerName}!</h2>
        <p>Du hast den Zuschlag für folgenden Auftrag erhalten:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
          <strong>${jobTitle}</strong><br/>
          📍 ${jobCity}<br/>
          💰 Dein Angebot: ${amount.toFixed(2)} €
        </div>
        <p>Melde dich jetzt beim Auftraggeber, um die nächsten Schritte zu besprechen.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/anbieter/dashboard"
           style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Zum Dashboard
        </a>
      </div>
    `
  );
}

export async function sendReviewReceivedEmail(
  to: string,
  providerName: string,
  jobTitle: string,
  rating: number,
  comment?: string | null
) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  await sendMail(
    to,
    `⭐ Neue Bewertung für dich: ${stars}`,
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Neue Bewertung, ${providerName}!</h2>
        <p>Du hast eine Bewertung für den Auftrag <strong>${jobTitle}</strong> erhalten:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0">
          <span style="font-size:24px;color:#f97316">${stars}</span><br/>
          ${comment ? `<p style="margin-top:8px;color:#374151">"${comment}"</p>` : ""}
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/anbieter/bewertungen"
           style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Bewertungen ansehen
        </a>
      </div>
    `
  );
}
