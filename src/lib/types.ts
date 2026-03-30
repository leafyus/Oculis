export type Tier = "free" | "pro" | "enterprise";

export type ScanStatus = "pending" | "ranking" | "scanning" | "critiquing" | "complete" | "error";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type Confidence = "high" | "medium" | "low";

export interface FileInput {
  name: string;
  content: string;
  language: string;
}

export interface FileRanking {
  fileName: string;
  score: number;
  reason: string;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  description: string;
  fileName: string;
  lineStart: number;
  lineEnd: number;
  vulnerableCode: string;
  exploitPoC: string;
  fixedCode: string;
  fixExplanation: string;
  category: string;
}

export interface ScanResult {
  id: string;
  status: ScanStatus;
  tier: Tier;
  createdAt: string;
  completedAt?: string;
  files: FileInput[];
  rankings: FileRanking[];
  vulnerabilities: Vulnerability[];
  error?: string;
  progress: number;
  currentStage: string;
}

export interface ScanRequest {
  files: FileInput[];
  tier: Tier;
}

export interface TierLimits {
  maxFiles: number;
  maxLinesPerFile: number;
  maxScansPerMonth: number;
  showExploitPoC: boolean;
  showFixedCode: boolean;
  maxDetailedVulns: number;
}
