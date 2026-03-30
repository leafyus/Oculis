import Link from "next/link";

interface BlurredOverlayProps {
  children: React.ReactNode;
  isGated: boolean;
  label?: string;
}

export default function BlurredOverlay({ children, isGated, label = "Upgrade to Pro" }: BlurredOverlayProps) {
  if (!isGated) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm select-none pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-lg">
        <svg className="w-8 h-8 text-violet-500 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
        <Link
          href="/pricing"
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}
