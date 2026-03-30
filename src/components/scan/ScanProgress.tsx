"use client";

import { Progress } from "@/components/ui/progress";

interface ScanProgressProps {
  progress: number;
  currentStage: string;
  status: string;
}

export default function ScanProgress({ progress, currentStage, status }: ScanProgressProps) {
  const stages = [
    { key: "ranking", label: "File Analysis", threshold: 10 },
    { key: "scanning", label: "Vulnerability Scanning", threshold: 30 },
    { key: "critiquing", label: "Verification", threshold: 65 },
    { key: "complete", label: "Complete", threshold: 100 },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          {status !== "complete" && status !== "error" ? (
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-violet-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin" />
            </div>
          ) : status === "complete" ? (
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
          )}

          <p className="text-lg font-semibold text-zinc-900">{currentStage}</p>
          <p className="text-sm text-zinc-500 mt-1">{Math.round(progress)}% complete</p>
        </div>

        <Progress value={progress} className="h-2 mb-6" />

        <div className="space-y-3">
          {stages.map((stage) => {
            const isComplete = progress >= stage.threshold;
            const isActive = !isComplete && progress > (stage.threshold - 25);

            return (
              <div key={stage.key} className="flex items-center gap-3">
                {isComplete ? (
                  <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="w-5 h-5 border-2 border-violet-400 rounded-full shrink-0 relative">
                    <div className="absolute inset-0.5 bg-violet-400 rounded-full animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 border-2 border-zinc-200 rounded-full shrink-0" />
                )}
                <span className={`text-sm ${isComplete ? "text-zinc-900 font-medium" : isActive ? "text-violet-600 font-medium" : "text-zinc-400"}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
