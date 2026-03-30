"use client";

import { useCallback, useState } from "react";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { Tier } from "@/lib/types";

interface FileUploaderProps {
  onFilesSelected: (files: Array<{ name: string; content: string; language: string }>) => void;
  disabled?: boolean;
  tier: Tier;
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

export default function FileUploader({ onFilesSelected, disabled, tier }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const processFiles = useCallback(async (fileList: FileList) => {
    setError(null);
    const parsed: Array<{ name: string; content: string; language: string }> = [];

    for (const file of Array.from(fileList)) {
      // Handle ZIP files
      if (file.name.endsWith(".zip")) {
        try {
          const { extractZip } = await import("@/lib/zip");
          const extracted = await extractZip(file);
          parsed.push(...extracted);
        } catch {
          setError("Failed to extract ZIP file. Make sure it contains supported source code files.");
          return;
        }
        continue;
      }

      if (!isSupportedFile(file.name)) {
        setError(`Unsupported file: ${file.name}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")} or .zip`);
        return;
      }

      const content = await file.text();
      parsed.push({ name: file.name, content, language: getLanguage(file.name) });
    }

    if (parsed.length === 0) {
      setError("No supported source code files found.");
      return;
    }

    const maxFiles = tier === "free" ? 1 : tier === "pro" ? 50 : 500;
    if (parsed.length > maxFiles) {
      setError(`${tier} tier supports up to ${maxFiles} file(s). Found ${parsed.length}. ${tier === "free" ? "Upgrade to Pro for full repo scans." : "Upgrade to Enterprise."}`);
      return;
    }

    setSelectedFiles(parsed.map((f) => f.name));
    onFilesSelected(parsed);
  }, [onFilesSelected, tier]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragActive
            ? "border-violet-400 bg-violet-50"
            : "border-zinc-300 hover:border-violet-300 hover:bg-violet-50/30"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={[...SUPPORTED_EXTENSIONS, ".zip"].join(",")}
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <p className="text-lg font-medium text-zinc-900 mb-1">
          Drop your code files or ZIP here
        </p>
        <p className="text-sm text-zinc-500 mb-4">
          or click to browse &middot; {tier === "free" ? "1 file" : tier === "pro" ? "up to 50 files" : "up to 500 files"}
        </p>
        <p className="text-xs text-zinc-400">
          Supports: .py .js .ts .go .rs .java .c .cpp .php .rb .cs .sol .sql &middot; or .zip archive
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-zinc-500 mb-2">{selectedFiles.length} file(s) selected</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {selectedFiles.map((name) => (
              <div key={name} className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
