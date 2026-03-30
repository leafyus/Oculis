import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FileInput, Tier } from "@/lib/types";
import { TIER_LIMITS } from "@/lib/constants";
import { runScanPipeline } from "@/lib/claude/pipeline";
import { db } from "@/lib/db";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Fetch fresh user data so tier is always authoritative from DB
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Admin always gets enterprise limits
  const tier: Tier = user.role === "admin" ? "enterprise" : (user.tier as Tier);
  const limits = TIER_LIMITS[tier];

  // Reset monthly scan count if calendar month has turned over
  const now = new Date();
  const resetDate = new Date(user.lastScanReset);
  const monthsElapsed =
    (now.getFullYear() - resetDate.getFullYear()) * 12 +
    (now.getMonth() - resetDate.getMonth());

  let scansThisMonth = user.scansThisMonth;
  if (monthsElapsed > 0) {
    scansThisMonth = 0;
    await db.user.update({
      where: { id: user.id },
      data: { scansThisMonth: 0, lastScanReset: now },
    });
  }

  // Enforce monthly limit (admin is exempt)
  if (user.role !== "admin" && scansThisMonth >= limits.maxScansPerMonth) {
    return NextResponse.json(
      {
        error: `Monthly scan limit reached (${limits.maxScansPerMonth} scans). Upgrade your plan for more.`,
      },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { files } = body as { files: FileInput[] };

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (files.length > limits.maxFiles) {
    return NextResponse.json(
      {
        error: `Your ${tier} plan allows up to ${limits.maxFiles} file(s) per scan. Upgrade for full repo scans.`,
      },
      { status: 400 }
    );
  }

  for (const file of files) {
    const lineCount = file.content.split("\n").length;
    if (lineCount > limits.maxLinesPerFile) {
      return NextResponse.json(
        {
          error: `File "${file.name}" exceeds the ${limits.maxLinesPerFile}-line limit for your ${tier} plan.`,
        },
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

    const severityCounts = {
      critical: vulnerabilities.filter((v) => v.severity === "critical").length,
      high: vulnerabilities.filter((v) => v.severity === "high").length,
      medium: vulnerabilities.filter((v) => v.severity === "medium").length,
      low: vulnerabilities.filter((v) => v.severity === "low").length,
      info: vulnerabilities.filter((v) => v.severity === "info").length,
    };

    const completedAt = new Date();

    const resultPayload = {
      status: "complete" as const,
      tier,
      rankings,
      vulnerabilities: gatedVulnerabilities,
      totalVulnerabilities: vulnerabilities.length,
      severityCounts,
    };

    // Persist scan to DB
    const scan = await db.scan.create({
      data: {
        userId: user.id,
        tier,
        status: "complete",
        fileCount: files.length,
        totalVulnerabilities: vulnerabilities.length,
        severityCounts: JSON.stringify(severityCounts),
        result: JSON.stringify(resultPayload),
        completedAt,
      },
    });

    // Increment monthly usage counter
    await db.user.update({
      where: { id: user.id },
      data: { scansThisMonth: { increment: 1 } },
    });

    return NextResponse.json({
      id: scan.id,
      createdAt: scan.createdAt.toISOString(),
      completedAt: completedAt.toISOString(),
      ...resultPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
