"use client";

import { useState } from "react";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";

interface GitHubInputProps {
  onFilesLoaded: (files: Array<{ name: string; content: string; language: string }>) => void;
  disabled?: boolean;
}

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

const SKIP_DIRS = ["node_modules", ".git", "__pycache__", ".next", "dist", "build", "vendor", ".venv", "venv"];

function shouldSkip(path: string): boolean {
  return SKIP_DIRS.some((dir) => path.includes(`/${dir}/`) || path.startsWith(`${dir}/`));
}

interface GitHubTreeItem {
  path: string;
  type: string;
  url: string;
}

export default function GitHubInput({ onFilesLoaded, disabled }: GitHubInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState<number | null>(null);

  const fetchRepo = async () => {
    setError(null);
    setFileCount(null);

    // Parse GitHub URL: https://github.com/owner/repo
    const match = url.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
    if (!match) {
      setError("Invalid GitHub URL. Use format: https://github.com/owner/repo");
      return;
    }

    const [, owner, repo] = match;
    const repoName = repo.replace(/\.git$/, "");

    setLoading(true);

    try {
      // Fetch repo tree via GitHub API
      const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/trees/HEAD?recursive=1`
      );

      if (!treeRes.ok) {
        if (treeRes.status === 404) throw new Error("Repository not found. Make sure it's public.");
        throw new Error(`GitHub API error: ${treeRes.status}`);
      }

      const tree = await treeRes.json();
      const sourceFiles = (tree.tree as GitHubTreeItem[]).filter(
        (item) => item.type === "blob" && isSupportedFile(item.path) && !shouldSkip(item.path)
      );

      if (sourceFiles.length === 0) {
        throw new Error("No supported source code files found in this repository.");
      }

      // Limit to first 50 files to stay within API limits
      const filesToFetch = sourceFiles.slice(0, 50);
      setFileCount(filesToFetch.length);

      const files = await Promise.all(
        filesToFetch.map(async (item) => {
          const res = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repoName}/HEAD/${item.path}`
          );
          const content = await res.text();
          return {
            name: item.path,
            content,
            language: getLanguage(item.path),
          };
        })
      );

      onFilesLoaded(files.filter((f) => f.content.length > 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          disabled={disabled || loading}
          className="flex-1 border border-zinc-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          onClick={fetchRepo}
          disabled={!url.trim() || disabled || loading}
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Fetching...
            </span>
          ) : (
            "Fetch Repo"
          )}
        </button>
      </div>

      {fileCount !== null && (
        <p className="mt-2 text-sm text-green-600">
          Loaded {fileCount} source file(s) from repository
        </p>
      )}

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <p className="mt-2 text-xs text-zinc-400">
        Public repositories only. Fetches up to 50 source files. Enterprise tier supports private repos.
      </p>
    </div>
  );
}
