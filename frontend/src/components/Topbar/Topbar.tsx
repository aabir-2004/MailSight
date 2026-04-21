import React from 'react';
import { BellIcon, ArrowPathIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAppStore } from '../../store/appStore';
import { triggerSync, fetchSyncStatus } from '../../api/sync';
import { isMockMode } from '../../api/client';
import './Topbar.css';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  home:      { title: 'Home',           subtitle: 'AI-powered inbox intelligence' },
  search:    { title: 'Smart Search',   subtitle: 'Semantic + keyword search with LLM synthesis' },
  dashboard: { title: 'Analytics',      subtitle: 'Chart-driven inbox insights' },
  analyse:   { title: 'AI Analysis',    subtitle: 'Free-form query engine powered by Groq LLM' },
  settings:  { title: 'Settings',       subtitle: 'Manage sync, account, and preferences' },
};

const Topbar: React.FC = () => {
  const { activePage, user, setActivePage, syncState, setSyncState } = useAppStore();
  const { title, subtitle } = PAGE_TITLES[activePage] || PAGE_TITLES.home;

  const handleSync = async () => {
    setSyncState({ status: 'syncing', emails_total: 0, emails_synced: 0 });

    if (isMockMode()) {
      // Simulate sync progress
      let synced = 0;
      const total = 250 + Math.floor(Math.random() * 200);
      setSyncState({ emails_total: total });
      const iv = setInterval(() => {
        synced = Math.min(synced + Math.floor(Math.random() * 30 + 10), total);
        setSyncState({ emails_synced: synced });
        if (synced >= total) {
          clearInterval(iv);
          setSyncState({ status: 'done', last_synced_at: new Date().toISOString() });
        }
      }, 300);
      return;
    }

    try {
      await triggerSync('incremental');
      const iv = setInterval(async () => {
        try {
          const st = await fetchSyncStatus();
          setSyncState(st);
          if (st.status === 'done' || st.status === 'error') {
            clearInterval(iv);
          }
        } catch (err) {
          clearInterval(iv);
          setSyncState({ status: 'error' });
        }
      }, 2000);
    } catch (e) {
      setSyncState({ status: 'error' });
    }
  };

  return (
    <header className="topbar" role="banner">
      {/* Page info */}
      <div className="topbar__page">
        <h1 className="topbar__title">{title}</h1>
        <p className="topbar__subtitle">{subtitle}</p>
      </div>

      {/* Quick search shortcut */}
      <button
        className="topbar__search-pill"
        id="topbar-search-shortcut"
        onClick={() => setActivePage('search')}
      >
        <MagnifyingGlassIcon width={14} />
        <span>Search your inbox…</span>
        <kbd className="topbar__kbd">⌘K</kbd>
      </button>

      {/* Actions */}
      <div className="topbar__actions">
        {/* Sync button */}
        <button
          className={`topbar__action-btn ${syncState.status === 'syncing' ? 'topbar__action-btn--syncing' : ''}`}
          id="topbar-sync-btn"
          onClick={handleSync}
          title="Sync Gmail"
          disabled={syncState.status === 'syncing'}
        >
          <ArrowPathIcon width={16} className={syncState.status === 'syncing' ? 'animate-spin' : ''} />
        </button>

        {/* Notifications */}
        <button className="topbar__action-btn" id="topbar-notifications" title="Notifications">
          <BellIcon width={16} />
          <span className="topbar__notif-dot" />
        </button>

        {/* Avatar */}
        <button className="topbar__avatar" id="topbar-avatar" onClick={() => setActivePage('settings')}>
          {user?.picture ? (
            <img src={user.picture} alt={user.name} />
          ) : (
            <UserIcon width={16} />
          )}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
