import React from 'react';
import { Search, LayoutDashboard, Beaker, TrendingUp, Mail, Zap, ArrowRight, Star } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useQuery } from '@tanstack/react-query';
import { fetchSummary } from '../api/analytics';
import './HomePage.css';

const QUICK_ACTIONS = [
  { id: 'go-search',    icon: <Search size={20} />,         label: 'Smart Search',    desc: 'Ask anything about your inbox',   page: 'search'    as const, color: 'purple' },
  { id: 'go-dashboard', icon: <LayoutDashboard size={20} />, label: 'Analytics',       desc: 'Charts · Heatmaps · Trends',      page: 'dashboard' as const, color: 'blue'   },
  { id: 'go-analyse',   icon: <Beaker size={20} />,          label: 'AI Analysis',     desc: 'Free-form custom queries',        page: 'analyse'   as const, color: 'green'  },
];

const RECENT_INSIGHTS = [
  { icon: <TrendingUp size={14} />, text: 'Email volume up 12% this week vs last week', color: 'green' },
  { icon: <Mail size={14} />,       text: 'You have 1,204 unread emails',               color: 'amber' },
  { icon: <Zap size={14} />,        text: 'GitHub is your busiest sender this month',   color: 'purple' },
  { icon: <Star size={14} />,       text: '87 starred emails worth reviewing',          color: 'blue'  },
];

const HomePage: React.FC = () => {
  const { setActivePage, user } = useAppStore();
  const { data: summary } = useQuery({ queryKey: ['summary'], queryFn: fetchSummary, staleTime: 5 * 60 * 1000 });

  const formatNum = (n?: number) => {
    if (n === undefined) return '—';
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
  };

  return (
    <div className="home animate-fade-in">
      {/* Hero */}
      <div className="home__hero">
        <div>
          <h2 className="home__hero-title">
            Good {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'there'}</span>
          </h2>
          <p className="home__hero-sub">
            Your inbox at a glance — {formatNum(summary?.total_emails)} emails indexed, AI-powered insights ready.
          </p>
        </div>
        <div className="home__hero-stats">
          <div className="home__hero-stat" id="hero-stat-emails">
            <span className="home__hero-stat-value gradient-text">{formatNum(summary?.total_emails)}</span>
            <span className="home__hero-stat-label">Emails</span>
          </div>
          <div className="home__hero-stat-divider" />
          <div className="home__hero-stat" id="hero-stat-senders">
            <span className="home__hero-stat-value">{formatNum(summary?.total_senders)}</span>
            <span className="home__hero-stat-label">Senders</span>
          </div>
          <div className="home__hero-stat-divider" />
          <div className="home__hero-stat" id="hero-stat-unread">
            <span className="home__hero-stat-value" style={{ color: 'var(--accent-rose)' }}>{formatNum(summary?.unread_count)}</span>
            <span className="home__hero-stat-label">Unread</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home__section">
        <h3 className="home__section-title">Quick Actions</h3>
        <div className="home__actions-grid">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              id={a.id}
              className={`home__action-card home__action-card--${a.color}`}
              onClick={() => setActivePage(a.page)}
            >
              <div className={`home__action-icon home__action-icon--${a.color}`}>{a.icon}</div>
              <div className="home__action-body">
                <div className="home__action-label">{a.label}</div>
                <div className="home__action-desc">{a.desc}</div>
              </div>
              <ArrowRight size={16} className="home__action-arrow" />
            </button>
          ))}
        </div>
      </div>

      {/* Insights strip */}
      <div className="home__section">
        <h3 className="home__section-title">Latest Insights</h3>
        <div className="home__insights">
          {RECENT_INSIGHTS.map((ins, i) => (
            <div key={i} className={`home__insight home__insight--${ins.color} animate-fade-in`} style={{ animationDelay: `${i * 80}ms` }}>
              <span className={`home__insight-icon home__insight-icon--${ins.color}`}>{ins.icon}</span>
              <span>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sync CTA */}
      <div className="home__sync-cta glass-card" id="home-sync-cta">
        <div className="home__sync-cta-left">
          <div className="home__sync-cta-icon">
            <Mail size={22} />
          </div>
          <div>
            <div className="home__sync-cta-title">Connect your Gmail</div>
            <div className="home__sync-cta-sub">Authenticate with Google to start ingesting your inbox. Read-only access — your data stays private.</div>
          </div>
        </div>
        <button className="home__sync-cta-btn" id="home-connect-gmail-btn" onClick={() => setActivePage('settings')}>
          Connect Gmail <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default HomePage;
