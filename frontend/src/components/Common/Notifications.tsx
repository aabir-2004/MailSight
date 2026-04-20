import React from 'react';
import { useAppStore } from '../../store/appStore';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import './Notifications.css';

const ICONS = {
  success: <CheckCircle size={16} />,
  error:   <XCircle size={16} />,
  info:    <Info size={16} />,
  warning: <AlertTriangle size={16} />,
};

const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useAppStore();

  return (
    <div className="notifications" aria-live="polite">
      {notifications.map((n) => (
        <div key={n.id} className={`notification notification--${n.type} animate-slide-left`}>
          <span className={`notification__icon notification__icon--${n.type}`}>{ICONS[n.type]}</span>
          <div className="notification__body">
            <div className="notification__title">{n.title}</div>
            {n.message && <div className="notification__msg">{n.message}</div>}
          </div>
          <button className="notification__close" onClick={() => removeNotification(n.id)}>
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;
