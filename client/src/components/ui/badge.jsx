import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "border-primary/50 bg-primary/20 text-primary shadow-glow-sm",
        secondary:
          "border-secondary/50 bg-secondary/50 text-secondary-foreground",
        destructive:
          "border-destructive/50 bg-destructive/20 text-destructive shadow-[0_0_5px_hsl(0_100%_50%_/_0.3)]",
        outline:
          "border-primary/30 text-primary bg-transparent",
        // Cyberpunk variants
        success:
          "border-neon-green/50 bg-neon-green/10 text-neon-green shadow-[0_0_5px_hsl(120_100%_50%_/_0.3)]",
        warning:
          "border-neon-orange/50 bg-neon-orange/10 text-neon-orange shadow-[0_0_5px_hsl(30_100%_50%_/_0.3)]",
        neon:
          "border-primary bg-primary/20 text-primary shadow-glow-sm animate-pulse-glow",
        "neon-red":
          "border-accent bg-accent/20 text-accent shadow-[0_0_5px_hsl(14_100%_50%_/_0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }
