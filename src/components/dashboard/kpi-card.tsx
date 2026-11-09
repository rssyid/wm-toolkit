"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trendText: string;
  trendType?: "positive" | "negative" | "warning" | "neutral";
  href: string;
  accentColor?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trendText,
  trendType = "neutral",
  href,
  accentColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
}: KPICardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 cursor-pointer group relative overflow-hidden">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors">
              {title}
            </span>
            <div className={cn("p-2 rounded-lg shrink-0", accentColor)}>
              <Icon className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {value}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              <span
                className={cn(
                  "font-medium",
                  trendType === "positive" && "text-emerald-600 dark:text-emerald-400",
                  trendType === "negative" && "text-rose-600 dark:text-rose-400",
                  trendType === "warning" && "text-amber-600 dark:text-amber-400",
                  trendType === "neutral" && "text-muted-foreground"
                )}
              >
                {trendText}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
