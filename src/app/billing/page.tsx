"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface UserInfo {
  tier: string;
  role: string;
  scansThisMonth: number;
  email: string;
}

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/mo",
    description: "Full power for teams shipping secure software.",
    features: [
      "50 files per scan",
      "50 scans / month",
      "Exploit proof-of-concepts",
      "Auto-generated fixes",
      "Priority processing",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$299",
    period: "/mo",
    description: "For organizations with compliance requirements.",
    features: [
      "500+ files per scan",
      "Unlimited scans",
      "Everything in Pro",
      "CI/CD webhook integration",
      "PDF compliance reports",
      "REST API access",
      "Dedicated support",
    ],
  },
] as const;

const SCAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 50,
  enterprise: Infinity,
};

export default function BillingPage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSuccess(new URLSearchParams(window.location.search).get("success") === "true");
    }
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpgrade = async (tier: "pro" | "enterprise") => {
    setCheckoutLoading(tier);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
        setCheckoutLoading(null);
      }
    } catch {
      alert("Something went wrong");
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-zinc-500">
        Loading billing info…
      </div>
    );
  }

  const tier = user?.tier ?? "free";
  const isAdmin = user?.role === "admin";
  const scanLimit = SCAN_LIMITS[tier];
  const scansUsed = user?.scansThisMonth ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Billing & Plan</h1>
        <p className="text-sm text-zinc-500 mt-1">{session?.user?.email}</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl mb-8 text-sm font-medium">
          Your plan has been upgraded successfully. Enjoy your new features!
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900 text-lg">Current Plan</h2>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  isAdmin
                    ? "bg-yellow-100 text-yellow-800"
                    : tier === "enterprise"
                    ? "bg-violet-100 text-violet-800"
                    : tier === "pro"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {isAdmin ? "Admin — Enterprise" : tier.charAt(0).toUpperCase() + tier.slice(1)}
              </span>
              {isAdmin && (
                <span className="text-xs text-zinc-500">Full access, no limits</span>
              )}
            </div>
          </div>
        </div>

        {/* Usage bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-zinc-600">Scans this month</span>
            <span className="font-medium text-zinc-900">
              {scansUsed}
              {scanLimit !== Infinity ? ` / ${scanLimit}` : " (unlimited)"}
            </span>
          </div>
          {scanLimit !== Infinity && (
            <div className="bg-zinc-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full transition-all"
                style={{ width: `${Math.min((scansUsed / scanLimit) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Upgrade options */}
      {!isAdmin && tier !== "enterprise" && (
        <>
          <h2 className="font-semibold text-zinc-900 text-lg mb-4">Upgrade Your Plan</h2>
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {PLANS.filter((p) => {
              if (tier === "pro") return p.id === "enterprise";
              return true;
            }).map((plan) => (
              <div
                key={plan.id}
                className={`bg-white border rounded-xl p-6 ${
                  plan.id === "pro"
                    ? "border-violet-300 ring-1 ring-violet-200 relative"
                    : "border-zinc-200"
                }`}
              >
                {plan.id === "pro" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-zinc-900">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">{plan.period}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 text-lg">{plan.name}</h3>
                <p className="text-sm text-zinc-500 mt-1 mb-4">{plan.description}</p>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-700">
                      <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id as "pro" | "enterprise")}
                  disabled={checkoutLoading === plan.id}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                    plan.id === "pro"
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "bg-zinc-900 hover:bg-zinc-700 text-white"
                  }`}
                >
                  {checkoutLoading === plan.id
                    ? "Redirecting…"
                    : `Upgrade to ${plan.name}`}
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-zinc-400 text-center">
            Payments processed securely by Stripe. Cancel anytime.
          </p>
        </>
      )}

      {!isAdmin && tier === "enterprise" && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-6 text-center">
          <p className="text-violet-800 font-medium">
            You&apos;re on the Enterprise plan — you have full access to all features.
          </p>
          <p className="text-sm text-violet-600 mt-1">
            To manage your subscription, contact{" "}
            <a href="mailto:support@oculis.dev" className="underline">
              support@oculis.dev
            </a>
          </p>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-zinc-200 flex items-center gap-4 text-sm text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-700">
          Back to Dashboard
        </Link>
        <span>•</span>
        <Link href="/pricing" className="hover:text-zinc-700">
          Compare Plans
        </Link>
      </div>
    </div>
  );
}
