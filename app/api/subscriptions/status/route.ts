import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const subscription = await getUserSubscription(user.id);

    return NextResponse.json({
      subscription: subscription ? {
        ...subscription,
        isDeveloper: user.isDeveloper,
      } : null,
      user: {
        id: user.id,
        email: user.email,
        isDeveloper: user.isDeveloper,
      },
    });
  } catch (error: any) {
    console.error("Error getting subscription status:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij ophalen subscription status" },
      { status: 500 }
    );
  }
}

