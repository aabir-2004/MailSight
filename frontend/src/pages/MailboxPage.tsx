import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowsUpDownIcon, TagIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../store/appStore';
import { apiClient } from '../api/client';
import type { EmailCard } from '../types';
import './SearchPage.css'; // Reuse search page styles for consistency

const HOUR_DIFF = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
};

const LABEL_COLOR: Record<string, string> = {
  INBOX: 'purple',
  Important: 'amber',
  Starred: 'amber',
  Promotions: 'blue',
  Social: 'green',
  Updates: 'cyan',
  Spam: 'rose',
};

const EmailResultCard: React.FC<{ email: EmailCard; index: number; onLabelClick: (label: string) => void }> = ({ email, index, onLabelClick }) => (
  <div
    className="email-card animate-fade-in"
    style={{ animationDelay: `${index * 40}ms` }}
    id={`email-item-${email.id}`}
  >
    <div className="email-card__avatar">
      {email.sender_name.charAt(0).toUpperCase()}
    </div>
    <div className="email-card__body">
      <div className="email-card__header">
        <span className="email-card__sender">{email.sender_name}</span>
        <span className="email-card__date">{HOUR_DIFF(email.date)}</span>
      </div>
      <div className="email-card__subject">{email.subject}</div>
      <div className="email-card__snippet">{email.snippet}</div>
      <div className="email-card__footer">
        <div className="email-card__labels">
          {email.labels.map((l) => (
            <span 
                key={l} 
                className={`badge badge-${LABEL_COLOR[l] ?? 'muted'} clickable`} 
                onClick={(e) => { e.stopPropagation(); onLabelClick(l); }}
            >
                {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const MailboxPage: React.FC = () => {
  const {  } = useAppStore();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'sender'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: emails = [], isLoading, error, isError } = useQuery({
    queryKey: ['emails', selectedLabel, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLabel) params.append('label', selectedLabel);
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      
      console.log(`[Mailbox] Fetching emails with params: ${params.toString()}`);
      try {
        const res = await apiClient.get<EmailCard[]>(`/analytics/list?${params.toString()}`);
        console.log(`[Mailbox] Received ${res.data?.length} emails`);
        return res.data;
      } catch (err) {
        console.error('[Mailbox] Fetch failed:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="mailbox-page animate-fade-in">
      <div className="mailbox-header">
        <div>
            <h2 className="home__hero-title" style={{ fontSize: '1.8rem', marginBottom: 4 }}>
                Inbox
            </h2>
            <p className="home__hero-sub">
                {selectedLabel ? `Showing ${selectedLabel} emails` : 'All your synced emails in one place'}
            </p>
        </div>
        
        <div className="mailbox-controls">
            <button 
                className={`filter-btn ${sortBy === 'sender' ? 'active' : ''}`}
                onClick={() => {
                    if (sortBy === 'sender') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                        setSortBy('sender');
                        setSortOrder('asc');
                    }
                }}
            >
                <ArrowsUpDownIcon width={14} /> Sort: {sortBy === 'sender' ? `Sender (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})` : 'Date'}
            </button>
            
            <button 
                className="filter-btn"
                onClick={() => setSelectedLabel(null)}
                disabled={!selectedLabel}
            >
                <TagIcon width={14} /> {selectedLabel || 'Filter Label'}
            </button>
        </div>
      </div>

      {isError ? (
        <div className="error-state glass-card" style={{ padding: 24, textAlign: 'center', color: '#ff4d4d' }}>
            <p><strong>Error loading emails:</strong></p>
            <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>{(error as any)?.message || 'Unknown error'}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
                Try Again
            </button>
        </div>
      ) : isLoading ? (
        <div className="search-page__skeleton">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="email-card glass-card">
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 11, width: '90%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : emails.length > 0 ? (
        <div className="search-page__email-list">
          {emails.map((email, i) => (
            <EmailResultCard 
                key={email.id} 
                email={email} 
                index={i} 
                onLabelClick={setSelectedLabel}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
            <EnvelopeIcon width={40} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p>No emails found in this category.</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: 8 }}>
                Checked for user ID: {localStorage.getItem('maillens-store') ? 'Logged In' : 'Not Found'}
            </p>
        </div>
      )}
    </div>
  );
};

export default MailboxPage;
