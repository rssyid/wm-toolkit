"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  History,
  CheckCircle2,
  FileText,
  ShoppingCart,
  HardHat,
  CalendarClock,
  Filter,
  Search,
  Download,
  Paperclip,
  Star,
  ArrowUpDown,
  FileSpreadsheet,
  Check,
  ShieldCheck,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineSeparator,
  TimelineIndicator,
  TimelineDate,
  TimelineContent,
} from "@/components/ui/timeline";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, cn } from "@/lib/utils";
import { toast } from "sonner";

interface TimelineAttachment {
  name: string;
  size: string;
}

interface TimelineRating {
  score: number;
  label?: string;
}

interface AuditTimelineEvent {
  id: string;
  dateStr: string;
  formattedDate: string;
  actionVerb: string;
  actionTitle: string;
  description: string;
  category: "AFCE" | "PR" | "PO" | "Schedule" | "Progress" | "General";
  nodeColor: string;
  owner: string;
  categoryBadge: {
    label: string;
    className: string;
  };
  statusBadge: {
    label: string;
    dotColor: string;
  };
  attachment?: TimelineAttachment;
  rating?: TimelineRating;
  sortTimestamp: number;
}

export default function HistoryTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, afces, prs, pos, grs, dailyProgress } = useAppState();

  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const project = projects.find((p) => p.id === projectId);
  const afce = afces.find((a) => a.projectId === projectId);

  // Build timeline events from state
  const rawEvents = useMemo(() => {
    if (!project) return [];

    const items: AuditTimelineEvent[] = [];

    // 1. Initial Project Creation & Baseline Lock
    const initDate = project.baselineStartDate || project.lastUpdated || "2026-08-01";
    items.push({
      id: "evt-init",
      dateStr: initDate,
      formattedDate: `${formatIDDate(initDate, true).toUpperCase()}`,
      actionVerb: "Inisiasi",
      actionTitle: `Pengesahan Dokumen & Penguncian Baseline Proyek`,
      description: `Baseline master schedule (${project.durationDays} hari kalender) dan ${project.workItems.length} work items disahkan dengan nilai otorisasi AFCE ${formatIDR(project.afceValue)}. Lokasi: ${project.locationName}.`,
      category: "General",
      nodeColor: "bg-emerald-500",
      owner: "System / Admin PM",
      categoryBadge: {
        label: "Baseline",
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      },
      statusBadge: {
        label: "Baseline Valid",
        dotColor: "bg-emerald-500",
      },
      attachment: {
        name: `Baseline_Lock_${project.code}.pdf`,
        size: "2.4 MB",
      },
      rating: {
        score: 5.0,
        label: "Kepatuhan Tata Kelola",
      },
      sortTimestamp: new Date(initDate).getTime() + 8 * 3600 * 1000,
    });

    // 2. AFCE History (Multi-tier Approval Workflow)
    if (afce && afce.history) {
      afce.history.forEach((h, idx) => {
        const timeParsed = h.timestamp ? new Date(h.timestamp.replace(" ", "T")) : new Date();
        const validTime = !isNaN(timeParsed.getTime())
          ? timeParsed.getTime()
          : new Date().getTime();

        const isApproved = h.action === "Approve";
        const isRejected = h.action === "Reject";
        const isRevised = h.action === "Revise";

        const verb = isApproved
          ? "Disetujui"
          : isRejected
          ? "Ditolak"
          : isRevised
          ? "Perlu Revisi"
          : "Diajukan";

        const nodeColor = isApproved
          ? "bg-emerald-500"
          : isRejected
          ? "bg-rose-500"
          : isRevised
          ? "bg-amber-500"
          : "bg-blue-500";

        items.push({
          id: `evt-afce-${h.id || idx}`,
          dateStr: h.timestamp || h.approvalDate || project.lastUpdated,
          formattedDate: h.timestamp
            ? `${formatIDDate(h.timestamp.split(" ")[0], true).toUpperCase()} • ${h.timestamp.split(" ")[1] || "10:00"} WIB`
            : "OKTOBER 2026",
          actionVerb: verb,
          actionTitle: `Persetujuan AFCE ${afce.afceNumber} (${h.approverRole})`,
          description: `Catatan persetujuan: "${h.note}" • Transisi status: ${h.previousStatus} → ${h.newStatus} • SAP Ref: ${afce.sapDocNumber}`,
          category: "AFCE",
          nodeColor,
          owner: h.approverName || h.approverRole,
          categoryBadge: {
            label: h.approverRole,
            className:
              "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300",
          },
          statusBadge: {
            label: h.newStatus,
            dotColor: isApproved
              ? "bg-emerald-500"
              : isRejected
              ? "bg-rose-500"
              : "bg-amber-500",
          },
          attachment: {
            name: `Lembar_Approval_AFCE_${h.approverRole.replace(/\s+/g, "_")}.pdf`,
            size: "1.2 MB",
          },
          rating: isApproved
            ? {
                score: 4.9,
                label: "SLA Persetujuan Terpenuhi",
              }
            : undefined,
          sortTimestamp: validTime,
        });
      });
    }

    // 3. Purchase Requisitions (PR)
    const projectPrs = prs.filter((p) => p.projectId === projectId);
    projectPrs.forEach((pr, idx) => {
      const prTime = new Date(`${pr.releaseDate}T10:15:00`).getTime();
      items.push({
        id: `evt-pr-${pr.id || idx}`,
        dateStr: pr.releaseDate,
        formattedDate: `${formatIDDate(pr.releaseDate, true).toUpperCase()} • 10:15 WIB`,
        actionVerb: "Rilis Dokumen",
        actionTitle: `Purchase Requisition ${pr.prNumber} (${pr.prType})`,
        description: `${pr.description} • Terkait work item: "${pr.workItemName}" • SAP PR No: ${pr.sapPrNumber}.`,
        category: "PR",
        nodeColor: "bg-blue-500",
        owner: "Bagian Pengadaan HO",
        categoryBadge: {
          label: "PR Release",
          className:
            "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
        },
        statusBadge: {
          label: pr.status === "Released" ? "Dokumen Sah (Rilis)" : pr.status,
          dotColor: "bg-blue-500",
        },
        attachment: {
          name: pr.attachmentName || `SAP_PR_${pr.sapPrNumber}_Release.pdf`,
          size: "860 KB",
        },
        rating: {
          score: 4.8,
          label: "Kesesuaian Spesifikasi Teknis",
        },
        sortTimestamp: !isNaN(prTime) ? prTime : new Date().getTime(),
      });
    });

    // 4. Purchase Orders (PO)
    const projectPos = pos.filter((p) => p.projectId === projectId);
    projectPos.forEach((po, idx) => {
      const poDate = po.releaseDate || po.poDate;
      const poTime = new Date(`${poDate}T14:30:00`).getTime();
      items.push({
        id: `evt-po-${po.id || idx}`,
        dateStr: poDate,
        formattedDate: `${formatIDDate(poDate, true).toUpperCase()} • 14:30 WIB`,
        actionVerb: "Kontrak Terbit",
        actionTitle: `Penerbitan Kontrak PO ${po.poNumber}`,
        description: `Rekanan: ${po.supplierName} • Total Kontrak: ${formatIDR(po.poValue)} • Memuat ${po.items.length} item material pesanan.`,
        category: "PO",
        nodeColor: "bg-indigo-500",
        owner: "Procurement Officer",
        categoryBadge: {
          label: "PO Contract",
          className:
            "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
        },
        statusBadge: {
          label: po.status === "Released" ? "Terkontrak" : po.status,
          dotColor: "bg-indigo-500",
        },
        attachment: {
          name: po.attachmentName || `SAP_PO_${po.poNumber}_Signed.pdf`,
          size: "1.6 MB",
        },
        rating: {
          score: 4.9,
          label: "Evaluasi Kualifikasi Rekanan",
        },
        sortTimestamp: !isNaN(poTime) ? poTime : new Date().getTime(),
      });
    });

    // 5. Goods Receipt (GR)
    const projectPoNumbers = new Set(projectPos.map((p) => p.poNumber));
    const projectGrs = grs.filter((g) => projectPoNumbers.has(g.poNumber));
    projectGrs.forEach((gr, idx) => {
      const grTime = new Date(`${gr.receiptDate}T09:45:00`).getTime();
      items.push({
        id: `evt-gr-${gr.id || idx}`,
        dateStr: gr.receiptDate,
        formattedDate: `${formatIDDate(gr.receiptDate, true).toUpperCase()} • 09:45 WIB`,
        actionVerb: "Penerimaan Material",
        actionTitle: `Goods Receipt ${gr.grNumber}: ${gr.materialName}`,
        description: `Volume diterima: ${gr.receivedVolume} ${gr.unit} • Terkait Kontrak: ${gr.poNumber} • Catatan: "${gr.notes}"`,
        category: "PO",
        nodeColor: "bg-amber-500",
        owner: gr.recordedBy || "Gudang & Logistik Site",
        categoryBadge: {
          label: "Goods Receipt",
          className:
            "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        },
        statusBadge: {
          label: "Diterima Lengkap",
          dotColor: "bg-emerald-500",
        },
        attachment: {
          name: gr.attachmentName || `Surat_Jalan_GR_${gr.grNumber}.pdf`,
          size: "740 KB",
        },
        rating: {
          score: 5.0,
          label: "Kondisi Fisik Baik & Lolos QC",
        },
        sortTimestamp: !isNaN(grTime) ? grTime : new Date().getTime(),
      });
    });

    // 6. Schedule Revisions (Addendum Waktu)
    project.revisions.forEach((rev, idx) => {
      const revTime = new Date(`${rev.revisedAt}T11:00:00`).getTime();
      items.push({
        id: `evt-rev-${rev.id || idx}`,
        dateStr: rev.revisedAt,
        formattedDate: `${formatIDDate(rev.revisedAt, true).toUpperCase()} • 11:00 WIB`,
        actionVerb: "Addendum Waktu",
        actionTitle: `Revisi Baseline Rev #${rev.revisionNumber} (+${rev.extendedWeeks} Minggu)`,
        description: `Alasan kompensasi: "${rev.reason}" • Target baru: ${formatIDDate(rev.newEndDate)} • Status persetujuan: ${rev.approvalStatus}.`,
        category: "Schedule",
        nodeColor: "bg-violet-500",
        owner: `${rev.revisedBy}${rev.approvedBy ? ` (Disetujui: ${rev.approvedBy})` : ""}`,
        categoryBadge: {
          label: "Addendum Baseline",
          className:
            "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
        },
        statusBadge: {
          label: rev.approvalStatus,
          dotColor: "bg-violet-500",
        },
        attachment: {
          name: rev.attachmentName || `Berita_Acara_Addendum_Rev${rev.revisionNumber}.pdf`,
          size: "1.4 MB",
        },
        rating: {
          score: 4.7,
          label: "Mitigasi Risiko Terkendali",
        },
        sortTimestamp: !isNaN(revTime) ? revTime : new Date().getTime(),
      });
    });

    // 7. Daily Progress Records (Inspeksi Fisik Lapangan)
    const projectDaily = dailyProgress.filter((d) => d.projectId === projectId);
    projectDaily.forEach((dp, idx) => {
      const dpTime = new Date(`${dp.date}T16:30:00`).getTime();
      items.push({
        id: `evt-dp-${dp.id || idx}`,
        dateStr: dp.date,
        formattedDate: `${formatIDDate(dp.date, true).toUpperCase()} • 16:30 WIB`,
        actionVerb: "Inspeksi Fisik",
        actionTitle: `Laporan Progres: ${dp.workItemName} (${dp.progressPercent}%)`,
        description: `Uraian kerja: ${dp.activity} • Cuaca: ${dp.weather} • Tenaga kerja: ${dp.manpower} orang • Catatan: "${dp.notes}"`,
        category: "Progress",
        nodeColor: "bg-teal-500",
        owner: "Mandor & Pengawas Lapangan",
        categoryBadge: {
          label: "Fisik Lapangan",
          className:
            "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300",
        },
        statusBadge: {
          label: "Terverifikasi Site",
          dotColor: "bg-teal-500",
        },
        attachment: {
          name: dp.photoName || `Dokumentasi_Fisik_${dp.id}.jpg`,
          size: "2.1 MB",
        },
        rating: {
          score: 5.0,
          label: "Kepatuhan K3 & Mutu Konstruksi",
        },
        sortTimestamp: !isNaN(dpTime) ? dpTime : new Date().getTime(),
      });
    });

    return items;
  }, [project, afce, prs, pos, grs, dailyProgress, projectId]);

  // Filter & Search
  const filteredEvents = useMemo(() => {
    let result = rawEvents.filter((item) => {
      // Category filter
      if (activeCategory !== "ALL") {
        if (activeCategory === "PR_PO") {
          if (item.category !== "PR" && item.category !== "PO") return false;
        } else if (item.category !== activeCategory) {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.actionTitle.toLowerCase().includes(q);
        const matchVerb = item.actionVerb.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchOwner = item.owner.toLowerCase().includes(q);
        const matchAttach = item.attachment?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchVerb && !matchDesc && !matchOwner && !matchAttach) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    result.sort((a, b) => {
      return sortOrder === "desc"
        ? b.sortTimestamp - a.sortTimestamp
        : a.sortTimestamp - b.sortTimestamp;
    });

    return result;
  }, [rawEvents, activeCategory, searchQuery, sortOrder]);

  if (!project) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Proyek tidak ditemukan.
      </div>
    );
  }

  const handleDownload = (fileName: string, fileSize?: string) => {
    toast.success(`Mengunduh berkas ${fileName}`, {
      description: `Ukuran berkas: ${fileSize || "1.2 MB"} • Server SAP DMS`,
      icon: <Download className="w-4 h-4 text-emerald-600" />,
    });
  };

  const handleExportCSV = () => {
    const headers = ["Waktu", "Aksi", "Judul", "Kategori", "Otoritas/Pelaksana", "Status", "Lampiran"];
    const rows = filteredEvents.map((e) => [
      `"${e.dateStr}"`,
      `"${e.actionVerb}"`,
      `"${e.actionTitle.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.owner.replace(/"/g, '""')}"`,
      `"${e.statusBadge.label}"`,
      `"${e.attachment?.name || "-"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Trail_${project.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Audit Trail berhasil diekspor ke CSV", {
      description: `${filteredEvents.length} entri audit tersimpan.`,
    });
  };

  // Metrics
  const totalEvents = rawEvents.length;
  const totalAttachments = rawEvents.filter((e) => !!e.attachment).length;
  const afceApprovalsCount = rawEvents.filter((e) => e.category === "AFCE").length;
  const poCount = rawEvents.filter((e) => e.category === "PO" || e.category === "PR").length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Audit KPI summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 shadow-2xs border bg-card/60 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Total Jejak Audit
              </p>
              <p className="text-base font-bold text-foreground font-mono">
                {totalEvents} <span className="text-[11px] font-normal text-muted-foreground">Entri</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 shadow-2xs border bg-card/60 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Approval AFCE
              </p>
              <p className="text-base font-bold text-foreground font-mono">
                {afceApprovalsCount} <span className="text-[11px] font-normal text-muted-foreground">Persetujuan</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 shadow-2xs border bg-card/60 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                PR / PO & GR
              </p>
              <p className="text-base font-bold text-foreground font-mono">
                {poCount} <span className="text-[11px] font-normal text-muted-foreground">Transaksi</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 shadow-2xs border bg-card/60 backdrop-blur-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Berkas Terlampir
              </p>
              <p className="text-base font-bold text-foreground font-mono">
                {totalAttachments} <span className="text-[11px] font-normal text-muted-foreground">Dokumen</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Card with Timeline-2 layout */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold tracking-tight">
                Jejak Aktivitas & Audit Trail Proyek
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kronologi berurutan seluruh keputusan persetujuan bertingkat, rilis pengadaan SAP, revisi baseline addendum, dan inspeksi mutu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-48 md:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari aktivitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-muted/40"
              />
            </div>

            {/* Sort Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
              title={sortOrder === "desc" ? "Urutan: Terkini ke Terlama" : "Urutan: Terlama ke Terkini"}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {sortOrder === "desc" ? "Terkini" : "Terlama"}
              </span>
            </Button>

            {/* Export CSV Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </Button>
          </div>
        </CardHeader>

        {/* Category Pills Bar */}
        <div className="px-4 py-2.5 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: "ALL", label: "Semua Aktivitas" },
              { id: "AFCE", label: "Approval AFCE" },
              { id: "PR_PO", label: "Pengadaan (PR / PO / GR)" },
              { id: "Schedule", label: "Addendum Waktu" },
              { id: "Progress", label: "Progres Fisik" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-muted-foreground font-mono">
            Menampilkan {filteredEvents.length} dari {totalEvents} jejak
          </span>
        </div>

        {/* Timeline Content formatted like https://reui.io/preview/base/timeline-2 */}
        <CardContent className="p-5 sm:p-7">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Tidak ada jejak audit yang sesuai kriteria filter.
              </p>
              <p className="text-xs text-muted-foreground">
                Coba ubah kata kunci pencarian atau pilih kategori filter "Semua Aktivitas".
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCategory("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto py-2">
              <Timeline orientation="vertical" defaultValue={filteredEvents.length}>
                {filteredEvents.map((evt, idx) => (
                  <TimelineItem key={evt.id} step={idx + 1}>
                    <TimelineHeader>
                      <TimelineSeparator />
                      <TimelineIndicator color={evt.nodeColor} />
                      <TimelineDate>
                        {evt.formattedDate}
                      </TimelineDate>
                    </TimelineHeader>

                    <TimelineContent>
                      <div className="min-w-0 space-y-1.5 pt-0.5">
                        {/* Title with Action Verb & Bold Title */}
                        <p className="leading-snug text-sm">
                          <span className="text-muted-foreground font-normal">
                            {evt.actionVerb}
                          </span>{" "}
                          <span className="font-semibold text-foreground">
                            {evt.actionTitle}
                          </span>
                        </p>

                        {/* Description */}
                        <p className="text-muted-foreground text-xs leading-relaxed font-normal">
                          {evt.description}
                        </p>

                        {/* ReUI-Style File Attachment & Rating Row */}
                        {(evt.attachment || evt.rating) && (
                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            {/* Downloadable Attachment Button Group */}
                            {evt.attachment && (
                              <div
                                role="group"
                                data-slot="button-group"
                                className="inline-flex items-stretch rounded-md border border-input bg-background hover:bg-muted/40 transition-colors shadow-2xs divide-x divide-border"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownload(
                                      evt.attachment!.name,
                                      evt.attachment!.size
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="truncate max-w-[200px] sm:max-w-[280px]">
                                    {evt.attachment.name}
                                  </span>
                                  <span className="text-muted-foreground text-[11px] font-normal">
                                    ({evt.attachment.size})
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownload(
                                      evt.attachment!.name,
                                      evt.attachment!.size
                                    )
                                  }
                                  aria-label={`Download ${evt.attachment.name}`}
                                  className="inline-flex items-center justify-center px-2 py-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
                                  title={`Unduh ${evt.attachment.name}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* ReUI Star Rating */}
                            {evt.rating && (
                              <div
                                data-slot="rating"
                                className="flex items-center gap-1.5 py-0.5"
                              >
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        star <= Math.floor(evt.rating!.score)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted-foreground/30"
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-semibold text-foreground/80 font-mono">
                                  {evt.rating.score.toFixed(1)}
                                </span>
                                {evt.rating.label && (
                                  <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                    • {evt.rating.label}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ReUI Meta Footer Row: Owner, Category Badge, Status Badge with colored dot */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-muted-foreground truncate text-xs font-medium">
                            {evt.owner}
                          </span>

                          <span
                            data-slot="badge"
                            className={cn(
                              "relative inline-flex shrink-0 items-center justify-center w-fit border font-medium whitespace-nowrap text-[11px] px-2 py-0.5 rounded-sm",
                              evt.categoryBadge.className
                            )}
                          >
                            {evt.categoryBadge.label}
                          </span>

                          <span
                            data-slot="badge"
                            className="relative inline-flex shrink-0 items-center justify-center w-fit border border-border bg-background font-medium whitespace-nowrap text-[11px] px-2 py-0.5 rounded-sm gap-1.5 text-foreground"
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full shrink-0",
                                evt.statusBadge.dotColor
                              )}
                              aria-hidden="true"
                            />
                            {evt.statusBadge.label}
                          </span>
                        </div>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
