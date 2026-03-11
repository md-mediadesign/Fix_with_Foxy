export const APP_NAME = "Werkspot";
export const APP_CLAIM = "Dein Handwerker, ein Klick entfernt.";
export const APP_DESCRIPTION =
  "Werkspot verbindet Auftraggeber mit den besten Handwerkern und Dienstleistern in ihrer Region. Kostenlos einen Auftrag erstellen und Angebote erhalten.";

export const TRIAL_DAYS = 30;
export const PREMIUM_WINDOW_HOURS = 0;
export const JOB_EXPIRY_DAYS = 14;

export const PLAN_LIMITS = {
  BASIC: { monthlyAwards: 5, price: 29, name: "Basic" },
  PRO: { monthlyAwards: 10, price: 50, name: "Pro" },
  PREMIUM: { monthlyAwards: 999999, price: 139, name: "Premium" },
} as const;

export const PLAN_FEATURES = {
  BASIC: [
    "Bis zu 5 angenommene Aufträge/Monat",
    "Profil mit Bewertungen",
    "Nachrichten mit Auftraggebern",
    "E-Mail-Benachrichtigungen",
  ],
  PRO: [
    "Bis zu 10 angenommene Aufträge/Monat",
    "Profil mit Bewertungen",
    "Nachrichten mit Auftraggebern",
    "E-Mail-Benachrichtigungen",
    "Erweiterte Profilansicht",
  ],
  PREMIUM: [
    "Unbegrenzte Aufträge/Monat",
    "Premium-Badge auf Profil",
    "WhatsApp First Access (2h exklusiv)",
    "Nachrichten mit Auftraggebern",
    "Prioritäts-Benachrichtigungen",
    "Erweiterte Profilansicht",
  ],
} as const;

export const JOB_CATEGORIES = [
  { name: "Elektrik", slug: "elektrik", icon: "Zap" },
  { name: "Sanitär & Heizung", slug: "sanitaer-heizung", icon: "Droplets" },
  { name: "Malerei & Lackierung", slug: "malerei-lackierung", icon: "Paintbrush" },
  { name: "Garten & Landschaft", slug: "garten-landschaft", icon: "TreePine" },
  { name: "Reinigung", slug: "reinigung", icon: "Sparkles" },
  { name: "Umzug & Transport", slug: "umzug-transport", icon: "Truck" },
  { name: "Schreiner & Tischler", slug: "schreiner-tischler", icon: "Hammer" },
  { name: "Dach & Fassade", slug: "dach-fassade", icon: "Home" },
  { name: "Fliesen & Boden", slug: "fliesen-boden", icon: "LayoutGrid" },
  { name: "Schlüsseldienst", slug: "schluesseldienst", icon: "KeyRound" },
  { name: "Montage & Aufbau", slug: "montage-aufbau", icon: "Wrench" },
  { name: "Sonstiges", slug: "sonstiges", icon: "MoreHorizontal" },
] as const;
