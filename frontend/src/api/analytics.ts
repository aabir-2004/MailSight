import { apiClient, isMockMode, delay } from './client';
import type {
  AnalyticsSummary,
  LabelFrequency,
  VolumeDataPoint,
  SenderStat,
  HeatmapCell,
  ThreadDepthBin,
  Granularity,
} from '../types';

// ─── Mocks ───────────────────────────────────────────────────────────────────
export const MOCK_SUMMARY: AnalyticsSummary = {
  total_emails: 12_847,
  total_senders: 438,
  total_labels: 24,
  total_threads: 3_211,
  avg_emails_per_day: 35.2,
  busiest_day: 'Tuesday',
  busiest_hour: 10,
  top_label: 'INBOX',
  top_sender: 'github.com',
  unread_count: 1_204,
  starred_count: 87,
};

export const MOCK_LABELS: LabelFrequency[] = [
  { label: 'INBOX', count: 5420, percentage: 42.2 },
  { label: 'Promotions', count: 3180, percentage: 24.8 },
  { label: 'Social', count: 1840, percentage: 14.3 },
  { label: 'Updates', count: 1120, percentage: 8.7 },
  { label: 'Important', count: 720, percentage: 5.6 },
  { label: 'Spam', count: 430, percentage: 3.3 },
  { label: 'Starred', count: 137, percentage: 1.1 },
];

export const MOCK_VOLUME: VolumeDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(Date.now() - (29 - i) * 86400000);
  return {
    date: d.toISOString().split('T')[0],
    count: Math.floor(20 + Math.random() * 60),
  };
});

export const MOCK_SENDERS: SenderStat[] = [
  { sender_email: 'notifications@github.com', sender_name: 'GitHub', domain: 'github.com', count: 1240, first_seen: '2024-01-01', last_seen: '2025-04-20' },
  { sender_email: 'newsletter@producthunt.com', sender_name: 'Product Hunt', domain: 'producthunt.com', count: 890, first_seen: '2024-02-10', last_seen: '2025-04-18' },
  { sender_email: 'team@notion.so', sender_name: 'Notion', domain: 'notion.so', count: 670, first_seen: '2024-03-05', last_seen: '2025-04-15' },
  { sender_email: 'no-reply@accounts.google.com', sender_name: 'Google', domain: 'google.com', count: 540, first_seen: '2024-01-15', last_seen: '2025-04-20' },
  { sender_email: 'support@linear.app', sender_name: 'Linear', domain: 'linear.app', count: 420, first_seen: '2024-04-01', last_seen: '2025-04-19' },
  { sender_email: 'hello@vercel.com', sender_name: 'Vercel', domain: 'vercel.com', count: 310, first_seen: '2024-05-20', last_seen: '2025-04-17' },
  { sender_email: 'alerts@pagerduty.com', sender_name: 'PagerDuty', domain: 'pagerduty.com', count: 280, first_seen: '2024-06-01', last_seen: '2025-04-20' },
];

export const MOCK_HEATMAP: HeatmapCell[] = (() => {
  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const isWeekday = day < 5;
      const isWorkHour = hour >= 9 && hour <= 18;
      const base = isWeekday && isWorkHour ? 30 : 5;
      cells.push({ day, hour, count: Math.floor(base + Math.random() * 40) });
    }
  }
  return cells;
})();

export const MOCK_THREADS: ThreadDepthBin[] = [
  { depth: '1', count: 1240 },
  { depth: '2–3', count: 980 },
  { depth: '4–6', count: 540 },
  { depth: '7–10', count: 280 },
  { depth: '11–20', count: 120 },
  { depth: '21+', count: 51 },
];

// ─── API functions ────────────────────────────────────────────────────────────
export async function fetchSummary(): Promise<AnalyticsSummary> {
  if (isMockMode()) { await delay(400); return MOCK_SUMMARY; }
  const res = await apiClient.get<AnalyticsSummary>('/analytics/summary');
  return res.data;
}

export async function fetchLabelFrequency(from: string, to: string): Promise<LabelFrequency[]> {
  if (isMockMode()) { await delay(350); return MOCK_LABELS; }
  const res = await apiClient.get<LabelFrequency[]>('/analytics/labels', { params: { date_from: from, date_to: to } });
  return res.data;
}

export async function fetchVolume(from: string, to: string, granularity: Granularity = 'day'): Promise<VolumeDataPoint[]> {
  if (isMockMode()) { await delay(300); return MOCK_VOLUME; }
  const res = await apiClient.get<VolumeDataPoint[]>('/analytics/volume', { params: { date_from: from, date_to: to, granularity } });
  return res.data;
}

export async function fetchTopSenders(limit = 10): Promise<SenderStat[]> {
  if (isMockMode()) { await delay(250); return MOCK_SENDERS.slice(0, limit); }
  const res = await apiClient.get<SenderStat[]>('/analytics/senders', { params: { limit } });
  return res.data;
}

export async function fetchHeatmap(from: string, to: string): Promise<HeatmapCell[]> {
  if (isMockMode()) { await delay(300); return MOCK_HEATMAP; }
  const res = await apiClient.get<HeatmapCell[]>('/analytics/heatmap', { params: { date_from: from, date_to: to } });
  return res.data;
}

export async function fetchThreadDepth(from: string, to: string): Promise<ThreadDepthBin[]> {
  if (isMockMode()) { await delay(200); return MOCK_THREADS; }
  const res = await apiClient.get<ThreadDepthBin[]>('/analytics/threads', { params: { date_from: from, date_to: to } });
  return res.data;
}
