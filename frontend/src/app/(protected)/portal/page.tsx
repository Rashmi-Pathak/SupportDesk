'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { Ticket } from '@/lib/types';
import { getStatusColor, getStatusLabel, formatTimeAgo, getPriorityColor } from '@/lib/constants';
import {
  PlusCircle, Inbox, CheckCircle, Clock, AlertTriangle,
  ArrowRight, Ticket as TicketIcon, ShoppingBag
} from 'lucide-react';
import { OrderHistory } from '@/components/orders/order-history';
import styles from './portal.module.css';

export default function PortalPage() {
  const { user, isCustomer, isLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isCustomer) {
      router.push('/dashboard');
      return;
    }
    loadTickets();
  }, [isLoading, isCustomer, router]);

  const loadTickets = async () => {
    setLoading(true);
    const res = await api.customerGetMyTickets({ limit: 10 });
    if (res.success && res.data) {
      setTickets(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status !== 'Resolved').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    pending: tickets.filter(t => t.status === 'Pending').length,
  };

  if (isLoading || loading) {
    return (
      <div className={styles.loadingState}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p>Loading your portal...</p>
      </div>
    );
  }

  return (
    <div className={styles.portal}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomeAvatar}>{user?.name?.[0] || '?'}</div>
          <div>
            <h1 className={styles.welcomeTitle}>
              Welcome back, {user?.name?.split(' ')[0] || 'Customer'}! 👋
            </h1>
            <p className={styles.welcomeSub}>
              Track your support tickets and get help from our team.
            </p>
          </div>
        </div>
        <button className={styles.newTicketBtn} onClick={() => router.push('/new-ticket')}>
          <PlusCircle size={20} />
          <span>Create New Ticket</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <TicketIcon size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>Total Tickets</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.open}</span>
            <span className={styles.statLabel}>Open Tickets</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CheckCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.resolved}</span>
            <span className={styles.statLabel}>Resolved</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
        </div>
      </div>

      {/* Recent Tickets & Orders Grid */}
      <div className={styles.dashboardGrid}>
        {/* Recent Tickets */}
        <div className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2>Recent Tickets</h2>
            <button className={styles.viewAllBtn} onClick={() => router.push('/my-tickets')}>
              View All <ArrowRight size={16} />
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox size={48} strokeWidth={1.2} />
              <h3>No tickets yet</h3>
              <p>Create your first support ticket to get help from our team.</p>
              <button className="btn btn-primary" onClick={() => router.push('/new-ticket')}>
                <PlusCircle size={18} /> Create Ticket
              </button>
            </div>
          ) : (
            <div className={styles.ticketList}>
              {tickets.slice(0, 5).map(ticket => (
                <div
                  key={ticket.ticketId}
                  className={styles.ticketCard}
                  onClick={() => router.push(`/my-tickets?view=${ticket.ticketId}`)}
                >
                  <div className={styles.ticketCardLeft}>
                    <span className={styles.ticketId}>{ticket.ticketId}</span>
                    <h4 className={styles.ticketSubject}>{ticket.subject}</h4>
                    <div className={styles.ticketMeta}>
                      <span className={styles.ticketCategory}>{ticket.queryTheme}</span>
                      <span className={styles.ticketTime}>{formatTimeAgo(ticket.createdAt)}</span>
                    </div>
                  </div>
                  <div className={styles.ticketCardRight}>
                    <span
                      className={styles.ticketStatus}
                      style={{ color: getStatusColor(ticket.status), borderColor: getStatusColor(ticket.status) }}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span
                      className={styles.ticketPriority}
                      style={{ color: getPriorityColor(ticket.priority) }}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className={styles.ordersSection}>
          <div className={styles.sectionHeader}>
            <h2><ShoppingBag size={20} /> Your Recent Orders</h2>
            <button className={styles.viewAllBtn} onClick={() => router.push('/my-orders')}>
              View All <ArrowRight size={16} />
            </button>
          </div>
          <div className={styles.ordersContainer}>
            {user?.customerId && <OrderHistory customerId={user.customerId} />}
          </div>
        </div>
      </div>
    </div>
  );
}
