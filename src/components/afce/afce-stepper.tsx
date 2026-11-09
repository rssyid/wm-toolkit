"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileText,
  UserCheck,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AFCEDocument, AFCEApprovalLevelItem } from "@/types";
import { formatIDDate } from "@/lib/utils";

interface AFCEStepperProps {
  afce: AFCEDocument;
  onOpenActionDialog?: (level: AFCEApprovalLevelItem, action: "Approve" | "Revise" | "Reject") => void;
}

export function AFCEStepper({ afce, onOpenActionDialog }: AFCEStepperProps) {
  const levels = afce.approvalMatrixLevels || [];

  if (levels.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-xs overflow-hidden border">
      <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <CardTitle className="text-sm font-semibold">
            Alur Persetujuan Berjenjang SAP (Approval Stepper)
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Tingkat Saat Ini:
          </span>
          <Badge variant="outline" className="text-xs font-mono font-bold bg-background">
            Level {afce.status === "Approved" ? levels.length : afce.currentLevel} dari {levels.length} ({afce.currentApproverRole})
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="relative">
          {/* Stepper Pipeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            {levels.map((item, index) => {
              const isApproved = item.status === "Approved";
              const isPending = item.status === "Pending";
              const isWaiting = item.status === "Waiting";
              const isNeedRevision = item.status === "Need Revision";
              const isRejected = item.status === "Rejected";

              return (
                <div
                  key={item.id || `level-${index}`}
                  className={`relative rounded-xl border p-3.5 transition-all flex flex-col justify-between ${
                    isApproved
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                      : isPending
                      ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/20"
                      : isNeedRevision
                      ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800"
                      : isRejected
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800"
                      : "bg-muted/30 border-muted-foreground/15 opacity-75"
                  }`}
                >
                  <div>
                    {/* Top Step Header */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                            isApproved
                              ? "bg-emerald-600 text-white"
                              : isPending
                              ? "bg-amber-500 text-white animate-pulse"
                              : isNeedRevision
                              ? "bg-orange-600 text-white"
                              : isRejected
                              ? "bg-rose-600 text-white"
                              : "bg-muted text-muted-foreground border"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Level {item.level}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-600" /> Menunggu Otorisasi
                        </span>
                      )}
                      {isWaiting && (
                        <span className="inline-flex items-center text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          Menunggu Giliran
                        </span>
                      )}
                      {isNeedRevision && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/60 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-orange-600" /> Perlu Revisi
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
                        </span>
                      )}
                    </div>

                    {/* Role Title */}
                    <h4 className="text-xs font-bold text-foreground line-clamp-1 mb-1">
                      {item.label}
                    </h4>

                    {/* Approver Details */}
                    {isApproved && item.approverName && (
                      <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                        <div className="flex items-center gap-1 text-foreground font-medium">
                          <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.approverName}</span>
                        </div>
                        {item.decidedAt && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>{formatIDDate(item.decidedAt)}</span>
                          </div>
                        )}
                        {item.sapDocNumber && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate">{item.sapDocNumber}</span>
                          </div>
                        )}
                        {item.note && (
                          <p className="text-[10px] italic text-muted-foreground line-clamp-2 pt-0.5">
                            "{item.note}"
                          </p>
                        )}
                      </div>
                    )}

                    {isPending && (
                      <div className="text-[11px] text-muted-foreground pt-1 border-t border-amber-200 dark:border-amber-800 space-y-1">
                        <p className="font-medium text-amber-900 dark:text-amber-200">
                          {item.approverJabatan || item.label}
                        </p>
                        <p className="text-[10px]">
                          Menunggu input hasil evaluasi SAP kebun/holding.
                        </p>
                      </div>
                    )}

                    {isWaiting && (
                      <div className="text-[10px] text-muted-foreground pt-1 border-t border-muted">
                        <p>{item.approverJabatan || item.label}</p>
                        <p className="italic">Akan aktif setelah level sebelumnya disetujui.</p>
                      </div>
                    )}
                  </div>

                  {/* Interactive Action Button on Pending Step */}
                  {isPending && onOpenActionDialog && (
                    <div className="pt-3 mt-2">
                      <Button
                        size="sm"
                        onClick={() => onOpenActionDialog(item, "Approve")}
                        className="w-full text-xs h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Catat Otorisasi
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
