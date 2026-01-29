import { useMemo } from 'react';
import type { RecordItem } from '../types';

/**
 * Hook for computing status counts
 * Uses useMemo to prevent unnecessary recalculations
 */
export function useStatusCounts(records: RecordItem[]): Record<RecordItem["status"], number> {
  return useMemo(() => {
    const counts = {
      pending: 0,
      approved: 0,
      flagged: 0,
      needs_revision: 0,
    };

    const next = { ...counts };

    for (const r of records) {
      next[r.status] += 1;
    }

    return next;
  }, [records]);
}