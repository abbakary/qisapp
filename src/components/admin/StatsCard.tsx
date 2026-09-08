import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  variant?: "default" | "gold" | "teal" | "deep";
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  subtext,
  change,
  trend = "neutral",
  icon,
  variant = "default",
  onClick,
}: StatsCardProps) {
  const variantStyles = {
    default: "bg-white text-ink border-line hover:border-gold/40",
    gold: "bg-gradient-to-br from-[#FAF5E6] to-[#F3E7C4] text-deep-green border-gold/30",
    teal: "bg-gradient-to-br from-[#E8F4F2] to-[#D2EBE7] text-teal border-teal/20",
    deep: "bg-deep-green text-warm-white border-deep-green",
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-3.5 transition-all card-shadow flex flex-col gap-2.5 min-w-0 ${variantStyles} ${
        onClick ? "cursor-pointer hover:shadow-md hover:scale-[1.01]" : ""
      }`}
    >
      {/* Top row: icon + change badge */}
      <div className="flex items-center justify-between gap-1.5">
        {icon ? (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0 ${
              variant === "deep"
                ? "bg-warm-white/10 text-gold-light"
                : "bg-sand/80 text-deep-green"
            }`}
          >
            {icon}
          </div>
        ) : (
          <div />
        )}

        {change && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg flex-shrink-0 ${
              trend === "up"
                ? "bg-emerald-100 text-emerald-700"
                : trend === "down"
                ? "bg-rose-100 text-rose-700"
                : "bg-sand text-muted"
            }`}
          >
            {change}
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <span
          className={`font-display text-2xl font-bold tracking-tight leading-none block ${
            variant === "deep" ? "text-warm-white" : "text-deep-green"
          }`}
        >
          {value}
        </span>
      </div>

      {/* Title — full text, wraps naturally, no truncation */}
      <div>
        <span
          className={`text-[10.5px] font-bold uppercase tracking-wide leading-snug block ${
            variant === "deep" ? "text-warm-white/70" : "text-muted"
          }`}
        >
          {title}
        </span>

        {subtext && (
          <span
            className={`mt-0.5 text-[10px] leading-snug block ${
              variant === "deep" ? "text-warm-white/50" : "text-muted/80"
            }`}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
