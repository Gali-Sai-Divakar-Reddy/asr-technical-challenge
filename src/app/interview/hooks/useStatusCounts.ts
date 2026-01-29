import { useMemo } from 'react';
import type { RecordItem } from '../types';

/**
 * Hook for computing status counts
 * Uses useMemo to prevent unnecessary recalculations
 */
const EMPTY_COUNTS = {
    pending: 0,
    approved: 0,
    flagged: 0,
    needs_revision: 0,
} as const;

export function useStatusCounts(records: RecordItem[]): Record<RecordItem["status"], number> {
  return useMemo(() => {

    const next = { ...EMPTY_COUNTS };

    for (const r of records) {
      next[r.status] += 1;
    }

    return next;
  }, [records]);
}