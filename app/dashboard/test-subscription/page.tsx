"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TestSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = async (plan: "basis" | "premium") => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/test/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fout bij aanmaken subscription");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Er is een fout opgetreden");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Test Abonnement</h1>
        <p className="text-muted-foreground">
          Maak een test abonnement aan om de applicatie te gebruiken zonder Stripe
        </p>
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="w-5 h-5" />
              <p>Test abonnement succesvol aangemaakt! Je wordt doorgestuurd...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basis</CardTitle>
            <CardDescription>Test abonnement voor Basis plan</CardDescription>
            <div className="mt-4">
              <span className="text-2xl font-bold">€29,95</span>
              <span className="text-slate-600 ml-2">/maand</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => createSubscription("basis")}
              disabled={loading || success}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                "Test Basis Abonnement"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-600">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Premium</CardTitle>
              <Badge className="bg-blue-600 text-white">Aanbevolen</Badge>
            </div>
            <CardDescription>Test abonnement voor Premium plan</CardDescription>
            <div className="mt-4">
              <span className="text-2xl font-bold">€39,95</span>
              <span className="text-slate-600 ml-2">/maand</span>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => createSubscription("premium")}
              disabled={loading || success}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                "Test Premium Abonnement"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Let op</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>
            • Deze pagina is alleen beschikbaar in development mode
          </p>
          <p>
            • Test abonnementen worden automatisch als &quot;active&quot; gemarkeerd
          </p>
          <p>
            • In productie moet je een echte Stripe subscription hebben
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

