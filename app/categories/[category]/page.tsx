"use client";

import { useState, useMemo, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { articles, categories } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { ArticleCard } from "@/components/ArticleCard";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const categoryName = decodeURIComponent(resolvedParams.category)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const category = categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (!category) {
    notFound();
  }

  const [searchQuery, setSearchQuery] = useState("");

  const categoryArticles = useMemo(() => {
    return articles.filter((article) => article.category === category.name);
  }, [category.name]);

  const filteredArticles = useMemo(() => {
    return categoryArticles.filter((article) => {
      return searchQuery === "" ||
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    });
  }, [categoryArticles, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/categories">
        <Button variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Button>
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-4 h-4 rounded-full ${category.color}`} />
          <h1 className="text-4xl font-bold">{category.name}</h1>
        </div>
        <p className="text-muted-foreground mb-4">{category.description}</p>
        <Badge variant="secondary">
          {categoryArticles.length} {categoryArticles.length === 1 ? 'article' : 'articles'}
        </Badge>
      </div>

      <div className="mb-8">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search in ${category.name}...`}
        />
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"} found
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
