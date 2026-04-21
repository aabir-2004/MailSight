import { apiClient, isMockMode, delay } from './client';
import type { SyncState } from '../types';

export async function triggerSync(mode: 'full' | 'incremental', dateRange?: { date_from?: string; date_to?: string }): Promise<{ task_id: string, status: string }> {
  if (isMockMode()) {
    await delay(300);
    return { task_id: 'mock-task', status: 'queued' };
  }
  const payload: any = { mode };
  if (dateRange?.date_from) payload.date_from = dateRange.date_from;
  if (dateRange?.date_to) payload.date_to = dateRange.date_to;
  const res = await apiClient.post('/sync/start', payload);
  return res.data;
}

export async function fetchSyncStatus(): Promise<SyncState> {
  if (isMockMode()) {
    await delay(200);
    return { status: 'idle', emails_total: 100, emails_synced: 100, last_synced_at: new Date().toISOString() } as SyncState;
  }
  const res = await apiClient.get<SyncState>('/sync/status');
  return res.data;
}
