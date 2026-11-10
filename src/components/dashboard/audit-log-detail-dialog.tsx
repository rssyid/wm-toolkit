"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditLog, AuditLogAction } from "@/types";
import { formatIDDate } from "@/lib/utils";
import {
  ShieldCheck,
  User,
  Globe,
  Clock,
  Layers,
  FileCode,
  ArrowRight,
  Terminal,
} from "lucide-react";

interface AuditLogDetailDialogProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditLogDetailDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailDialogProps) {
  if (!log) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Rincian Jejak Audit Sistem
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-mono">
                  ID: {log.id} &bull; Tercatat Immutable
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getActionBadgeColor(log.action)}>
                {log.action}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {log.entityType}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Metadata Header Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 py-3 bg-muted/40 rounded-lg p-3 text-xs border border-border/60">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
              <User className="w-3 h-3 text-muted-foreground" /> Pelaku / Pengguna
            </span>
            <p className="font-semibold text-foreground truncate">{log.userName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{log.userJabatan || log.userRole || "User"}</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Globe className="w-3 h-3 text-muted-foreground" /> Alamat IP Origin
            </span>
            <p className="font-mono font-medium text-foreground">{log.ipAddress}</p>
            <p className="text-[11px] text-muted-foreground">Jaringan Intranet Kebun</p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Clock className="w-3 h-3 text-muted-foreground" /> Waktu Transaksi
            </span>
            <p className="font-medium text-foreground">
              {formatIDDate(log.createdAt.split("T")[0], true)}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {log.createdAt.includes("T") ? log.createdAt.split("T")[1].replace("Z", "") : "10:00:00"} WIB
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-semibold">
              <Layers className="w-3 h-3 text-muted-foreground" /> Entitas Target
            </span>
            <p className="font-semibold text-foreground truncate" title={log.entityTitle || log.entityId}>
              {log.entityTitle || log.entityId}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono">{log.entityId}</p>
          </div>
        </div>

        {/* Operational Notes */}
        {log.notes && (
          <div className="p-3 rounded-md bg-secondary/50 border border-secondary text-xs">
            <span className="font-semibold text-foreground block mb-0.5">Catatan Operasional:</span>
            <p className="text-muted-foreground italic">&ldquo;{log.notes}&rdquo;</p>
          </div>
        )}

        {/* Side-by-Side Diff Inspector */}
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-600" />
              Perbandingan Snapshot Data (Before vs After JSON Diff)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Format Objek Database Sesuai docs/DATA-MODEL.md
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Before Data Panel */}
            <div className="flex flex-col rounded-md border border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/20 overflow-hidden">
              <div className="px-3 py-1.5 bg-rose-100/60 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between text-xs font-semibold text-rose-800 dark:text-rose-300">
                <span>SEBELUM PERUBAHAN (BEFORE)</span>
                <span className="text-[10px] font-mono">
                  {log.beforeData ? `${Object.keys(log.beforeData).length} Field` : "Initial"}
                </span>
              </div>
              <div className="p-3 font-mono text-[11px] leading-relaxed overflow-x-auto flex-1">
                {log.beforeData ? (
                  <pre className="text-rose-900 dark:text-rose-200 whitespace-pre-wrap break-all">
                    {JSON.stringify(log.beforeData, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-muted-foreground italic text-xs">
                    <span>- Tidak Ada Data Sebelumnya -</span>
                    <span className="text-[10px] mt-0.5">(Objek Baru Dibuat)</span>
                  </div>
                )}
              </div>
            </div>

            {/* After Data Panel */}
            <div className="flex flex-col rounded-md border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/20 overflow-hidden">
              <div className="px-3 py-1.5 bg-emerald-100/60 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span>SESUDAH PERUBAHAN (AFTER)</span>
                <span className="text-[10px] font-mono">
                  {log.afterData ? `${Object.keys(log.afterData).length} Field` : "Deleted"}
                </span>
              </div>
              <div className="p-3 font-mono text-[11px] leading-relaxed overflow-x-auto flex-1">
                {log.afterData ? (
                  <pre className="text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap break-all">
                    {JSON.stringify(log.afterData, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-muted-foreground italic text-xs">
                    <span>- Data Dihapus -</span>
                    <span className="text-[10px] mt-0.5">(Entitas Dinonaktifkan/Soft Delete)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Signature */}
        <div className="flex items-center gap-2 pt-2 text-[10px] text-muted-foreground border-t">
          <Terminal className="w-3 h-3 shrink-0" />
          <span className="truncate">Client: {log.userAgent || "Desktop Browser Intranet"}</span>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
