import * as React from "react"
import { cn } from "@/lib/utils"

interface DottedSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const DottedSurface = React.forwardRef<HTMLDivElement, DottedSurfaceProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          // Dotted pattern background
          "bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)]",
          "[background-size:20px_20px]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DottedSurface.displayName = "DottedSurface"

export { DottedSurface }