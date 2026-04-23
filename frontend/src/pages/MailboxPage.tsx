import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowsUpDownIcon, TagIcon, EnvelopeIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { searchEmails } from '../api/search';
import type { EmailCard } from '../types';
import './SearchPage.css';

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

/* ── Sender Filter Dropdown with Suggestive Search ─────────────────────── */
const SenderFilterDropdown: React.FC<{
  allSenders: string[];
  onSelect: (sender: string) => void;
  onClose: () => void;
}> = ({ allSenders, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Only show suggestions after 2+ characters
  const suggestions = useMemo(() => {
    if (search.length < 2) return [];
    const q = search.toLowerCase();
    return allSenders
      .filter(s => s.toLowerCase().includes(q))
      .slice(0, 12);
  }, [search, allSenders]);

  return (
    <div ref={dropdownRef} className="sender-filter-dropdown" style={{
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: 6,
      width: 280,
      background: 'var(--glass-bg, rgba(255,255,255,0.95))',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border, #e5e5e5)',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Search input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        borderBottom: '1px solid var(--border, #e5e5e5)',
      }}>
        <MagnifyingGlassIcon width={16} style={{ opacity: 0.4, flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type sender name..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '0.85rem',
            color: 'inherit',
          }}
        />
        {search && (
          <XMarkIcon
            width={14}
            style={{ opacity: 0.4, cursor: 'pointer' }}
            onClick={() => setSearch('')}
          />
        )}
      </div>

      {/* Suggestions list */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {search.length < 2 ? (
          <div style={{
            padding: '16px 12px',
            fontSize: '0.8rem',
            opacity: 0.4,
            textAlign: 'center',
          }}>
            Type at least 2 letters to search senders
          </div>
        ) : suggestions.length === 0 ? (
          <div style={{
            padding: '16px 12px',
            fontSize: '0.8rem',
            opacity: 0.4,
            textAlign: 'center',
          }}>
            No senders match "{search}"
          </div>
        ) : (
          suggestions.map((sender) => (
            <button
              key={sender}
              onClick={() => { onSelect(sender); onClose(); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: 'inherit',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b6b, #ffa500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {sender.charAt(0).toUpperCase()}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sender}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

/* ── Email Card ────────────────────────────────────────────────────────── */
const EmailResultCard: React.FC<{
  email: EmailCard;
  index: number;
  onLabelClick: (label: string) => void;
}> = ({ email, index, onLabelClick }) => (
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

/* ── Sender Divider ────────────────────────────────────────────────────── */
const SenderDivider: React.FC<{ senderName: string; count: number }> = ({ senderName, count }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 4px 8px',
    marginTop: 8,
  }}>
    <div style={{
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '0.8rem',
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {senderName.charAt(0).toUpperCase()}
    </div>
    <div style={{ flex: 1 }}>
      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{senderName}</span>
      <span style={{ marginLeft: 8, fontSize: '0.75rem', opacity: 0.45 }}>
        {count} email{count > 1 ? 's' : ''}
      </span>
    </div>
    <div style={{
      flex: 1,
      height: 1,
      background: 'var(--border, #e5e5e5)',
    }} />
  </div>
);

/* ── Main Page ─────────────────────────────────────────────────────────── */
const MailboxPage: React.FC = () => {
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'sender'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Use the existing /search endpoint to fetch emails
  const { data: searchResult, isLoading, error, isError } = useQuery({
    queryKey: ['inbox-emails'],
    queryFn: async () => {
      console.log('[Mailbox] Fetching emails via /search endpoint');
      const result = await searchEmails({ query: 'all recent emails', top_k: 100 });
      console.log(`[Mailbox] Received ${result.sources?.length} emails`);
      return result;
    },
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });

  // All unique senders (sorted alphabetically)
  const allSenders = useMemo(() => {
    const raw = searchResult?.sources || [];
    const set = new Set<string>();
    raw.forEach(e => {
      if (e.sender_name) set.add(e.sender_name);
    });
    return Array.from(set).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [searchResult]);

  // Apply sorting and filtering
  const emails = useMemo(() => {
    const raw = searchResult?.sources || [];

    // Filter by sender if selected
    let filtered = raw;
    if (selectedSender) {
      filtered = raw.filter(e =>
        e.sender_name?.toLowerCase() === selectedSender.toLowerCase()
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'sender') {
        const cmp = (a.sender_name || '').toLowerCase().localeCompare((b.sender_name || '').toLowerCase());
        if (cmp !== 0) return sortOrder === 'asc' ? cmp : -cmp;
        // Secondary sort: date desc within same sender
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        const cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortOrder === 'desc' ? -cmp : cmp;
      }
    });

    return sorted;
  }, [searchResult, selectedSender, sortBy, sortOrder]);

  // Group emails by sender for divider rendering (only when sorting by sender)
  const groupedEmails = useMemo(() => {
    if (sortBy !== 'sender' || selectedSender) return null;

    const groups: { sender: string; count: number; emails: { email: EmailCard; globalIdx: number }[] }[] = [];
    let currentSender = '';
    let globalIdx = 0;

    for (const email of emails) {
      const name = email.sender_name || 'Unknown';
      if (name.toLowerCase() !== currentSender.toLowerCase()) {
        currentSender = name;
        groups.push({ sender: name, count: 0, emails: [] });
      }
      groups[groups.length - 1].emails.push({ email, globalIdx });
      groups[groups.length - 1].count++;
      globalIdx++;
    }
    return groups;
  }, [emails, sortBy, selectedSender]);

  return (
    <div className="mailbox-page animate-fade-in">
      <div className="mailbox-header">
        <div>
          <h2 className="home__hero-title" style={{ fontSize: '1.8rem', marginBottom: 4 }}>
            Inbox
          </h2>
          <p className="home__hero-sub">
            {selectedSender
              ? `Showing emails from "${selectedSender}"`
              : 'All your synced emails in one place'}
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
            <ArrowsUpDownIcon width={14} /> Sort:{' '}
            {sortBy === 'sender'
              ? `Sender (${sortOrder === 'asc' ? 'A-Z' : 'Z-A'})`
              : 'Date'}
          </button>

          <div style={{ position: 'relative' }}>
            {selectedSender ? (
              <button
                className="filter-btn active"
                onClick={() => setSelectedSender(null)}
              >
                <XMarkIcon width={14} /> {selectedSender}
              </button>
            ) : (
              <button
                className="filter-btn"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <TagIcon width={14} /> Filter Sender
              </button>
            )}

            {showFilterDropdown && !selectedSender && (
              <SenderFilterDropdown
                allSenders={allSenders}
                onSelect={(sender) => setSelectedSender(sender)}
                onClose={() => setShowFilterDropdown(false)}
              />
            )}
          </div>
        </div>
      </div>

      {isError ? (
        <div
          className="error-state glass-card"
          style={{ padding: 24, textAlign: 'center', color: '#ff4d4d' }}
        >
          <p><strong>Error loading emails:</strong></p>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
            {(error as any)?.message || 'Unknown error'}
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      ) : isLoading ? (
        <div className="search-page__skeleton">
          {[1, 2, 3, 4, 5].map(i => (
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
          {groupedEmails
            ? /* Sender-grouped view with dividers */
              groupedEmails.map((group) => (
                <React.Fragment key={group.sender}>
                  <SenderDivider senderName={group.sender} count={group.count} />
                  {group.emails.map(({ email, globalIdx }) => (
                    <EmailResultCard
                      key={email.id}
                      email={email}
                      index={globalIdx}
                      onLabelClick={() => {}}
                    />
                  ))}
                </React.Fragment>
              ))
            : /* Normal chronological view with sender breaks */
              emails.map((email, i) => {
                const prevSender = i > 0 ? emails[i - 1].sender_name : null;
                const showBreak = prevSender !== null && prevSender !== email.sender_name;
                return (
                  <React.Fragment key={email.id}>
                    {showBreak && (
                      <div style={{
                        height: 1,
                        background: 'var(--border, #e5e5e5)',
                        margin: '12px 0',
                        opacity: 0.6,
                      }} />
                    )}
                    <EmailResultCard
                      email={email}
                      index={i}
                      onLabelClick={() => {}}
                    />
                  </React.Fragment>
                );
              })}
        </div>
      ) : (
        <div className="empty-state">
          <EnvelopeIcon width={40} style={{ opacity: 0.2, marginBottom: 16 }} />
          <p>
            {selectedSender
              ? `No emails found from "${selectedSender}".`
              : 'No emails found.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default MailboxPage;
