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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Uploads", href: "/dashboard/upload", icon: Upload },
  { name: "Documenten", href: "/dashboard/documents", icon: FileText },
  { name: "Boekingen", href: "/dashboard/bookings", icon: BookOpen },
  { name: "Facturen", href: "/dashboard/invoices", icon: FileText },
  { name: "Klanten", href: "/dashboard/customers", icon: Users },
  { name: "Grootboekrekeningen", href: "/dashboard/ledger-accounts", icon: BookOpen },
  { name: "BTW", href: "/dashboard/btw", icon: Receipt },
  { name: "Rapportages", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Herhalende Boekingen", href: "/dashboard/recurring", icon: Repeat },
  { name: "Belastingregels", href: "/dashboard/tax-rules", icon: Scale },
  { name: "Instellingen", href: "/dashboard/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Admin Panel", href: "/admin", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">EasyBoek</h1>
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
        <UserButton />
      </div>
    </div>
  );
}

