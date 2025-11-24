/**
 * Standaard grootboekrekeningen voor Nederlandse ZZP boekhouding
 * Volgens algemene Nederlandse boekhouding standaarden
 */

export interface LedgerAccountDefinition {
  code: string;
  name: string;
  type: "balance" | "result";
  category: string;
  description?: string;
  keywords?: string[]; // Keywords voor AI categorisatie
}

export const STANDARD_LEDGER_ACCOUNTS: LedgerAccountDefinition[] = [
  // BALANS REKENINGEN (0xxx-3xxx)
  
  // Activa (0xxx-1xxx)
  { code: "1000", name: "Bank", type: "balance", category: "activa", description: "Bankrekening" },
  { code: "1010", name: "Kas", type: "balance", category: "activa", description: "Contant geld" },
  { code: "1300", name: "Debiteuren", type: "balance", category: "activa", description: "Openstaande facturen van klanten" },
  
  // Passiva (2xxx-3xxx)
  { code: "2000", name: "Eigen vermogen", type: "balance", category: "passiva", description: "Eigen vermogen" },
  { code: "3000", name: "Crediteuren", type: "balance", category: "passiva", description: "Openstaande facturen aan leveranciers" },
  { code: "1500", name: "BTW te ontvangen", type: "balance", category: "passiva", description: "BTW over verkopen (te betalen aan Belastingdienst)" },
  { code: "1510", name: "BTW te vorderen", type: "balance", category: "activa", description: "BTW over inkoop (terug te vorderen van Belastingdienst)" },
  
  // KOSTEN (4xxx-6xxx)
  
  // Algemene kosten (4xxx)
  { code: "4000", name: "Algemene kosten", type: "result", category: "kosten", description: "Algemene bedrijfskosten", keywords: ["algemeen", "diversen"] },
  
  // Kantoor kosten (45xx)
  { code: "4500", name: "Kantoor kosten", type: "result", category: "kosten", description: "Algemene kantoor kosten", keywords: ["kantoor", "office"] },
  { code: "4510", name: "Kantoorartikelen", type: "result", category: "kosten", description: "Papier, pennen, mappen, etc.", keywords: ["papier", "pen", "map", "kantoorartikelen", "bol.com", "kantoorvakhandel"] },
  { code: "4520", name: "Kantoormeubilair", type: "result", category: "kosten", description: "Bureaus, stoelen, kasten", keywords: ["bureau", "stoel", "kast", "meubilair", "ikea"] },
  { code: "4530", name: "Software & Licenties", type: "result", category: "kosten", description: "Software abonnementen en licenties", keywords: ["software", "microsoft", "adobe", "licentie", "abonnement", "subscription", "saas", "cloud"] },
  { code: "4540", name: "Internet & Telefoon", type: "result", category: "kosten", description: "Internet, telefoon, mobiel", keywords: ["internet", "telefoon", "mobiel", "kpn", "ziggo", "vodafone", "t-mobile"] },
  { code: "4550", name: "Hosting & Domeinnaam", type: "result", category: "kosten", description: "Website hosting en domeinnamen", keywords: ["hosting", "domein", "domain", "server", "vps", "transip", "mijndomein"] },
  { code: "4560", name: "Post & Verzending", type: "result", category: "kosten", description: "Postzegels, pakketverzending", keywords: ["post", "postzegel", "verzending", "pakket", "dhl", "postnl"] },
  { code: "4570", name: "Printer & Inkt", type: "result", category: "kosten", description: "Printer, inkt, toner", keywords: ["printer", "inkt", "toner", "hp", "canon", "epson"] },
  { code: "4580", name: "IT-apparatuur", type: "result", category: "kosten", description: "Telefoons, laptops, tablets, computers, smartphones en andere IT-hardware", keywords: ["iphone", "ipad", "laptop", "computer", "smartphone", "telefoon", "tablet", "macbook", "imac", "pc", "desktop", "hardware", "it-apparatuur", "apple", "samsung", "huawei", "xiaomi", "oneplus", "google pixel", "notebook", "ultrabook"] },
  
  // Reiskosten (46xx)
  { code: "4600", name: "Reiskosten", type: "result", category: "kosten", description: "Algemene reiskosten", keywords: ["reis", "travel"] },
  { code: "4610", name: "Brandstof", type: "result", category: "kosten", description: "Benzine, diesel, LPG", keywords: ["brandstof", "benzine", "diesel", "lpg", "shell", "bp", "esso", "tango", "tanken", "tankstation"] },
  { code: "4620", name: "Parkeren", type: "result", category: "kosten", description: "Parkeerkosten", keywords: ["parkeren", "parking", "parkeerplaats", "q-park"] },
  { code: "4630", name: "Openbaar Vervoer", type: "result", category: "kosten", description: "OV-chipkaart, trein, bus", keywords: ["ov", "trein", "bus", "tram", "metro", "ns", "ov-chipkaart", "ov-chip"] },
  { code: "4640", name: "Taxi", type: "result", category: "kosten", description: "Taxi kosten", keywords: ["taxi", "uber", "bolt"] },
  { code: "4650", name: "Vliegtickets", type: "result", category: "kosten", description: "Vliegtickets zakelijk", keywords: ["vliegticket", "vliegtuig", "vlucht", "klm", "transavia", "easyjet"] },
  { code: "4660", name: "Hotel & Overnachting", type: "result", category: "kosten", description: "Hotel, B&B zakelijk", keywords: ["hotel", "overnachting", "bnb", "booking.com", "trivago"] },
  { code: "4670", name: "Tolwegen", type: "result", category: "kosten", description: "Tolwegen, vignetten", keywords: ["tol", "tolweg", "vignet", "dartford", "tunnel"] },
  { code: "4690", name: "Overige algemene kosten", type: "result", category: "kosten", description: "Overige algemene kosten die niet in andere categorieën passen", keywords: ["overig", "algemeen", "diversen", "overige"] },
  
  // Overige kosten (49xx)
  { code: "4900", name: "Verzekeringen", type: "result", category: "kosten", description: "Bedrijfsverzekeringen", keywords: ["verzekering", "insurance", "aov", "aansprakelijkheid"] },
  { code: "4910", name: "Advies & Accountancy", type: "result", category: "kosten", description: "Advieskosten, accountant", keywords: ["advies", "accountant", "boekhouder", "consultant"] },
  { code: "4920", name: "Marketing & Reclame", type: "result", category: "kosten", description: "Marketing, advertenties", keywords: ["marketing", "reclame", "advertentie", "google ads", "facebook ads"] },
  { code: "4930", name: "Opleiding & Cursussen", type: "result", category: "kosten", description: "Cursussen, trainingen", keywords: ["opleiding", "cursus", "training", "studie"] },
  { code: "4940", name: "Reparaties & Onderhoud", type: "result", category: "kosten", description: "Reparaties en onderhoud", keywords: ["reparatie", "onderhoud", "maintenance"] },
  { code: "4950", name: "Huur & Huurderlasten", type: "result", category: "kosten", description: "Kantoorhuur, servicekosten", keywords: ["huur", "kantoorhuur", "servicekosten"] },
  { code: "4960", name: "Energie & Water", type: "result", category: "kosten", description: "Gas, elektriciteit, water", keywords: ["energie", "gas", "elektriciteit", "stroom", "water", "essent", "vattenfall"] },
  { code: "4999", name: "Overige kosten", type: "result", category: "kosten", description: "Overige niet gespecificeerde kosten", keywords: ["overig", "diversen", "overige"] },
  
  // Opbrengsten (8xxx)
  { code: "8000", name: "Omzet", type: "result", category: "opbrengsten", description: "Algemene omzet uit diensten/producten", keywords: ["omzet", "inkomsten", "factuur", "verkoop", "diensten"] },
  { code: "8100", name: "Omzet Diensten", type: "result", category: "opbrengsten", description: "Omzet uit dienstverlening", keywords: ["dienst", "consultancy", "advies"] },
  { code: "8200", name: "Omzet Producten", type: "result", category: "opbrengsten", description: "Omzet uit productverkoop", keywords: ["product", "verkoop", "producten"] },
];

/**
 * Vind de beste grootboekrekening op basis van keywords en vendor
 * Retourneert de meest specifieke match
 */
export function findBestLedgerAccount(
  ocrText: string,
  vendor?: string
): LedgerAccountDefinition | null {
  const text = (ocrText + " " + (vendor || "")).toLowerCase();
  
  // Sorteer rekeningen op specificiteit (meer specifieke codes eerst)
  const sortedAccounts = [...STANDARD_LEDGER_ACCOUNTS].sort((a, b) => {
    // Kosten rekeningen: 4xxx, dan 45xx/46xx/49xx, dan 45xx/46xx/49xx
    if (a.category === "kosten" && b.category === "kosten") {
      // Meer specifieke codes (meer cijfers) eerst
      return b.code.length - a.code.length || parseInt(b.code) - parseInt(a.code);
    }
    return 0;
  });
  
  // Zoek eerst op specifieke keywords (meest specifieke eerst)
  for (const account of sortedAccounts) {
    if (account.keywords) {
      for (const keyword of account.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          return account;
        }
      }
    }
  }
  
  // Fallback naar algemene rekeningen
  if (text.includes("kantoor") || text.includes("office")) {
    return STANDARD_LEDGER_ACCOUNTS.find(a => a.code === "4500") || null;
  }
  
  // IT-apparatuur (hardware) - controleer dit VOOR telefoon/internet abonnementen
  if (text.includes("iphone") || text.includes("ipad") || text.includes("laptop") || 
      text.includes("macbook") || text.includes("computer") || text.includes("smartphone") ||
      text.includes("tablet") || text.includes("pc") || text.includes("desktop") ||
      text.includes("hardware") || text.includes("it-apparatuur") || 
      (text.includes("apple") && (text.includes("telefoon") || text.includes("laptop") || text.includes("ipad"))) ||
      (text.includes("samsung") && text.includes("telefoon"))) {
    return STANDARD_LEDGER_ACCOUNTS.find(a => a.code === "4580") || null;
  }
  
  if (text.includes("reis") || text.includes("travel") || text.includes("brandstof") || text.includes("shell") || text.includes("bp")) {
    return STANDARD_LEDGER_ACCOUNTS.find(a => a.code === "4610") || null; // Meer specifiek: brandstof
  }
  
  if (text.includes("factuur") || text.includes("invoice") || text.includes("omzet")) {
    return STANDARD_LEDGER_ACCOUNTS.find(a => a.code === "8000") || null;
  }
  
  return STANDARD_LEDGER_ACCOUNTS.find(a => a.code === "4690") || null;
}

/**
 * Haal alle rekeningen op voor een specifieke categorie
 */
export function getAccountsByCategory(category: "kosten" | "opbrengsten" | "activa" | "passiva"): LedgerAccountDefinition[] {
  return STANDARD_LEDGER_ACCOUNTS.filter(acc => acc.category === category);
}

/**
 * Haal alle kostenrekeningen op (voor dropdowns)
 */
export function getCostAccounts(): LedgerAccountDefinition[] {
  return STANDARD_LEDGER_ACCOUNTS.filter(acc => acc.category === "kosten");
}

/**
 * Haal alle opbrengstenrekeningen op
 */
export function getRevenueAccounts(): LedgerAccountDefinition[] {
  return STANDARD_LEDGER_ACCOUNTS.filter(acc => acc.category === "opbrengsten");
}

