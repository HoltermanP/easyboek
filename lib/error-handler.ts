/**
 * Utility functies voor error handling in server components
 */

export function handleDatabaseError(error: unknown): never {
  console.error("Database error:", error);
  
  // Check voor specifieke Prisma errors
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; message: string };
    
    switch (prismaError.code) {
      case "P2002":
        throw new Error("Deze gegevens bestaan al in de database");
      case "P2025":
        throw new Error("Record niet gevonden");
      case "P2003":
        throw new Error("Database relatie fout");
      case "P1001":
        throw new Error("Kan niet verbinden met database");
      default:
        throw new Error(`Database fout: ${prismaError.message || "Onbekende fout"}`);
    }
  }
  
  // Generic error
  if (error instanceof Error) {
    throw error;
  }
  
  throw new Error("Onbekende database fout");
}

/**
 * Wrapper voor async functies die database queries uitvoeren
 * Vangt errors op en gooit ze opnieuw met betere error messages
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage || "Error in async function:", error);
    
    if (error && typeof error === "object" && "code" in error) {
      handleDatabaseError(error);
    }
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(errorMessage || "Onbekende fout opgetreden");
  }
}

