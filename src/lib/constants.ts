import { Severity, Tier, TierLimits } from "./types";

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxFiles: 1,
    maxLinesPerFile: 500,
    maxScansPerMonth: 3,
    showExploitPoC: false,
    showFixedCode: false,
    maxDetailedVulns: 2,
  },
  pro: {
    maxFiles: 50,
    maxLinesPerFile: 10000,
    maxScansPerMonth: 50,
    showExploitPoC: true,
    showFixedCode: true,
    maxDetailedVulns: Infinity,
  },
  enterprise: {
    maxFiles: 500,
    maxLinesPerFile: 50000,
    maxScansPerMonth: Infinity,
    showExploitPoC: true,
    showFixedCode: true,
    maxDetailedVulns: Infinity,
  },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bgColor: string }> = {
  critical: { label: "Critical", color: "text-red-700", bgColor: "bg-red-100 border-red-200" },
  high: { label: "High", color: "text-orange-700", bgColor: "bg-orange-100 border-orange-200" },
  medium: { label: "Medium", color: "text-yellow-700", bgColor: "bg-yellow-100 border-yellow-200" },
  low: { label: "Low", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-200" },
  info: { label: "Info", color: "text-gray-700", bgColor: "bg-gray-100 border-gray-200" },
};

export const SUPPORTED_EXTENSIONS = [
  ".js", ".ts", ".jsx", ".tsx",
  ".py",
  ".go",
  ".java",
  ".rb",
  ".php",
  ".c", ".cpp", ".h", ".hpp",
  ".rs",
  ".cs",
  ".sol",
  ".sql",
];

export const PRICING = {
  free: { price: 0, label: "Free", period: "" },
  pro: { price: 49, label: "Pro", period: "/mo" },
  enterprise: { price: 299, label: "Enterprise", period: "/mo" },
};
