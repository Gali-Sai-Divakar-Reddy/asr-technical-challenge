"use client";

import { useState } from "react";
import { AlertCircle, FileX, SearchX } from "lucide-react";

import { useRecords } from "../context/RecordsContext";
import type { RecordItem } from "../types";
import RecordCard from "./RecordCard";
import RecordDetailDialog from "./RecordDetailDialog";
import { Button } from "@/components/ui/button";
import RecordFilter from "./RecordFilter";
import RecordSummary from "./RecordSummary";
import HistoryLog from "./HistoryLog";
import { useStatusCounts } from "../hooks/useStatusCounts";
import { useFilteredRecords } from "../hooks/useFilteredRecords";

// Skeleton card component for loading state
const SkeletonCard = () => (
  <div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted/60 rounded w-full" />
      </div>
      <div className="h-6 bg-muted rounded-full w-16" />
    </div>
    <div className="h-4 bg-muted/40 rounded w-2/3" />
    <div className="flex justify-end">
      <div className="h-9 bg-muted rounded w-20" />
    </div>
  </div>
);

/**
 * RecordList orchestrates the interview page by fetching records via
 * RecordsContext, presenting summary counts, exposing a simple filter UI, and
 * handling selection to open the detail dialog.
 */
export default function RecordList() {
  const { records, loading, error, refresh, history, clearHistory } = useRecords();
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | RecordItem["status"]>("all");

  const counts = useStatusCounts(records);
  const visibleRecords = useFilteredRecords(records, filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Records</h2>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading records…" : `${records.length} total • ${visibleRecords.length} showing`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <RecordFilter value={filterStatus} onChange={setFilterStatus} />
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            Reload
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-destructive">Failed to load records</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-2"
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {/* Loading State - Skeleton Cards */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && !error && <RecordSummary counts={counts} total={records.length} />}

      {/* Records Grid */}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleRecords.map((record) => (
            <RecordCard key={record.id} record={record} onSelect={setSelectedRecord} />
          ))}
        </div>
      )}

      {/* Filter Empty State */}
      {visibleRecords.length === 0 && records.length > 0 && !loading && !error && (
        <div className="rounded-lg border bg-card/50 p-8 flex flex-col items-center justify-center text-center space-y-3">
          <SearchX className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No records match this filter</p>
            <p className="text-xs text-muted-foreground">
              Try selecting a different status or clear the filter to see all records.
            </p>
          </div>
        </div>
      )}

      {/* Complete Empty State */}
      {records.length === 0 && !loading && !error && (
        <div className="rounded-lg border bg-card/50 p-8 flex flex-col items-center justify-center text-center space-y-3">
          <FileX className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">No records found</p>
            <p className="text-xs text-muted-foreground">
              Records will appear here once they are available.
            </p>
          </div>
        </div>
      )}

      {selectedRecord && (
        <RecordDetailDialog record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      <HistoryLog history={history} onClear={clearHistory} />
    </div>
  );
}
