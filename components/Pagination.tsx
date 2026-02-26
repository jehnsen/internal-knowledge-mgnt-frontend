"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** Current page number (1-indexed). */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  className?: string;
}

/** Returns the page-number slots to render, inserting null for ellipsis gaps. */
function getPageSlots(current: number, total: number): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const slots: (number | null)[] = [1];

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);

  if (start > 2) slots.push(null);           // left ellipsis

  for (let p = start; p <= end; p++) slots.push(p);

  if (end < total - 1) slots.push(null);     // right ellipsis

  slots.push(total);
  return slots;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem  = Math.min(currentPage * pageSize, totalItems);
  const slots     = getPageSlots(currentPage, totalPages);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 pt-4", className)}>
      {/* Item count */}
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{firstItem}</span>–<span className="font-medium">{lastItem}</span>{" "}
        of <span className="font-medium">{totalItems}</span> items
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {slots.map((slot, idx) =>
          slot === null ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground select-none">
              …
            </span>
          ) : (
            <Button
              key={slot}
              variant={slot === currentPage ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 text-sm"
              onClick={() => onPageChange(slot)}
              aria-label={`Page ${slot}`}
              aria-current={slot === currentPage ? "page" : undefined}
            >
              {slot}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
