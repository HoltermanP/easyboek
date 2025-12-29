import OpenAI from "openai";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
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
    let filePath: string;
    if (url.startsWith(process.cwd())) {
      filePath = url;
    } else if (url.startsWith("/")) {
      filePath = join(process.cwd(), "public", url);
    } else {
      filePath = join(process.cwd(), "public", url);
    }
    
    // Check of bestand bestaat
    if (!existsSync(filePath)) {
      throw new Error(`Bestand niet gevonden: ${filePath}`);
    }
    
    // Extract file extension - ondersteun zowel .jpg als .jpeg
    const urlLower = url.toLowerCase();
    let fileExtension: string | undefined;
    if (urlLower.endsWith(".jpg") || urlLower.endsWith(".jpeg")) {
      fileExtension = "jpg";
    } else if (urlLower.endsWith(".png")) {
      fileExtension = "png";
    } else if (urlLower.endsWith(".pdf")) {
      fileExtension = "pdf";
    } else {
      fileExtension = url.split(".").pop()?.toLowerCase();
    }

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
    let base64Image: string;
    let mimeType: string;
    
    if (fileExtension === "pdf") {
      mimeType = "application/pdf";
      base64Image = await imageToBase64(filePath);
    } else if (fileExtension === "png") {
      mimeType = "image/png";
      base64Image = await imageToBase64(filePath);
    } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
      mimeType = "image/jpeg";
      base64Image = await imageToBase64(filePath);
    } else {
      // Fallback: probeer als JPEG
      console.warn(`Onbekende extensie ${fileExtension}, probeer als JPEG`);
      mimeType = "image/jpeg";
      base64Image = await imageToBase64(filePath);
    }

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
    console.error("File path:", url);
    console.error("Error details:", error instanceof Error ? error.stack : error);
    
    // Fallback: retourneer error message maar blijf functioneel
    const errorMessage = error instanceof Error ? error.message : "Onbekende fout";
    return {
      ocrText: `OCR fout: ${errorMessage}. Document: ${url}. Controleer of het bestand bestaat en een geldig JPG, PNG of PDF bestand is.`,
      confidence: 0,
    };
  }
}
