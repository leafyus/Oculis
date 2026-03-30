import { NextRequest, NextResponse } from "next/server";
import { getScan } from "@/lib/store";
import { TIER_LIMITS } from "@/lib/constants";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = getScan(id);

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const limits = TIER_LIMITS[scan.tier];

  // Gate response based on tier
  const gatedVulnerabilities = scan.vulnerabilities.map((v, index) => {
    const isGated = index >= limits.maxDetailedVulns;

    return {
      id: v.id,
      title: v.title,
      severity: v.severity,
      confidence: v.confidence,
      fileName: v.fileName,
      lineStart: v.lineStart,
      lineEnd: v.lineEnd,
      category: v.category,
      // Gate detailed fields for free tier beyond limit
      description: isGated ? "" : v.description,
      vulnerableCode: isGated ? "" : v.vulnerableCode,
      exploitPoC: limits.showExploitPoC ? v.exploitPoC : "",
      fixedCode: limits.showFixedCode ? v.fixedCode : "",
      fixExplanation: limits.showFixedCode ? v.fixExplanation : "",
      isGated,
      isPoCGated: !limits.showExploitPoC,
      isFixGated: !limits.showFixedCode,
    };
  });

  return NextResponse.json({
    id: scan.id,
    status: scan.status,
    tier: scan.tier,
    createdAt: scan.createdAt,
    completedAt: scan.completedAt,
    rankings: scan.rankings,
    vulnerabilities: gatedVulnerabilities,
    error: scan.error,
    progress: scan.progress,
    currentStage: scan.currentStage,
    totalVulnerabilities: scan.vulnerabilities.length,
    severityCounts: {
      critical: scan.vulnerabilities.filter((v) => v.severity === "critical").length,
      high: scan.vulnerabilities.filter((v) => v.severity === "high").length,
      medium: scan.vulnerabilities.filter((v) => v.severity === "medium").length,
      low: scan.vulnerabilities.filter((v) => v.severity === "low").length,
      info: scan.vulnerabilities.filter((v) => v.severity === "info").length,
    },
  });
}
