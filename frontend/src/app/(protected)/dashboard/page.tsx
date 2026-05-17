'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { getStatusColor, getPriorityColor, getStatusLabel } from '@/lib/constants';
import {
  Ticket, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users,
  BarChart3, ArrowUpRight, ShoppingBag, DollarSign, Award,
  Package
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import styles from './dashboard.module.css';

function KPICard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType; label: string; value: string | number; color: string; sub?: string;
}) {
  return (
    <div className={styles.kpiCard}>
      <div className={styles.kpiIcon} style={{ background: `${color}15`, color }}>
        <Icon size={22} />
      </div>
      <div className={styles.kpiInfo}>
        <span className={styles.kpiLabel}>{label}</span>
        <strong className={styles.kpiValue}>{value}</strong>
        {sub && <span className={styles.kpiSub}>{sub}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then(meRes => {
      if (meRes.success) {
        setCurrentUser(meRes.data);
        const isConsulting = meRes.data.role === 'Agent' && meRes.data.agentId && (
          meRes.data.agentId >= 'AGT-1025' && meRes.data.agentId <= 'AGT-1034'
        );
        if (isConsulting) {
          api.getOrders({ assignedTo: meRes.data.agentId, limit: 100 }).then(ordRes => {
            if (ordRes.success) {
              setOrders(ordRes.data);
            }
            setLoading(false);
          });
        } else {
          api.getDashboard().then(res => {
            if (res.success) setStats(res.data);
            setLoading(false);
          });
        }
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className={styles.grid || ''} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  const isConsultingAgent = currentUser?.role === 'Agent' && currentUser?.agentId && (
    currentUser.agentId >= 'AGT-1025' && currentUser.agentId <= 'AGT-1034'
  );

  if (isConsultingAgent) {
    // --- CONSULTING ORDER METRICS ---
    const totalOrders = orders.length;
    const processingCount = orders.filter(o => o.status === 'Processing').length;
    const shippedCount = orders.filter(o => o.status === 'Shipped').length;
    const deliveredCount = orders.filter(o => o.status === 'Delivered' || o.status === 'Work Completed').length;
    const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;
    
    // Total Revenue (exclude cancelled)
    const totalRevenue = orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      
    const avgOrderValue = totalOrders - cancelledCount > 0 
      ? (totalRevenue / (totalOrders - cancelledCount)) 
      : 0;

    const formattedRevenue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue);
    const formattedAvgValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(avgOrderValue);

    // Chart 1: Order Trend
    const trendMap: Record<string, number> = {};
    orders.forEach(o => {
      const dateStr = o.orderDate ? o.orderDate.slice(0, 10) : '';
      if (dateStr) trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
    });
    const orderTrendData = Object.entries(trendMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15);

    // Chart 2: Status Distribution
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const statusColors: Record<string, string> = {
      'Processing': '#3b82f6',
      'Shipped': '#f59e0b',
      'Delivered': '#10b981',
      'Work Completed': '#818cf8',
      'Waiting Customer': '#a855f7',
      'Cancelled': '#ef4444',
      'Returned': '#ec4899',
    };
    const orderStatusData = Object.entries(statusCounts).map(([name, value]) => ({
      name, value, color: statusColors[name] || '#64748b'
    }));

    // Chart 3: Product Share
    const productCounts: Record<string, number> = {};
    orders.forEach(o => {
      productCounts[o.product] = (productCounts[o.product] || 0) + 1;
    });
    const orderProductData = Object.entries(productCounts).map(([name, value]) => ({
      name: name.length > 20 ? name.slice(0, 18) + '...' : name,
      value
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // Chart 4: Priority Breakdown
    const priorityCounts: Record<string, number> = {};
    orders.forEach(o => {
      const p = o.priority || 'Standard';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    });
    const priorityColors: Record<string, string> = {
      'Standard': '#6366f1',
      'VIP': '#ec4899',
      'Consulting': '#f59e0b'
    };
    const orderPriorityData = Object.entries(priorityCounts).map(([name, value]) => ({
      name, value, color: priorityColors[name] || '#64748b'
    }));

    // Top Products ranking by value
    const productRevenue: Record<string, number> = {};
    orders.forEach(o => {
      productRevenue[o.product] = (productRevenue[o.product] || 0) + (Number(o.amount) || 0);
    });
    const orderTopProducts = Object.entries(productRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return (
      <div className={styles.dashboard}>
        {/* Consulting Support Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'rgba(245,158,11,0.1)',
            color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--text-primary)' }}>Consulting Support Workspace</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
              Certified Consulting Specialist: <strong style={{ color: '#f59e0b' }}>{currentUser.name}</strong>. Managing consulting orders, status flows, and client chats.
            </p>
          </div>
        </div>

        {/* KPI Row */}
        <div className={styles.kpiRow}>
          <KPICard icon={ShoppingBag} label="Total Orders" value={totalOrders} color="#f59e0b" />
          <KPICard icon={Clock} label="Processing" value={processingCount} color="#3b82f6" />
          <KPICard icon={TrendingUp} label="Shipped" value={shippedCount} color="#a855f7" />
          <KPICard icon={CheckCircle2} label="Delivered" value={deliveredCount} color="#10b981" />
          <KPICard icon={DollarSign} label="Revenue" value={formattedRevenue} color="#10b981" sub="Excl. Cancelled" />
          <KPICard icon={Award} label="Avg Order Value" value={formattedAvgValue} color="#6366f1" />
        </div>

        {/* Charts Row */}
        <div className={styles.chartsRow}>
          {/* Order Trend */}
          <div className={styles.chartCard}>
            <h3><BarChart3 size={18} /> Order Trend (15 days)</h3>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={orderTrendData}>
                  <defs>
                    <linearGradient id="orderTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="url(#orderTrendGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Distribution */}
          <div className={styles.chartCard}>
            <h3>Order Status Share</h3>
            <div className={styles.chartBody} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={orderStatusData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                    {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legend}>
                {orderStatusData.map((s, i) => (
                  <div key={i} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: s.color }} />
                    <span>{s.name}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className={styles.bottomRow}>
          {/* Product Volume Share */}
          <div className={styles.chartCard}>
            <h3>Product Volume Share</h3>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={orderProductData} layout="vertical" barSize={20}>
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className={styles.chartCard}>
            <h3>Order Priority Breakdown</h3>
            <div className={styles.chartBody}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={orderPriorityData} barSize={36}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {orderPriorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products */}
          <div className={styles.chartCard}>
            <h3><Package size={18} /> Top Products by Revenue</h3>
            <div className={styles.agentList}>
              {orderTopProducts.map((p, i) => (
                <div key={i} className={styles.agentRow}>
                  <div className={styles.agentRank}>#{i + 1}</div>
                  <div className={styles.agentAvatar} style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}>P</div>
                  <div className={styles.agentInfo}>
                    <strong title={p.name}>{p.name.length > 20 ? p.name.slice(0, 18) + '...' : p.name}</strong>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.revenue)}</span>
                  </div>
                  <div className={styles.agentBar}>
                    <div style={{
                      width: `${(p.revenue / (orderTopProducts[0]?.revenue || 1)) * 100}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #ec4899)'
                    }} />
                  </div>
                </div>
              ))}
              {orderTopProducts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No orders processed yet</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- REGULAR TICKET DASHBOARD ---
  if (!stats) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60 }}>
      <p>Unable to load dashboard data. Please configure your GAS URL in <code>.env.local</code></p>
    </div>;
  }

  const statusData = Object.entries(stats.byStatus).map(([name, value]) => ({
    name: getStatusLabel(name), value, color: getStatusColor(name)
  }));

  const channelData = Object.entries(stats.byChannel).map(([name, value]) => ({
    name, value
  }));

  const priorityData = Object.entries(stats.byPriority).map(([name, value]) => ({
    name, value, color: getPriorityColor(name)
  }));

  return (
    <div className={styles.dashboard}>
      {/* Agent Specialization Banner */}
      {stats.agentContext && stats.agentContext.categories.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(129,140,248,0.05))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: 'rgba(99,102,241,0.1)',
            color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Ticket size={20} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--text-primary)' }}>Your Specialty</h3>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
              You are assigned to handle tickets for: <strong style={{ color: '#818cf8' }}>{stats.agentContext.categories.join(', ')}</strong>
            </p>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className={styles.kpiRow}>
        <KPICard icon={Ticket} label="Total Tickets" value={stats.total} color="#6366f1" />
        <KPICard icon={Clock} label="Open" value={stats.open} color="#3b82f6" sub={`${stats.pending} pending`} />
        <KPICard icon={CheckCircle2} label="Resolved" value={stats.resolved} color="#10b981" />
        <KPICard icon={TrendingUp} label="Avg Resolution" value={`${stats.avgResolutionHours}h`} color="#f59e0b" />
        <KPICard icon={AlertTriangle} label="SLA Breach" value={`${stats.slaBreachPct}%`} color="#ef4444" sub={`${stats.slaBreached} tickets`} />
        <KPICard icon={ArrowUpRight} label="Escalated" value={stats.escalated} color="#a855f7" />
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Ticket Trend */}
        <div className={styles.chartCard}>
          <h3><BarChart3 size={18} /> Ticket Trend (30 days)</h3>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v: string) => v.slice(5)} interval={4} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#trendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className={styles.chartCard}>
          <h3>Status Distribution</h3>
          <div className={styles.chartBody} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {statusData.map((s, i) => (
                <div key={i} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: s.color }} />
                  <span>{s.name}</span>
                  <strong>{s.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomRow}>
        {/* Channel Distribution */}
        <div className={styles.chartCard}>
          <h3>Channel Distribution</h3>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={channelData} layout="vertical" barSize={20}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className={styles.chartCard}>
          <h3>Priority Breakdown</h3>
          <div className={styles.chartBody}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} barSize={36}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={{ background: '#1a1a3e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Agents */}
        <div className={styles.chartCard}>
          <h3><Users size={18} /> Top Agents</h3>
          <div className={styles.agentList}>
            {stats.topAgents.map((agent, i) => (
              <div key={i} className={styles.agentRow}>
                <div className={styles.agentRank}>#{i + 1}</div>
                <div className={styles.agentAvatar}>{agent.name[0]}</div>
                <div className={styles.agentInfo}>
                  <strong>{agent.name}</strong>
                  <span>{agent.resolved} resolved</span>
                </div>
                <div className={styles.agentBar}>
                  <div style={{ width: `${(agent.resolved / (stats.topAgents[0]?.resolved || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
            {stats.topAgents.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No resolved tickets yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
