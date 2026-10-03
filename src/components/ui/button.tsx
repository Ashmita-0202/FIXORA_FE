import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Button.
 *
 * Variants and sizes are transcribed from the Button component in the Figma
 * prototype's App.tsx (its base/variant/size class strings), so the rendered
 * result matches the design rather than stock shadcn defaults.
 *
 * The prototype pairs the variant classes with an inline `font-family: Inter`,
 * which is now the body font globally — hence no font utility here.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-blue-700 text-white hover:bg-blue-800 shadow-sm shadow-blue-200",
        secondary:
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200",
        outline:
          "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200",
        link: "text-blue-700 underline-offset-4 hover:underline",
      },
      size: {
        sm: "px-3 py-1.5 text-sm [&_svg]:size-3.5",
        default: "px-4 py-2.5 text-sm [&_svg]:size-4",
        lg: "px-5 py-3 text-base [&_svg]:size-4",
        icon: "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      type={asChild ? undefined : type}
      {...props}
    />
  );
}

export { buttonVariants };