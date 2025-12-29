import OpenAI from "openai";
import { STANDARD_LEDGER_ACCOUNTS, findBestLedgerAccount } from "@/lib/ledgerAccounts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI categorisatie service met OpenAI
 * Categoriseert documenten en suggereert grootboekrekeningen
 */
export async function categorizeDocument(
  ocrText: string
): Promise<{
  category: string;
  suggestedLedger: number;
  confidence?: number;
  extractedAmount?: number;
  extractedDate?: string;
  vendor?: string;
  vatPercentage?: number;
  vatAmount?: number;
  amountExclVat?: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY niet gevonden, gebruik fallback categorisatie");
    return fallbackCategorize(ocrText);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Je bent een expert in Nederlandse boekhouding voor ZZP'ers. 
Analyseer de OCR tekst van een document (bon, factuur, etc.) en geef een JSON response terug met:

BELANGRIJK: Analyseer het document grondig en let op:
- Productnamen en merken (bijv. "iPhone 15", "MacBook Pro", "Samsung Galaxy", "HP Laptop")
- Of het om hardware (aanschaf) of abonnementen/diensten gaat
- De context van het document (aankoopbon, factuur, etc.)
- category: een duidelijke categorie naam (bijv. "kantoor-kosten", "reis-kosten", "representatie-kosten", "inkomsten", "overige-kosten")
- suggestedLedger: een grootboekrekening code - KIES DE MEEST SPECIFIEKE CODE uit onderstaande lijst
- extractedAmount: het TOTAAL bedrag in het document INCL. BTW (als getal, bijv. 123.45). Zoek naar "Totaal", "Totaalbedrag", "Totaal incl. BTW", of het hoogste bedrag als er meerdere zijn. GEEN bedrag als je het niet zeker weet.
- extractedDate: de datum in het document (format: YYYY-MM-DD)
- vendor: de naam van de leverancier/winkel (indien aanwezig)
- vatPercentage: het BTW percentage in het document (bijv. 21, 9, of 0). Als er geen BTW is of je weet het niet zeker, geef null terug.
- vatAmount: het BTW bedrag in het document (als getal, bijv. 21.45). Als er geen BTW is, geef 0 terug.
- amountExclVat: het bedrag EXCL. BTW (als getal, bijv. 102.05). Bereken dit als: extractedAmount - vatAmount. Als er geen BTW is, is dit gelijk aan extractedAmount.

BESCHIKBARE GROOTBOEKREKENINGEN - KIES DE MEEST SPECIFIEKE:

KANTOOR KOSTEN (45xx):
- 4500: Kantoor kosten (algemeen)
- 4510: Kantoorartikelen (papier, pennen, mappen) - keywords: papier, pen, map, kantoorartikelen, bol.com
- 4520: Kantoormeubilair (bureaus, stoelen, kasten) - keywords: bureau, stoel, kast, meubilair, ikea
- 4530: Software & Licenties - keywords: software, microsoft, adobe, licentie, abonnement, subscription, saas, cloud
- 4540: Internet & Telefoon (abonnementen) - keywords: internet, telefoon, mobiel, kpn, ziggo, vodafone, t-mobile (LET OP: alleen voor abonnementen, NIET voor hardware)
- 4550: Hosting & Domeinnaam - keywords: hosting, domein, domain, server, vps, transip, mijndomein
- 4560: Post & Verzending - keywords: post, postzegel, verzending, pakket, dhl, postnl
- 4570: Printer & Inkt - keywords: printer, inkt, toner, hp, canon, epson
- 4580: IT-apparatuur (telefoons, laptops, tablets, computers) - keywords: iphone, ipad, laptop, computer, smartphone, telefoon (hardware), tablet, macbook, imac, pc, desktop, hardware, apple, samsung, huawei, xiaomi, oneplus, google pixel, notebook, ultrabook
  LET OP: Als je "iPhone", "iPad", "MacBook", "laptop", "computer", "smartphone" of soortgelijke hardware ziet in de factuur → gebruik 4580
  Als je alleen "telefoon" of "internet" ziet zonder productnaam → gebruik 4540 (abonnement)

REISKOSTEN (46xx):
- 4600: Reiskosten (algemeen)
- 4610: Brandstof - keywords: brandstof, benzine, diesel, lpg, shell, bp, esso, tango, tanken, tankstation
- 4620: Parkeren - keywords: parkeren, parking, parkeerplaats, q-park
- 4630: Openbaar Vervoer - keywords: ov, trein, bus, tram, metro, ns, ov-chipkaart, ov-chip
- 4640: Taxi - keywords: taxi, uber, bolt
- 4650: Vliegtickets - keywords: vliegticket, vliegtuig, vlucht, klm, transavia, easyjet
- 4660: Hotel & Overnachting - keywords: hotel, overnachting, bnb, booking.com, trivago
- 4670: Tolwegen - keywords: tol, tolweg, vignet, dartford, tunnel
- 4680: Representatiekosten - keywords: koffie, lunch, diner, borrel, representatie, representatiekosten, catering, maaltijd, restaurant, café, eten (zakelijk), drinken (zakelijk), business lunch, business dinner, networking, relatiegeschenk

OVERIGE KOSTEN:
- 4000: Algemene kosten (alleen als niets anders van toepassing is)
- 4690: Overige algemene kosten - gebruik voor algemene kosten die niet in andere categorieën passen (bijv. boodschappen, algemene uitgaven)
- 4900: Verzekeringen - keywords: verzekering, insurance, aov, aansprakelijkheid
- 4910: Advies & Accountancy - keywords: advies, accountant, boekhouder, consultant
- 4920: Marketing & Reclame - keywords: marketing, reclame, advertentie, google ads, facebook ads
- 4930: Opleiding & Cursussen - keywords: opleiding, cursus, training, studie
- 4940: Reparaties & Onderhoud - keywords: reparatie, onderhoud, maintenance
- 4950: Huur & Huurderlasten - keywords: huur, kantoorhuur, servicekosten
- 4960: Energie & Water - keywords: energie, gas, elektriciteit, stroom, water, essent, vattenfall
- 4999: Overige kosten (laatste redmiddel, alleen als echt niets anders past)

OPBRENGSTEN (8xxx):
- 8000: Omzet (algemeen)
- 8100: Omzet Diensten - keywords: dienst, consultancy, advies
- 8200: Omzet Producten - keywords: product, verkoop, producten

VOORBEELDEN:
- "Shell" + brandstof → 4610 (brandstof)
- "BP" + tanken → 4610 (brandstof)
- "NS" + treinkaartje → 4630 (openbaar vervoer)
- "Parkeren" → 4620 (parkeren)
- "Koffie" of "lunch" of "diner" of "borrel" → 4680 (representatiekosten)
- "Restaurant" + zakelijk → 4680 (representatiekosten)
- "Café" + zakelijk → 4680 (representatiekosten)
- "Bol.com" + kantoorartikelen → 4510 (kantoorartikelen)
- "Microsoft" + software → 4530 (software & licenties)
- "KPN" + internet → 4540 (internet & telefoon) - alleen voor abonnementen
- "TransIP" + hosting → 4550 (hosting & domeinnaam)
- "HP" + printer → 4570 (printer & inkt)
- "iPhone" of "Apple" + telefoon/laptop → 4580 (IT-apparatuur)
- "Samsung" + telefoon → 4580 (IT-apparatuur)
- "Laptop" of "MacBook" → 4580 (IT-apparatuur)
- "AH" + boodschappen → 4690 (overige algemene kosten, tenzij duidelijk zakelijk)
- Factuur van klant → 8000 of 8100 (omzet)

BELANGRIJK: 
- Kies ALTIJD de meest specifieke grootboekrekening (bijv. 4610 boven 4600, 4510 boven 4500, 4580 voor IT-hardware)
- IT-apparatuur (telefoons, laptops, tablets, computers) → 4580 (NIET 4540, want dat is voor abonnementen)
- extractedAmount moet het TOTAAL bedrag zijn (incl. BTW), niet een deelbedrag
- Als je het bedrag niet zeker weet, zet extractedAmount op null
- vendor moet de naam van de winkel/leverancier zijn (bijv. "Shell", "AH", "Bol.com", "Apple", "MediaMarkt")
- Analyseer het document goed: als het om hardware gaat (aanschaf), gebruik 4580. Als het om abonnementen/diensten gaat, gebruik 4540
- Geef alleen geldige JSON terug, geen extra tekst.`,
        },
        {
          role: "user",
          content: `Analyseer dit document:\n\n${ocrText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Geen response van OpenAI");
    }

    const result = JSON.parse(content);

    // Speciale check voor koffie/lunch - altijd representatiekosten (VOOR validatie)
    const text = ocrText.toLowerCase();
    if (text.includes("koffie") || text.includes("lunch") || text.includes("diner") || 
        text.includes("borrel") || text.includes("representatie") || text.includes("catering") ||
        (text.includes("restaurant") && (text.includes("zakelijk") || text.includes("business") || text.includes("lunch") || text.includes("diner"))) ||
        (text.includes("café") && (text.includes("zakelijk") || text.includes("business") || text.includes("koffie")))) {
      // Forceer representatiekosten
      return {
        category: "representatie-kosten",
        suggestedLedger: 4680,
        confidence: 0.95,
        extractedAmount: result.extractedAmount,
        extractedDate: result.extractedDate,
        vendor: result.vendor,
        vatPercentage: result.vatPercentage,
        vatAmount: result.vatAmount,
        amountExclVat: result.amountExclVat,
      };
    }

    // Valideer en normaliseer resultaat
    const category = result.category || "overige-kosten";
    let suggestedLedger = parseInt(result.suggestedLedger) || 4690;
    
    // Valideer dat de code bestaat in onze standaard rekeningen
    const validAccount = STANDARD_LEDGER_ACCOUNTS.find(acc => acc.code === suggestedLedger.toString());
    if (!validAccount) {
      // Fallback: gebruik findBestLedgerAccount als AI een ongeldige code geeft
      const bestAccount = findBestLedgerAccount(ocrText, result.vendor);
      if (bestAccount) {
        suggestedLedger = parseInt(bestAccount.code);
      } else {
        // Laatste fallback
        if (category.includes("inkomsten") || category.includes("omzet")) {
          suggestedLedger = 8000;
        } else {
          suggestedLedger = 4999;
        }
      }
    }
    
    // Zorg dat ledger code binnen geldig bereik valt
    if (category.includes("inkomsten") || category.includes("omzet")) {
      if (suggestedLedger < 8000 || suggestedLedger >= 9000) {
        suggestedLedger = 8000;
      }
        } else {
          if (suggestedLedger < 4000 || suggestedLedger >= 5000) {
            suggestedLedger = 4690;
          }
        }

    // Valideer extractedAmount - moet een redelijk bedrag zijn
    let validatedAmount: number | undefined = undefined;
    if (result.extractedAmount !== null && result.extractedAmount !== undefined) {
      const amount = parseFloat(result.extractedAmount);
      if (!isNaN(amount) && amount > 0 && amount < 100000) {
        validatedAmount = amount;
      }
    }

    // Valideer BTW gegevens
    let vatPercentage: number | undefined = undefined;
    if (result.vatPercentage !== null && result.vatPercentage !== undefined) {
      const vat = parseFloat(result.vatPercentage);
      if (!isNaN(vat) && (vat === 0 || vat === 9 || vat === 21)) {
        vatPercentage = vat;
      }
    }

    let vatAmount: number | undefined = undefined;
    if (result.vatAmount !== null && result.vatAmount !== undefined) {
      const vat = parseFloat(result.vatAmount);
      if (!isNaN(vat) && vat >= 0 && vat < 100000) {
        vatAmount = vat;
      }
    }

    let amountExclVat: number | undefined = undefined;
    if (validatedAmount && vatAmount !== undefined) {
      amountExclVat = validatedAmount - vatAmount;
      if (amountExclVat < 0) amountExclVat = validatedAmount; // Fallback als berekening fout gaat
    } else if (validatedAmount) {
      amountExclVat = validatedAmount; // Geen BTW, dus bedrag is excl. BTW
    }

    return {
      category,
      suggestedLedger,
      confidence: result.confidence || 0.8,
      extractedAmount: validatedAmount,
      extractedDate: result.extractedDate,
      vendor: result.vendor,
      vatPercentage,
      vatAmount,
      amountExclVat,
    };
  } catch (error) {
    console.error("AI categorisatie error:", error);
    // Fallback naar simpele categorisatie
    return fallbackCategorize(ocrText);
  }
}

/**
 * Fallback categorisatie zonder AI
 */
function fallbackCategorize(ocrText: string): {
  category: string;
  suggestedLedger: number;
  confidence?: number;
  extractedAmount?: number;
  extractedDate?: string;
  vendor?: string;
  vatPercentage?: number;
  vatAmount?: number;
  amountExclVat?: number;
} {
  const text = ocrText.toLowerCase();
  
  // Gebruik findBestLedgerAccount voor betere fallback
  const bestAccount = findBestLedgerAccount(ocrText);
  if (bestAccount) {
    return {
      category: bestAccount.category,
      suggestedLedger: parseInt(bestAccount.code),
      confidence: 0.7,
    };
  }

  // Oude fallback logica
  if (text.includes("kantoor") || text.includes("office") || text.includes("papier") || text.includes("printer")) {
    return {
      category: "kantoor-kosten",
      suggestedLedger: 4500,
      confidence: 0.7,
    };
  }

  if (
    text.includes("brandstof") ||
    text.includes("tank") ||
    text.includes("shell") ||
    text.includes("bp") ||
    text.includes("esso") ||
    text.includes("tanken")
  ) {
    return {
      category: "reis-kosten",
      suggestedLedger: 4610, // Meer specifiek: brandstof
      confidence: 0.7,
    };
  }

  if (text.includes("factuur") || text.includes("invoice") || text.includes("verkoop")) {
    return {
      category: "inkomsten",
      suggestedLedger: 8000,
      confidence: 0.8,
    };
  }

  // Default
  return {
    category: "overige-kosten",
    suggestedLedger: 4690,
    confidence: 0.5,
  };
}
