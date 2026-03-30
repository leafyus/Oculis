"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import SeverityBadge from "@/components/scan/SeverityBadge";
import { Severity } from "@/lib/types";

interface ScanSummary {
  id: string;
  status: string;
  tier: string;
  fileCount: number;
  createdAt: string;
  completedAt?: string;
  totalVulnerabilities: number;
  severityCounts: Record<string, number>;
}

interface UserInfo {
  tier: string;
  role: string;
  scansThisMonth: number;
}

const SCAN_LIMITS: Record<string, number> = {
  free: 3,
  pro: 50,
  enterprise: Infinity,
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/scans").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
    ]).then(([scansData, userData]) => {
      setScans(Array.isArray(scansData) ? scansData : []);
      setUserInfo(userData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isAdmin = userInfo?.role === "admin";
  const tier = isAdmin ? "enterprise" : (userInfo?.tier ?? "free");
  const scanLimit = SCAN_LIMITS[tier];
  const scansUsed = userInfo?.scansThisMonth ?? 0;

  const tierLabel = isAdmin
    ? "Admin — Enterprise"
    : tier.charAt(0).toUpperCase() + tier.slice(1);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {session?.user?.email}
          </p>
        </div>
        <Link
          href="/scan"
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          New Scan
        </Link>
      </div>

      {/* Usage card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-900">{tierLabel}</h2>
            <p className="text-sm text-zinc-500 mt-1">
              {scanLimit === Infinity
                ? `${scansUsed} scans used this month (unlimited)`
                : `${scansUsed} of ${scanLimit} scans used this month`}
            </p>
          </div>
          {!isAdmin && tier !== "enterprise" && (
            <Link
              href="/billing"
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Upgrade Plan
            </Link>
          )}
        </div>
        {scanLimit !== Infinity && (
          <div className="mt-3 bg-zinc-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-violet-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min((scansUsed / scanLimit) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Scan History */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading scan history…</div>
      ) : scans.length === 0 ? (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">No scans yet</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Upload a code file to run your first security audit.
          </p>
          <Link
            href="/scan"
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Start Your First Scan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => (
            <div
              key={scan.id}
              className="block bg-white border border-zinc-200 rounded-xl p-5 hover:border-violet-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-zinc-900">
                      {scan.id.slice(0, 8)}…
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        scan.status === "complete"
                          ? "bg-green-100 text-green-700"
                          : scan.status === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {scan.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 capitalize">
                      {scan.tier}
                    </span>
                    {scan.fileCount > 0 && (
                      <span className="text-xs text-zinc-400">
                        {scan.fileCount} file{scan.fileCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    {new Date(scan.createdAt).toLocaleString()}
                  </p>
                </div>

                {scan.status === "complete" && (
                  <div className="flex items-center gap-2">
                    {(["critical", "high", "medium", "low"] as Severity[]).map((sev) => {
                      const count = scan.severityCounts?.[sev] || 0;
                      if (count === 0) return null;
                      return (
                        <div key={sev} className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-zinc-900">
                            {count}
                          </span>
                          <SeverityBadge severity={sev} />
                        </div>
                      );
                    })}
                    {scan.totalVulnerabilities === 0 && (
                      <span className="text-sm text-green-600 font-medium">Clean</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
