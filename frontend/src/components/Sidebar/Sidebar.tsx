import React from 'react';
import {
  Home, Search, LayoutDashboard, Beaker,
  Settings, ChevronLeft, ChevronRight,
  Mail, Zap, TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import type { Page } from '../../types';
import './Sidebar.css';

const NAV_ITEMS: { id: Page; icon: React.ReactNode; label: string; badge?: string }[] = [
  { id: 'home',      icon: <Home size={18} />,          label: 'Home' },
  { id: 'search',    icon: <Search size={18} />,        label: 'Smart Search' },
  { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Analytics' },
  { id: 'analyse',   icon: <Beaker size={18} />,        label: 'AI Analysis' },
  { id: 'settings',  icon: <Settings size={18} />,      label: 'Settings' },
];

const Sidebar: React.FC = () => {
  const { activePage, setActivePage, sidebarCollapsed, toggleSidebar, syncState } = useAppStore();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <Mail size={20} />
        </div>
        {!sidebarCollapsed && (
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-name">MailLens</span>
            <span className="sidebar__logo-tag">AI Platform</span>
          </div>
        )}
      </div>

      <div className="sidebar__divider" />

      {/* Sync Status */}
      {!sidebarCollapsed && (
        <div className="sidebar__sync-status">
          <div className={`sidebar__sync-dot ${syncState.status === 'syncing' ? 'sidebar__sync-dot--active' : ''}`} />
          <span className="sidebar__sync-text">
            {syncState.status === 'syncing'
              ? `Syncing… ${syncState.emails_synced}/${syncState.emails_total}`
              : syncState.last_synced_at
              ? 'Up to date'
              : 'Not synced'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar__nav-item ${activePage === item.id ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => setActivePage(item.id)}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            {!sidebarCollapsed && <span className="sidebar__nav-label">{item.label}</span>}
            {!sidebarCollapsed && item.badge && (
              <span className="sidebar__nav-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom stats */}
      {!sidebarCollapsed && (
        <div className="sidebar__stats">
          <div className="sidebar__stat">
            <Zap size={12} className="sidebar__stat-icon" />
            <span>Groq LLM Active</span>
          </div>
          <div className="sidebar__stat">
            <TrendingUp size={12} className="sidebar__stat-icon" />
            <span>Free tier</span>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button className="sidebar__toggle" onClick={toggleSidebar} id="sidebar-toggle">
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};

export default Sidebar;
