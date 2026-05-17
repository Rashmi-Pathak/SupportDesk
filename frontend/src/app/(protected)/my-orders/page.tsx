'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Order, Comment } from '@/lib/types';
import { formatTimeAgo } from '@/lib/constants';
import { 
  Package, Search, Eye, ShoppingBag, Send, Hash, Calendar, 
  DollarSign, CheckCircle, Clock, Loader2, ArrowRight, PlusCircle, AlertTriangle,
  MessageSquare, X
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './my-orders.module.css';

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

function MyOrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('view');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Order
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // New self-service order state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newOrder, setNewOrder] = useState({
    product: '',
    amount: '',
  });
  const [addingOrder, setAddingOrder] = useState(false);

  // Comments Chat thread
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get customer profile to signature comments
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Custom states for copilot drawer
  const [showAiCopilot, setShowAiCopilot] = useState(false);

  useEffect(() => {
    api.getMe().then(res => {
      if (res.success) setCurrentUser(res.data);
    });
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    const res = await api.customerGetMyOrders();
    if (res.success) {
      setOrders(res.data);
    } else {
      setError(res.error?.message || 'Failed to fetch orders from server.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Handle order selection
  const selectOrder = async (order: Order) => {
    setDetailLoading(true);
    setSelected(order);
    const res = await api.customerGetOrderById(order.orderId);
    if (res.success) {
      setSelected(res.data);
    } else {
      toast.error('Failed to load order details');
    }
    setDetailLoading(false);
  };

  // Deep linking logic
  useEffect(() => {
    if (viewId) {
      setDetailLoading(true);
      api.customerGetOrderById(viewId).then(res => {
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

  // Add self-service mock order
  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.product || !newOrder.amount) {
      toast.error('Please enter product name and amount.');
      return;
    }

    setAddingOrder(true);
    const amountVal = parseFloat(newOrder.amount);
    
    // Generate random confirmation details
    const confirmationId = 'CNF-' + Math.floor(100000 + Math.random() * 900000);
    const dateStr = new Date().toISOString();

    const res = await api.customerAddOrder({
      product: newOrder.product,
      amount: amountVal,
      orderDate: dateStr,
      status: 'Processing',
      confirmationId
    });

    if (res.success) {
      toast.success('New order successfully registered!');
      setNewOrder({ product: '', amount: '' });
      setShowAddForm(false);
      fetchOrders();
      
      // Auto select newly registered order
      selectOrder(res.data);
    } else {
      toast.error(res.error?.message || 'Failed to add order');
    }
    setAddingOrder(false);
  };

  // Submit comment
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
      agentId: currentUser?.customerId || 'CLIENT',
      agentName: currentUser?.name || 'Customer',
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
      // Re-fetch detail to get authentic comment IDs
      const detailRes = await api.customerGetOrderById(selected.orderId);
      if (detailRes.success) setSelected(detailRes.data);
    } else {
      toast.error('Failed to post comment');
      // Rollback optimism
      setSelected(prev => prev ? {
        ...prev,
        comments: (prev.comments || []).filter(c => c.commentId !== tempComment.commentId)
      } : null);
      setCommentText(text);
    }
    setSendingComment(false);
  };

  // Track status progression helper
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
      {/* ── LEFT PANEL: Order History List ── */}
      <div className={styles.listPanel}>
        <div className={styles.listHeader}>
          <div className={styles.searchBar}>
            <Search size={16} />
            <input placeholder="Search products..." disabled value="" readOnly />
          </div>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => setShowAddForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PlusCircle size={16} /> Place Self-Service Order
          </button>
        </div>

        {showAddForm && (
          <form className={styles.selfServiceForm} onSubmit={handleAddOrder}>
            <h3>🛒 Register Self-Service Order</h3>
            <div className={styles.formRow}>
              <input 
                placeholder="Product Name (e.g. MacBook Pro M4)" 
                value={newOrder.product}
                onChange={e => setNewOrder(p => ({ ...p, product: e.target.value }))}
                required
              />
              <input 
                placeholder="Paid Amount (USD)" 
                type="number" 
                step="0.01"
                value={newOrder.amount}
                onChange={e => setNewOrder(p => ({ ...p, amount: e.target.value }))}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" type="submit" disabled={addingOrder}>
                {addingOrder ? 'Registering...' : 'Register Order'}
              </button>
            </div>
          </form>
        )}

        <div className={styles.tableWrap}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, margin: '8px 16px', borderRadius: 8 }} />
            ))
          ) : error ? (
            <div className={styles.emptyDetail}>
              <AlertTriangle size={32} className="text-red-400" />
              <h3>Failed to load orders</h3>
              <p>{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyDetail}>
              <ShoppingBag size={48} strokeWidth={1} />
              <h3>No purchases recorded yet</h3>
              <p>Use the self-service form above to order mock products for recruitment testing!</p>
            </div>
          ) : (
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Total</th>
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
                    <td><strong>{o.product}</strong></td>
                    <td>
                      <span className={`badge ${
                        o.status === 'Delivered' ? 'badge-resolved' : 
                        o.status === 'Cancelled' ? 'badge-pending' : 
                        'badge-inprogress'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td><strong>${o.amount.toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Customer order details pane ── */}
      <div className={styles.detailPanel} style={{ position: 'relative', overflow: 'hidden' }}>
        {!selected ? (
          <div className={styles.emptyDetail}>
            <Eye size={48} strokeWidth={1} />
            <h3>Select an Order</h3>
            <p>Click on any order in the left panel history list to view tracking milestones and chat with support agents.</p>
          </div>
        ) : detailLoading ? (
          <div className={styles.emptyDetail}>
            <Loader2 size={36} className="spinner" />
            <p>Connecting to support center...</p>
          </div>
        ) : (
          <>
            {/* Detail Header */}
            <div className={styles.detailHeader}>
              <div>
                <span className="subText"><Hash size={12} style={{ display: 'inline', marginRight: 4 }} />{selected.orderId}</span>
                <h2>{selected.product}</h2>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAiCopilot(true)}
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}
              >
                🤖 AI Copilot
              </button>
            </div>

            {/* Scrollable details */}
            <div className={styles.detailBody}>
              {/* Badges / Meta */}
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${
                  selected.priority === 'VIP' ? 'badge-urgent' : 
                  selected.priority === 'Consulting' ? 'badge-waiting' : 
                  'badge-pending'
                }`}>
                  {selected.priority || 'Standard'} Routing
                </span>
                <span className="badge badge-resolved">
                  Status: {selected.status}
                </span>
              </div>

              {/* Status Timeline Progress Tracker */}
              <div className={styles.timelineSection}>
                <div className={styles.sectionHeader}><CheckCircle size={14} /> Tracking Progress</div>
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
                            {step === 'Processing' && 'Validated by warehouse staff.'}
                            {step === 'Shipped' && 'Handed to logistic courier.'}
                            {step === 'Delivered' && 'Order delivery confirmed at destination.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order specifications grid */}
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
                  <span>COURIER TIMELINE</span>
                  <strong>STANDARD</strong>
                </div>
              </div>

              {/* Timeline Activity Logs */}
              {selected.activityLogs && selected.activityLogs.length > 0 && (
                <div className={styles.timelineSection}>
                  <div className={styles.sectionHeader}><Clock size={14} /> Activity Updates</div>
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
                <div className={styles.sectionHeader}><MessageSquare size={14} /> Agent Live Chat Center</div>
                
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
                              <span>{isAgent ? 'Support Staff' : 'You'}</span>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
                            <div className={styles.bubbleTime}>{formatTimeAgo(c.createdAt)}</div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ textAlign: 'center', color: 'var(--text-mut)', padding: 16, fontSize: 12 }}>
                        No chat logs recorded. Write below to alert support team!
                      </p>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className={styles.chatInputArea}>
                    <input 
                      className={styles.chatInput}
                      placeholder="Type message to agent..."
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

export default function MyOrdersPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader2 size={36} className="spinner" />
      </div>
    }>
      <MyOrdersPageContent />
    </Suspense>
  );
}
