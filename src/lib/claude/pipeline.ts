import { v4 as uuidv4 } from "uuid";
import { getClient } from "./client";
import {
  rankingPrompt,
  injectionScanPrompt,
  authScanPrompt,
  logicScanPrompt,
  critiquePrompt,
  fixPrompt,
} from "./prompts";
import { FileInput, FileRanking, Vulnerability, Tier } from "../types";
import { TIER_LIMITS } from "../constants";

const MODEL = "claude-sonnet-4-20250514";

async function callClaude(prompt: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type === "text") return block.text;
  return "";
}

function parseJSON<T>(text: string): T | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

// Stage 1: Rank files by vulnerability likelihood
async function rankFiles(files: FileInput[]): Promise<FileRanking[]> {
  if (files.length === 1) {
    return [{ fileName: files[0].name, score: 5, reason: "Single file scan — full audit" }];
  }

  const response = await callClaude(rankingPrompt(files));
  const parsed = parseJSON<{ rankings: FileRanking[] }>(response);

  if (!parsed?.rankings) {
    return files.map((f) => ({ fileName: f.name, score: 3, reason: "Default ranking" }));
  }

  return parsed.rankings.sort((a, b) => b.score - a.score);
}

// Stage 2: Multi-pass vulnerability discovery
async function discoverVulnerabilities(
  files: FileInput[],
  rankings: FileRanking[]
): Promise<Array<Omit<Vulnerability, "id" | "fixedCode" | "fixExplanation" | "confidence">>> {
  const targetFiles = rankings.filter((r) => r.score >= 3);
  const allVulns: Array<Omit<Vulnerability, "id" | "fixedCode" | "fixExplanation" | "confidence">> = [];

  for (const ranking of targetFiles) {
    const file = files.find((f) => f.name === ranking.fileName);
    if (!file) continue;

    // Run 3 scan passes in parallel
    const [injectionResult, authResult, logicResult] = await Promise.all([
      callClaude(injectionScanPrompt(file)),
      callClaude(authScanPrompt(file)),
      callClaude(logicScanPrompt(file)),
    ]);

    for (const result of [injectionResult, authResult, logicResult]) {
      const parsed = parseJSON<{ vulnerabilities: Array<{
        title: string;
        severity: string;
        description: string;
        lineStart: number;
        lineEnd: number;
        vulnerableCode: string;
        exploitPoC: string;
        category: string;
      }> }>(result);
      if (parsed?.vulnerabilities) {
        for (const v of parsed.vulnerabilities) {
          allVulns.push({
            ...v,
            fileName: file.name,
            severity: v.severity as Vulnerability["severity"],
            fixedCode: "",
            fixExplanation: "",
          } as Omit<Vulnerability, "id" | "fixedCode" | "fixExplanation" | "confidence">);
        }
      }
    }
  }

  return allVulns;
}

// Stage 3: Critique and verify findings
async function critiqueFindings(
  files: FileInput[],
  rawVulns: Array<Omit<Vulnerability, "id" | "fixedCode" | "fixExplanation" | "confidence">>
): Promise<Vulnerability[]> {
  if (rawVulns.length === 0) return [];

  const vulnsByFile = new Map<string, typeof rawVulns>();
  for (const v of rawVulns) {
    const existing = vulnsByFile.get(v.fileName) || [];
    existing.push(v);
    vulnsByFile.set(v.fileName, existing);
  }

  const verified: Vulnerability[] = [];

  for (const [fileName, vulns] of vulnsByFile) {
    const file = files.find((f) => f.name === fileName);
    if (!file) continue;

    const response = await callClaude(critiquePrompt(file, vulns));
    const parsed = parseJSON<{ verified: Array<{
      title: string;
      severity: string;
      confidence: string;
      description: string;
      lineStart: number;
      lineEnd: number;
      vulnerableCode: string;
      exploitPoC: string;
      category: string;
    }> }>(response);

    if (parsed?.verified) {
      for (const v of parsed.verified) {
        verified.push({
          id: uuidv4(),
          title: v.title,
          severity: v.severity as Vulnerability["severity"],
          confidence: v.confidence as Vulnerability["confidence"],
          description: v.description,
          fileName,
          lineStart: v.lineStart,
          lineEnd: v.lineEnd,
          vulnerableCode: v.vulnerableCode,
          exploitPoC: v.exploitPoC,
          fixedCode: "",
          fixExplanation: "",
          category: v.category,
        });
      }
    }
  }

  return verified;
}

// Stage 4: Generate fixes (Pro/Enterprise only)
async function generateFixes(
  files: FileInput[],
  vulnerabilities: Vulnerability[]
): Promise<Vulnerability[]> {
  const withFixes = [...vulnerabilities];

  for (const vuln of withFixes) {
    const file = files.find((f) => f.name === vuln.fileName);
    if (!file) continue;

    const response = await callClaude(fixPrompt(file, vuln));
    const parsed = parseJSON<{ fixedCode: string; fixExplanation: string }>(response);

    if (parsed) {
      vuln.fixedCode = parsed.fixedCode;
      vuln.fixExplanation = parsed.fixExplanation;
    }
  }

  return withFixes;
}

export interface ScanPipelineResult {
  rankings: FileRanking[];
  vulnerabilities: Vulnerability[];
}

// Main pipeline orchestrator — runs synchronously, returns results directly
export async function runScanPipeline(files: FileInput[], tier: Tier): Promise<ScanPipelineResult> {
  const limits = TIER_LIMITS[tier];

  // Stage 1: Rank files
  const rankings = await rankFiles(files);

  // Stage 2: Discover vulnerabilities
  const rawVulns = await discoverVulnerabilities(files, rankings);

  // Stage 3: Critique and verify
  let vulnerabilities = await critiqueFindings(files, rawVulns);

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  vulnerabilities.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Stage 4: Generate fixes (paid tiers only)
  if (limits.showFixedCode && vulnerabilities.length > 0) {
    vulnerabilities = await generateFixes(files, vulnerabilities);
  }

  return { rankings, vulnerabilities };
}
