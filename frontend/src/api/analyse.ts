import { apiClient, isMockMode, delay } from './client';
import type { CustomQueryResponse, SavedQuery } from '../types';

const MOCK_RESPONSE: CustomQueryResponse = {
  query_text: 'Show me email volume by sender domain for the last 30 days',
  explanation:
    'I analyzed your inbox over the last 30 days and grouped all incoming emails by the sender\'s root domain. GitHub dominates with automated notifications, followed by productivity tools and newsletters. The data shows you receive the most emails from developer tooling services.',
  query_time_ms: 2140,
  chart_spec: {
    type: 'bar',
    title: 'Email Volume by Sender Domain (Last 30 Days)',
    x_label: 'Domain',
    y_label: 'Emails',
    data: [
      { domain: 'github.com', count: 142 },
      { domain: 'producthunt.com', count: 87 },
      { domain: 'notion.so', count: 63 },
      { domain: 'google.com', count: 58 },
      { domain: 'linear.app', count: 41 },
      { domain: 'vercel.com', count: 35 },
      { domain: 'pagerduty.com', count: 28 },
    ],
  },
};

const MOCK_SAVED: SavedQuery[] = [
  {
    id: '1',
    name: 'Domain breakdown',
    query_text: 'Show me email volume by sender domain for the last 30 days',
    chart_spec_json: MOCK_RESPONSE.chart_spec,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export async function runCustomQuery(query: string): Promise<CustomQueryResponse> {
  if (isMockMode()) {
    await delay(2000 + Math.random() * 1000);
    return { ...MOCK_RESPONSE, query_text: query };
  }
  const res = await apiClient.post<CustomQueryResponse>('/analyse/custom', { query });
  return res.data;
}

export async function fetchSavedQueries(): Promise<SavedQuery[]> {
  if (isMockMode()) { await delay(200); return MOCK_SAVED; }
  const res = await apiClient.get<SavedQuery[]>('/queries');
  return res.data;
}

export async function saveQuery(name: string, query_text: string, chart_spec_json: object): Promise<SavedQuery> {
  if (isMockMode()) {
    await delay(300);
    return { id: Math.random().toString(36), name, query_text, chart_spec_json: chart_spec_json as SavedQuery['chart_spec_json'], created_at: new Date().toISOString() };
  }
  const res = await apiClient.post<SavedQuery>('/queries', { name, query_text, chart_spec_json });
  return res.data;
}

export async function startSync(mode: 'full' | 'incremental' = 'incremental'): Promise<void> {
  if (isMockMode()) { await delay(500); return; }
  await apiClient.post('/sync/start', { mode });
}
