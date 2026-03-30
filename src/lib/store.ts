import { ScanResult } from "./types";

const scans = new Map<string, ScanResult>();

export function getScan(id: string): ScanResult | undefined {
  return scans.get(id);
}

export function setScan(id: string, result: ScanResult): void {
  scans.set(id, result);
}

export function updateScan(id: string, updates: Partial<ScanResult>): ScanResult | undefined {
  const existing = scans.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  scans.set(id, updated);
  return updated;
}

export function getAllScans(): ScanResult[] {
  return Array.from(scans.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
