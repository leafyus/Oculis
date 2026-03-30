import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-zinc-900">Oculis</span>
            </div>
            <p className="text-zinc-600 text-sm max-w-md">
              AI-powered code security auditing. Find vulnerabilities before attackers do.
              Powered by advanced LLM analysis with multi-pass scanning and automated verification.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-3">Product</h3>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li><Link href="/scan" className="hover:text-violet-600 transition-colors">Start Scan</Link></li>
              <li><Link href="/pricing" className="hover:text-violet-600 transition-colors">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-violet-600 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900 mb-3">Resources</h3>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li><span className="text-zinc-400">Documentation</span></li>
              <li><span className="text-zinc-400">API Reference</span></li>
              <li><span className="text-zinc-400">Blog</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 mt-8 pt-8 text-center text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} Oculis. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
