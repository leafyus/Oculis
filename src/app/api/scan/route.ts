import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { FileInput, Tier } from "@/lib/types";
import { TIER_LIMITS } from "@/lib/constants";
import { runScanPipeline } from "@/lib/claude/pipeline";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { files, tier = "free" } = body as { files: FileInput[]; tier?: Tier };

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const limits = TIER_LIMITS[tier];

  if (files.length > limits.maxFiles) {
    return NextResponse.json(
      { error: `${tier === "free" ? "Free" : "Current"} tier limited to ${limits.maxFiles} file(s). Upgrade for full repo scans.` },
      { status: 400 }
    );
  }

  for (const file of files) {
    const lineCount = file.content.split("\n").length;
    if (lineCount > limits.maxLinesPerFile) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds ${limits.maxLinesPerFile} line limit. Upgrade for larger files.` },
        { status: 400 }
      );
    }
  }

  try {
    const { rankings, vulnerabilities } = await runScanPipeline(files, tier);

    const gatedVulnerabilities = vulnerabilities.map((v, index) => {
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
      id: uuidv4(),
      status: "complete",
      tier,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      rankings,
      vulnerabilities: gatedVulnerabilities,
      totalVulnerabilities: vulnerabilities.length,
      severityCounts: {
        critical: vulnerabilities.filter((v) => v.severity === "critical").length,
        high: vulnerabilities.filter((v) => v.severity === "high").length,
        medium: vulnerabilities.filter((v) => v.severity === "medium").length,
        low: vulnerabilities.filter((v) => v.severity === "low").length,
        info: vulnerabilities.filter((v) => v.severity === "info").length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
