import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe, STRIPE_PRICES } from "@/lib/stripe";
import { db } from "@/lib/db";
import { Tier } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Payments not configured" },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tier } = (await request.json()) as { tier: Tier };
  const priceId = tier === "pro" ? STRIPE_PRICES.pro : STRIPE_PRICES.enterprise;

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan or price not configured" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?success=true`,
    cancel_url: `${baseUrl}/billing`,
    metadata: { userId: user.id, tier },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
