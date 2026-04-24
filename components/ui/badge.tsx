import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill px-[7px] py-[2px] text-xxs font-semibold tracking-[0.02em] transition-colors",
  {
    variants: {
      variant: {
        // Pill = design's VA_Pill with color-soft background + colored text.
        success: "bg-success-soft text-success",
        warn: "bg-warn-soft text-warn",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        brand: "bg-brand-soft text-brand",
        // Case types
        visa: "bg-visa/10 text-visa",
        pobyt: "bg-pobyt/10 text-pobyt",
        obywatelstwo: "bg-obywatelstwo/10 text-obywatelstwo",
        praca: "bg-praca/10 text-praca",
        // Shadcn back-compat
        default:
          "bg-brand-soft text-brand",
        secondary:
          "bg-surface-hover text-text-dim",
        destructive:
          "bg-danger-soft text-danger",
        outline:
          "border border-border text-text-dim",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
