import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scans = await db.scan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      tier: true,
      status: true,
      fileCount: true,
      totalVulnerabilities: true,
      severityCounts: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json(
    scans.map((scan) => ({
      ...scan,
      severityCounts: JSON.parse(scan.severityCounts),
    }))
  );
}
