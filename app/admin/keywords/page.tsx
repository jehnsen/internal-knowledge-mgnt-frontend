"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsAPI } from "@/lib/api";
import { LoadingState } from "@/components/LoadingState";

interface QueryItem {
  query: string;
  count: number;
  last_searched?: string;
}

export default function KeywordsPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    setIsLoading(true);
    try {
      const overviewData = await AnalyticsAPI.getOverview();
      const searchData = overviewData?.top_searches || overviewData?.popular_queries || [];
      setQueries(searchData);
    } catch (err) {
      console.error('Failed to load keywords:', err);
      setQueries([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Loading keywords..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Keywords & Trends</h1>
        <p className="text-muted-foreground">
          Analyze search patterns and popular topics
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          {queries.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {queries.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">#{idx + 1}</Badge>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="font-medium mb-1 line-clamp-2">{item.query}</p>
                  <p className="text-sm text-muted-foreground">{item.count} searches</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No keyword data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
