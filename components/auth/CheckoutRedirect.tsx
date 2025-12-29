"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function CheckoutRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    if (!plan) return;

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
  }, [plan]);

  useEffect(() => {
    if (plan && (plan === "basis" || plan === "premium")) {
      startCheckout();
    }
  }, [plan, startCheckout]);

  if (!plan) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Abonnement afsluiten</CardTitle>
        <CardDescription>
          Je wordt doorgestuurd naar de betaalpagina...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        
        {error && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={startCheckout} className="flex-1">
                Opnieuw proberen
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                Later afsluiten
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

