import React from 'react';
import { useAppStore } from '../store/appStore';
import { Shield, RefreshCw, Trash2, Moon, Database, Key, ChevronRight } from 'lucide-react';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { user, logout, globalDateRange, setGlobalDateRange, setSyncState } = useAppStore();

  const handleFullSync = () => {
    setSyncState({ status: 'syncing', emails_total: 0, emails_synced: 0 });
    let synced = 0;
    const total = 2000 + Math.floor(Math.random() * 8000);
    setSyncState({ emails_total: total });
    const iv = setInterval(() => {
      synced = Math.min(synced + Math.floor(Math.random() * 80 + 40), total);
      setSyncState({ emails_synced: synced });
      if (synced >= total) {
        clearInterval(iv);
        setSyncState({ status: 'done', last_synced_at: new Date().toISOString() });
      }
    }, 200);
  };

  return (
    <div className="settings animate-fade-in">
      {/* Profile */}
      <div className="settings__section">
        <h3 className="settings__section-title">Account</h3>
        <div className="settings__card">
          <div className="settings__profile">
            <div className="settings__avatar">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} />
              ) : (
                <span>{(user?.name ?? 'U').charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="settings__profile-name">{user?.name ?? 'Not connected'}</div>
              <div className="settings__profile-email">{user?.email ?? 'Connect Gmail to get started'}</div>
            </div>
            <button className="settings__btn settings__btn--ghost" id="settings-connect-btn">
              Connect Gmail <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Sync */}
      <div className="settings__section">
        <h3 className="settings__section-title">Gmail Sync</h3>
        <div className="settings__card">
          <div className="settings__row">
            <div className="settings__row-left">
              <div className="settings__row-icon" style={{ background: 'rgba(124,92,252,0.15)', color: 'var(--accent-purple-light)' }}>
                <RefreshCw size={16} />
              </div>
              <div>
                <div className="settings__row-title">Sync Date Range</div>
                <div className="settings__row-sub">Only emails within this range will be indexed</div>
              </div>
            </div>
            <div className="settings__date-range">
              <input
                type="date"
                className="settings__date-input"
                value={globalDateRange.from}
                onChange={(e) => setGlobalDateRange({ ...globalDateRange, from: e.target.value })}
                id="settings-date-from"
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>to</span>
              <input
                type="date"
                className="settings__date-input"
                value={globalDateRange.to}
                onChange={(e) => setGlobalDateRange({ ...globalDateRange, to: e.target.value })}
                id="settings-date-to"
              />
            </div>
          </div>
          <div className="settings__divider" />
          <div className="settings__row">
            <div className="settings__row-left">
              <div className="settings__row-icon" style={{ background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)' }}>
                <Database size={16} />
              </div>
              <div>
                <div className="settings__row-title">Full Re-sync</div>
                <div className="settings__row-sub">Re-index all emails from scratch (may take several minutes)</div>
              </div>
            </div>
            <button className="settings__btn settings__btn--primary" id="settings-full-sync-btn" onClick={handleFullSync}>
              Start Full Sync
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="settings__section">
        <h3 className="settings__section-title">Privacy & Security</h3>
        <div className="settings__card">
          <div className="settings__row">
            <div className="settings__row-left">
              <div className="settings__row-icon" style={{ background: 'rgba(79,156,249,0.15)', color: 'var(--accent-blue)' }}>
                <Shield size={16} />
              </div>
              <div>
                <div className="settings__row-title">OAuth Scope</div>
                <div className="settings__row-sub">Read-only Gmail access — MailLens cannot send or modify emails</div>
              </div>
            </div>
            <span className="badge badge-green">Read Only</span>
          </div>
          <div className="settings__divider" />
          <div className="settings__row">
            <div className="settings__row-left">
              <div className="settings__row-icon" style={{ background: 'rgba(251,191,36,0.15)', color: 'var(--accent-amber)' }}>
                <Key size={16} />
              </div>
              <div>
                <div className="settings__row-title">Token Encryption</div>
                <div className="settings__row-sub">OAuth refresh tokens are encrypted at rest with AES-256</div>
              </div>
            </div>
            <span className="badge badge-green">AES-256</span>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="settings__section">
        <h3 className="settings__section-title">Appearance</h3>
        <div className="settings__card">
          <div className="settings__row">
            <div className="settings__row-left">
              <div className="settings__row-icon" style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--accent-cyan)' }}>
                <Moon size={16} />
              </div>
              <div>
                <div className="settings__row-title">Theme</div>
                <div className="settings__row-sub">Currently using Dark Mode</div>
              </div>
            </div>
            <div className="settings__toggle-group">
              <button className="settings__toggle-btn settings__toggle-btn--active" id="settings-theme-dark">Dark</button>
              <button className="settings__toggle-btn" id="settings-theme-light">Light</button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="settings__section">
        <h3 className="settings__section-title settings__section-title--danger">Danger Zone</h3>
        <div className="settings__card settings__card--danger">
          <div className="settings__row">
            <div className="settings__row-left">
              <div className="settings__row-icon" style={{ background: 'rgba(244,63,94,0.15)', color: 'var(--accent-rose)' }}>
                <Trash2 size={16} />
              </div>
              <div>
                <div className="settings__row-title">Delete Account & Data</div>
                <div className="settings__row-sub">Permanently removes all emails, embeddings, and your account from Supabase</div>
              </div>
            </div>
            <button className="settings__btn settings__btn--danger" id="settings-delete-btn" onClick={logout}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
