"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  const startCheckout = async () => {
    if (!plan || (plan !== "basis" && plan !== "premium")) {
      setError("Ongeldig abonnement");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fout bij aanmaken checkout");
      }

      // Bypass mode: direct doorsturen naar dashboard
      if (data.bypass) {
        window.location.href = data.url;
      } else if (data.url) {
        // Stripe checkout: doorsturen naar Stripe
        window.location.href = data.url;
      } else {
        throw new Error("Geen checkout URL ontvangen");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Er is een fout opgetreden");
      setLoading(false);
    }
  };

  const planInfo = plan === "premium" ? {
    name: "Premium",
    price: "€39,95",
    period: "/maand",
    description: "Volledig ontzorgd met AI en ondersteuning",
    originalPrice: null,
    trialInfo: null,
  } : plan === "basis" ? {
    name: "Basis",
    price: "€29,95",
    period: "/maand",
    description: "Voor zelfstandigen die zelf de controle willen houden",
    originalPrice: null,
    trialInfo: null,
  } : null;

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

  if (!planInfo) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Geen abonnement geselecteerd</CardTitle>
              <CardDescription>
                Selecteer een abonnement om door te gaan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/onboarding/select-plan")}>
                Terug naar abonnementen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-foreground">Afrekenen</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{planInfo.name}</CardTitle>
                <CardDescription>{planInfo.description}</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{planInfo.price}</span>
                    <span className="text-muted-foreground">{planInfo.period}</span>
                  </div>
                  {planInfo.trialInfo && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                        {planInfo.trialInfo}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-4 bg-destructive/10 border border-destructive/50 rounded-md">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={startCheckout}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Laden...
                    </>
                  ) : (
                    "Doorgaan naar betaling"
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Je wordt doorgestuurd naar een beveiligde betaalpagina
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wat gebeurt er na betaling?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Direct toegang</p>
                    <p className="text-sm text-muted-foreground">
                      Je krijgt direct toegang tot alle functies van je abonnement
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Maandelijks betalen</p>
                    <p className="text-sm text-muted-foreground">
                      Je betaalt maandelijks, maar hebt een jaarlijks contract
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Jaarlijks contract</p>
                    <p className="text-sm text-muted-foreground">
                      Abonnement is voor 12 maanden en niet tussentijds opzegbaar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

