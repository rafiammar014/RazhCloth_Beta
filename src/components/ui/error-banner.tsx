import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface ErrorBannerProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorBanner({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat data dari server. Silakan periksa koneksi Anda dan coba lagi.",
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900">{title}</h4>
          <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-rose-300 text-rose-800 hover:bg-rose-100 flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

