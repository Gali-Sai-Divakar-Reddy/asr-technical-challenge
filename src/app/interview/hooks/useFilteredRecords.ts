import { useMemo } from 'react';
import type { RecordItem } from '../types';

/**
 * Hook for filtering records by status
 * Uses useMemo to prevent unnecessary recalculations
 */
export type RecordStatusFilter = "all" | RecordItem["status"];

export function useFilteredRecords(
  records: RecordItem[],
  filter: RecordStatusFilter
): RecordItem[] {
  return useMemo(() => {
    if (filter === 'all') return records;
    return records.filter((r) => r.status === filter);
  }, [records, filter]);
}