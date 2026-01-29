import type { RecordItem, RecordStatus } from "../types";

/**
 * RecordSummary computes derived counts by status from the current record set
 * provided by RecordsContext and renders them as a lightweight dashboard.
 */
interface RecordSummaryProps {
  counts: Record<RecordStatus, number>;
  total: number;
}

export default function RecordSummary({ counts, total }: RecordSummaryProps) {
  const statuses: RecordStatus[] = ["pending", "approved", "flagged", "needs_revision"];

  return (
    <section aria-label="Record status summary" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base sm:text-lg font-semibold tracking-tight">Summary</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {total} total • counts by status
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statuses.map((status) => (
          <div
            key={status}
            className="rounded-lg border bg-card/50 p-3 sm:p-4 flex flex-col items-center justify-center shadow-sm hover:bg-card transition-colors"
          >
            <span className="text-xs sm:text-sm font-medium capitalize text-muted-foreground">
              {status.replaceAll("_", " ")}
            </span>
            <span className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              {counts[status] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
