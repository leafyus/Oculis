"use client";

import { useState, useEffect, useCallback } from "react";

interface ScanData {
  id: string;
  status: string;
  tier: string;
  createdAt: string;
  completedAt?: string;
  rankings: Array<{ fileName: string; score: number; reason: string }>;
  vulnerabilities: Array<{
    id: string;
    title: string;
    severity: string;
    confidence: string;
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
  error?: string;
  progress: number;
  currentStage: string;
  totalVulnerabilities: number;
  severityCounts: Record<string, number>;
}

export function useScanPolling(scanId: string | null) {
  const [data, setData] = useState<ScanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    if (!scanId) return;
    try {
      const res = await fetch(`/api/scan/${scanId}`);
      if (!res.ok) throw new Error("Failed to fetch scan");
      const result = await res.json();
      setData(result);
      return result.status;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return "error";
    }
  }, [scanId]);

  useEffect(() => {
    if (!scanId) return;

    let active = true;

    const run = async () => {
      while (active) {
        const status = await poll();
        if (status === "complete" || status === "error") break;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    };

    run();
    return () => { active = false; };
  }, [scanId, poll]);

  return { data, error };
}
