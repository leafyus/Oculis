import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgxMzksMTAyLDIyNywwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-32 sm:pb-32">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
            Powered by advanced LLM security analysis
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 tracking-tight leading-tight">
            Find vulnerabilities
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              before attackers do
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            Upload your code and get an instant security audit. Our AI runs multi-pass vulnerability scanning,
            verifies exploitability, and generates production-ready fixes.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/scan"
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
            >
              Scan Your Code Free
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto border border-zinc-300 hover:border-zinc-400 text-zinc-700 px-8 py-3.5 rounded-xl text-lg font-medium transition-colors"
            >
              View Pricing
            </Link>
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            No sign-up required. 3 free scans per month.
          </p>
        </div>

        {/* Code preview */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-zinc-900 rounded-xl shadow-2xl overflow-hidden border border-zinc-800">
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border-b border-zinc-700/50">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-zinc-500 font-mono">vulnerability-report.json</span>
            </div>
            <pre className="p-6 text-sm font-mono text-zinc-300 overflow-x-auto">
              <code>{`{
  "scan": "completed",
  "vulnerabilities_found": 4,
  "critical": 1,
  "high": 2,
  "medium": 1,
  "findings": [
    {
      "severity": "CRITICAL",
      "title": "SQL Injection in user authentication",
      "file": "auth/login.py:42",
      "confidence": "high",
      "fix_available": true
    }
  ]
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
