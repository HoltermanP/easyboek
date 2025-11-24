"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUpload } from "@/components/upload/FileUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, CheckCircle2, XCircle, Clock, Euro, Calendar, Building2, Hash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale/nl";
import { LedgerAccountCode } from "@/components/ledger/LedgerAccountCode";

interface UploadedFile {
  url: string;
  name: string;
  type: string;
  documentId?: string;
  category?: string;
  bookingCreated?: boolean;
  extractedAmount?: number | null;
  extractedDate?: string | null;
  vendor?: string | null;
  suggestedLedger?: number | null;
  bookingDetails?: {
    amount: number | null;
    date: string | null;
    description: string | null;
    ledgerCode: string | null;
    ledgerName: string | null;
  } | null;
  uploadedAt: Date;
}

export default function UploadPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [documentType, setDocumentType] = useState("receipt");
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleUploadComplete = async (file: {
    url: string;
    name: string;
    type: string;
    documentId?: string;
    ocrText?: string;
    category?: string;
    bookingCreated?: boolean;
    extractedAmount?: number | null;
    extractedDate?: string | null;
    vendor?: string | null;
    suggestedLedger?: number | null;
    bookingDetails?: {
      amount: number | null;
      date: string | null;
      description: string | null;
      ledgerCode: string | null;
      ledgerName: string | null;
    } | null;
  }) => {
    setUploading(false);

    // Voeg toe aan lijst van geüploade bestanden
    const newFile: UploadedFile = {
      ...file,
      uploadedAt: new Date(),
    };
    setUploadedFiles((prev) => [newFile, ...prev]);

    if (file.bookingCreated) {
      toast({
        title: "Succes",
        description: `Document verwerkt en boeking aangemaakt voor ${file.name}`,
      });
    } else if (file.category) {
      toast({
        title: "Document verwerkt",
        description: `OCR en categorisatie voltooid voor ${file.name}`,
      });
    } else {
      toast({
        title: "Document geüpload",
        description: `${file.name} is geüpload. OCR verwerking wordt uitgevoerd...`,
      });
    }
    
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documenten Uploaden</h1>
          <p className="text-muted-foreground">
            Upload bonnen en facturen voor automatische verwerking en boeking
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/documents">
            <FileText className="mr-2 h-4 w-4" />
            Bekijk alle documenten
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Ondersteunde formaten: PDF, JPG, PNG (max 4MB per bestand)
            <br />
            Documenten worden automatisch verwerkt en boekingen worden klaar gezet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receipt">Bon</SelectItem>
                <SelectItem value="invoice">Factuur</SelectItem>
                <SelectItem value="other">Anders</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FileUpload
            onUploadComplete={handleUploadComplete}
            documentType={documentType}
            onUploadStart={() => setUploading(true)}
          />
        </CardContent>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Geüploade Documenten</CardTitle>
            <CardDescription>
              Overzicht van recent geüploade documenten en hun verwerkingsstatus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bestand</TableHead>
                  <TableHead>Upload Status</TableHead>
                  <TableHead>Boeking Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedFiles.map((file, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(file.uploadedAt, "d MMM yyyy HH:mm", { locale: nl })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Geslaagd
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {file.bookingCreated ? (
                        <Badge variant="default" className="gap-1 bg-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          Boeking aangemaakt
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Handmatig boeken
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {file.bookingDetails && (
                          <>
                            {file.bookingDetails.amount && (
                              <div className="flex items-center gap-1">
                                <Euro className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">
                                  €{file.bookingDetails.amount.toLocaleString("nl-NL", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            )}
                            {file.bookingDetails.ledgerCode && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                <LedgerAccountCode
                                  code={file.bookingDetails.ledgerCode}
                                  name={file.bookingDetails.ledgerName || undefined}
                                  className="text-sm"
                                />
                              </div>
                            )}
                            {file.bookingDetails.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>
                                  {format(new Date(file.bookingDetails.date), "d MMM yyyy", { locale: nl })}
                                </span>
                              </div>
                            )}
                            {file.vendor && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span>{file.vendor}</span>
                              </div>
                            )}
                          </>
                        )}
                        {!file.bookingCreated && file.suggestedLedger && (
                          <div className="text-xs text-muted-foreground">
                            Voorgesteld: {file.suggestedLedger}
                          </div>
                        )}
                        {file.category && (
                          <div className="text-xs text-muted-foreground">
                            Categorie: {file.category}
                          </div>
                        )}
                        {!file.bookingCreated && file.extractedAmount && file.extractedAmount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Bedrag gevonden: €{file.extractedAmount.toLocaleString("nl-NL", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Hoe werkt het?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. Selecteer een document type (Bon, Factuur, of Anders)</p>
          <p>2. Upload je document (PDF, JPG of PNG)</p>
          <p>3. Het document wordt automatisch gelezen met OCR</p>
          <p>4. Het document wordt gecategoriseerd met AI</p>
          <p>5. Een boeking wordt automatisch klaar gezet op basis van de categorie</p>
          <p>6. Je kunt de boeking controleren en goedkeuren in het dashboard</p>
        </CardContent>
      </Card>
    </div>
  );
}
