import OpenAI from "openai";
import { readFile } from "fs/promises";
import { join } from "path";
import pdfParse from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converteer afbeelding naar base64
 */
async function imageToBase64(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath);
  return fileBuffer.toString("base64");
}

/**
 * Extract tekst uit PDF
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw error;
  }
}

/**
 * OCR service met OpenAI Vision API
 * Ondersteunt afbeeldingen (JPG, PNG) en PDFs
 * @param url - Relatieve URL (bijv. /uploads/file.jpg) of absolute file path
 */
export async function processOCR(url: string): Promise<{
  ocrText: string;
  confidence?: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY niet gevonden, gebruik fallback OCR");
    return {
      ocrText: `OCR niet beschikbaar: OPENAI_API_KEY niet geconfigureerd. Document: ${url}`,
      confidence: 0,
    };
  }

  try {
    // Converteer URL naar file path
    // Als het al een absolute path is, gebruik die; anders maak er een van
    const filePath = url.startsWith("/") 
      ? join(process.cwd(), "public", url)
      : url.startsWith(process.cwd())
      ? url
      : join(process.cwd(), "public", url);
    
    const fileExtension = url.split(".").pop()?.toLowerCase();

    // Voor PDFs: probeer eerst directe tekst extractie
    if (fileExtension === "pdf") {
      try {
        const pdfText = await extractTextFromPDF(filePath);
        if (pdfText && pdfText.trim().length > 0) {
          return {
            ocrText: pdfText,
            confidence: 0.9,
          };
        }
      } catch (error) {
        console.log("PDF tekst extractie faalde, gebruik Vision API");
        // Fallback naar Vision API voor PDF eerste pagina
      }
    }

    // Voor afbeeldingen en PDFs: gebruik OpenAI Vision API
    const base64Image = await imageToBase64(filePath);
    const mimeType = fileExtension === "pdf" 
      ? "application/pdf" 
      : fileExtension === "png" 
      ? "image/png" 
      : "image/jpeg";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract alle tekst uit dit document. Geef de volledige tekst terug, inclusief bedragen, datums, leveranciers, en alle andere relevante informatie. Formatteer de tekst duidelijk met nieuwe regels waar nodig.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const ocrText = response.choices[0]?.message?.content || "";

    if (!ocrText || ocrText.trim().length === 0) {
      throw new Error("Geen tekst gevonden in document");
    }

    return {
      ocrText: ocrText.trim(),
      confidence: 0.95,
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    
    // Fallback: retourneer error message maar blijf functioneel
    return {
      ocrText: `OCR fout: ${error instanceof Error ? error.message : "Onbekende fout"}. Document: ${url}`,
      confidence: 0,
    };
  }
}
