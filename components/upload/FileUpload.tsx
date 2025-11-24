"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete: (file: {
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
  }) => void;
  documentType?: string;
  onUploadStart?: () => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileUpload({
  onUploadComplete,
  documentType = "receipt",
  onUploadStart,
  accept = "image/*,application/pdf",
  maxSize = 4 * 1024 * 1024, // 4MB default
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateAndSetFile = useCallback((file: File) => {
    // Valideer file type
    const allowedTypes = accept.split(",").map(t => t.trim());
    const isValidType = allowedTypes.some(type => {
      if (type.includes("/*")) {
        const baseType = type.split("/")[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      toast({
        title: "Fout",
        description: "Dit bestandstype wordt niet ondersteund. Gebruik PDF, JPG of PNG.",
        variant: "destructive",
      });
      return false;
    }

    // Valideer file size
    if (file.size > maxSize) {
      toast({
        title: "Fout",
        description: `Bestand is te groot (max ${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
        variant: "destructive",
      });
      return false;
    }

    setSelectedFile(file);
    return true;
  }, [accept, maxSize, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndSetFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, [validateAndSetFile]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    if (onUploadStart) {
      onUploadStart();
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", documentType);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload mislukt");
      }

      onUploadComplete({
        url: data.url,
        name: data.fileName,
        type: data.type,
        documentId: data.documentId,
        ocrText: data.ocrText,
        category: data.category,
        bookingCreated: data.bookingCreated,
        extractedAmount: data.extractedAmount,
        extractedDate: data.extractedDate,
        vendor: data.vendor,
        suggestedLedger: data.suggestedLedger,
        bookingDetails: data.bookingDetails,
      });

      // Reset
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Upload fout",
        description: error instanceof Error ? error.message : "Onbekende fout",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">
                Sleep een bestand hierheen of klik om te selecteren
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, JPG of PNG (max {maxSize / 1024 / 1024}MB)
              </p>
            </div>
            <Button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              size="lg"
              className="mt-4"
            >
              <Upload className="mr-2 h-4 w-4" />
              Selecteer bestand
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected File Display */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={uploading}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Button */}
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              size="lg"
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploaden...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload bestand
                </>
              )}
            </Button>

            {/* Change File Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              disabled={uploading}
              className="w-full"
            >
              Ander bestand selecteren
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

