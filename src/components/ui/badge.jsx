import * as React from "react"
import { cn } from "../../lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200/80",
    secondary: "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200/80",
    destructive: "border-transparent bg-red-100 text-red-800",
    outline: "text-slate-950 border border-slate-200",
    success: "border-transparent bg-emerald-100 text-emerald-800",
    warning: "border-transparent bg-amber-100 text-amber-800",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
