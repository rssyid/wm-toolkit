import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Master Data - WM-Toolkit",
  description: "Pengelolaan master data operasional proyek teknis perkebunan kelapa sawit.",
};

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return children;
}
