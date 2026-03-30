"use client";

import { useCallback, useState } from "react";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";

interface FileUploaderProps {
  onFilesSelected: (files: Array<{ name: string; content: string; language: string }>) => void;
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

export default function FileUploader({ onFilesSelected, disabled }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const processFiles = useCallback(async (fileList: FileList) => {
    setError(null);
    const parsed: Array<{ name: string; content: string; language: string }> = [];

    for (const file of Array.from(fileList)) {
      const ext = file.name.slice(file.name.lastIndexOf("."));
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        setError(`Unsupported file: ${file.name}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`);
        return;
      }

      const content = await file.text();
      const lineCount = content.split("\n").length;

      if (lineCount > 500) {
        setError(`${file.name} has ${lineCount} lines (free tier limit: 500). Upgrade to Pro for larger files.`);
        return;
      }

      parsed.push({ name: file.name, content, language: getLanguage(file.name) });
    }

    setSelectedFiles(parsed.map((f) => f.name));
    onFilesSelected(parsed);
  }, [onFilesSelected]);

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
          accept={SUPPORTED_EXTENSIONS.join(",")}
          onChange={handleChange}
          className="hidden"
        />

        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <p className="text-lg font-medium text-zinc-900 mb-1">
          Drop your code file here
        </p>
        <p className="text-sm text-zinc-500 mb-4">
          or click to browse
        </p>
        <p className="text-xs text-zinc-400">
          Supports: Python, JavaScript, TypeScript, Go, Rust, Java, C/C++, PHP, Ruby, C#, Solidity, SQL
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedFiles.map((name) => (
            <div key={name} className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              {name}
            </div>
          ))}
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
