"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QueryItem {
  query: string;
  count: number;
  last_searched?: string;
}

interface PopularQueriesProps {
  queries: QueryItem[];
}

export function PopularQueries({ queries }: PopularQueriesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Most Searched Queries
        </CardTitle>
        <CardDescription>
          The most frequently searched questions in your knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent>
        {queries.length > 0 ? (
          <div className="space-y-3">
            {queries.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    #{idx + 1}
                  </Badge>
                  <p className="text-sm font-medium">{item.query}</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {item.count} searches
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No search data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
