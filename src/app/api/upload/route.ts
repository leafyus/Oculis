import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { FileInput } from "@/lib/types";

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

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const parsed: FileInput[] = [];

  for (const file of files) {
    const ext = file.name.slice(file.name.lastIndexOf("."));
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${ext}. Supported: ${SUPPORTED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const content = await file.text();
    if (content.length === 0) {
      return NextResponse.json({ error: `File ${file.name} is empty` }, { status: 400 });
    }

    parsed.push({
      name: file.name,
      content,
      language: getLanguage(file.name),
    });
  }

  return NextResponse.json({ files: parsed });
}
