"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  PlusCircle,
  FileCode,
  Clock,
  Globe,
  ArrowUpDown,
  RefreshCw,
  Layers,
  Activity,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useAppState } from "@/context/app-state-context";
import { AuditLog, AuditLogAction, AuditEntityType } from "@/types";
import { formatIDDate } from "@/lib/utils";
import { toast } from "sonner";
import { AuditLogDetailDialog } from "@/components/dashboard/audit-log-detail-dialog";

export function AuditLogViewer() {
  const { auditLogs, addAuditLog, userProfile } = useAppState();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [activeLogForDiff, setActiveLogForDiff] = useState<AuditLog | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);

  // Metrics
  const totalLogs = auditLogs.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const logsToday = auditLogs.filter((l) => l.createdAt.startsWith(todayStr)).length;
  const uniqueEntities = new Set(auditLogs.map((l) => `${l.entityType}:${l.entityId}`)).size;
  const approvalAndReleaseCount = auditLogs.filter(
    (l) => l.action === "APPROVE" || l.action === "RELEASE"
  ).length;

  // Filter & Search
  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        // Category Filter
        if (selectedCategory !== "ALL") {
          if (selectedCategory === "BARANG") {
            if (!["PR", "PO", "GR", "GOODS_HANDOVER", "VENDOR_EVALUATION"].includes(log.entityType)) {
              return false;
            }
          } else if (selectedCategory === "JASA") {
            if (!["USPK", "TECHNICAL_EVALUATION", "SPK"].includes(log.entityType)) {
              return false;
            }
          } else if (selectedCategory === "AFCE") {
            if (log.entityType !== "AFCE") return false;
          } else if (selectedCategory === "PROJECT") {
            if (log.entityType !== "PROJECT") return false;
          } else if (selectedCategory === "FISIK") {
            if (!["PROGRESS_LOG", "SCHEDULE_REVISION"].includes(log.entityType)) {
              return false;
            }
          }
        }

        // Action Filter
        if (selectedAction !== "ALL" && log.action !== selectedAction) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchUser = log.userName.toLowerCase().includes(q);
          const matchTitle = (log.entityTitle || "").toLowerCase().includes(q);
          const matchNotes = (log.notes || "").toLowerCase().includes(q);
          const matchIp = log.ipAddress.toLowerCase().includes(q);
          const matchEntityId = log.entityId.toLowerCase().includes(q);
          if (!matchUser && !matchTitle && !matchNotes && !matchIp && !matchEntityId) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [auditLogs, selectedCategory, selectedAction, searchQuery, sortOrder]);

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

  const handleExportCSV = () => {
    const headers = [
      "ID Audit",
      "Waktu (WIB)",
      "Pelaku",
      "Jabatan",
      "IP Address",
      "Aksi",
      "Tipe Entitas",
      "ID Entitas",
      "Judul / Rincian",
      "Catatan",
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${l.createdAt}"`,
      `"${l.userName.replace(/"/g, '""')}"`,
      `"${(l.userJabatan || l.userRole || "").replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId}"`,
      `"${(l.entityTitle || "").replace(/"/g, '""')}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Log_WM_Toolkit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Log audit berhasil diekspor ke format CSV", {
      description: `${filteredLogs.length} baris jejak audit tersimpan aman.`,
    });
  };

  const handleSimulateNewAudit = () => {
    const newEntry = addAuditLog({
      action: "UPDATE",
      entityType: "PROJECT",
      entityId: "prj-1",
      entityTitle: "PRJ-2026-001 • Pembangunan Pintu Air & Tanggul Banjir Afdeling III",
      projectId: "prj-1",
      projectName: "Pembangunan Pintu Air & Tanggul Banjir Afdeling III",
      beforeData: {
        lastInspectionStatus: "Routine Check",
        supervisor: "Mandor Lapangan",
      },
      afterData: {
        lastInspectionStatus: "Verified Site Check",
        supervisor: userProfile.fullName,
        timestamp: new Date().toISOString(),
      },
      ipAddress: "10.20.4.15",
      notes: "Verifikasi simulasi pencatatan jejak audit interaktif oleh pengguna.",
    });

    toast.success("Entri jejak audit baru berhasil dicatat", {
      description: `ID: ${newEntry.id} • Snapshot data tersimpan di LocalStorage.`,
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Pusat Tata Kelola & Jejak Audit &bull; Immutable Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Pusat Rekam Jejak Audit Sistem (Audit Log)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log immutable pencatatan seluruh mutasi data: siapa, apa, kapan, alamat IP origin, dan snapshot komparasi sebelum vs sesudah perubahan (docs/DATA-MODEL.md).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={handleSimulateNewAudit}
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Simulasi Catat Audit</span>
          </Button>

          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-xs"
            onClick={handleExportCSV}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Total Jejak Audit</span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{totalLogs}</div>
              <span className="text-[10px] text-emerald-600 font-medium">Immutable Record</span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Aktivitas Hari Ini</span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{logsToday}</div>
              <span className="text-[10px] text-blue-600 font-medium">Sesi Berjalan</span>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Entitas Terpantau</span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{uniqueEntities}</div>
              <span className="text-[10px] text-purple-600 font-medium">AFCE, PR, PO, SPK, BAST</span>
            </div>
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Approval & Rilis</span>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{approvalAndReleaseCount}</div>
              <span className="text-[10px] text-teal-600 font-medium">Otoritas Bertingkat</span>
            </div>
            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">Tabel Riwayat Mutasi Data Seluruh Sistem</CardTitle>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari user, entitas, ID dokumen, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          {/* Filter Chips Bar */}
          <div className="flex items-center justify-between gap-2 pt-3 flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-muted-foreground font-semibold text-[11px] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Kategori:
              </span>
              {[
                { key: "ALL", label: "Semua" },
                { key: "PROJECT", label: "Proyek" },
                { key: "AFCE", label: "AFCE" },
                { key: "BARANG", label: "Jalur Barang (PR/PO/GR/BAST)" },
                { key: "JASA", label: "Jalur Jasa (USPK/SPK)" },
                { key: "FISIK", label: "Fisik & Addendum" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.key
                      ? "bg-emerald-600 text-white font-semibold shadow-2xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Action Filter & Sort */}
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter Tipe Aksi"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="h-8 text-xs border rounded-md px-2 bg-background text-foreground"
              >
                <option value="ALL">Semua Aksi</option>
                <option value="CREATE">CREATE</option>
                <option value="APPROVE">APPROVE</option>
                <option value="RELEASE">RELEASE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="REJECT">REJECT</option>
                <option value="SUBMIT">SUBMIT</option>
                <option value="CLOSE">CLOSE</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2 gap-1"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>{sortOrder === "desc" ? "Terbaru" : "Terlama"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs font-semibold w-40">Waktu & IP</TableHead>
                  <TableHead className="text-xs font-semibold w-48">Pengguna / Pelaku</TableHead>
                  <TableHead className="text-xs font-semibold w-36">Aksi & Entitas</TableHead>
                  <TableHead className="text-xs font-semibold">Rincian Dokumen & Catatan</TableHead>
                  <TableHead className="text-xs font-semibold text-right w-28">Diff Snapshot</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                      Tidak ditemukan riwayat jejak audit yang sesuai dengan filter pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
                      {/* Waktu & IP */}
                      <TableCell className="align-top py-3 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {formatIDDate(log.createdAt.split("T")[0])}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {log.createdAt.includes("T") ? log.createdAt.split("T")[1].slice(0, 8) : "10:00:00"} WIB
                          </p>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded">
                            <Globe className="w-2.5 h-2.5" /> {log.ipAddress}
                          </span>
                        </div>
                      </TableCell>

                      {/* Pelaku */}
                      <TableCell className="align-top py-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7 text-[10px] font-bold border shrink-0">
                            <AvatarFallback className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {log.userName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{log.userName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {log.userJabatan || log.userRole || "User"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Aksi & Entitas */}
                      <TableCell className="align-top py-3 text-xs">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                            {log.entityType}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Rincian Dokumen & Catatan */}
                      <TableCell className="align-top py-3 text-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground" title={log.entityTitle}>
                            {log.entityTitle || log.entityId}
                          </p>
                          {log.projectName && (
                            <p className="text-[11px] text-muted-foreground">
                              Proyek: <span className="font-medium text-foreground">{log.projectName}</span>
                            </p>
                          )}
                          {log.notes && (
                            <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-1.5 rounded border border-border/40">
                              &ldquo;{log.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Diff Snapshot Action */}
                      <TableCell className="align-top py-3 text-xs text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                          onClick={() => {
                            setActiveLogForDiff(log);
                            setDiffDialogOpen(true);
                          }}
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>Diff Data</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Menampilkan <b className="text-foreground">{filteredLogs.length}</b> dari{" "}
              <b className="text-foreground">{totalLogs}</b> entri audit
            </span>
            <span className="font-mono text-[11px]">
              Engine: PostgreSQL &bull; Prisma schema audit_logs
            </span>
          </div>
        </CardContent>
      </Card>

      <AuditLogDetailDialog
        log={activeLogForDiff}
        open={diffDialogOpen}
        onOpenChange={setDiffDialogOpen}
      />
    </div>
  );
}
