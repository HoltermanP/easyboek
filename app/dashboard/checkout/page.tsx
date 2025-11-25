"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (data.url) {
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
    originalPrice: "€49,95",
  } : plan === "basis" ? {
    name: "Basis",
    price: "€29,95",
    period: "/maand",
    description: "Voor zelfstandigen die zelf de controle willen houden",
    originalPrice: null,
  } : null;

  if (!planInfo) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Abonnement afsluiten</h1>
        <Card>
          <CardHeader>
            <CardTitle>Geen abonnement geselecteerd</CardTitle>
            <CardDescription>
              Selecteer een abonnement om door te gaan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>
              Terug naar overzicht
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Abonnement afsluiten</h1>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{planInfo.name}</CardTitle>
            <CardDescription>{planInfo.description}</CardDescription>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{planInfo.price}</span>
                <span className="text-slate-600">{planInfo.period}</span>
              </div>
              {planInfo.originalPrice && (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm text-slate-500 line-through">
                    {planInfo.originalPrice}
                  </span>
                  <Badge variant="secondary">
                    Eerste 6 maanden
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
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
            
            <p className="text-xs text-slate-500 mt-4 text-center">
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
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Direct toegang</p>
                <p className="text-sm text-slate-600">
                  Je krijgt direct toegang tot alle functies van je abonnement
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Maandelijks verlengd</p>
                <p className="text-sm text-slate-600">
                  Je abonnement wordt automatisch maandelijks verlengd
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Altijd opzegbaar</p>
                <p className="text-sm text-slate-600">
                  Je kunt je abonnement op elk moment opzeggen
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Abonnement afsluiten</h1>
        <Card>
          <CardHeader>
            <CardTitle>Laden...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

