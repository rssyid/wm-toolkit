"use client";

import React from "react";
import Link from "next/link";
import { Hammer, ArrowRight, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyText } from "@/components/shared/currency-text";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate } from "@/lib/utils";

export function ServicesWidget() {
  const { uspks, spkContracts, projects } = useAppState();

  const activeSpks = spkContracts.filter((s) => s.status === "ACTIVE").slice(0, 4);
  const pendingUspks = uspks.filter((u) => u.status === "SUBMITTED" || u.status === "DRAFT").slice(0, 4);

  const totalServicesValue = spkContracts.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card className="flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Hammer className="w-4 h-4 text-emerald-600" />
          <CardTitle className="text-sm font-semibold">Jalur Jasa & Kontrak SPK</CardTitle>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
          {spkContracts.length} SPK &bull; {uspks.length} USPK
        </span>
      </CardHeader>

      <CardContent className="p-3 divide-y divide-border/60 flex-1">
        {spkContracts.length === 0 && uspks.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Belum ada data usulan USPK atau kontrak SPK tercatat.
          </p>
        ) : (
          <>
            {activeSpks.map((spk) => {
              const project = projects.find((p) => p.id === spk.projectId);
              return (
                <div key={spk.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-bold text-foreground">
                        {spk.spkNumber}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10">
                        SPK Aktif
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {spk.vendorName}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <CurrencyText value={spk.value} className="font-medium text-foreground" />
                      <span>&bull;</span>
                      <span className="truncate">{project?.name || "Proyek Lapangan"}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Masa Berlaku: {formatIDDate(spk.startDate)} s/d {formatIDDate(spk.endDate)}
                    </span>
                  </div>

                  <Link href={`/workspace/${spk.projectId}/services`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2.5">
                      SPK
                    </Button>
                  </Link>
                </div>
              );
            })}

            {pendingUspks.slice(0, 2).map((uspk) => (
              <div key={uspk.id} className="py-2.5 flex items-center justify-between gap-2 bg-amber-50/30 dark:bg-amber-950/20 px-2 rounded-md">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      {uspk.uspkNumber}
                    </span>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-amber-500/30 text-amber-700 dark:text-amber-400">
                      Evaluasi Teknis
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground truncate mt-0.5">
                    Usulan: {uspk.vendorName}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Scope: {uspk.scope}
                  </p>
                </div>

                <Link href={`/workspace/${uspk.projectId}/services`}>
                  <Button size="sm" className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white">
                    Review
                  </Button>
                </Link>
              </div>
            ))}
          </>
        )}
      </CardContent>

      <div className="p-3 pt-0 border-t mt-auto flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-mono">
          Komitmen: {totalServicesValue > 0 ? <CurrencyText value={totalServicesValue} className="font-semibold text-foreground" /> : "Rp 0"}
        </span>
        <Link href="/workspace" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium pt-2">
          Buka rincian jasa & SPK <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
}
