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
  await sendMail(
    to,
    "Willkommen bei Fix with Foxy!",
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#f97316">Willkommen, ${name}!</h2>
        <p>Schön, dass du dabei bist. Dein Konto bei <strong>Fix with Foxy</strong> wurde erfolgreich erstellt.</p>
        ${isProvider
          ? `<p>Als <strong>Dienstleister</strong> kannst du jetzt auf Aufträge in deiner Region bieten und neue Kunden gewinnen. Du startest mit einem kostenlosen 30-Tage-Test.</p>`
          : `<p>Als <strong>Auftraggeber</strong> kannst du jetzt kostenlos Aufträge erstellen und Angebote von geprüften Handwerkern erhalten.</p>`
        }
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/${isProvider ? "anbieter/dashboard" : "dashboard"}"
           style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">
          Zum Dashboard
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">Fix with Foxy · auftrag@fixwithfoxy.com</p>
      </div>
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
