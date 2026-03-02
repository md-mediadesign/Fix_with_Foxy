import "dotenv/config";
import pkg from "@prisma/client";
const { PrismaClient } = pkg as any;
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { name: "Elektrik", slug: "elektrik", icon: "Zap", sortOrder: 1 },
  { name: "Sanitär & Heizung", slug: "sanitaer-heizung", icon: "Droplets", sortOrder: 2 },
  { name: "Malerei & Lackierung", slug: "malerei-lackierung", icon: "Paintbrush", sortOrder: 3 },
  { name: "Garten & Landschaft", slug: "garten-landschaft", icon: "TreePine", sortOrder: 4 },
  { name: "Reinigung", slug: "reinigung", icon: "Sparkles", sortOrder: 5 },
  { name: "Umzug & Transport", slug: "umzug-transport", icon: "Truck", sortOrder: 6 },
  { name: "Schreiner & Tischler", slug: "schreiner-tischler", icon: "Hammer", sortOrder: 7 },
  { name: "Dach & Fassade", slug: "dach-fassade", icon: "Home", sortOrder: 8 },
  { name: "Fliesen & Boden", slug: "fliesen-boden", icon: "LayoutGrid", sortOrder: 9 },
  { name: "Schlüsseldienst", slug: "schluesseldienst", icon: "KeyRound", sortOrder: 10 },
  { name: "Montage & Aufbau", slug: "montage-aufbau", icon: "Wrench", sortOrder: 11 },
  { name: "Marketing", slug: "marketing", icon: "TrendingUp", sortOrder: 12 },
  { name: "Mediadesign", slug: "mediadesign", icon: "Palette", sortOrder: 13 },
  { name: "Sonstiges", slug: "sonstiges", icon: "MoreHorizontal", sortOrder: 14 },
];

async function main() {
  console.log("Seeding database...");

  // Create categories
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`Created ${CATEGORIES.length} categories`);

  // Create admin user
  const adminPassword = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@werkspot.de" },
    update: { passwordHash: await bcrypt.hash("admin1234", 12) },
    create: {
      email: "admin@werkspot.de",
      name: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`Admin user: ${admin.email} / admin1234`);

  // Create test client
  const clientPassword = await bcrypt.hash("test1234", 12);
  const client = await prisma.user.upsert({
    where: { email: "kunde@test.de" },
    update: {},
    create: {
      email: "kunde@test.de",
      name: "Max Mustermann",
      passwordHash: clientPassword,
      role: "CLIENT",
      isActive: true,
      clientProfile: {
        create: { city: "Berlin", zipCode: "10115" },
      },
    },
  });
  console.log(`Test client: ${client.email} / test1234`);

  // Create test provider
  const providerPassword = await bcrypt.hash("test1234", 12);
  const categories = await prisma.category.findMany({ take: 3 });

  const provider = await prisma.user.upsert({
    where: { email: "handwerker@test.de" },
    update: {},
    create: {
      email: "handwerker@test.de",
      name: "Hans Werkmann",
      passwordHash: providerPassword,
      role: "PROVIDER",
      isActive: true,
      providerProfile: {
        create: {
          companyName: "Werkmann Handwerk GmbH",
          phone: "+49 170 1234567",
          city: "Berlin",
          zipCode: "10115",
          description:
            "Erfahrener Handwerker mit über 15 Jahren Berufserfahrung. Spezialisiert auf Elektrik, Sanitär und allgemeine Reparaturen.",
          serviceRadius: 30,
          categories: {
            create: categories.map((cat) => ({ categoryId: cat.id })),
          },
          subscription: {
            create: {
              tier: "PRO",
              status: "TRIALING",
              trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              monthlyAwardsLimit: 10,
            },
          },
        },
      },
    },
  });
  console.log(`Test provider: ${provider.email} / test1234`);

  // Create a sample job
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId: client.id },
  });

  if (clientProfile) {
    const elektrikCategory = await prisma.category.findUnique({
      where: { slug: "elektrik" },
    });

    if (elektrikCategory) {
      await prisma.job.create({
        data: {
          clientId: clientProfile.id,
          categoryId: elektrikCategory.id,
          title: "Steckdosen im Wohnzimmer installieren",
          description:
            "Ich benötige 3 neue Steckdosen im Wohnzimmer. Die Wände sind bereits verputzt. Kabelkanäle müssen noch verlegt werden. Bitte um zeitnahes Angebot.",
          city: "Berlin",
          zipCode: "10115",
          budgetMin: 200,
          budgetMax: 500,
          status: "OPEN",
          publishedAt: new Date(),
          premiumAccessUntil: new Date(Date.now() - 3 * 60 * 60 * 1000), // expired
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      console.log("Created sample job");
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
