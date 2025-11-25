"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log de volledige error informatie voor debugging
    console.error("Error Boundary caught error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      name: error.name,
    });
    
    // In productie kunnen we de error ook naar een logging service sturen
    if (process.env.NODE_ENV === "production" && error.digest) {
      // Hier kun je later een logging service toevoegen zoals Sentry
      console.error("Error digest:", error.digest);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Er is een fout opgetreden</CardTitle>
          <CardDescription>
            Er is iets misgegaan. Probeer het opnieuw.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.message && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">{error.message}</p>
              {error.digest && process.env.NODE_ENV === "development" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset}>Probeer opnieuw</Button>
            <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>
              Naar Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

