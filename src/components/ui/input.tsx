import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-input-background px-3.5 py-2.5 text-sm text-slate-900",
        "placeholder:text-slate-400 transition-colors",
        "focus-visible:border-blue-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-red-500 aria-invalid:focus-visible:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-input-background px-3.5 py-2.5 text-sm text-slate-900",
        "placeholder:text-slate-400 transition-colors resize-y",
        "focus-visible:border-blue-600 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-invalid:border-red-500 aria-invalid:focus-visible:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}