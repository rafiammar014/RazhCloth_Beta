import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "neutral" | "brand";
}

export function Badge({
  className,
  variant = "neutral",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold",
    warning: "bg-amber-50 text-amber-700 border-amber-200 font-semibold",
    danger: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return <Badge variant="danger">Habis (0)</Badge>;
  }
  if (stock <= 5) {
    return <Badge variant="warning">Sisa {stock} (Menipis)</Badge>;
  }
  return <Badge variant="success">Stok: {stock}</Badge>;
}

