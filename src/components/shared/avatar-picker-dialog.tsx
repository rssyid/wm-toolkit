/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Shuffle,
  Check,
  Palette,
  Layers,
  Smile,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type DiceBearStyle = "micah" | "open-peeps" | "big-smile" | "big-ears";

export interface DiceBearStyleOption {
  id: DiceBearStyle;
  label: string;
  creator: string;
  description: string;
}

export const DICEBEAR_STYLES: DiceBearStyleOption[] = [
  {
    id: "micah",
    label: "Micah",
    creator: "Micah Lanier",
    description: "Karakter minimalis modern dengan aksen warna estetis",
  },
  {
    id: "open-peeps",
    label: "Open Peeps",
    creator: "Pablo Stanley",
    description: "Karakter ilustrasi tangan dengan ekspresi khas",
  },
  {
    id: "big-smile",
    label: "Big Smile",
    creator: "Ashley Seo",
    description: "Karakter kartun ramah dengan senyuman ceria",
  },
  {
    id: "big-ears",
    label: "Big Ears",
    creator: "The Visual Team",
    description: "Karakter kartun jenaka dengan telinga ekspresif",
  },
];

export const PRESET_SEEDS = [
  "Budi",
  "Siti",
  "Agus",
  "Dewi",
  "Rian",
  "Maya",
  "Eko",
  "Putri",
  "Doni",
  "Lina",
  "Fajar",
  "Rani",
];

export const RANDOM_SEEDS_POOL = [
  "Bambang",
  "Kartika",
  "Surya",
  "Indra",
  "Widodo",
  "Teguh",
  "Hendra",
  "Novi",
  "Bayu",
  "Alya",
  "Reza",
  "Farah",
  "Dimas",
  "Anisa",
  "Aditya",
  "Wulan",
  "Ilham",
  "Rizky",
  "Nadia",
  "Saputra",
];

export const BG_COLORS = [
  { id: "", label: "Transparan", hex: "transparent", colorClass: "bg-background border-dashed border-border" },
  { id: "dcfce7", label: "Mint", hex: "#dcfce7", colorClass: "bg-[#dcfce7] border-emerald-300" },
  { id: "b6e3f4", label: "Biru", hex: "#b6e3f4", colorClass: "bg-[#b6e3f4] border-sky-300" },
  { id: "c0aede", label: "Lavender", hex: "#c0aede", colorClass: "bg-[#c0aede] border-purple-300" },
  { id: "ffdfbf", label: "Peach", hex: "#ffdfbf", colorClass: "bg-[#ffdfbf] border-orange-300" },
  { id: "ffd5dc", label: "Mawar", hex: "#ffd5dc", colorClass: "bg-[#ffd5dc] border-rose-300" },
];

export function buildDiceBearUrl(style: DiceBearStyle, seed: string, bgColor?: string): string {
  const cleanSeed = encodeURIComponent((seed || "User").trim());
  const base = `https://api.dicebear.com/9.x/${style}/svg?seed=${cleanSeed}`;
  if (bgColor && bgColor.trim()) {
    return `${base}&backgroundColor=${bgColor.trim()}`;
  }
  return base;
}

export function parseDiceBearUrl(url?: string): {
  style: DiceBearStyle;
  seed: string;
  bgColor: string;
} | null {
  if (!url || !url.includes("api.dicebear.com")) return null;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const candidate = parts[1] as DiceBearStyle;
    const validStyles: DiceBearStyle[] = ["micah", "open-peeps", "big-smile", "big-ears"];
    if (!validStyles.includes(candidate)) return null;
    const seed = parsed.searchParams.get("seed") || "User";
    const bgColor = parsed.searchParams.get("backgroundColor") || "";
    return {
      style: candidate,
      seed,
      bgColor,
    };
  } catch {
    return null;
  }
}

interface AvatarPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  onSelectAvatar: (avatarUrl: string) => void;
  userFullName?: string;
}

export function AvatarPickerDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  onSelectAvatar,
  userFullName,
}: AvatarPickerDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<DiceBearStyle>("micah");
  const [seed, setSeed] = useState<string>("Budi");
  const [bgColor, setBgColor] = useState<string>("");

  // Initialize or restore state when dialog opens
  useEffect(() => {
    if (open) {
      const parsed = parseDiceBearUrl(currentAvatarUrl);
      if (parsed) {
        setSelectedStyle(parsed.style);
        setSeed(parsed.seed);
        setBgColor(parsed.bgColor);
      } else if (userFullName && userFullName.trim()) {
        const first = userFullName.trim().split(" ")[0];
        setSeed(first || "Budi");
      }
    }
  }, [open, currentAvatarUrl, userFullName]);

  const activeUrl = buildDiceBearUrl(selectedStyle, seed, bgColor);

  const handleRandomize = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_SEEDS_POOL.length);
    const randomSuffix = Math.floor(Math.random() * 90 + 10);
    setSeed(`${RANDOM_SEEDS_POOL[randomIndex]}${randomSuffix}`);
  };

  const handleApply = () => {
    onSelectAvatar(activeUrl);
    onOpenChange(false);
  };

  const activeStyleInfo = DICEBEAR_STYLES.find((s) => s.id === selectedStyle) || DICEBEAR_STYLES[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden sm:rounded-xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Pilih Karakter Avatar DiceBear
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pilih salah satu dari 4 gaya ilustrasi resmi, tentukan karakter, atau sesuaikan kata kunci sesuai preferensi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Style Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Gaya Ilustrasi (Style)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Karya: {activeStyleInfo.creator}
              </span>
            </div>

            <Tabs
              value={selectedStyle}
              onValueChange={(val) => setSelectedStyle(val as DiceBearStyle)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/60 gap-1">
                {DICEBEAR_STYLES.map((style) => (
                  <TabsTrigger
                    key={style.id}
                    value={style.id}
                    className="text-xs py-2 px-2.5 flex flex-col gap-0.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    <span className="font-semibold">{style.label}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">
                      {style.id}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <p className="text-[11px] text-muted-foreground mt-1.5 italic">
              {activeStyleInfo.description}
            </p>
          </div>

          {/* Active Preview & Controls Card */}
          <div className="p-4 rounded-xl border bg-muted/30 flex flex-col sm:flex-row items-center gap-4">
            {/* Enlarged Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl border-2 border-emerald-500/40 bg-background shadow-xs overflow-hidden flex items-center justify-center p-1.5">
                <img
                  src={activeUrl}
                  alt={seed}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <Badge
                variant="outline"
                className="absolute -bottom-2 -right-2 bg-emerald-600 text-white border-0 text-[9px] px-1.5 py-0 shadow-xs"
              >
                Aktif
              </Badge>
            </div>

            {/* Seed Controls */}
            <div className="flex-1 w-full space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-emerald-600" />
                    Kata Kunci Karakter (Seed)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                    onClick={handleRandomize}
                  >
                    <Shuffle className="w-3 h-3" />
                    Acak Karakter
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    placeholder="Masukkan nama atau kata kunci..."
                    className="h-8 text-xs font-mono"
                    maxLength={35}
                  />
                  {seed && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => setSeed("")}
                      title="Hapus teks"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Background Color Swatches */}
              <div>
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1.5">
                  <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                  Warna Latar Belakang
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {BG_COLORS.map((bg) => {
                    const isSelected = bgColor === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setBgColor(bg.id)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-all cursor-pointer",
                          isSelected
                            ? "border-emerald-600 ring-2 ring-emerald-500/20 font-semibold"
                            : "border-border/80 hover:border-foreground/40 text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn("w-3 h-3 rounded-full border shadow-2xs", bg.colorClass)}
                        />
                        <span>{bg.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Preset Gallery Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-foreground">
                Koleksi Pilihan Cepat (12 Karakter)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Klik salah satu avatar untuk memilih instan
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {PRESET_SEEDS.map((presetSeed) => {
                const presetUrl = buildDiceBearUrl(selectedStyle, presetSeed, bgColor);
                const isCurrentSeed = seed.trim().toLowerCase() === presetSeed.toLowerCase();

                return (
                  <button
                    key={presetSeed}
                    type="button"
                    onClick={() => setSeed(presetSeed)}
                    className={cn(
                      "group relative flex flex-col items-center justify-center p-2 rounded-xl border bg-card hover:bg-muted/40 transition-all text-center cursor-pointer",
                      isCurrentSeed
                        ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20"
                        : "border-border/70 hover:border-border"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-background/50">
                      <img
                        src={presetUrl}
                        alt={presetSeed}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-foreground mt-1 truncate max-w-full">
                      {presetSeed}
                    </span>
                    {isCurrentSeed && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/10 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            Gunakan Avatar Ini
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
