import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";

interface ResearchCardProps {
  slug: string;
  title: string;
  description: string;
  category: string;
  wordCount: number;
  readingTime: number;
}

export function ResearchCard({
  slug,
  title,
  description,
  category,
  wordCount,
  readingTime,
}: ResearchCardProps) {
  return (
    <Link href={`/research/${slug}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardHeader>
          <div className="mb-2">
            <Badge variant="secondary">{category}</Badge>
          </div>
          <CardTitle className="group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {wordCount.toLocaleString()} words
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
