import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EasyBoek - Administratie & Belastingautomatisering",
  description: "Volledig ontzorgd boekhouden voor ZZP'ers met AI-automatisering. Kies tussen Basis (€29,95/maand) of Premium (€39,95/maand eerste 6 maanden, daarna €49,95/maand).",
};

import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="nl" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}

