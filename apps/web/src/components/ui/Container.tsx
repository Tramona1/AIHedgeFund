import type React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

export function Container({ as: Component = "div", className, ...props }: ContainerProps) {
  return <Component className={cn("container mx-auto px-4 md:px-6", className)} {...props} />
} 