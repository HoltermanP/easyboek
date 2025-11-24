"use client";

import { STANDARD_LEDGER_ACCOUNTS } from "@/lib/ledgerAccounts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LedgerAccountCodeProps {
  code: string;
  name?: string;
  className?: string;
}

export function LedgerAccountCode({ code, name, className }: LedgerAccountCodeProps) {
  // Zoek de standaard rekening voor beschrijving
  const standardAccount = STANDARD_LEDGER_ACCOUNTS.find((acc) => acc.code === code);
  const description = standardAccount?.description || "";
  const accountName = name || standardAccount?.name || code;
  const category = standardAccount?.category || "";
  const type = standardAccount?.type || "";
  const keywords = standardAccount?.keywords || [];

  // Toon beschrijving als primaire tekst (of code als er geen beschrijving is)
  const displayText = description || accountName;

  const content = (
    <span className={`font-mono ${className || ""}`}>
      {code} - {displayText}
    </span>
  );

  // Tooltip met uitgebreide informatie
  const tooltipContent = (
    <div className="space-y-2 max-w-sm">
      <div>
        <div className="font-semibold text-sm">{accountName}</div>
        <div className="text-xs text-muted-foreground mt-1">{description || "Geen beschrijving beschikbaar"}</div>
      </div>
      <div className="pt-2 border-t border-border">
        <div className="text-xs space-y-1">
          <div>
            <span className="font-medium">Categorie:</span>{" "}
            <span className="capitalize">{category || "Onbekend"}</span>
          </div>
          <div>
            <span className="font-medium">Type:</span>{" "}
            <span className="capitalize">
              {type === "balance" ? "Balansrekening" : type === "result" ? "Resultaatrekening" : "Onbekend"}
            </span>
          </div>
          {keywords.length > 0 && (
            <div>
              <span className="font-medium">Keywords:</span>{" "}
              <span className="text-muted-foreground">{keywords.slice(0, 5).join(", ")}{keywords.length > 5 ? "..." : ""}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

