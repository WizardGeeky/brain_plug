"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-xs",
        primary:
          "border-primary/30 bg-primary/10 text-primary shadow-xs",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-xs",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-xs",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300 shadow-xs",
        outline:
          "border-border/90 text-foreground bg-background/50 backdrop-blur-xs",
        glow:
          "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 shadow-sm shadow-purple-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
