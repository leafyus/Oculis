import { NextRequest, NextResponse } from "next/server";
import { getScan, updateScan } from "@/lib/store";
import { getClient } from "@/lib/claude/client";
import { fixPrompt } from "@/lib/claude/prompts";

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = getScan(id);

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.tier === "free") {
    return NextResponse.json(
      { error: "Fix generation requires Pro or Enterprise tier" },
      { status: 403 }
    );
  }

  const { vulnerabilityId } = await request.json();
  const vuln = scan.vulnerabilities.find((v) => v.id === vulnerabilityId);

  if (!vuln) {
    return NextResponse.json({ error: "Vulnerability not found" }, { status: 404 });
  }

  if (vuln.fixedCode) {
    return NextResponse.json({ fixedCode: vuln.fixedCode, fixExplanation: vuln.fixExplanation });
  }

  const file = scan.files.find((f) => f.name === vuln.fileName);
  if (!file) {
    return NextResponse.json({ error: "Source file not found" }, { status: 404 });
  }

  const client = getClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: fixPrompt(file, vuln) }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    vuln.fixedCode = parsed.fixedCode || "";
    vuln.fixExplanation = parsed.fixExplanation || "";
    updateScan(id, { vulnerabilities: scan.vulnerabilities });
    return NextResponse.json({ fixedCode: vuln.fixedCode, fixExplanation: vuln.fixExplanation });
  }

  return NextResponse.json({ error: "Failed to generate fix" }, { status: 500 });
}
