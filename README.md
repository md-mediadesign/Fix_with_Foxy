# Werkspot

**Dein Handwerker, ein Klick entfernt.**

Werkspot ist eine Marktplatz-Plattform, die Auftraggeber mit Handwerkern und Dienstleistern in ihrer Region verbindet. Kunden erstellen kostenlos Auftraege, Dienstleister bieten darauf und erhalten Zuschlaege.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + TypeScript + TailwindCSS v4 + shadcn/ui
- **Backend:** Server Actions + Route Handlers
- **Datenbank:** PostgreSQL 16 + Prisma 7
- **Auth:** NextAuth v5 (Credentials Provider, JWT)
- **Zahlungen:** Stripe Subscriptions (Checkout + Customer Portal + Webhooks)
- **E-Mail:** Resend / Mailpit (lokal)

## Schnellstart

### Voraussetzungen

- Node.js 20+
- PostgreSQL 16 (lokal oder Docker)
- npm

### 1. Repository klonen & Abhaengigkeiten installieren

```bash
cd Fix_with_Foxy
npm install
```

### 2. Umgebungsvariablen

```bash
cp .env.example .env
# .env anpassen (DATABASE_URL, AUTH_SECRET, Stripe Keys etc.)
```

### 3. Datenbank mit Docker (optional)

```bash
docker compose up -d
```

Oder lokale PostgreSQL-Instanz verwenden und `DATABASE_URL` in `.env` anpassen.

### 4. Datenbank einrichten

```bash
npm run db:generate    # Prisma Client generieren
npm run db:push        # Schema auf DB anwenden
npm run db:seed        # Testdaten einfuegen
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

App oeffnen: [http://localhost:3000](http://localhost:3000)

## Test-Accounts

| Rolle | E-Mail | Passwort |
|---|---|---|
| Admin | admin@werkspot.de | admin1234 |
| Kunde | kunde@test.de | test1234 |
| Anbieter | handwerker@test.de | test1234 |

## Projektstruktur

```
Fix_with_Foxy/
├── prisma/
│   ├── schema.prisma       # Datenmodell
│   └── seed.ts             # Seed-Daten
├── src/
│   ├── actions/            # Server Actions
│   │   ├── auth.ts         # Registrierung, Login
│   │   ├── jobs.ts         # Job CRUD + Status
│   │   ├── bids.ts         # Angebote
│   │   ├── messages.ts     # Nachrichten
│   │   ├── reviews.ts      # Bewertungen
│   │   ├── profile.ts      # Profilverwaltung
│   │   ├── subscription.ts # Stripe Abo
│   │   ├── categories.ts   # Kategorien
│   │   └── admin.ts        # Admin-Aktionen
│   ├── app/
│   │   ├── (auth)/         # Login, Registrierung
│   │   ├── (client)/       # Kundenbereich (Dashboard)
│   │   ├── (provider)/     # Anbieterbereich
│   │   ├── (admin)/        # Admin-Dashboard
│   │   ├── (public)/       # Oeffentliche Seiten
│   │   └── api/            # API Routes (Auth, Webhooks)
│   ├── components/
│   │   ├── layout/         # Header, Footer, Dashboard Shell
│   │   └── ui/             # shadcn/ui Komponenten
│   └── lib/
│       ├── auth.ts         # NextAuth Konfiguration
│       ├── db.ts           # Prisma Client
│       ├── stripe.ts       # Stripe Client + Plans
│       ├── constants.ts    # App-Konstanten
│       ├── validations/    # Zod-Schemas
│       └── queries/        # DB-Abfragen
├── docker-compose.yml      # PostgreSQL + Mailpit
├── .env.example            # Umgebungsvariablen Template
└── package.json
```

## Seiten-Uebersicht

### Oeffentlich
- `/` - Landing Page
- `/preise` - Preise & Pakete
- `/so-funktionierts` - So funktioniert's
- `/kategorien` - Alle Kategorien
- `/handwerker/[id]` - Oeffentliches Anbieterprofil
- `/impressum`, `/datenschutz`, `/agb` - Rechtliches

### Auth
- `/anmelden` - Login
- `/registrieren` - Registrierungsauswahl
- `/registrieren/kunde` - Kundenregistrierung
- `/registrieren/anbieter` - Anbieterregistrierung (3 Schritte)

### Kundenbereich
- `/dashboard` - Uebersicht
- `/dashboard/auftraege` - Meine Auftraege
- `/dashboard/auftraege/neu` - Neuen Auftrag erstellen (3 Schritte)
- `/dashboard/auftraege/[id]` - Auftragsdetail + Angebote
- `/dashboard/auftraege/[id]/nachrichten` - Chat
- `/dashboard/auftraege/[id]/bewertung` - Bewertung abgeben

### Anbieterbereich
- `/anbieter/dashboard` - Uebersicht
- `/anbieter/auftraege` - Verfuegbare Jobs (mit Filtern)
- `/anbieter/auftraege/[id]` - Job-Detail + Angebot abgeben
- `/anbieter/meine-auftraege` - Zugeschlagene Auftraege
- `/anbieter/angebote` - Meine Angebote
- `/anbieter/bewertungen` - Erhaltene Bewertungen
- `/anbieter/profil` - Profil bearbeiten
- `/anbieter/abo` - Abo-Verwaltung

### Admin
- `/admin` - Uebersicht (Metriken)
- `/admin/benutzer` - Benutzerverwaltung
- `/admin/auftraege` - Auftragsmoderation
- `/admin/kategorien` - Kategorieverwaltung
- `/admin/bewertungen` - Bewertungsmoderation
- `/admin/protokoll` - Audit-Log

## Abo-Modell

| Plan | Preis | Zuschlaege/Monat |
|---|---|---|
| Trial | 30 Tage kostenlos | 5 |
| Basic | 29 EUR/Monat | 5 |
| Pro | 50 EUR/Monat | 10 |
| Premium | 139 EUR/Monat | Unbegrenzt + WhatsApp First Access |

## NPM Scripts

```bash
npm run dev          # Entwicklungsserver
npm run build        # Production Build
npm run start        # Production Server
npm run lint         # ESLint
npm run db:generate  # Prisma Client generieren
npm run db:migrate   # Migration erstellen + ausfuehren
npm run db:push      # Schema direkt auf DB pushen
npm run db:seed      # Testdaten einfuegen
npm run db:studio    # Prisma Studio (DB GUI)
```

## Stripe einrichten

1. Stripe-Account erstellen: https://stripe.com
2. Test-API-Keys in `.env` eintragen
3. Produkte + Preise erstellen (Basic, Pro, Premium)
4. Price IDs in `.env` eintragen
5. Webhook lokal testen:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Lizenz

Proprietaer - Alle Rechte vorbehalten.
