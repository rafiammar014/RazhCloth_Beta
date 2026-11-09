import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-bold rounded-xl transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 min-h-[44px]";

    const variants = {
      primary:
        "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20",
      secondary:
        "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/10",
      danger:
        "bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20",
      outline:
        "border-2 border-slate-300 hover:border-slate-800 text-slate-800 bg-transparent hover:bg-slate-50",
      ghost:
        "text-slate-700 hover:text-slate-950 hover:bg-slate-100 bg-transparent",
    };

    const sizes = {
      sm: "text-xs px-3 py-2 min-h-[38px] gap-1.5",
      md: "text-sm px-4 py-2.5 min-h-[44px] gap-2",
      lg: "text-base px-6 py-3 min-h-[50px] gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
            <span>Memproses...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

