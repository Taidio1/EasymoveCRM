import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-btn border border-border bg-bg px-3 text-[13px] text-text placeholder:text-text-mute",
          "outline-none transition-colors",
          "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/30",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
