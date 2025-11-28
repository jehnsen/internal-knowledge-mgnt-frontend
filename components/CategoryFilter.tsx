"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selectedCategory === null ? "default" : "outline"}
        className={cn(
          "cursor-pointer transition-colors",
          selectedCategory === null ? "" : "hover:bg-secondary"
        )}
        onClick={() => onSelectCategory(null)}
      >
        All
      </Badge>
      {categories.map((category) => (
        <Badge
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-colors",
            selectedCategory === category ? "" : "hover:bg-secondary"
          )}
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  );
}
