import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import type { KeyboardEvent } from "react";

import type { RecordItem } from "@/app/interview/types";

interface RecordCardProps {
  record: RecordItem;
  onSelect: (record: RecordItem) => void;
}

/**
 * RecordCard presents a compact summary of a specimen including its name,
 * description, and current review status, alongside a Review action to open
 * the detail dialog. Status is rendered as a badge with a consistent visual
 * mapping to aid quick scanning in the grid.
 */
const statusToVariant: Record<
  RecordItem["status"],
  NonNullable<VariantProps<typeof badgeVariants>["variant"]>
> = {
  pending: "secondary",
  approved: "default",
  flagged: "destructive",
  needs_revision: "destructive",
};

export default function RecordCard({ record, onSelect }: RecordCardProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(record);
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(record)}
      onKeyDown={handleKeyDown}
      className="overflow-hidden cursor-pointer hover:shadow-md hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all duration-200"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b">
        <div>
          <CardTitle className="text-base sm:text-lg tracking-tight">
            {record.name}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {record.description}
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant={statusToVariant[record.status]}>
            {record.status.replaceAll("_", " ").toLowerCase()}
          </Badge>
        </CardAction>
      </CardHeader>
      {record.note && (
        <CardContent>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Note: {record.note}
          </p>
        </CardContent>
      )}
      <CardFooter className="border-t pt-4 flex justify-end">
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(record);
          }}
        >
          Review
        </Button>
      </CardFooter>
    </Card>
  );
}
