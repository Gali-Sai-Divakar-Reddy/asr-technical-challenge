"use client";

import { useState } from "react";

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
            {records.length} total • {visibleRecords.length} showing
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <RecordFilter value={filterStatus} onChange={setFilterStatus} />
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            Reload
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">Error: {error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading records...</p>}

      <RecordSummary counts={counts} total={records.length} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleRecords.map((record) => (
          <RecordCard key={record.id} record={record} onSelect={setSelectedRecord} />
        ))}
      </div>

      {visibleRecords.length === 0 && records.length > 0 && !loading && !error && (
        <p className="text-sm text-muted-foreground">No records match this filter.</p>
      )}

      {selectedRecord && (
        <RecordDetailDialog record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      {records.length === 0 && !loading && !error && (
        <p className="text-sm text-muted-foreground">No records found.</p>
      )}

      <HistoryLog history={history} onClear={clearHistory} />
    </div>
  );
}
