"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import FileUploader from "@/components/scan/FileUploader";
import GitHubInput from "@/components/scan/GitHubInput";
import ScanProgress from "@/components/scan/ScanProgress";
import VulnerabilityCard from "@/components/scan/VulnerabilityCard";
import SeverityBadge from "@/components/scan/SeverityBadge";
import { Tier, Severity } from "@/lib/types";

interface ParsedFile {
  name: string;
  content: string;
  language: string;
}

interface ScanResultData {
  id: string;
  status: string;
  tier: string;
  completedAt: string;
  vulnerabilities: Array<{
    id: string;
    title: string;
    severity: Severity;
    confidence: "high" | "medium" | "low";
    description: string;
    fileName: string;
    lineStart: number;
    lineEnd: number;
    category: string;
    vulnerableCode: string;
    exploitPoC: string;
    fixedCode: string;
    fixExplanation: string;
    isGated: boolean;
    isPoCGated: boolean;
    isFixGated: boolean;
  }>;
  totalVulnerabilities: number;
  severityCounts: Record<string, number>;
}

const TIER_DESCRIPTIONS: Record<string, string> = {
  free: "1 file · 500 lines · 3 scans/month",
  pro: "50 files · full reports with exploit PoC + fixes",
  enterprise: "500+ files · unlimited scans · API access",
};

export default function ScanPage() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [tab, setTab] = useState<"upload" | "github">("upload");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultData | null>(null);

  // Derive tier from session (admin gets enterprise display)
  const sessionTier = session?.user?.role === "admin"
    ? "enterprise"
    : (session?.user?.tier as Tier | undefined) ?? "free";

  const [displayTier, setDisplayTier] = useState<string>("free");

  useEffect(() => {
    if (session) setDisplayTier(sessionTier);
  }, [session, sessionTier]);

  const handleScan = async () => {
    if (files.length === 0) return;

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setFiles([]);
    setError(null);
  };

  // Show results
  if (result) {
    const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];
    const effectiveTier = result.tier;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Security Audit Report</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Scan ID: {result.id.slice(0, 8)}… · Completed{" "}
            {new Date(result.completedAt).toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {severityOrder.map((severity) => (
            <div
              key={severity}
              className="bg-white border border-zinc-200 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-zinc-900">
                {result.severityCounts[severity] || 0}
              </div>
              <SeverityBadge severity={severity} />
            </div>
          ))}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              {result.totalVulnerabilities}{" "}
              {result.totalVulnerabilities === 1 ? "Vulnerability" : "Vulnerabilities"} Found
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {effectiveTier === "free"
                ? "Free tier — first 2 findings shown in detail. Upgrade for full access."
                : `${effectiveTier} tier — full access to all findings`}
            </p>
          </div>
          {effectiveTier === "free" && result.totalVulnerabilities > 0 && (
            <Link
              href="/billing"
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>

        {result.vulnerabilities.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-800">No Vulnerabilities Detected</h3>
            <p className="text-green-600 text-sm mt-2">Your code passed all security checks.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {result.vulnerabilities.map((vuln) => (
              <VulnerabilityCard key={vuln.id} vulnerability={vuln} />
            ))}
          </div>
        )}

        {effectiveTier === "free" && result.totalVulnerabilities > 2 && (
          <div className="mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">
              We found {result.totalVulnerabilities} vulnerabilities in your code
            </h3>
            <p className="text-violet-100 mb-6">
              Upgrade to Pro to see all exploit details, get auto-generated fixes, and secure your
              entire codebase.
            </p>
            <Link
              href="/billing"
              className="inline-block bg-white text-violet-700 px-8 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors"
            >
              Upgrade to Pro — $49/mo
            </Link>
          </div>
        )}

        <div className="mt-8 flex gap-4 justify-center">
          <button
            onClick={resetScan}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            New Scan
          </button>
          <Link
            href="/dashboard"
            className="border border-zinc-300 hover:border-zinc-400 text-zinc-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Scanning progress
  if (scanning) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ScanProgress
          progress={50}
          currentStage={`Scanning ${files.length} file(s) for vulnerabilities…`}
          status="scanning"
        />
        <p className="text-center text-sm text-zinc-500 mt-6">
          This may take up to 60 seconds depending on file count and size.
        </p>
      </div>
    );
  }

  // Scan form
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-zinc-900">Scan Your Code</h1>
        <p className="mt-3 text-zinc-600">
          Upload files, a ZIP archive, or enter a GitHub repo URL to scan for vulnerabilities.
        </p>
      </div>

      {/* Plan indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-lg">
          <span className="text-sm text-zinc-500">Your plan:</span>
          <span className="text-sm font-semibold text-zinc-900 capitalize">
            {session?.user?.role === "admin" ? "Admin (Enterprise)" : displayTier}
          </span>
        </div>
        {displayTier === "free" && (
          <Link
            href="/billing"
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Upgrade →
          </Link>
        )}
      </div>
      <p className="text-center text-xs text-zinc-400 -mt-4 mb-8">
        {TIER_DESCRIPTIONS[displayTier] ?? ""}
      </p>

      {/* Source Tabs */}
      <div className="flex border-b border-zinc-200 mb-6">
        <button
          onClick={() => setTab("upload")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "upload"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Upload Files / ZIP
        </button>
        <button
          onClick={() => setTab("github")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "github"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          GitHub Repository
        </button>
      </div>

      {tab === "upload" ? (
        <FileUploader
          onFilesSelected={setFiles}
          disabled={scanning}
          tier={sessionTier}
        />
      ) : (
        <GitHubInput onFilesLoaded={setFiles} disabled={scanning} />
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleScan}
          disabled={files.length === 0 || scanning}
          className={`px-8 py-3.5 rounded-xl text-lg font-semibold transition-all ${
            files.length === 0
              ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              : "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200"
          }`}
        >
          Scan{" "}
          {files.length > 0 ? `${files.length} File${files.length > 1 ? "s" : ""}` : ""}{" "}
          for Vulnerabilities
        </button>
      </div>

      <div className="mt-12 bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
        <h3 className="font-semibold text-zinc-900 mb-3">What we scan for</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-600">
          {[
            "SQL Injection",
            "Cross-Site Scripting (XSS)",
            "Command Injection",
            "Broken Authentication",
            "IDOR / Access Control",
            "Path Traversal",
            "Race Conditions",
            "Insecure Deserialization",
            "Hardcoded Secrets",
            "Buffer Overflow",
            "Cryptographic Weaknesses",
            "Business Logic Flaws",
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
