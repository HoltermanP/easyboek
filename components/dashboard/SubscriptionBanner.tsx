"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";

export function SubscriptionBanner() {
  const [show, setShow] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(true);

  useEffect(() => {
    // Check subscription status
    fetch("/api/test/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (!data.hasSubscription) {
          setHasSubscription(false);
          setShow(true);
        }
      })
      .catch(() => {
        // In development zonder Stripe, toon banner
        if (typeof window !== "undefined" && window.location.hostname === "localhost") {
          setHasSubscription(false);
          setShow(true);
        }
      });
  }, []);

  if (!show || hasSubscription) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Geen actief abonnement
              </h3>
              <p className="text-sm text-amber-800">
                {process.env.NODE_ENV === "development" ? (
                  <>
                    Maak een test abonnement aan om de applicatie te gebruiken zonder Stripe.
                  </>
                ) : (
                  <>
                    Sluit een abonnement af om toegang te krijgen tot alle functies.
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {process.env.NODE_ENV === "development" ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/test-subscription">
                  Test Abonnement
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/dashboard/checkout?plan=premium">
                  Abonnement Afsluiten
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShow(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

