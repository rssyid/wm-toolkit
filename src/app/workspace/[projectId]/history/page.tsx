"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { History, Search, ArrowUpDown, Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { AuditLogDetailDialog } from "@/components/dashboard/audit-log-detail-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useAppState } from "@/context/app-state-context";
import { AuditEntityType, AuditLog } from "@/types";
import { cn } from "@/lib/utils";

const WIB_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

const ENTITY_FILTER_OPTIONS: Array<{ value: "ALL" | AuditEntityType; label: string }> = [
  { value: "ALL", label: "Semua Entitas" },
  { value: "PROJECT", label: "Proyek" },
  { value: "AFCE", label: "AFCE" },
  { value: "PR", label: "PR" },
  { value: "PO", label: "PO / GR / BAST" },
  { value: "USPK", label: "USPK / SPK" },
  { value: "PROGRESS_LOG", label: "Progres Fisik" },
  { value: "WORK_ITEM", label: "WBS & BOQ" },
  { value: "COMMENT", label: "Diskusi & Lampiran" },
];

export default function HistoryTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, auditLogs } = useAppState();

  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const project = projects.find((p) => p.id === projectId);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return auditLogs
      .filter((log) => log.projectId === projectId)
      .filter((log) => {
        if (entityFilter === "ALL") return true;
        if (entityFilter === "PO") {
          return (
            log.entityType === "PO" ||
            log.entityType === "GR" ||
            log.entityType === "GOODS_HANDOVER" ||
            log.entityType === "VENDOR_EVALUATION"
          );
        }
        if (entityFilter === "USPK") {
          return (
            log.entityType === "USPK" ||
            log.entityType === "SPK" ||
            log.entityType === "TECHNICAL_EVALUATION"
          );
        }
        if (entityFilter === "WORK_ITEM") {
          return (
            log.entityType === "WORK_ITEM" ||
            log.entityType === "BOQ_ITEM" ||
            log.entityType === "SCHEDULE_REVISION"
          );
        }
        if (entityFilter === "COMMENT") {
          return log.entityType === "COMMENT" || log.entityType === "ATTACHMENT";
        }
        return log.entityType === entityFilter;
      })
      .filter((log) => {
        if (!query) return true;
        return (
          (log.entityTitle || "").toLowerCase().includes(query) ||
          (log.userName || "").toLowerCase().includes(query) ||
          (log.notes || "").toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? tb - ta : ta - tb;
      });
  }, [auditLogs, projectId, entityFilter, searchQuery, sortOrder]);

  if (!project) return null;

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Jejak Audit &amp; Riwayat Aktivitas Proyek ({filteredLogs.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rekaman audit aktual dari basis data untuk seluruh perubahan proyek {project.code}.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSortOrder((s) => (s === "desc" ? "asc" : "desc"))}
            className="h-9 text-xs gap-1.5 self-start sm:self-auto"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === "desc" ? "Terbaru Dahulu" : "Terlama Dahulu"}
          </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {ENTITY_FILTER_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={entityFilter === opt.value ? "default" : "outline"}
                  onClick={() => setEntityFilter(opt.value)}
                  className="h-8 text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aktor, entitas, catatan..."
                aria-label="Cari riwayat audit proyek"
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={<History className="w-8 h-8 opacity-60" />}
              title="Belum ada log audit yang cocok"
              description="Setiap perubahan proyek, AFCE, pengadaan, jadwal, dan progres tercatat otomatis pada tabel ini."
            />
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu (WIB)</TableHead>
                    <TableHead>Aksi</TableHead>
                    <TableHead>Entitas</TableHead>
                    <TableHead>Pelaku</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-mono whitespace-nowrap text-muted-foreground">
                        {WIB_FORMATTER.format(new Date(log.createdAt))} WIB
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] font-semibold",
                            log.action === "CREATE" || log.action === "APPROVE"
                              ? "border-emerald-300 text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : log.action === "DELETE" || log.action === "REJECT"
                              ? "border-rose-300 text-rose-800 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300"
                              : "border-slate-300 text-slate-800 bg-slate-50 dark:bg-slate-900 dark:text-slate-300"
                          )}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{log.entityTitle}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          {log.entityType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.userName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {log.userJabatan || log.userRole}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {log.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailOpen(true);
                          }}
                          className="h-8 text-xs gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AuditLogDetailDialog
        log={selectedLog}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
