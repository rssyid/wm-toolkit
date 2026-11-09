"use client";

import React from "react";
import { Filter, RotateCcw, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstateLocation } from "@/types";

export interface DashboardFilterState {
  locationName: string;
  focusFilter: "all" | "critical" | "in_progress" | "pending_afce";
}

interface DashboardFilterBarProps {
  filters: DashboardFilterState;
  onFilterChange: (filters: DashboardFilterState) => void;
  locations: EstateLocation[];
  filteredCount: number;
  totalCount: number;
}

export function DashboardFilterBar({
  filters,
  onFilterChange,
  locations,
  filteredCount,
  totalCount,
}: DashboardFilterBarProps) {
  const isFiltered =
    filters.locationName !== "all" || filters.focusFilter !== "all";

  const handleReset = () => {
    onFilterChange({
      locationName: "all",
      focusFilter: "all",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border shadow-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
          <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Filter Tampilan:</span>
        </div>

        {/* Filter Lokasi Kebun */}
        <div className="w-[180px]">
          <Select
            value={filters.locationName}
            onValueChange={(val) =>
              onFilterChange({ ...filters, locationName: val })
            }
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Semua Kebun" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Semua Kebun / Lokasi
              </SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.name} className="text-xs">
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Fokus Status */}
        <div className="w-[190px]">
          <Select
            value={filters.focusFilter}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                focusFilter: val as DashboardFilterState["focusFilter"],
              })
            }
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <div className="flex items-center gap-1.5 truncate">
                <Activity className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Semua Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Semua Status Proyek
              </SelectItem>
              <SelectItem value="critical" className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Peringatan EWS / Kritis (&gt;7 Hari)
              </SelectItem>
              <SelectItem value="in_progress" className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Sedang Berjalan (In Progress)
              </SelectItem>
              <SelectItem value="pending_afce" className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Menunggu Approval AFCE
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-2 self-end sm:self-center">
        <span>
          Menampilkan <strong className="text-foreground font-mono">{filteredCount}</strong> dari{" "}
          <span className="font-mono">{totalCount}</span> proyek
        </span>
        {isFiltered && (
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        )}
      </div>
    </div>
  );
}
