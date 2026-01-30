import type { RecordStatus } from "../types";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Clock, CheckCircle2, Flag, AlertTriangle } from "lucide-react";

/**
 * RecordSummary computes derived counts by status from the current record set
 * provided by RecordsContext and renders them as a lightweight dashboard.
 */
interface RecordSummaryProps {
  counts: Record<RecordStatus, number>;
  total: number;
}

const statusToVariant: Record<
  RecordStatus,
  NonNullable<VariantProps<typeof badgeVariants>["variant"]>
> = {
  pending: "secondary",
  approved: "default",
  flagged: "destructive",
  needs_revision: "destructive",
};

const statusToIcon: Record<RecordStatus, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  flagged: Flag,
  needs_revision: AlertTriangle,
};

export default function RecordSummary({ counts, total }: RecordSummaryProps) {
  const statuses: RecordStatus[] = ["pending", "approved", "flagged", "needs_revision"];

  return (
    <section aria-label="Record status summary" className="space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold tracking-tight">Summary</h3>
        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          {total} total
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statuses.map((status) => {
          const Icon = statusToIcon[status];
          const count = counts[status] ?? 0;
          
          return (
            <div
              key={status}
              className="rounded-lg border bg-card p-4 flex flex-col gap-2 shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant={statusToVariant[status]} className="text-xs shrink-0">
                  {status.replaceAll("_", " ")}
                </Badge>
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
