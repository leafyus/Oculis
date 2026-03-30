"use client";

import { use } from "react";
import Link from "next/link";
import { useScanPolling } from "@/hooks/useScanPolling";
import ScanProgress from "@/components/scan/ScanProgress";
import VulnerabilityCard from "@/components/scan/VulnerabilityCard";
import SeverityBadge from "@/components/scan/SeverityBadge";
import { Severity } from "@/lib/types";

export default function ScanResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error } = useScanPolling(id);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          Error loading scan: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ScanProgress progress={0} currentStage="Loading..." status="pending" />
      </div>
    );
  }

  if (data.status !== "complete" && data.status !== "error") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ScanProgress progress={data.progress} currentStage={data.currentStage} status={data.status} />
      </div>
    );
  }

  if (data.status === "error") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
          Scan failed: {data.error || "Unknown error"}
        </div>
        <Link href="/scan" className="mt-4 inline-block text-violet-600 hover:underline">
          Try again
        </Link>
      </div>
    );
  }

  const severityOrder: Severity[] = ["critical", "high", "medium", "low", "info"];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Security Audit Report</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Scan ID: {data.id.slice(0, 8)}... &middot; Completed {data.completedAt ? new Date(data.completedAt).toLocaleString() : ""}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {severityOrder.map((severity) => (
          <div key={severity} className="bg-white border border-zinc-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-zinc-900">{data.severityCounts[severity] || 0}</div>
            <SeverityBadge severity={severity} />
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">
            {data.totalVulnerabilities} {data.totalVulnerabilities === 1 ? "Vulnerability" : "Vulnerabilities"} Found
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {data.tier === "free"
              ? "Free tier — first 2 findings shown in detail. Upgrade for full access."
              : `${data.tier} tier — full access to all findings`}
          </p>
        </div>
        {data.tier === "free" && data.totalVulnerabilities > 0 && (
          <Link
            href="/pricing"
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>

      {/* Vulnerability List */}
      {data.vulnerabilities.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800">No Vulnerabilities Detected</h3>
          <p className="text-green-600 text-sm mt-2">Your code passed all security checks. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.vulnerabilities.map((vuln) => (
            <VulnerabilityCard key={vuln.id} vulnerability={vuln as Parameters<typeof VulnerabilityCard>[0]["vulnerability"]} />
          ))}
        </div>
      )}

      {/* Upsell Banner */}
      {data.tier === "free" && data.totalVulnerabilities > 2 && (
        <div className="mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">
            We found {data.totalVulnerabilities} vulnerabilities in your code
          </h3>
          <p className="text-violet-100 mb-6">
            Upgrade to Pro to see all exploit details, get auto-generated fixes, and secure your entire codebase.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-violet-700 px-8 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors"
          >
            Upgrade to Pro — $49/mo
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="mt-8 flex gap-4 justify-center">
        <Link
          href="/scan"
          className="border border-zinc-300 hover:border-zinc-400 text-zinc-700 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          New Scan
        </Link>
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
