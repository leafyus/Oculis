import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const scan = await db.scan.findUnique({ where: { id } });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.userId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: scan.id,
    tier: scan.tier,
    status: scan.status,
    fileCount: scan.fileCount,
    totalVulnerabilities: scan.totalVulnerabilities,
    severityCounts: JSON.parse(scan.severityCounts),
    createdAt: scan.createdAt,
    completedAt: scan.completedAt,
    ...JSON.parse(scan.result),
  });
}
