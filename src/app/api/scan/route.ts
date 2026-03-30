import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { FileInput, ScanResult, Tier } from "@/lib/types";
import { TIER_LIMITS } from "@/lib/constants";
import { setScan } from "@/lib/store";
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
      { error: `Free tier limited to ${limits.maxFiles} file(s). Upgrade to Pro for full repo scans.` },
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

  const scanId = uuidv4();
  const scanResult: ScanResult = {
    id: scanId,
    status: "pending",
    tier,
    createdAt: new Date().toISOString(),
    files,
    rankings: [],
    vulnerabilities: [],
    progress: 0,
    currentStage: "Initializing scan...",
  };

  setScan(scanId, scanResult);

  // Run pipeline in background (don't await)
  runScanPipeline(scanId, files, tier).catch(console.error);

  return NextResponse.json({ scanId });
}
