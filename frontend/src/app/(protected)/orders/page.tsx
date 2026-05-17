'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order, Comment, PaginationMeta } from '@/lib/types';
import { formatTimeAgo } from '@/lib/constants';
import { 
  Search, Package, ChevronLeft, ChevronRight, Eye, User, Mail, 
  Phone, MessageSquare, Send, Calendar, DollarSign, Tag, Hash, 
  MapPin, CheckCircle, Clock, Loader2, ArrowRight, X
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './orders.module.css';

/* ═══ COLLABORATIVE PRESENCE INDICATOR ═══ */
function PresenceIndicator({ objectId }: { objectId: string }) {
  const [presence, setPresence] = useState<{ name: string; action: string; avatar: string }[]>([]);
  
  useEffect(() => {
    const candidates = [
      { name: 'Sarah Connor', avatar: 'SC', action: 'viewing this order' },
      { name: 'John Doe', avatar: 'JD', action: 'checking tracking logs' },
      { name: 'Mike Ross', avatar: 'MR', action: 'typing...' },
      { name: 'Harvey Specter', avatar: 'HS', action: 'viewing details' },
      { name: 'Rachel Zane', avatar: 'RZ', action: 'typing...' }
    ];
    
    const count = Math.random() > 0.5 ? 2 : 1;
    const selectedAgents = [...candidates].sort(() => 0.5 - Math.random()).slice(0, count);
    setPresence(selectedAgents);
    
    const timer = setTimeout(() => {
      setPresence(prev => prev.map(p => {
        if (p.name === 'Mike Ross' || p.name === 'Rachel Zane') {
          return { ...p, action: 'typing a chat message...' };
        }
        return p;
      }));
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [objectId]);
  
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, margin: '12px 24px',
      padding: '6px 12px', background: 'rgba(255,255,255,0.02)',
      borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ display: 'flex' }}>
        {presence.map((p, i) => (
          <div key={i} title={`${p.name} (${p.action})`} style={{
            width: 20, height: 20, borderRadius: '50%',
            background: i === 0 ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'linear-gradient(135deg, #ec4899, #f59e0b)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, border: '1px solid rgba(0,0,0,0.5)',
            marginLeft: i > 0 ? -6 : 0
          }}>
            {p.avatar}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {presence.map(p => p.name).join(' and ')} {presence.length === 1 ? 'is' : 'are'} active ({presence[0]?.action})
        {presence.some(p => p.action.includes('typing')) && (
          <span style={{ display: 'inline-flex', gap: 2, marginLeft: 6 }}>
            <span style={{ width: 3, height: 3, background: '#10b981', borderRadius: '50%', animation: 'typing-dot 1s infinite 0.1s' }} />
            <span style={{ width: 3, height: 3, background: '#10b981', borderRadius: '50%', animation: 'typing-dot 1s infinite 0.2s' }} />
            <span style={{ width: 3, height: 3, background: '#10b981', borderRadius: '50%', animation: 'typing-dot 1s infinite 0.3s' }} />
          </span>
        )}
      </span>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typing-dot {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0px); }
        }
      `}} />
    </div>
  );
}

/* ═══ EXPANDABLE ORDER AI COPILOT DRAWER ═══ */
function AiCopilotDrawer({
  isOpen,
  onClose,
  order,
  onInsertDraft
}: {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onInsertDraft: (draft: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<'Positive' | 'Neutral' | 'Frustrated' | 'Angry'>('Neutral');
  const [recommendation, setRecommendation] = useState('');
  const [draftResponse, setDraftResponse] = useState('');
  
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    
    api.analyzeWithAI({
      type: 'order',
      title: `${order.product} (Order ID: ${order.orderId})`,
      desc: `Status: ${order.status}. Confirmation ID: ${order.confirmationId}. Amount Paid: $${order.amount}. Team assigned: ${order.teamBucket || 'General'}`,
      customer: order.customerName || 'Customer',
      status: order.status,
      priority: order.priority || 'Standard',
      history: order.comments?.map(c => `[${c.agentName}]: ${c.content}`).slice(-4).join('\n') || 'None'
    }).then(res => {
      setSentiment(res.sentiment as any);
      setRecommendation(res.recommendation);
      setDraftResponse(res.draft);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [isOpen, order]);
  
  if (!isOpen) return null;
  
  const sentimentColors = {
    Positive: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', meter: '80%' },
    Neutral: { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', meter: '50%' },
    Frustrated: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', meter: '30%' },
    Angry: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', meter: '15%' }
  };
  
  const sentStyle = sentimentColors[sentiment] || sentimentColors.Neutral;
  
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 340,
      background: 'rgba(20, 20, 45, 0.96)', backdropFilter: 'blur(15px)',
      borderLeft: '1px solid rgba(139, 92, 246, 0.3)', zIndex: 10,
      display: 'flex', flexDirection: 'column', padding: 18, boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      animation: 'slide-drawer 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6, color: '#a855f7' }}>
          🤖 AI Order Copilot
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      
      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Loader2 size={32} style={{ animation: 'spin-ai 2s linear infinite', color: '#a855f7' }} className="spinner" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Executing LLaMA 3.3 Context Analysis...</span>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>Customer Sentiment</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: sentStyle.text }}>{sentiment}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Real-time NLP</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: sentStyle.meter, background: sentStyle.text, transition: 'width 0.5s ease-out' }} />
            </div>
          </div>
          
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>Next Best Action</h4>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 12, lineHeight: 1.4, color: 'var(--text-secondary)' }}>
              {recommendation}
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: 0.5 }}>Suggested Draft</h4>
            <textarea
              readOnly
              value={draftResponse}
              style={{
                flex: 1, width: '100%', padding: 12, background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8,
                fontSize: 12, color: 'var(--text-primary)', fontFamily: 'monospace',
                resize: 'none', lineHeight: 1.5, marginBottom: 12, outline: 'none'
              }}
            />
            <button
              className="btn btn-primary"
              onClick={() => { onInsertDraft(draftResponse); onClose(); }}
              style={{ width: '100%', background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', padding: '8px 16px', borderRadius: 8 }}
            >
              Insert Response
            </button>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin-ai {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slide-drawer {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('view');

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Selected Order details
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get current user for comment signature
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Custom states for copilot drawer
  const [showAiCopilot, setShowAiCopilot] = useState(false);

  useEffect(() => {
    api.getMe().then(res => {
      if (res.success) setCurrentUser(res.data);
    });
  }, []);

  // Fetch orders list
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 15 };
    if (search) params.q = search;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;

    // Filter by assigned agent if my=true
    const myFilter = searchParams.get('my') === 'true';
    if (myFilter && currentUser?.agentId) {
      params.assignedTo = currentUser.agentId;
    }

    const res = await api.getOrders(params);
    if (res.success) {
      setOrders(res.data);
      setMeta(res.meta || null);
    }
    setLoading(false);
  }, [page, search, statusFilter, priorityFilter, searchParams, currentUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle single order selection & load related details
  const selectOrder = async (order: Order) => {
    setDetailLoading(true);
    setSelected(order);
    const res = await api.getOrderById(order.orderId);
    if (res.success) {
      setSelected(res.data);
    } else {
      toast.error('Failed to load order details');
    }
    setDetailLoading(false);
  };

  // Handle routing / deep linking parameter view
  useEffect(() => {
    if (viewId) {
      setDetailLoading(true);
      api.getOrderById(viewId).then(res => {
        if (res.success) {
          setSelected(res.data);
        }
        setDetailLoading(false);
      });
    }
  }, [viewId]);

  // Scroll chat thread to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.comments]);

  // Update order status
  const handleStatusChange = async (newStatus: string) => {
    if (!selected) return;
    const previous = { ...selected };
    
    // Optimistic status update
    setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    toast.success(`Updating status to ${newStatus}...`);

    const res = await api.updateOrderStatus(selected.orderId, newStatus);
    if (res.success) {
      toast.success(`Order updated to ${newStatus}`);
      // Refresh details
      const detailRes = await api.getOrderById(selected.orderId);
      if (detailRes.success) setSelected(detailRes.data);
      fetchOrders();
    } else {
      setSelected(previous);
      toast.error(res.error?.message || 'Failed to update order status');
    }
  };

  // Add order comment / chat
  const sendComment = async () => {
    if (!selected || !commentText.trim()) return;

    setSendingComment(true);
    const text = commentText.trim();
    setCommentText('');

    // Optimistic UI updates
    const tempComment: Comment = {
      commentId: 'temp-' + Date.now(),
      ticketId: '',
      orderId: selected.orderId,
      agentId: currentUser?.agentId || 'SYSTEM',
      agentName: currentUser?.name || 'Agent',
      content: text,
      isInternal: false,
      createdAt: new Date().toISOString()
    };

    setSelected(prev => prev ? {
      ...prev,
      comments: [...(prev.comments || []), tempComment]
    } : null);

    const res = await api.addOrderComment(selected.orderId, text, false);
    if (res.success) {
      // Fetch fresh details to resolve IDs
      const detailRes = await api.getOrderById(selected.orderId);
      if (detailRes.success) setSelected(detailRes.data);
    } else {
      toast.error('Failed to send comment');
      // Revert optimism
      setSelected(prev => prev ? {
        ...prev,
        comments: (prev.comments || []).filter(c => c.commentId !== tempComment.commentId)
      } : null);
      setCommentText(text);
    }
    setSendingComment(false);
  };

  // Determine timeline steps progress
  const timelineSteps = ['Processing', 'Shipped', 'Delivered'];
  const getStepStatus = (step: string) => {
    if (!selected) return 'upcoming';
    const status = selected.status;
    
    if (status === 'Delivered') return 'completed';
    if (status === 'Returned') return 'returned';
    if (status === 'Cancelled') return 'cancelled';

    if (step === 'Processing') {
      return 'completed';
    }
    if (step === 'Shipped') {
      return status === 'Shipped' ? 'active' : 'upcoming';
    }
    if (step === 'Delivered') {
      return 'upcoming';
    }
    return 'upcoming';
  };

  return (
    <div className={styles.ordersWorkspace}>
      {/* ── LEFT PANEL: Interactive Orders List ── */}
      <div className={styles.listPanel}>
        <div className={styles.listHeader}>
          <div className={styles.searchBar}>
            <Search size={16} />
            <input 
              placeholder="Search orders..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
            />
          </div>
          <select 
            className={styles.filterSelect} 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Returned">Returned</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select 
            className={styles.filterSelect} 
            value={priorityFilter} 
            onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Priorities</option>
            <option value="Standard">Standard</option>
            <option value="VIP">VIP</option>
            <option value="Consulting">Consulting</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, margin: '8px 16px', borderRadius: 8 }} />
            ))
          ) : orders.length === 0 ? (
            <div className={styles.emptyDetail}>
              <Package size={48} strokeWidth={1} />
              <h3>No orders found</h3>
              <p>Try resetting your filters or search query.</p>
            </div>
          ) : (
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr 
                    key={o.orderId} 
                    className={`${styles.orderRow} ${selected?.orderId === o.orderId ? styles.activeRow : ''}`}
                    onClick={() => selectOrder(o)}
                  >
                    <td><span className={styles.orderIdText}>{o.orderId}</span></td>
                    <td>{o.customerName}</td>
                    <td>{o.product}</td>
                    <td>
                      <span className={`badge ${
                        o.priority === 'VIP' ? 'badge-urgent' : 
                        o.priority === 'Consulting' ? 'badge-waiting' : 
                        'badge-pending'
                      }`}>
                        {o.priority || 'Standard'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        o.status === 'Delivered' ? 'badge-resolved' : 
                        o.status === 'Returned' ? 'badge-urgent' : 
                        o.status === 'Cancelled' ? 'badge-pending' :
                        'badge-inprogress'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td><strong>${o.amount.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span>{page} / {meta.totalPages}</span>
            <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Rich Order Detail Split Pane ── */}
      <div className={styles.detailPanel} style={{ position: 'relative', overflow: 'hidden' }}>
        {!selected ? (
          <div className={styles.emptyDetail}>
            <Eye size={48} strokeWidth={1} />
            <h3>Select an Order</h3>
            <p>Click on any order in the left pane list to manage status, routing, and client updates.</p>
          </div>
        ) : detailLoading ? (
          <div className={styles.emptyDetail}>
            <Loader2 size={36} className="spinner" />
            <p>Retrieving full order ledger and activity logs...</p>
          </div>
        ) : (
          <>
            {/* Detail Header */}
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderTitle}>
                <span className="subText"><Hash size={12} style={{ display: 'inline', marginRight: 4 }} />{selected.orderId}</span>
                <h2>{selected.product}</h2>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAiCopilot(true)}
                  style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8 }}
                >
                  🤖 AI Copilot
                </button>
                <select 
                  className={styles.filterSelect}
                  value={selected.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  style={{ fontWeight: 'bold' }}
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returned">Returned</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Collaborative Presence Indicator */}
            <PresenceIndicator objectId={selected.orderId} />

            {/* Detail Scrollable Body */}
            <div className={styles.detailBody}>
              {/* Badges / Meta */}
              <div className={styles.orderTagRow}>
                <span className={`badge ${
                  selected.priority === 'VIP' ? 'badge-urgent' : 
                  selected.priority === 'Consulting' ? 'badge-waiting' : 
                  'badge-pending'
                }`}>
                  {selected.priority || 'Standard'} Priority
                </span>
                <span className="badge badge-inprogress">
                  <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> 
                  {selected.teamBucket === 'TEAM-05' ? 'VIP Priority Team' : 
                   selected.teamBucket === 'TEAM-08' ? 'Consulting Support' : 
                   'General Support'}
                </span>
              </div>

              {/* Status Timeline Progress Tracker */}
              <div className={styles.timelineSection}>
                <div className={styles.sectionHeader}><CheckCircle size={14} /> Order Tracking Status</div>
                <div className={styles.timelineProgress}>
                  {timelineSteps.map((step, idx) => {
                    const stepStatus = getStepStatus(step);
                    return (
                      <div key={idx} className={styles.timelineStep}>
                        <div className={`${styles.stepDot} ${
                          stepStatus === 'completed' ? styles.stepDotCompleted : 
                          stepStatus === 'active' ? styles.stepDotActive : ''
                        }`} />
                        <div className={styles.stepContent}>
                          <div className={styles.stepTitle}>{step}</div>
                          <div className={styles.stepDesc}>
                            {step === 'Processing' && 'Order validated and packaged for delivery.'}
                            {step === 'Shipped' && 'Dispatched with confirmation tracking.'}
                            {step === 'Delivered' && 'Handed over directly to target address.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Specs Grid */}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span>CONFIRMATION ID</span>
                  <strong>{selected.confirmationId}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>AMOUNT PAID</span>
                  <strong>${selected.amount.toFixed(2)}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>ORDER DATE</span>
                  <strong>{new Date(selected.orderDate).toLocaleDateString()}</strong>
                </div>
                <div className={styles.infoItem}>
                  <span>ASSIGNED AGENT</span>
                  <strong>{selected.assignedName || 'Unassigned'}</strong>
                </div>
              </div>

              {/* Customer Details */}
              <div className={styles.timelineSection}>
                <div className={styles.sectionHeader}><User size={14} /> Customer Profile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  <div><strong>{selected.customerName}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-sec)' }}><Mail size={12} /> {selected.customerId}</div>
                </div>
              </div>

              {/* Timeline Activity Logs */}
              {selected.activityLogs && selected.activityLogs.length > 0 && (
                <div className={styles.timelineSection}>
                  <div className={styles.sectionHeader}><Clock size={14} /> Tracking Activity Logs</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selected.activityLogs.map((log) => (
                      <div key={log.logId} style={{ fontSize: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong>{log.action}</strong>
                          <span style={{ color: 'var(--text-mut)' }}>{formatTimeAgo(log.timestamp)}</span>
                        </div>
                        <p style={{ color: 'var(--text-sec)', marginTop: 2 }}>{log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Thread / Comments */}
              <div className={styles.commentsContainer}>
                <div className={styles.sectionHeader}><MessageSquare size={14} /> Live Client Chat Timeline</div>
                
                <div className={styles.chatWrapper}>
                  <div className={styles.chatList}>
                    {selected.comments && selected.comments.length > 0 ? (
                      selected.comments.map((c) => {
                        const isAgent = c.agentId && c.agentId.startsWith('AGT-');
                        return (
                          <div 
                            key={c.commentId} 
                            className={`${styles.chatBubble} ${isAgent ? styles.bubbleAgent : styles.bubbleCustomer}`}
                          >
                            <div className={styles.bubbleHeader}>
                              <strong>{c.agentName}</strong>
                              <span>{isAgent ? 'Staff' : 'Customer'}</span>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
                            <div className={styles.bubbleTime}>{formatTimeAgo(c.createdAt)}</div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ textAlign: 'center', color: 'var(--text-mut)', padding: 24, fontSize: 13 }}>
                        No conversation history on this order. Send a chat below to alert the customer!
                      </p>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className={styles.chatInputArea}>
                    <input 
                      className={styles.chatInput}
                      placeholder="Type your message here..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          sendComment();
                        }
                      }}
                    />
                    <button 
                      className={styles.sendButton}
                      onClick={sendComment}
                      disabled={sendingComment || !commentText.trim()}
                    >
                      {sendingComment ? <Loader2 size={14} className="spinner" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Copilot Drawer */}
            <AiCopilotDrawer
              isOpen={showAiCopilot}
              onClose={() => setShowAiCopilot(false)}
              order={selected}
              onInsertDraft={(draft) => setCommentText(draft)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 size={36} className="spinner" />
      </div>
    }>
      <OrdersPageContent />
    </Suspense>
  );
}
