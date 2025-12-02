import Link from "next/link";
import { Calendar, User, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Article } from "@/lib/types";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const formattedDate = new Date(article.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`/articles/${article.id}`} className="group">
      <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-border hover:border-primary/50 overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {article.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <Eye className="h-3 w-3" />
              <span>{article.views}</span>
            </div>
          </div>
          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">
            {article.summary}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs group-hover:border-primary/50 transition-colors"
              >
                {tag}
              </Badge>
            ))}
            {article.tags.length > 3 && (
              <Badge variant="outline" className="text-xs group-hover:border-primary/50 transition-colors">
                +{article.tags.length - 3}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
