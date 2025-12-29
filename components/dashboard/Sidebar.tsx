"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Receipt,
  Settings,
  Shield,
  BookOpen,
  Users,
  BarChart3,
  Repeat,
  Scale,
  Calculator,
  Route,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserPreferences {
  showUploads: boolean;
  showTimeEntries: boolean;
  showInvoices: boolean;
  showMileage: boolean;
  showBookings: boolean;
  showCustomers: boolean;
  showLedgerAccounts: boolean;
  showBtw: boolean;
  showReports: boolean;
  showRecurring: boolean;
  showTaxRules: boolean;
  showIncomeTax: boolean;
}

const allNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { name: "Uploads", href: "/dashboard/upload", icon: Upload, key: "showUploads" },
  { name: "Documenten", href: "/dashboard/documents", icon: FileText, key: "showUploads" },
  { name: "Uren", href: "/dashboard/time-entries", icon: Clock, key: "showTimeEntries" },
  { name: "Facturen", href: "/dashboard/invoices", icon: FileText, key: "showInvoices" },
  { name: "Kilometerregistratie", href: "/dashboard/mileage", icon: Route, key: "showMileage" },
  { name: "Boekingen", href: "/dashboard/bookings", icon: BookOpen, key: "showBookings" },
  { name: "Klanten", href: "/dashboard/customers", icon: Users, key: "showCustomers" },
  { name: "Grootboekrekeningen", href: "/dashboard/ledger-accounts", icon: BookOpen, key: "showLedgerAccounts" },
  { name: "BTW", href: "/dashboard/btw", icon: Receipt, key: "showBtw" },
  { name: "Rapportages", href: "/dashboard/reports", icon: BarChart3, key: "showReports" },
  { name: "Herhalende Boekingen", href: "/dashboard/recurring", icon: Repeat, key: "showRecurring" },
  { name: "Belastingregels", href: "/dashboard/tax-rules", icon: Scale, key: "showTaxRules" },
  { name: "Inkomstenbelasting", href: "/dashboard/income-tax", icon: Calculator, key: "showIncomeTax" },
  { name: "Instellingen", href: "/dashboard/settings", icon: Settings, key: "settings" },
];

const adminNavigation = [
  { name: "Admin Panel", href: "/admin", icon: Shield },
];

interface SidebarProps {
  preferences?: UserPreferences | null;
}

export function Sidebar({ preferences }: SidebarProps) {
  const pathname = usePathname();

  // Filter navigatie op basis van voorkeuren
  // Dashboard en Instellingen zijn altijd zichtbaar
  const navigation = allNavigation.filter((item) => {
    if (item.key === "dashboard" || item.key === "settings") {
      return true;
    }
    // Als er geen voorkeuren zijn, toon alles (standaard gedrag)
    if (!preferences) {
      return true;
    }
    // Check of deze module zichtbaar moet zijn
    return preferences[item.key as keyof UserPreferences] === true;
  });

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-foreground">EasyBoek</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        {pathname?.startsWith("/admin") && (
          <>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center justify-center">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </div>
  );
}
