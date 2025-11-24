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
    console.error(error);
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

