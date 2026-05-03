import { cn } from "@/lib/utils";

interface LeadScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function LeadScoreBadge({ score, size = "sm" }: LeadScoreBadgeProps) {
  const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold rounded tabular-nums",
        size === "sm" && "text-xs px-1.5 py-0.5 min-w-[36px]",
        size === "md" && "text-sm px-2 py-1 min-w-[44px]",
        size === "lg" && "text-2xl px-3 py-1.5 min-w-[64px]",
        tier === "hot" && "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
        tier === "warm" && "bg-amber-500/15 text-amber-400 border border-amber-500/25",
        tier === "cold" && "bg-red-500/10 text-red-400 border border-red-500/20",
      )}
    >
      {score}
    </span>
  );
}
