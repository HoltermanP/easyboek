import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/dashboard");
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      // Check of subscription bestaat
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      if (subscription && subscription.status === "active") {
        // Redirect naar dashboard met success message
        redirect("/dashboard?subscription=active");
      }
    }

    redirect("/dashboard");
  } catch (error) {
    console.error("Error in checkout success:", error);
    redirect("/dashboard");
  }
}

