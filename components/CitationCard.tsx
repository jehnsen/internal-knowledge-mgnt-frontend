"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Citation } from "@/lib/types";
import { cn } from "@/lib/utils";

// Helper to clean and format text
function formatText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n+/g, ' ')   // Replace newlines with spaces
    .trim();
}

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export function CitationCard({ citation, index }: CitationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return "bg-green-500";
    if (score >= 0.8) return "bg-blue-500";
    if (score >= 0.7) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 0.9) return "Highly Relevant";
    if (score >= 0.8) return "Very Relevant";
    if (score >= 0.7) return "Relevant";
    return "Somewhat Relevant";
  };

  return (
    <Card className="border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{citation.documentName}</p>
                <div className="flex items-center gap-2 mt-1">
                  {citation.pageNumber && (
                    <Badge variant="outline" className="text-xs">
                      Page {citation.pageNumber}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <div className={cn("h-2 w-2 rounded-full", getRelevanceColor(citation.relevanceScore))} />
                    <span className="text-xs text-muted-foreground">
                      {getRelevanceLabel(citation.relevanceScore)} ({Math.round(citation.relevanceScore * 100)}%)
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className={cn(
              "overflow-hidden transition-all",
              isExpanded ? "max-h-96 overflow-y-auto" : "max-h-12"
            )}>
              <p className={cn(
                "text-sm leading-relaxed",
                !isExpanded && "line-clamp-2 text-muted-foreground",
                isExpanded && "text-foreground/90 bg-muted/30 p-3 rounded-lg"
              )}>
                {formatText(citation.content)}
              </p>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-3 border-t">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                  <ExternalLink className="h-3 w-3" />
                  View in document
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
