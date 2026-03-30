import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, tier } = session.metadata as { userId: string; tier: string };
    const subscriptionId = session.subscription as string;

    await db.user.update({
      where: { id: userId },
      data: { tier, stripeSubscriptionId: subscriptionId },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await db.user.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { tier: "free", stripeSubscriptionId: null },
    });
  }

  return NextResponse.json({ received: true });
}
