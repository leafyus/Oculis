import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const STRIPE_PRICES = {
  pro: process.env.STRIPE_PRICE_PRO ?? "",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? "",
};
