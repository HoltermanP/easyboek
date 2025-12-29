import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pagina niet gevonden</CardTitle>
          <CardDescription>
            De authenticatie pagina die u zoekt bestaat niet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/sign-in">Naar inloggen</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Terug naar home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

