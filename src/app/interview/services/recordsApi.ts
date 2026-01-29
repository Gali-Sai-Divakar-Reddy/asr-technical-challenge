import type { RecordItem, RecordStatus } from '../types';

/**
 * Records API Service (Repository Pattern)
 * 
 * Encapsulates all API communication for records.
 * This layer can be easily swapped for a real API or mocked for testing.
 */
export const recordsApi = {
  /**
   * Fetch all records from the API
   */
  async fetchAll(): Promise<RecordItem[]> {
    const response = await fetch('/api/mock/records');
    if (!response.ok) {
      throw new Error(`Failed to load records: ${response.statusText}`);
    }
    return response.json() as Promise<RecordItem[]>;
  },

  /**
   * Update a record's status and/or note
   */
  async update(
    id: string,
    updates: { status?: RecordStatus; note?: string }
  ): Promise<RecordItem> {
    const response = await fetch('/api/mock/records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update record: ${response.statusText}`);
    }
    return response.json() as Promise<RecordItem>;
  },
};