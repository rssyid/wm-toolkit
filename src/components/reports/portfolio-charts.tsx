"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { formatIDR } from "@/lib/utils";
import {
  formatCompactIDR,
  type LocationBreakdownRow,
  type PortfolioSummary,
} from "@/lib/report-portfolio-utils";

interface PortfolioChartsProps {
  locationBreakdown: LocationBreakdownRow[];
  summary: PortfolioSummary;
}

export function PortfolioCharts({
  locationBreakdown,
  summary,
}: PortfolioChartsProps) {
  const topLocations = locationBreakdown.slice(0, 8).map((loc) => ({
    name:
      loc.locationName.length > 18
        ? `${loc.locationName.slice(0, 16)}...`
        : loc.locationName,
    fullName: loc.locationName,
    AFCE: loc.afceValue,
    PO: loc.poValue,
    SPK: loc.spkValue,
    projects: loc.projectCount,
  }));

  const statusData = [
    { name: "Berjalan", jumlah: summary.inProgressCount, color: "#2563eb" },
    { name: "Selesai", jumlah: summary.completedCount, color: "#15803d" },
    { name: "Direncanakan", jumlah: summary.plannedCount, color: "#475569" },
    { name: "Ditunda", jumlah: summary.onHoldCount, color: "#d97706" },
    { name: "EWS / Terlambat", jumlah: summary.delayedCount, color: "#be123c" },
  ];

  return (
    <section
      aria-label="Visualisasi analitik portofolio"
      className="grid grid-cols-1 gap-4 lg:grid-cols-12 print-avoid-break"
    >
      {/* Grafik 1: Perbandingan AFCE vs PO & SPK per Kebun */}
      <div className="lg:col-span-7 rounded-lg border bg-card p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Perbandingan Nilai AFCE terhadap Komitmen PO &amp; SPK per Kebun
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Menampilkan hingga 8 kebun dengan nilai plafon AFCE terbesar pada cakupan filter aktif.
          </p>
        </div>

        {topLocations.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Tidak ada data kebun untuk ditampilkan pada grafik.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topLocations}
                margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  interval={0}
                  angle={topLocations.length > 4 ? -15 : 0}
                  textAnchor={topLocations.length > 4 ? "end" : "middle"}
                  height={topLocations.length > 4 ? 46 : 30}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactIDR(Number(v))}
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  width={74}
                />
                <Tooltip
                  formatter={(value) => formatIDR(Number(value || 0))}
                  labelFormatter={(_, payload) => {
                    const item = payload?.[0]?.payload as
                      | { fullName?: string; projects?: number }
                      | undefined;
                    if (!item?.fullName) return "";
                    return `${item.fullName} (${item.projects ?? 0} proyek)`;
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                <Bar dataKey="AFCE" name="Plafon AFCE" fill="#0f766e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="PO" name="Komitmen PO (Barang)" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="SPK" name="Komitmen SPK (Jasa)" fill="#d97706" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Grafik 2: Distribusi Status Proyek & EWS */}
      <div className="lg:col-span-5 rounded-lg border bg-card p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Distribusi Status Proyek &amp; Peringatan Jadwal (EWS)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Jumlah proyek berdasarkan fase eksekusi saat ini dan kondisi keterlambatan jadwal.
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statusData}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-border"
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
              />
              <Tooltip
                formatter={(value) => [`${value} proyek`, "Jumlah"]}
                contentStyle={{
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="jumlah" name="Jumlah Proyek" radius={[0, 4, 4, 0]} barSize={24}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
