import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateCompanyDialog } from "@/components/dashboard/CreateCompanyDialog";
import { updateCompany, getPreferences } from "./actions";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { cookies } from "next/headers";
import { SelectCompanyForm } from "@/components/settings/SelectCompanyForm";
import { PreferencesForm } from "@/components/settings/PreferencesForm";

export const dynamic = 'force-dynamic';

async function getCompanyData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        orderBy: {
          year: "desc",
        },
      },
    },
  });

  return user?.companies || [];
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Instellingen</h1>
        <Card>
          <CardHeader>
            <CardTitle>Gebruiker niet gevonden</CardTitle>
            <CardDescription>
              Er is een probleem opgetreden.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  const companies = await getCompanyData(user.id);
  
  // Haal geselecteerde company op uit cookie of gebruik de eerste
  const cookieStore = await cookies();
  const selectedCompanyId = cookieStore.get("selectedCompanyId")?.value;
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  // Haal voorkeuren op
  const preferences = await getPreferences();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Instellingen</h1>
        <p className="text-muted-foreground">
          Beheer uw administraties en voorkeuren
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administraties</CardTitle>
          <CardDescription>
            Beheer uw administraties per jaar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {companies.length} administratie{companies.length !== 1 ? "s" : ""} aangemaakt
            </p>
            <CreateCompanyDialog />
          </div>

          {companies.length > 0 && (
            <div className="space-y-2">
              <Label>Actieve Administratie</Label>
              <SelectCompanyForm companies={companies} selectedCompanyId={selectedCompany?.id} />
            </div>
          )}

          {companies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                U heeft nog geen administratie aangemaakt. Maak er een aan om te beginnen.
              </p>
              <CreateCompanyDialog />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Bedrijfsgegevens - {selectedCompany.name} ({selectedCompany.year})</CardTitle>
            <CardDescription>
              Update uw bedrijfsinformatie voor deze administratie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCompany} className="space-y-4">
              <input type="hidden" name="companyId" value={selectedCompany.id} />
              <div className="space-y-2">
                <Label htmlFor="name">Bedrijfsnaam</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedCompany.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kvk">KVK Nummer</Label>
                <Input
                  id="kvk"
                  name="kvkNumber"
                  defaultValue={selectedCompany.kvkNumber || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="btw">BTW Nummer</Label>
                <Input
                  id="btw"
                  name="btwNumber"
                  defaultValue={selectedCompany.btwNumber || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Uurtarief (€)</Label>
                <Input
                  id="hourlyRate"
                  name="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={selectedCompany.hourlyRate ? selectedCompany.hourlyRate.toString() : ""}
                />
                <p className="text-sm text-muted-foreground">
                  Uw standaard uurtarief voor facturering
                </p>
              </div>
              <Button type="submit">Opslaan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <PreferencesForm initialPreferences={preferences} />

      <Card>
        <CardHeader>
          <CardTitle>Geavanceerd</CardTitle>
          <CardDescription>
            Geavanceerde opties voor uw administraties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" asChild>
            <Link href="/dashboard/settings/delete-period">
              <Trash2 className="mr-2 h-4 w-4" />
              Verwijder Periode Data
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Verwijder alle boekingen, facturen en documenten binnen een bepaalde periode
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


