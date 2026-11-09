"use client";

import React from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Tidak ada data yang cocok",
  description = "Coba sesuaikan kata kunci pencarian atau ubah filter untuk menemukan apa yang Anda cari.",
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border/70 bg-card/40 my-4">
      <div className="p-3 bg-muted/60 rounded-full text-muted-foreground mb-3">
        {icon || <FolderSearch className="w-8 h-8 opacity-80" />}
      </div>
      <h4 className="text-sm font-semibold tracking-tight text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
