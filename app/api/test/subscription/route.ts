import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createTestSubscription, getUserSubscription } from "@/lib/subscription";

/**
 * GET: Check subscription status
 * POST: Maak test subscription aan
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const subscription = await getUserSubscription(user.id);

    return NextResponse.json({
      hasSubscription: !!subscription && (subscription.status === "active" || subscription.status === "trialing"),
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Fout bij ophalen subscription" },
      { status: 500 }
    );
  }
}

/**
 * API route om een test subscription aan te maken
 * Alleen beschikbaar in development mode
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Niet beschikbaar in productie" },
      { status: 403 }
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const plan = body.plan || "premium";

    if (plan !== "basis" && plan !== "premium") {
      return NextResponse.json(
        { error: "Ongeldig plan. Gebruik 'basis' of 'premium'" },
        { status: 400 }
      );
    }

    const subscription = await createTestSubscription(user.id, plan);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error("Error creating test subscription:", error);
    return NextResponse.json(
      { error: error.message || "Fout bij aanmaken test subscription" },
      { status: 500 }
    );
  }
}

