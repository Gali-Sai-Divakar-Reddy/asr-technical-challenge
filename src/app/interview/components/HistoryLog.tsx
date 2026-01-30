import type { RecordHistoryEntry, RecordStatus } from "../types";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import { Clock, FileText, ArrowRight } from "lucide-react";

/**
 * History log renders a chronological, scrollable list of status changes
 * captured during the current session by the RecordsContext. Each entry shows
 * the record id, a human‑readable timestamp, the previous → new status, and an
 * optional reviewer note to aid traceability. A Clear action is provided to
 * reset the in‑memory log.
 */
interface HistoryLogProps {
  history: RecordHistoryEntry[];
  onClear: () => void;
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

export default function HistoryLog({ history, onClear }: HistoryLogProps) {
  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">History</h3>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed rounded-lg bg-muted/30">
          <Clock className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">No status changes yet</p>
          <p className="text-xs text-muted-foreground text-center">
            Status changes will appear here as you review records
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {history.map((entry, idx) => (
            <li
              key={idx}
              className="text-sm border rounded-md p-3 bg-card hover:bg-accent/50 transition-colors duration-150"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base">Record {entry.id}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={statusToVariant[entry.previousStatus]} className="text-xs">
                  {entry.previousStatus.replaceAll("_", " ")}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <Badge variant={statusToVariant[entry.newStatus]} className="text-xs">
                  {entry.newStatus.replaceAll("_", " ")}
                </Badge>
              </div>
              {entry.note && (
                <div className="mt-2 pt-2 border-t flex gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground flex-1">{entry.note}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
