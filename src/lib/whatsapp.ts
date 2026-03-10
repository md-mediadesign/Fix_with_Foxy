const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

async function sendWhatsAppMessage(phone: string, message: string) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn("[whatsapp] Env-Vars nicht gesetzt – WhatsApp übersprungen");
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace(/\D/g, ""),
        type: "text",
        text: { body: message },
      }),
    }
  );

  if (!res.ok) {
    console.error("[whatsapp] Fehler beim Senden:", await res.text());
  }
}

export async function sendJobAwardedWhatsApp(
  phone: string | null,
  providerName: string,
  jobTitle: string,
  amount: number
) {
  if (!phone) return;
  await sendWhatsAppMessage(
    phone,
    `🎉 Hallo ${providerName}!\n\nDu hast den Zuschlag erhalten:\n📋 ${jobTitle}\n💰 Dein Angebot: ${amount.toFixed(2)} €\n\nMelde dich beim Auftraggeber für die nächsten Schritte.`
  );
}

export async function sendReviewReceivedWhatsApp(
  phone: string | null,
  providerName: string,
  jobTitle: string,
  rating: number
) {
  if (!phone) return;
  const stars = "⭐".repeat(rating);
  await sendWhatsAppMessage(
    phone,
    `${stars} Hallo ${providerName}!\n\nDu hast eine neue Bewertung für:\n📋 ${jobTitle}\n\nBewertung: ${stars} (${rating}/5)`
  );
}
