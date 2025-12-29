import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookDocumentClient } from "./BookDocumentClient";

export const dynamic = 'force-dynamic';

async function getDocument(documentId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companies: {
        include: {
          documents: {
            where: { id: documentId },
          },
          ledgerAccounts: {
            where: {
              code: {
                startsWith: "4", // Alleen kostenrekeningen
              },
            },
            orderBy: {
              code: "asc",
            },
          },
        },
      },
    },
  });

  if (!user || user.companies.length === 0) {
    return null;
  }

  const company = user.companies[0];
  const document = company.documents[0];

  if (!document) {
    return null;
  }

  // Find bank account
  const bankAccount = await prisma.ledgerAccount.findFirst({
    where: {
      companyId: company.id,
      code: "1000",
    },
  });

  return {
    document,
    company,
    costAccounts: company.ledgerAccounts,
    bankAccount,
  };
}

export default async function BookDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/dashboard/documents");
  }
  const data = await getDocument(params.id, user.id);

  if (!data) {
    redirect("/dashboard/documents");
  }

  const { document, company, costAccounts, bankAccount } = data;

  // Extract amount from OCR if available
  let suggestedAmount = 0;
  if (document.ocrText) {
    const amountPatterns = [
      /€\s*(\d+[.,]\d{2})/,
      /EUR\s*(\d+[.,]\d{2})/,
      /(\d+[.,]\d{2})\s*€/,
      /Totaal[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /Bedrag[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /(\d+[.,]\d{2})/,
    ];

    for (const pattern of amountPatterns) {
      const match = document.ocrText.match(pattern);
      if (match) {
        const foundAmount = parseFloat(match[1].replace(",", "."));
        if (foundAmount > suggestedAmount) {
          suggestedAmount = foundAmount;
        }
      }
    }
  }

  // Find suggested account based on category
  let suggestedAccountId = costAccounts[0]?.id || "";
  if (document.aiCategory) {
    // Check for representatiekosten first
    const representationAccount = costAccounts.find((acc) => acc.code === "4680");
    if (representationAccount) {
      suggestedAccountId = representationAccount.id;
    } else {
    const categoryAccount = costAccounts.find(
      (acc) => acc.code === "4500" || acc.code === "4600" || acc.code === "4690"
    );
    if (categoryAccount) {
      suggestedAccountId = categoryAccount.id;
      }
    }
  }

  return (
    <BookDocumentClient
      document={document}
      company={company}
      costAccounts={costAccounts}
      bankAccount={bankAccount}
      suggestedAccountId={suggestedAccountId}
      suggestedAmount={suggestedAmount}
    />
  );
}



