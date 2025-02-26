import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "muted" | "primary" | "grid";
}

export function Section({ 
  className, 
  variant = "default", 
  children, 
  ...props 
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-20",
        {
          "bg-[hsl(var(--background))]": variant === "default",
          "bg-[hsl(var(--muted))] dark:bg-gray-900": variant === "muted",
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]": variant === "primary",
          "bg-grid-pattern bg-white dark:bg-gray-950 dark:bg-opacity-90": variant === "grid",
        },
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
} 