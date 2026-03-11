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
