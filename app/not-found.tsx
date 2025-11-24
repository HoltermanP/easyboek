import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Pagina niet gevonden</CardTitle>
          <CardDescription>
            De pagina die u zoekt bestaat niet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">Naar Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

