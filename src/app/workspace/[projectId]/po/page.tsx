"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  ShoppingCart,
  PackageCheck,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  FileCheck,
  BadgeCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyText } from "@/components/shared/currency-text";
import { AttachmentPreview } from "@/components/shared/attachment-preview";
import { POCreateDialog } from "@/components/procurement/po-create-dialog";
import { GRReceiptDialog } from "@/components/procurement/gr-receipt-dialog";
import { GoodsHandoverDialog } from "@/components/procurement/goods-handover-dialog";
import { useAppState } from "@/context/app-state-context";
import { formatIDDate, formatIDR, cn } from "@/lib/utils";
import { PurchaseOrder } from "@/types";

export default function POAndMaterialsTab() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const { projects, pos, grs, goodsHandovers, isViewerOnly } = useAppState();

  const project = projects.find((p) => p.id === projectId);
  const projectPos = pos.filter((p) => p.projectId === projectId);
  const projectGrs = grs.filter((g) =>
    projectPos.some((po) => po.id === g.poId)
  );
  const projectHandovers = goodsHandovers.filter(
    (gh) => projectPos.some((po) => po.id === gh.poId) || gh.projectId === projectId
  );

  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [grDialogOpen, setGrDialogOpen] = useState(false);
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [selectedPoForGr, setSelectedPoForGr] = useState<PurchaseOrder | null>(null);
  const [selectedPoForHandover, setSelectedPoForHandover] = useState<PurchaseOrder | null>(null);
  const [expandedPoIds, setExpandedPoIds] = useState<Record<string, boolean>>({
    [projectPos[0]?.id || ""]: true,
  });

  if (!project) return null;

  const toggleExpand = (id: string) => {
    setExpandedPoIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenGrModal = (po: PurchaseOrder) => {
    setSelectedPoForGr(po);
    setGrDialogOpen(true);
  };

  const handleOpenHandoverModal = (po: PurchaseOrder) => {
    setSelectedPoForHandover(po);
    setHandoverDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-sm font-semibold">
                Purchase Order (PO) & Manajemen Penerimaan Material (GR & BAST)
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pemantauan pengadaan kontrak rekanan supplier, item material, pencatatan Goods Receipt (GR), dan Berita Acara Serah Terima (BAST).
            </p>
          </div>

          {!isViewerOnly && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setPoDialogOpen(true)}
                className="gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> + Terbitkan PO Baru
              </Button>
            </div>
          )}
        </CardHeader>

        {/* PO List with Expandable Material Line Items */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[120px]">Nomor PO</TableHead>
                <TableHead className="w-[110px]">Terkait PR</TableHead>
                <TableHead className="min-w-[170px]">Supplier / Rekanan</TableHead>
                <TableHead>Tanggal Terbit</TableHead>
                <TableHead className="text-right">Nilai PO (Rp)</TableHead>
                <TableHead>Status PO</TableHead>
                <TableHead className="w-[140px]">Realisasi GR</TableHead>
                <TableHead>Status BAST</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectPos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                    Belum ada Purchase Order (PO) yang diterbitkan untuk proyek ini.
                    Klik tombol "+ Terbitkan PO Baru" di atas untuk menambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                projectPos.map((po) => {
                  const isExpanded = !!expandedPoIds[po.id];
                  const poHandover = projectHandovers.find((h) => h.poId === po.id);

                  return (
                    <React.Fragment key={po.id}>
                      {/* PO Parent Row */}
                      <TableRow className="hover:bg-muted/40 font-medium">
                        <TableCell className="p-2 text-center">
                          <button
                            onClick={() => toggleExpand(po.id)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-xs text-foreground">
                          {po.poNumber}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {po.relatedPrNumber}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {po.supplierName}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className="font-semibold text-foreground block">
                            {formatIDDate(po.releaseDate)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Terbit: {formatIDDate(po.poDate)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-right text-foreground">
                          {formatIDR(po.poValue)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={po.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-emerald-600">
                                {po.receiptProgressPercent}%
                              </span>
                              <span className="text-muted-foreground text-[10px]">
                                {po.items.length} Material
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full bg-emerald-600"
                                style={{ width: `${po.receiptProgressPercent}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {poHandover ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] gap-1 font-semibold",
                                poHandover.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                              )}
                            >
                              <BadgeCheck className="w-3 h-3 text-emerald-600" />
                              {poHandover.status === "COMPLETED" ? "BAST Selesai" : "BAST Pending"}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              Belum BAST
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isViewerOnly ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenGrModal(po)}
                                  className="h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
                                  title="Catat penerimaan volume fisik (Goods Receipt)"
                                >
                                  <PackageCheck className="w-3.5 h-3.5" /> + GR
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenHandoverModal(po)}
                                  className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                                  title="Catat Berita Acara Serah Terima (BAST) formal"
                                >
                                  <FileCheck className="w-3.5 h-3.5" /> BAST
                                </Button>
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Pantau</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Material Line Items Sub-table */}
                      {isExpanded && (
                        <TableRow className="bg-muted/15 border-b-2">
                          <TableCell colSpan={10} className="p-3 pl-12 pr-6">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                                <span>
                                  Katalog Item Material dalam PO {po.poNumber} ({po.items.length} Item):
                                </span>
                                <AttachmentPreview
                                  filename={po.attachmentName || `SAP_PO_${po.poNumber}.pdf`}
                                  fileId="1d7o2uaicE5rZvaarhze4BhRmWXw4oPhJ"
                                  fileUrl="https://drive.google.com/file/d/1d7o2uaicE5rZvaarhze4BhRmWXw4oPhJ/view?usp=sharing"
                                  mimeType="application/pdf"
                                  title={`Kontrak PO SAP No. ${po.poNumber}`}
                                  description={`Rekanan: ${po.supplierName} • Nilai: ${formatIDR(po.poValue)}`}
                                  docNumber={po.poNumber}
                                />
                              </div>

                              <div className="rounded border bg-card overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50 text-[11px]">
                                      <TableHead className="h-8">Kode SAP</TableHead>
                                      <TableHead className="h-8">Deskripsi Material</TableHead>
                                      <TableHead className="h-8 text-right">Dipesan</TableHead>
                                      <TableHead className="h-8">Satuan</TableHead>
                                      <TableHead className="h-8 text-right">Harga Satuan</TableHead>
                                      <TableHead className="h-8 text-right">Total Nilai</TableHead>
                                      <TableHead className="h-8 text-right">Diterima (GR)</TableHead>
                                      <TableHead className="h-8 text-right">Sisa Pesanan</TableHead>
                                      <TableHead className="h-8">Status Item</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {po.items.map((it) => (
                                      <TableRow key={it.id} className="text-xs">
                                        <TableCell className="font-mono text-[11px] text-muted-foreground">
                                          {it.sapMaterialCode}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground">
                                          {it.materialName}
                                        </TableCell>
                                        <TableCell className="font-mono text-right">
                                          {it.volume.toLocaleString("id-ID")}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                          {it.unit}
                                        </TableCell>
                                        <TableCell className="font-mono text-right">
                                          {formatIDR(it.unitPrice)}
                                        </TableCell>
                                        <TableCell className="font-mono font-medium text-right">
                                          {formatIDR(it.totalPrice)}
                                        </TableCell>
                                        <TableCell className="font-mono font-bold text-right text-emerald-600">
                                          {it.receivedVolume.toLocaleString("id-ID")}
                                        </TableCell>
                                        <TableCell
                                          className={cn(
                                            "font-mono font-bold text-right",
                                            it.remainingVolume > 0
                                              ? "text-amber-600"
                                              : "text-muted-foreground"
                                          )}
                                        >
                                          {it.remainingVolume.toLocaleString("id-ID")}
                                        </TableCell>
                                        <TableCell>
                                          <StatusBadge status={it.status} />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Goods Receipt (GR) Transaction History Table */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-semibold">
              Riwayat Transaksi Penerimaan Gudang (Goods Receipt History)
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {projectGrs.length} Bukti Penerimaan Fisik
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Nomor GR</TableHead>
                <TableHead className="w-[120px]">Nomor PO</TableHead>
                <TableHead>Tanggal Terima</TableHead>
                <TableHead>Material Diterima</TableHead>
                <TableHead className="text-right">Kuantitas Masuk</TableHead>
                <TableHead className="min-w-[200px]">Catatan Kondisi Lapangan</TableHead>
                <TableHead>Penerima</TableHead>
                <TableHead className="text-right">Bukti Surat Jalan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectGrs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-xs text-muted-foreground">
                    Belum ada pencatatan Goods Receipt (GR) untuk pesanan proyek ini.
                  </TableCell>
                </TableRow>
              ) : (
                projectGrs.map((gr) => (
                  <TableRow key={gr.id} className="text-xs">
                    <TableCell className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {gr.grNumber}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {gr.poNumber}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {formatIDDate(gr.receiptDate)}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {gr.materialName}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-right text-emerald-600">
                      +{gr.receivedVolume} {gr.unit}
                    </TableCell>
                    <TableCell className="italic text-muted-foreground">
                      "{gr.notes}"
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                      {gr.recordedBy}
                    </TableCell>
                    <TableCell className="text-right">
                      <AttachmentPreview
                        filename={gr.attachmentName || `SuratJalan_${gr.grNumber}.pdf`}
                        fileId="1d7o2uaicE5rZvaarhze4BhRmWXw4oPhJ"
                        fileUrl="https://drive.google.com/file/d/1d7o2uaicE5rZvaarhze4BhRmWXw4oPhJ/view?usp=sharing"
                        mimeType="application/pdf"
                        title={`Surat Jalan / BAST Material GR No. ${gr.grNumber}`}
                        description={gr.notes}
                        docNumber={gr.grNumber}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Formal Goods Handover (BAST) Section */}
      <Card className="shadow-xs">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <div>
              <CardTitle className="text-sm font-semibold">
                Berita Acara Serah Terima Barang (BAST Formal)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dokumen resmi serah terima barang antara vendor rekanan penyedia dan tim penerima kebun sawit.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {projectHandovers.length} Dokumen BAST
            </span>
            {!isViewerOnly && projectPos.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenHandoverModal(projectPos[0])}
                className="h-7 text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
              >
                <Plus className="w-3.5 h-3.5" /> + Catat BAST Formal
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Nomor BAST</TableHead>
                <TableHead className="w-[120px]">Nomor PO</TableHead>
                <TableHead className="min-w-[160px]">Rekanan Penyedia</TableHead>
                <TableHead>Tanggal BAST</TableHead>
                <TableHead>Pihak Penyerah (Vendor)</TableHead>
                <TableHead>Pihak Penerima (Kebun)</TableHead>
                <TableHead>Status Kesepakatan</TableHead>
                <TableHead className="min-w-[200px]">Catatan Uji & Kondisi Fisik</TableHead>
                <TableHead className="text-right">Dokumen BAST</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectHandovers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-xs text-muted-foreground">
                    Belum ada Berita Acara Serah Terima (BAST Formal) yang dicatat untuk PO proyek ini.
                    Klik tombol "BAST" pada baris PO di atas untuk mencatat serah terima resmi.
                  </TableCell>
                </TableRow>
              ) : (
                projectHandovers.map((gh) => (
                  <TableRow key={gh.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {gh.handoverNumber}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {gh.poNumber}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {gh.supplierName}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {formatIDDate(gh.handoverDate)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground block">{gh.giverName}</span>
                      <span className="text-[10px] text-muted-foreground">{gh.giverCompany || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-foreground block">{gh.receiverName}</span>
                      <span className="text-[10px] text-muted-foreground">{gh.receiverJabatan || "-"}</span>
                    </TableCell>
                    <TableCell>
                      {gh.status === "COMPLETED" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 border-none font-semibold text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 border-none font-semibold text-[10px] gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> PENDING
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="italic text-muted-foreground text-[11px]">
                      "{gh.notes}"
                    </TableCell>
                    <TableCell className="text-right">
                      <AttachmentPreview
                        filename={gh.attachmentName || `BAST_${gh.handoverNumber}_Signed.pdf`}
                        fileId="1d7o2uaicE5rZvaarhze4BhRmWXw4oPhJ"
                        fileUrl="https://drive.google.com/file/d/1d7o2uaicE5rZvaarhze4BhRmWXw4oPhJ/view?usp=sharing"
                        mimeType="application/pdf"
                        title={`Berita Acara Serah Terima No. ${gh.handoverNumber}`}
                        description={`PO: ${gh.poNumber} • Rekanan: ${gh.supplierName}`}
                        docNumber={gh.handoverNumber}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <POCreateDialog
        open={poDialogOpen}
        onOpenChange={setPoDialogOpen}
        project={project}
      />

      {selectedPoForGr && (
        <GRReceiptDialog
          open={grDialogOpen}
          onOpenChange={setGrDialogOpen}
          po={selectedPoForGr}
        />
      )}

      {selectedPoForHandover && (
        <GoodsHandoverDialog
          open={handoverDialogOpen}
          onOpenChange={setHandoverDialogOpen}
          project={project}
          po={selectedPoForHandover}
        />
      )}
    </div>
  );
}
