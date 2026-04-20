import { apiClient, isMockMode, delay } from './client';
import type { SearchRequest, SearchResponse } from '../types';

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_RESPONSE: SearchResponse = {
  answer:
    'Based on your inbox, I found 4 relevant emails discussing Q3 budget planning. The main thread from your manager Michael (michael@company.com) outlines a 15% budget increase for the engineering team, with a follow-up confirming approval from Finance on September 3rd. There is also a calendar invite for the Q3 review meeting on September 12th.',
  sources: [
    {
      id: '1',
      subject: 'Q3 Budget Planning — Engineering',
      sender_email: 'michael@company.com',
      sender_name: 'Michael Torres',
      snippet: 'Hi team, as we head into Q3 I wanted to share the updated budget allocations for engineering...',
      date: '2025-09-01T10:22:00Z',
      labels: ['INBOX'],
      relevance_score: 0.97,
    },
    {
      id: '2',
      subject: 'Re: Q3 Budget — Finance Approval',
      sender_email: 'finance@company.com',
      sender_name: 'Finance Team',
      snippet: 'The Q3 budget has been approved. Please find the signed document attached...',
      date: '2025-09-03T14:05:00Z',
      labels: ['INBOX', 'Important'],
      relevance_score: 0.91,
    },
    {
      id: '3',
      subject: 'Q3 Review Meeting Invite',
      sender_email: 'calendar@google.com',
      sender_name: 'Google Calendar',
      snippet: 'You have been invited to Q3 Budget Review on September 12, 2025...',
      date: '2025-09-04T09:00:00Z',
      labels: ['INBOX'],
      relevance_score: 0.82,
    },
  ],
  query_time_ms: 1240,
};

// ─── Real API ─────────────────────────────────────────────────────────────────
export async function searchEmails(req: SearchRequest): Promise<SearchResponse> {
  if (isMockMode()) {
    await delay(1200 + Math.random() * 800);
    return MOCK_RESPONSE;
  }
  const res = await apiClient.post<SearchResponse>('/search', req);
  return res.data;
}
