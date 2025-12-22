import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-[14px] border border-border bg-white/90 px-4 py-3 text-sm ring-offset-background placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:border-[rgba(37,99,235,0.55)] focus-visible:ring-4 focus-visible:ring-[rgba(37,99,235,0.12)] disabled:cursor-not-allowed disabled:opacity-50 transition-all leading-[1.75] resize-y",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

