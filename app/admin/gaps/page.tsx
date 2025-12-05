"use client";

import { useState, useEffect } from "react";
import { AlertCircle, TrendingDown, Search, Calendar, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalyticsAPI, KnowledgeGap } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";
import { toast } from "sonner";

export default function KnowledgeGapsPage() {
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadKnowledgeGaps();
  }, [days]);

  const loadKnowledgeGaps = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AnalyticsAPI.getKnowledgeGaps(days, 50);
      setGaps(data);
    } catch (err: any) {
      console.error('Failed to load knowledge gaps:', err);
      setError(err.message || 'Failed to load knowledge gaps');
      toast.error('Failed to load knowledge gaps');
      setGaps([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading knowledge gaps..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Knowledge Gaps Detection</h1>
          <p className="text-muted-foreground">
            Identify queries with poor results or missing information
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={days === 7 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDays(7)}
            >
              7 days
            </Button>
            <Button
              variant={days === 30 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDays(30)}
            >
              30 days
            </Button>
            <Button
              variant={days === 90 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setDays(90)}
            >
              90 days
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadKnowledgeGaps}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Identified Knowledge Gaps ({gaps.length})
          </CardTitle>
          <CardDescription>
            Search queries that may indicate missing or insufficient content in your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gaps.length > 0 ? (
            <div className="space-y-3">
              {gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="font-mono">
                        #{idx + 1}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium truncate">{gap.query}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          {gap.search_count} searches
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last: {new Date(gap.last_searched).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge
                      variant={gap.search_count >= 5 ? "destructive" : "secondary"}
                      className="flex-shrink-0"
                    >
                      {gap.search_count >= 10 ? 'High Priority' :
                       gap.search_count >= 5 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No Knowledge Gaps Detected</p>
              <p className="text-sm max-w-md mx-auto">
                Great! Your knowledge base appears to be comprehensive.
                All searches are returning satisfactory results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {gaps.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Review high-priority queries and consider creating documents addressing these topics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Check if existing documents need better tagging or categorization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Monitor recurring queries to identify common knowledge gaps</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Update or expand existing content to better match search intent</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
