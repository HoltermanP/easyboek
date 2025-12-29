"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export function SubscriptionBanner() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetch("/api/subscriptions/status")
      .then((res) => res.json())
      .then((data) => {
        setSubscription(data.subscription);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading || !subscription) {
    return null;
  }

  // Developer accounts hebben geen banner nodig
  if (subscription.isDeveloper) {
    return null;
  }

  // Check of trial verloopt
  if (subscription.isTrial && subscription.trialEndsAt) {
    const now = new Date();
    const trialEndsAt = new Date(subscription.trialEndsAt);
    const daysLeft = Math.ceil(
      (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft <= 0) {
      // Trial is verlopen
      return (
        <Card className="mb-6 border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Je gratis proefperiode is verlopen
            </CardTitle>
            <CardDescription className="text-destructive/80">
              Kies wat je wilt doen: stoppen, Basis plan (€29,95/maand) of Premium plan (€39,95/maand)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Link href="/onboarding/select-plan?action=stop">
                <Button variant="outline" className="w-full">
                  Stoppen
                </Button>
              </Link>
              <Link href="/onboarding/select-plan?plan=basis">
                <Button variant="outline" className="w-full">
                  Basis (€29,95/maand)
                </Button>
              </Link>
              <Link href="/onboarding/select-plan?plan=premium">
                <Button className="w-full">
                  Premium (€39,95/maand)
                </Button>
            </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (daysLeft <= 7) {
      // Trial verloopt binnenkort
      return (
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              Je gratis proefperiode verloopt over {daysLeft} {daysLeft === 1 ? "dag" : "dagen"}
            </CardTitle>
            <CardDescription className="text-yellow-500/80">
              Kies wat je wilt doen na je proefperiode: stoppen, Basis plan (€29,95/maand) of Premium plan (€39,95/maand)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Link href="/onboarding/select-plan?action=stop">
                <Button variant="outline" className="w-full">
                  Stoppen
                </Button>
              </Link>
              <Link href="/onboarding/select-plan?plan=basis">
                <Button variant="outline" className="w-full">
                  Basis (€29,95/maand)
                </Button>
              </Link>
              <Link href="/onboarding/select-plan?plan=premium">
                <Button className="w-full">
                  Premium (€39,95/maand)
                </Button>
            </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Trial is actief
    return (
      <Card className="mb-6 border-green-500/50 bg-green-500/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-500">
            <CheckCircle className="w-5 h-5" />
            Je gratis proefperiode is actief
          </CardTitle>
          <CardDescription className="text-green-500/80">
            Nog {daysLeft} {daysLeft === 1 ? "dag" : "dagen"} over in je gratis proefperiode met alle Premium functies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-500/90 mb-3">
            Na je proefperiode kun je kiezen: stoppen, Basis plan of Premium plan
          </p>
          <Link href="/onboarding/select-plan">
            <Button variant="outline">Bekijk opties</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Actieve subscription
  if (subscription.status === "active") {
    return null; // Geen banner nodig voor actieve subscriptions
  }

  // Geen actieve subscription
  return (
    <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-500">
          <AlertTriangle className="w-5 h-5" />
          Geen actief abonnement
        </CardTitle>
        <CardDescription className="text-yellow-500/80">
          Kies een abonnement om toegang te krijgen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/onboarding/select-plan">
          <Button>Kies een abonnement</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
