import JSZip from "jszip";
import { SUPPORTED_EXTENSIONS } from "./constants";

function getLanguage(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf("."));
  const langMap: Record<string, string> = {
    ".js": "javascript", ".jsx": "javascript", ".ts": "typescript", ".tsx": "typescript",
    ".py": "python", ".go": "go", ".java": "java", ".rb": "ruby", ".php": "php",
    ".c": "c", ".cpp": "cpp", ".h": "c", ".hpp": "cpp", ".rs": "rust",
    ".cs": "csharp", ".sol": "solidity", ".sql": "sql",
  };
  return langMap[ext] || "text";
}

function isSupportedFile(fileName: string): boolean {
  const ext = fileName.slice(fileName.lastIndexOf("."));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

// Skip common non-source directories
const SKIP_DIRS = ["node_modules", ".git", "__pycache__", ".next", "dist", "build", "vendor", ".venv", "venv"];

function shouldSkip(path: string): boolean {
  return SKIP_DIRS.some((dir) => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`));
}

export async function extractZip(
  file: File
): Promise<Array<{ name: string; content: string; language: string }>> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const results: Array<{ name: string; content: string; language: string }> = [];

  const entries = Object.entries(zip.files).filter(
    ([path, entry]) => !entry.dir && isSupportedFile(path) && !shouldSkip(path)
  );

  for (const [path, entry] of entries) {
    const content = await entry.async("string");
    if (content.length > 0) {
      // Use just the filename, or short relative path
      const shortName = path.includes("/") ? path.split("/").slice(-2).join("/") : path;
      results.push({
        name: shortName,
        content,
        language: getLanguage(path),
      });
    }
  }

  return results;
}
