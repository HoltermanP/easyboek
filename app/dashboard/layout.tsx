import { Sidebar } from "@/components/dashboard/Sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getPreferences } from "./settings/actions";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Haal gebruiker op (maakt automatisch demo gebruiker aan als er geen is)
  const user = await getCurrentUser();
  
  // Haal voorkeuren op
  const preferences = await getPreferences();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar preferences={preferences} />
      <main className="flex-1 overflow-y-auto bg-background/50">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}



