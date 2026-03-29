import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { db } from "@/lib/db";
import { getServerTranslations } from "@/lib/i18n/server";

const CATEGORY_IMAGES: Record<string, string> = {
  reinigung: "/categories/cleaner.png",
  "garten-landschaft": "/categories/gaertner.png",
  "malerei-lackierung": "/categories/maler.png",
  "montage-aufbau": "/categories/montage.png",
  elektrik: "/categories/elektrik.png",
  "sanitaer-heizung": "/categories/sanitaer.png",
  "dach-fassade": "/categories/dach.png",
  schluesseldienst: "/categories/schluesseldienst.png",
  "umzug-transport": "/categories/umzug.png",
  "schreiner-tischler": "/categories/schreiner.png",
  "fliesen-boden": "/categories/fliesen-boden.png",
  marketing: "/categories/marketing.png",
  mediadesign: "/categories/mediadesign.png",
  sonstiges: "/categories/sonstiges.png",
};

export default async function CategoriesPage() {
  const t = await getServerTranslations();

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { jobs: { where: { status: "OPEN" } } } },
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">{t.categories.title}</h1>
          <p className="mt-2 text-muted-foreground">
            {t.categories.subtitle}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => {
              const image = CATEGORY_IMAGES[cat.slug];
              return (
                <Link key={cat.id} href={`/registrieren/kunde?kategorie=${cat.slug}`}>
                  <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform group-hover:scale-110 overflow-hidden">
                        {image ? (
                          <Image src={image} alt={cat.name} width={48} height={48} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl">🔧</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{cat.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {cat._count.jobs} {t.categories.openJobs}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
