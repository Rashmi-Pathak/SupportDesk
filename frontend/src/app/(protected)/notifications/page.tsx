'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Bell, CheckCircle2, Clock, Info, AlertCircle, AlertTriangle } from 'lucide-react';
import styles from './notifications.module.css';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/constants';

interface Notification {
  notificationId: string;
  title: string;
  message: string;
  type: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const res = await api.getNotifications();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await api.markAllNotificationsRead();
  };

  const handleRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n));
    await api.markNotificationRead(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1><Bell size={24} /> Notifications</h1>
        {notifications.some(n => !n.isRead) && (
          <button className={styles.markAllBtn} onClick={handleMarkAll}>
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <Bell size={48} strokeWidth={1.5} />
          <h3>No notifications yet</h3>
          <p>When there are updates to your tickets, they will appear here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map(n => (
            <Link 
              key={n.notificationId} 
              href={n.link || '#'} 
              className={`${styles.notification} ${!n.isRead ? styles.unread : ''}`}
              onClick={() => { if (!n.isRead) handleRead(n.notificationId); }}
            >
              <div className={`${styles.iconWrap} ${styles[n.type] || styles.info}`}>
                {getIcon(n.type)}
              </div>
              <div className={styles.content}>
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <div className={styles.meta}>
                  <Clock size={12} />
                  <span>{formatTimeAgo(n.createdAt)}</span>
                  {!n.isRead && <span className={styles.unreadDot} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
