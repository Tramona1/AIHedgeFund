import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface AlertCardProps {
  ticker: string;
  content: string;
  author?: string | null;
  type: string;
  className?: string;
}

export const AlertCard = ({ ticker, content, author = null, type, className = "" }: AlertCardProps) => (
  <Card className={`overflow-hidden transition-all hover:shadow-lg border-blue-100 ${className}`}>
    <CardHeader className="pb-3 flex justify-between items-start">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
          <span className="font-bold text-blue-700">${ticker}</span>
        </div>
        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
          {type}
        </Badge>
      </div>
      {author && <div className="text-xs text-muted-foreground">via {author}</div>}
    </CardHeader>
    <CardContent className="pt-0">
      <p className="text-foreground/90">{content}</p>
    </CardContent>
  </Card>
);

export default AlertCard; 