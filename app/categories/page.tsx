"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categories, articles } from "@/lib/data";
import { FileText } from "lucide-react";

export default function CategoriesPage() {
  const categoryStats = categories.map((category) => ({
    ...category,
    articleCount: articles.filter((a) => a.category === category.name).length,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Categories</h1>
        <p className="text-muted-foreground">
          Browse articles organized by category
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryStats.map((category) => (
          <Link key={category.id} href={`/categories/${category.name.toLowerCase()}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${category.color}`} />
                  <Badge variant="secondary">
                    {category.articleCount} {category.articleCount === 1 ? 'article' : 'articles'}
                  </Badge>
                </div>
                <CardTitle>{category.name}</CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>View all articles</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
