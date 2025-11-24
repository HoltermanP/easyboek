import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const companyId = body.companyId;

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is verplicht" }, { status: 400 });
    }

    // Check if user owns the company
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        companies: {
          where: { id: companyId },
        },
      },
    });

    if (!user || user.companies.length === 0) {
      return NextResponse.json({ error: "Bedrijf niet gevonden" }, { status: 404 });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("selectedCompanyId", companyId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 jaar
    });

    return NextResponse.json({ success: true, companyId });
  } catch (error) {
    console.error("Error selecting company:", error);
    return NextResponse.json({ error: "Fout bij selecteren administratie" }, { status: 500 });
  }
}

