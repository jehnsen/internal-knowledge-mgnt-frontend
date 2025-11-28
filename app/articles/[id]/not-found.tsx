import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Article Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The article you're looking for doesn't exist or has been removed.
      </p>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
