import { cn } from "@/lib/utils";

/**
 * Skeleton — matching shadcn's neutral pulse, driven by the `--animate-pulse`
 * token already present in the Figma theme layer.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-lg bg-slate-100", className)}
      {...props}
    />
  );
}