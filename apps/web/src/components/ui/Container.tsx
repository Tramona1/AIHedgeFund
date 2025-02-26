import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  wide?: boolean;
}

export function Container({ 
  className, 
  wide = false, 
  children, 
  ...props 
}: ContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto px-4 md:px-6",
        wide ? "max-w-7xl" : "max-w-6xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 