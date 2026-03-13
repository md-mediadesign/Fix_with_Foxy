import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Check, ArrowRight, Zap } from "lucide-react";
import { PLAN_FEATURES } from "@/lib/constants";
import { getServerTranslations } from "@/lib/i18n/server";

export default async function PricingPage() {
  const t = await getServerTranslations();

  const PLANS = [
    {
      name: t.pricing.basic,
      price: "29",
      description: t.pricing.basicDesc,
      features: PLAN_FEATURES.BASIC,
      popular: false,
      tier: "BASIC",
    },
    {
      name: t.pricing.pro,
      price: "50",
      description: t.pricing.proDesc,
      features: PLAN_FEATURES.PRO,
      popular: true,
      tier: "PRO",
    },
    {
      name: t.pricing.premium,
      price: "139",
      description: t.pricing.premiumDesc,
      features: PLAN_FEATURES.PREMIUM,
      popular: false,
      tier: "PREMIUM",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">
                {t.pricing.trial}
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {t.pricing.title}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {t.pricing.subtitle}
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.popular ? "border-primary shadow-lg scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-3 py-1">
                        <Zap className="mr-1 h-3 w-3" />
                        {t.pricing.popular}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price} €</span>
                      <span className="text-muted-foreground"> {t.common.perMonth}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="mt-8 w-full"
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/registrieren/anbieter">
                        {t.pricing.startTrial}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center text-sm text-muted-foreground">
              <p>
                {t.pricing.disclaimer}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
