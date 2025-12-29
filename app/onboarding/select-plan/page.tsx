"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type PlanInfo = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  badge?: string;
  highlight?: boolean;
};

const PLANS: Record<string, PlanInfo> = {
  trial: {
    name: "Gratis Proefperiode",
    price: "€0",
    period: "1 maand gratis",
    description: "Probeer alle Premium functies 1 maand gratis. Na de proefperiode kun je kiezen: stoppen, Basis of Premium.",
    features: [
      "✓ Alle Premium functies (volledige toegang)",
      "✓ Onbeperkte documenten uploaden",
      "✓ AI categorisatie en OCR",
      "✓ BTW berekeningen en rapportages",
      "✓ Belastingaangiftes en inkomstenbelasting",
      "✓ Prioriteit ondersteuning",
      "✓ 1 maand volledig gratis",
      "✓ Geen verplichting - kies daarna zelf",
    ],
    badge: "Aanbevolen",
    highlight: true,
  },
  basis: {
    name: "Basis",
    price: "€29,95",
    period: "/maand",
    description: "Voor zelfstandigen die zelf de controle willen houden",
    features: [
      "Onbeperkte documenten",
      "AI categorisatie",
      "BTW berekeningen",
      "Basis rapportages",
      "Email ondersteuning",
      "Maandelijks betalen",
      "Jaarlijks contract (niet tussentijds opzegbaar)",
    ],
  },
  premium: {
    name: "Premium",
    price: "€39,95",
    period: "/maand",
    description: "Volledig ontzorgd met AI en ondersteuning",
    features: [
      "Alles van Basis",
      "Geavanceerde rapportages",
      "Belastingaangiftes",
      "Prioriteit ondersteuning",
      "AI assistent",
      "Automatische herinneringen",
      "Maandelijks betalen",
      "Jaarlijks contract (niet tussentijds opzegbaar)",
    ],
    badge: "Meest populair",
    highlight: true,
  },
};

function SelectPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const action = searchParams.get("action");
  const planParam = searchParams.get("plan");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }

    // Haal subscription status op
    if (user) {
      fetch("/api/subscriptions/status")
        .then((res) => res.json())
        .then((data) => {
          setSubscription(data.subscription);
        })
        .catch(() => {});
    }
  }, [isLoaded, user, router]);

  // Auto-redirect als plan parameter is
  useEffect(() => {
    if (planParam && (planParam === "basis" || planParam === "premium")) {
      router.push(`/checkout?plan=${planParam}`);
    }
  }, [planParam, router]);

  const handleSelectPlan = async (planKey: string) => {
    if (!user) return;

    setLoading(true);

    try {
      if (planKey === "trial") {
        // Start gratis proefperiode
        const response = await fetch("/api/subscriptions/start-trial", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Fout bij starten proefperiode");
        }

        router.push("/dashboard?trial=started");
      } else if (planKey === "stop") {
        // Stop trial - annuleer subscription
        const response = await fetch("/api/subscriptions/cancel", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Fout bij annuleren");
        }

        router.push("/dashboard?trial=canceled");
      } else {
        // Redirect naar checkout
        router.push(`/checkout?plan=${planKey}`);
      }
    } catch (error) {
      console.error("Error selecting plan:", error);
      alert("Er is een fout opgetreden. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  const hasTrial = subscription?.isTrial;
  const trialExpired = hasTrial && subscription?.trialEndsAt && new Date(subscription.trialEndsAt) < new Date();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {hasTrial && !trialExpired 
              ? "Wat wil je doen na je proefperiode?"
              : trialExpired
              ? "Je proefperiode is verlopen - kies een optie"
              : "Kies je abonnement"
            }
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {hasTrial && !trialExpired
              ? "Je hebt nu een gratis proefperiode met alle Premium functies. Kies wat je wilt doen na de proefperiode."
              : trialExpired
              ? "Je gratis proefperiode is verlopen. Kies een optie om door te gaan."
              : "Start met een gratis proefperiode of kies direct een abonnement"
            }
          </p>
        </div>

        {/* Stop optie voor trial gebruikers */}
        {(hasTrial || trialExpired) && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="border-2 border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <X className="w-5 h-5 text-muted-foreground" />
                  Stoppen met EasyBoek
                </CardTitle>
                <CardDescription>
                  Annuleer je proefperiode en stop met EasyBoek. Je verliest toegang na het einde van je proefperiode.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleSelectPlan("stop")}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Laden..." : "Stoppen"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={`grid gap-6 max-w-6xl mx-auto ${
          (hasTrial || trialExpired ? Object.entries(PLANS).filter(([key]) => key !== "trial") : Object.entries(PLANS)).length === 3
            ? "md:grid-cols-3"
            : "md:grid-cols-2"
        }`}>
          {/* Toon alleen Basis en Premium voor trial gebruikers, anders toon alle plannen */}
          {(hasTrial || trialExpired ? Object.entries(PLANS).filter(([key]) => key !== "trial") : Object.entries(PLANS)).map(([key, plan]) => (
            <Card
              key={key}
              className={`relative ${
                plan.highlight
                  ? "border-2 border-primary shadow-lg"
                  : "border border-border"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectPlan(key)}
                  disabled={loading}
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  size="lg"
                >
                  {loading ? "Laden..." : key === "trial" ? "Start gratis" : "Kies plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground space-y-2">
          {!hasTrial && !trialExpired ? (
            <>
              <p className="font-semibold text-foreground">
                Start met een gratis proefperiode van 1 maand met alle Premium functies
              </p>
              <p>
                Na de proefperiode kun je kiezen: <strong>stoppen</strong>, <strong>Basis plan</strong> (€29,95/maand) of <strong>Premium plan</strong> (€39,95/maand)
              </p>
            </>
          ) : (
            <p className="font-semibold text-foreground">
              Kies een betaald abonnement om door te gaan met EasyBoek
            </p>
          )}
          <p className="text-xs mt-4">
            Alle betaalde abonnementen worden maandelijks betaald met een jaarlijks contract (niet tussentijds opzegbaar). Geen verborgen kosten.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SelectPlanPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    }>
      <SelectPlanContent />
    </Suspense>
  );
}

