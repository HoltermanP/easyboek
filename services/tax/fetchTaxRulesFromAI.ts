import OpenAI from "openai";
import { getTaxRulesForYear, type TaxRulesData } from "./getTaxRules";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Haalt belastingregels op voor een specifiek jaar
 * Gebruikt eerst statische regels, vult aan met OpenAI indien nodig
 */
export async function fetchTaxRulesFromAI(year: number): Promise<TaxRulesData> {
  // Start met statische regels als basis
  const staticRules = getTaxRulesForYear(year);
  
  // Als OpenAI niet beschikbaar is, retourneer statische regels
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY niet geconfigureerd, gebruik statische regels");
    return staticRules;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Je bent een expert in Nederlandse belastingwetgeving. Je taak is om ALLEEN feitelijke, officiële belastingregels op te halen voor een specifiek jaar.

BELANGRIJK:
- Geef ALLEEN feitelijke, officiële cijfers terug van de Nederlandse Belastingdienst
- Geen interpretaties, advies of uitleg
- Gebruik de EXACTE officiële cijfers voor het jaar ${year}
- Geef een COMPLEET JSON object terug met ALLE gevraagde velden
- Als je een waarde niet zeker weet, gebruik null
- Gebruik alleen officiële bronnen (belastingdienst.nl, rijksoverheid.nl)

Gevraagde informatie voor jaar ${year}:
- vatStandardRate: Standaard BTW tarief (meestal 21%, maar kan variëren)
- vatReducedRate: Verlaagd BTW tarief (meestal 9%, maar kan variëren)
- vatZeroRate: Nul BTW tarief (meestal 0%)
- incomeTaxRate1: Inkomstenbelasting tarief eerste schijf box 1 (percentage, bijv. 36.93)
- incomeTaxRate2: Inkomstenbelasting tarief tweede schijf box 1 (percentage, bijv. 36.93)
- incomeTaxRate3: Inkomstenbelasting tarief derde schijf box 1 (percentage, bijv. 49.50)
- incomeTaxRate4: Inkomstenbelasting tarief vierde schijf box 1 (percentage, bijv. 49.50)
- incomeTaxBracket1: Eerste schijf tot bedrag in euro's (bijv. 75031)
- incomeTaxBracket2: Tweede schijf tot bedrag in euro's (bijv. 75031)
- incomeTaxBracket3: Derde schijf tot bedrag in euro's (bijv. 75031)
- generalTaxCredit: Algemene heffingskorting in euro's (bijv. 3070)
- employmentTaxCredit: Arbeidskorting in euro's (kan 0 zijn als afgebouwd)
- selfEmployedDeduction: Zelfstandigenaftrek in euro's (bijv. 5030)
- smeProfitExemption: MKB-winstvrijstelling percentage (bijv. 14.0)
- vatFilingFrequency: BTW aangifte frequentie ("monthly", "quarterly", of "yearly")

Geef ALLEEN een geldig JSON object terug met ALLE velden, geen extra tekst.`,
        },
        {
          role: "user",
          content: `Geef me de EXACTE officiële Nederlandse belastingregels voor het jaar ${year}. 
          
Belangrijk: Geef ALLE gevraagde velden terug. Gebruik de officiële cijfers van de Belastingdienst voor dit specifieke jaar.
          
Voorbeeld structuur:
{
  "vatStandardRate": 21.0,
  "vatReducedRate": 9.0,
  "vatZeroRate": 0.0,
  "incomeTaxRate1": 36.93,
  "incomeTaxRate2": 36.93,
  "incomeTaxRate3": 49.50,
  "incomeTaxRate4": 49.50,
  "incomeTaxBracket1": 75031,
  "incomeTaxBracket2": 75031,
  "incomeTaxBracket3": 75031,
  "generalTaxCredit": 3070,
  "employmentTaxCredit": 0,
  "selfEmployedDeduction": 5030,
  "smeProfitExemption": 14.0,
  "vatFilingFrequency": "quarterly"
}

Geef nu de EXACTE cijfers voor jaar ${year}.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.0, // Zeer lage temperature voor exacte cijfers
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("Geen response van OpenAI, gebruik statische regels");
      return staticRules;
    }

    const result = JSON.parse(content);

    // Valideer en normaliseer de resultaten, gebruik statische regels als fallback
    const validated: TaxRulesData = {
      ...staticRules,
      source: `OpenAI + Statisch (${new Date().toISOString()})`,
    };

    // BTW tarieven - gebruik AI als beschikbaar, anders statisch
    validated.vatStandardRate = 
      result.vatStandardRate !== null && result.vatStandardRate !== undefined
        ? parseFloat(result.vatStandardRate)
        : staticRules.vatStandardRate;

    validated.vatReducedRate = 
      result.vatReducedRate !== null && result.vatReducedRate !== undefined
        ? parseFloat(result.vatReducedRate)
        : staticRules.vatReducedRate;

    validated.vatZeroRate = 
      result.vatZeroRate !== null && result.vatZeroRate !== undefined
        ? parseFloat(result.vatZeroRate)
        : staticRules.vatZeroRate;

    // Inkomstenbelasting tarieven
    if (result.incomeTaxRate1 !== null && result.incomeTaxRate1 !== undefined) {
      const rate = parseFloat(result.incomeTaxRate1 as string);
      if (!isNaN(rate) && rate >= 0 && rate <= 100) {
        validated.incomeTaxRate1 = rate;
      }
    }
    if (result.incomeTaxRate2 !== null && result.incomeTaxRate2 !== undefined) {
      const rate = parseFloat(result.incomeTaxRate2 as string);
      if (!isNaN(rate) && rate >= 0 && rate <= 100) {
        validated.incomeTaxRate2 = rate;
      }
    }
    if (result.incomeTaxRate3 !== null && result.incomeTaxRate3 !== undefined) {
      const rate = parseFloat(result.incomeTaxRate3 as string);
      if (!isNaN(rate) && rate >= 0 && rate <= 100) {
        validated.incomeTaxRate3 = rate;
      }
    }
    if (result.incomeTaxRate4 !== null && result.incomeTaxRate4 !== undefined) {
      const rate = parseFloat(result.incomeTaxRate4 as string);
      if (!isNaN(rate) && rate >= 0 && rate <= 100) {
        validated.incomeTaxRate4 = rate;
      }
    }

    // Inkomstenbelasting schijven
    if (result.incomeTaxBracket1 !== null && result.incomeTaxBracket1 !== undefined) {
      const bracket = parseFloat(result.incomeTaxBracket1 as string);
      if (!isNaN(bracket) && bracket > 0) {
        validated.incomeTaxBracket1 = bracket;
      }
    }
    if (result.incomeTaxBracket2 !== null && result.incomeTaxBracket2 !== undefined) {
      const bracket = parseFloat(result.incomeTaxBracket2 as string);
      if (!isNaN(bracket) && bracket > 0) {
        validated.incomeTaxBracket2 = bracket;
      }
    }
    if (result.incomeTaxBracket3 !== null && result.incomeTaxBracket3 !== undefined) {
      const bracket = parseFloat(result.incomeTaxBracket3 as string);
      if (!isNaN(bracket) && bracket > 0) {
        validated.incomeTaxBracket3 = bracket;
      }
    }

    // Kortingen en aftrekposten
    validated.generalTaxCredit = 
      result.generalTaxCredit !== null && result.generalTaxCredit !== undefined
        ? parseFloat(result.generalTaxCredit)
        : staticRules.generalTaxCredit;

    validated.employmentTaxCredit = 
      result.employmentTaxCredit !== null && result.employmentTaxCredit !== undefined
        ? parseFloat(result.employmentTaxCredit)
        : staticRules.employmentTaxCredit;

    validated.selfEmployedDeduction = 
      result.selfEmployedDeduction !== null && result.selfEmployedDeduction !== undefined
        ? parseFloat(result.selfEmployedDeduction)
        : staticRules.selfEmployedDeduction;

    validated.smeProfitExemption = 
      result.smeProfitExemption !== null && result.smeProfitExemption !== undefined
        ? parseFloat(result.smeProfitExemption)
        : staticRules.smeProfitExemption;

    // BTW aangifte frequentie
    validated.vatFilingFrequency = 
      result.vatFilingFrequency && ["monthly", "quarterly", "yearly"].includes(result.vatFilingFrequency)
        ? result.vatFilingFrequency
        : staticRules.vatFilingFrequency;

    // Additional rules
    if (result.additionalRules && typeof result.additionalRules === "object") {
      validated.additionalRules = result.additionalRules;
    }

    return validated;
  } catch (error) {
    console.error("Error fetching tax rules from AI, gebruik statische regels:", error);
    // Fallback naar statische regels bij fout
    return staticRules;
  }
}

