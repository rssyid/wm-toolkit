"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  Terminal,
  User,
  Globe,
  Clock,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppState } from "@/context/app-state-context";
import { AuditLog, AuditLogAction } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { AuditLogDetailDialog } from "@/components/dashboard/audit-log-detail-dialog";

interface AuditLogFeedProps {
  onViewAll?: () => void;
}

export function AuditLogFeed({ onViewAll }: AuditLogFeedProps) {
  const { auditLogs } = useAppState();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const recentLogs = auditLogs.slice(0, 5);

  const getActionBadgeColor = (action: AuditLogAction) => {
    switch (action) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
      case "APPROVE":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
      case "RELEASE":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "UPDATE":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
      case "REJECT":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
      case "SUBMIT":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
      case "CLOSE":
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleOpenDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  return (
    <>
      <Card className="flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow md:col-span-2 lg:col-span-2">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-semibold">
              Jejak Audit & Aktivitas Sistem (Immutable Audit Log)
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              {auditLogs.length} Entri Tercatat
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-3 divide-y divide-border/60 flex-1">
          {recentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Belum ada aktivitas mutasi data tercatat.
            </p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Avatar className="w-7 h-7 text-[10px] font-bold border shrink-0 mt-0.5">
                    <AvatarFallback className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {log.userName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {log.userName}
                      </span>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-mono">
                        {log.entityType}
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground truncate mt-0.5" title={log.notes || log.entityTitle}>
                      {log.notes || log.entityTitle || log.entityId}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatIDDate(log.createdAt.split("T")[0])} &bull; {log.createdAt.includes("T") ? log.createdAt.split("T")[1].slice(0, 5) : "10:00"} WIB
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Globe className="w-3 h-3" />
                        IP: {log.ipAddress}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2 gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                    onClick={() => handleOpenDetail(log)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Diff Data</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>

        <div className="p-3 pt-0 border-t mt-auto flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Terminal className="w-3 h-3 text-emerald-600" />
            Audit engine aktif &bull; Snapshot JSON before/after tersimpan otomatis
          </span>

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium pt-2 cursor-pointer"
            >
              Buka seluruh log audit sistem <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </Card>

      <AuditLogDetailDialog
        log={selectedLog}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
