import { SEVERITY_CONFIG } from "@/lib/constants";
import { Severity } from "@/lib/types";

interface SeverityBadgeProps {
  severity: Severity;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = SEVERITY_CONFIG[severity];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  );
}
