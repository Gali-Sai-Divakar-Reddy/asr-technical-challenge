'use client';

/*
 * RecordsContext is the single source of truth for all record data in this
 * interview exercise.  It encapsulates data fetching from the mock API,
 * exposes mutation functions for updating records, and maintains a simple
 * history log of status changes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [data, setData] = useState<RecordItem[]>([]);
  const [busy, setBusy] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const [log, setLog] = useState<RecordHistoryEntry[]>([]);

  const loadData = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const records = await recordsApi.fetchAll();
      setData(records);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErr(message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const doUpdate = useCallback(async (id: string, updates: { status?: RecordStatus; note?: string }) => {
    setErr(null);
    try {
      const updated = await recordsApi.update(id, updates);
      setData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

      const prevRecord = data.find((r) => r.id === id);
      if (prevRecord && updates.status && prevRecord.status !== updates.status) {
        const entry: RecordHistoryEntry = {
          id,
          previousStatus: prevRecord.status,
          newStatus: updates.status,
          note: updates.note,
          timestamp: new Date().toISOString(),
        };
        setLog((prevHist) => [...prevHist, entry]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErr(message);
      throw error;
    }
  }, [data]);

  const reLoad = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const purgeLog = useCallback(() => {
    setLog([]);
  }, []);

  const value = {
    records: data,
    loading: busy,
    error: err,
    updateRecord: doUpdate,
    refresh: reLoad,
    history: log,
    clearHistory: purgeLog,
  };
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within a RecordsProvider');
  return ctx;
}
