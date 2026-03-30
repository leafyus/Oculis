import Link from "next/link";

export default function PricingCards() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "",
      description: "Try it out. See what our AI finds in your code.",
      features: [
        "1 file per scan (500 lines max)",
        "3 scans per month",
        "Vulnerability count & severity",
        "First 2 detailed findings",
        "Basic vulnerability descriptions",
      ],
      limitations: [
        "Exploit PoC code",
        "Auto-generated fixes",
        "Full repo scanning",
      ],
      cta: "Start Free Scan",
      href: "/scan",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$49",
      period: "/mo",
      description: "Full power for teams shipping secure software.",
      features: [
        "Full repo scans (50 files)",
        "50 scans per month",
        "All vulnerability details",
        "Exploit proof-of-concepts",
        "Auto-generated fix code",
        'One-click "Fix This Code"',
        "Priority processing",
      ],
      limitations: [],
      cta: "Get Pro",
      href: "/scan",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "$299",
      period: "/mo",
      description: "For organizations with compliance requirements.",
      features: [
        "Unlimited scans",
        "500+ files per scan",
        "Private repo support",
        "Everything in Pro",
        "CI/CD webhook integration",
        "PDF compliance reports",
        "REST API access",
        "Dedicated support",
      ],
      limitations: [],
      cta: "Contact Sales",
      href: "/pricing",
      highlighted: false,
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-zinc-600">
            Start free. Upgrade when you need the full picture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-violet-300 bg-violet-50/50 shadow-lg shadow-violet-100 ring-1 ring-violet-200 relative"
                  : "border-zinc-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-zinc-900">{plan.price}</span>
                {plan.period && <span className="text-zinc-500">{plan.period}</span>}
              </div>
              <p className="mt-3 text-sm text-zinc-600">{plan.description}</p>

              <Link
                href={plan.href}
                className={`mt-6 block w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlighted
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-md"
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <svg className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-zinc-700">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-3 text-sm">
                    <svg className="w-5 h-5 text-zinc-300 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                    <span className="text-zinc-400">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
