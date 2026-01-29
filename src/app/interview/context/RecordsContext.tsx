'use client';

/**
 * RecordsContext - Source-of-truth state + fetch/patch orchestration via recordsApi
 * 
 * Responsibilities:
 * - Manage records state (loading, error, data)
 * - Orchestrate fetch/patch operations using recordsApi service
 * - Maintain history log
 * - Expose update/refresh functions
 * 
 * Architecture Decision:
 * Context orchestrates API calls via service layer rather than calling fetch directly.
 * This improves testability and separation of concerns while keeping the pattern simple.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { RecordItem, RecordStatus, RecordHistoryEntry } from '../types';
import { recordsApi } from '../services/recordsApi';

interface RecordsContextValue {
  records: RecordItem[];
  loading: boolean;
  error: string | null;
  /**
   * Update a record’s status and/or note. This function calls the mock API
   * and then updates local state. Errors are set on the context.
   */
  updateRecord: (id: string, updates: { status?: RecordStatus; note?: string }) => Promise<void>;
  /**
   * Refresh the list of records from the API. Useful after a mutation
   * or when you need the latest state.
   */
  refresh: () => Promise<void>;

  /**
   * A log of record updates performed during this session. Each entry
   * records the record id, previous and new status, optional note and a
   * timestamp. This can be used to build an audit log or to teach
   * candidates about derived state.
   */
  history: RecordHistoryEntry[];
  /**
   * Clears the history log.
   */
  clearHistory: () => void;
}

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecordHistoryEntry[]>([]);

  const recordsRef = useRef<RecordItem[]>([]);
  // Snapshot current records from a ref to avoid stale closure issues
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextRecords = await recordsApi.fetchAll();
      setRecords(nextRecords);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const updateRecord = useCallback(
    async (id: string, updates: { status?: RecordStatus; note?: string }) => {
      setError(null);
      try {
        // Snapshot previous record from ref to avoid stale-closure issues
        const previousRecord = recordsRef.current.find((r) => r.id === id);

        // Update via API service
        const updated = await recordsApi.update(id, updates);
        
        // Update local state
        setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

        // Track history if status changed
        if (
          previousRecord &&
          updates.status &&
          previousRecord.status !== updates.status
        ) {
          const entry: RecordHistoryEntry = {
            id,
            previousStatus: previousRecord.status,
            newStatus: updates.status,
            note: updates.note,
            timestamp: new Date().toISOString(),
          };
          setHistory((prev) => [...prev, entry]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await fetchRecords();
  }, [fetchRecords]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const value = {
    records,
    loading,
    error,
    updateRecord,
    refresh,
    history,
    clearHistory,
  };
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within a RecordsProvider');
  return ctx;
}
