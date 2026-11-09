"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarClock,
  Clock,
  History,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ScheduleRevisionDialog } from "@/components/workspace/schedule-revision-dialog";
import { ScheduleGanttMatrix } from "@/components/workspace/schedule-gantt-matrix";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, calculateDaysBetween, cn } from "@/lib/utils";
import { ScheduleGanttGroup } from "@/types";

export default function ScheduleTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, updateProject } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);

  if (!project) return null;

  const baselineDays = calculateDaysBetween(project.baselineStartDate, project.baselineEndDate);
  const targetDays = calculateDaysBetween(project.baselineStartDate, project.targetEndDate);

  const handleUpdateSchedule = (updatedGroups: ScheduleGanttGroup[]) => {
    updateProject(projectId, {
      scheduleMatrix: updatedGroups,
    });
  };

  return (
    <div className="space-y-5">
      {/* Schedule Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Baseline Card */}
        <Card className="p-4 shadow-xs border-slate-300 dark:border-slate-800">
          <span className="text-xs text-muted-foreground font-medium block">
            Jadwal Baseline (Awal)
          </span>
          <div className="mt-1 font-mono text-sm font-bold text-foreground">
            {formatIDDate(project.baselineStartDate)} &rarr; {formatIDDate(project.baselineEndDate)}
          </div>
          <span className="text-[11px] text-muted-foreground block mt-1">
            Total Durasi Baseline: {baselineDays} Hari
          </span>
        </Card>

        {/* Current Target Card */}
        <Card className="p-4 shadow-xs border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
            Target Penyelesaian Saat Ini
          </span>
          <div className="mt-1 font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {formatIDDate(project.targetEndDate)}
          </div>
          <span className="text-[11px] text-muted-foreground block mt-1">
            Total Waktu Berjalan: {targetDays} Hari
          </span>
        </Card>

        {/* Variance / Revisions Card */}
        <Card className="p-4 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-medium block">
              Deviasi & Riwayat Addendum
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={cn(
                  "font-mono text-sm font-bold",
                  project.scheduleVarianceDays > 0 ? "text-rose-600" : "text-emerald-600"
                )}
              >
                {project.scheduleVarianceDays > 0
                  ? `+${project.scheduleVarianceDays} Hari Deviasi`
                  : "On-Schedule"}
              </span>
              <span className="text-xs text-muted-foreground">
                ({(project.revisions || []).length}x Revisi)
              </span>
            </div>
          </div>
          <div className="pt-2 mt-auto">
            <Button
              size="sm"
              onClick={() => setRevisionDialogOpen(true)}
              className="w-full text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <CalendarClock className="w-3.5 h-3.5 mr-1" /> Revise Schedule
            </Button>
          </div>
        </Card>
      </div>

      {/* Prominent Schedule Gantt Timeline Matrix (Matching Corporate Format) */}
      <ScheduleGanttMatrix
        project={project}
        onUpdateSchedule={handleUpdateSchedule}
      />

      {/* Schedule Revision History Table */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-semibold">
              Riwayat Perubahan Jadwal (Addendum Log)
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            {(project.revisions || []).length} Catatan Riwayat
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Revisi #</TableHead>
                <TableHead>Target Sebelumnya</TableHead>
                <TableHead>Target Baru</TableHead>
                <TableHead>Perpanjangan</TableHead>
                <TableHead className="min-w-[180px]">Alasan Perubahan</TableHead>
                <TableHead>Penyetuju & Pengusul</TableHead>
                <TableHead>Tanggal Approval Addendum</TableHead>
                <TableHead className="text-right">Lampiran BA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(project.revisions || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                    Belum pernah dilakukan revisi jadwal. Proyek masih berjalan sesuai baseline awal.
                  </TableCell>
                </TableRow>
              ) : (
                (project.revisions || []).map((rev) => (
                  <TableRow key={rev.id}>
                    <TableCell className="font-mono font-bold text-xs">
                      Rev #{rev.revisionNumber}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatIDDate(rev.previousEndDate)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-600">
                      {formatIDDate(rev.newEndDate)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-amber-600">
                      +{rev.extendedWeeks} Minggu
                    </TableCell>
                    <TableCell className="text-xs">{rev.reason}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground block">
                        {rev.approvedBy || "Ir. Ahmad Dahlan (Manager Area)"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Diajukan: {rev.revisedBy}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className="font-bold text-foreground block">
                        {formatIDDate(rev.approvalDate || rev.revisedAt)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Disetujui ({rev.approvalStatus})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <AttachmentPreview
                        filename={rev.attachmentName || `BA_Revisi_Rev${rev.revisionNumber}.pdf`}
                        title={`Berita Acara Revisi Jadwal Rev #${rev.revisionNumber}`}
                        description={rev.reason}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ScheduleRevisionDialog
        open={revisionDialogOpen}
        onOpenChange={setRevisionDialogOpen}
        project={project}
      />
    </div>
  );
}
