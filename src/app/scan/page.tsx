"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUploader from "@/components/scan/FileUploader";

interface ParsedFile {
  name: string;
  content: string;
  language: string;
}

export default function ScanPage() {
  const router = useRouter();
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, tier: "free" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }

      const { scanId } = await res.json();
      router.push(`/scan/${scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">Scan Your Code</h1>
        <p className="mt-3 text-zinc-600">
          Upload a source code file to scan for security vulnerabilities.
          Free tier: 1 file, up to 500 lines, 3 scans/month.
        </p>
      </div>

      <FileUploader onFilesSelected={setFiles} disabled={loading} />

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleScan}
          disabled={files.length === 0 || loading}
          className={`px-8 py-3.5 rounded-xl text-lg font-semibold transition-all ${
            files.length === 0 || loading
              ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Starting Scan...
            </span>
          ) : (
            "Scan for Vulnerabilities"
          )}
        </button>
      </div>

      <div className="mt-12 bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
        <h3 className="font-semibold text-zinc-900 mb-3">What we scan for</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-600">
          {[
            "SQL Injection", "Cross-Site Scripting (XSS)", "Command Injection",
            "Broken Authentication", "IDOR / Access Control", "Path Traversal",
            "Race Conditions", "Insecure Deserialization", "Hardcoded Secrets",
            "Buffer Overflow", "Cryptographic Weaknesses", "Business Logic Flaws",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
