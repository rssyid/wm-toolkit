"use client";

import React from "react";
import { getStatusSemanticClass } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const { badge, dot, label } = getStatusSemanticClass(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs transition-colors whitespace-nowrap",
        badge,
        className
      )}
    >
      {showDot && <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />}
      <span>{label}</span>
    </span>
  );
}
