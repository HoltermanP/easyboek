"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log de volledige error informatie voor debugging
    console.error("Global Error Boundary caught error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      name: error.name,
    });
    
    // In productie kunnen we de error ook naar een logging service sturen
    if (process.env.NODE_ENV === "production" && error.digest) {
      console.error("Global error digest:", error.digest);
    }
  }, [error]);

  return (
    <html lang="nl">
      <body>
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Er is een fout opgetreden</h1>
            <p className="text-muted-foreground">
              Er is een onverwachte fout opgetreden. Probeer de pagina te vernieuwen.
            </p>
            {error.digest && process.env.NODE_ENV === "development" && (
              <p className="text-xs text-muted-foreground">
                Error digest: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Probeer opnieuw
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

