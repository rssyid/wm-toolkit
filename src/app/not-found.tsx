import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
      <div className="p-3 bg-muted rounded-full text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground">
        Halaman Tidak Ditemukan (404)
      </h1>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
        Halaman yang Anda tuju tidak ditemukan atau telah dipindahkan.
      </p>
      <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white">
        <Link href="/dashboard">
          Kembali ke Dashboard
        </Link>
      </Button>
    </div>
  );
}
