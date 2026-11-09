import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400">
        <Store className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">404 - Halaman Tidak Ditemukan</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Halaman atau rute yang Anda cari di sistem kasir RAZH CLOTH tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        href="/pos"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Kasir POS
      </Link>
    </div>
  );
}

