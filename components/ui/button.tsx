import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white shadow-btn-primary hover:bg-brand-hover font-semibold",
        secondary:
          "bg-transparent text-text border border-border hover:bg-surface-hover",
        icon:
          "bg-transparent text-text-dim border border-border hover:bg-surface-hover hover:text-text",
        destructive:
          "bg-danger text-white hover:bg-danger/90 font-semibold",
        ghost:
          "bg-transparent text-text hover:bg-surface-hover",
        outline:
          "bg-transparent text-text border border-border hover:bg-surface-hover",
        link:
          "bg-transparent text-brand underline-offset-4 hover:underline",
        // Back-compat alias: old usage of `default` maps to primary styling.
        default:
          "bg-brand text-white shadow-btn-primary hover:bg-brand-hover font-semibold",
      },
      size: {
        default: "h-8 px-3 text-sm-plus rounded-btn [&_svg]:size-[13px]",
        sm: "h-7 px-2.5 text-xs rounded-chip [&_svg]:size-3",
        lg: "h-10 px-4 text-sm rounded-btn [&_svg]:size-4",
        icon: "h-8 w-8 rounded-btn [&_svg]:size-[15px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
