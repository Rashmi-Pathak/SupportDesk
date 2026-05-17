'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useSearchParams } from 'next/navigation';
import type { Ticket, Agent, PaginationMeta, Comment } from '@/lib/types';
import {
  STATUS_OPTIONS, PRIORITY_OPTIONS, CHANNEL_OPTIONS, VIEW_MODES,
  getStatusBadgeClass, getPriorityBadgeClass, getStatusLabel,
  getChannelIcon, formatTimeAgo, QUERY_THEMES
} from '@/lib/constants';
import {
  Search, Plus, Filter, ChevronLeft, ChevronRight, Edit3, Save, X,
  MessageSquare, AlertTriangle, Paperclip, Clock, User, Phone, Mail,
  Package, Send, Eye, ArrowUpRight, Loader2, Download, Tag, Hash, ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';
import { OrderHistory } from '@/components/orders/order-history';
import styles from './tickets.module.css';

/* ═══ LIVE SLA COUNTDOWN TIMER ═══ */
function SlaCountdown({ deadline, resolvedAt }: { deadline: string; resolvedAt?: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgency, setUrgency] = useState<'cool' | 'warning' | 'breached'>('cool');
  
  useEffect(() => {
    if (resolvedAt) {
      setTimeLeft('SLA Met');
      setUrgency('cool');
      return;
    }
    if (!deadline) {
      setTimeLeft('No SLA');
      setUrgency('cool');
      return;
    }
    
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Breached');
        setUrgency('breached');
        return;
      }
      
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      
      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
      if (hrs < 2) {
        setUrgency('breached');
      } else if (hrs < 8) {
        setUrgency('warning');
      } else {
        setUrgency('cool');
      }
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline, resolvedAt]);
  
  const colorMap = {
    cool: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' },
    breached: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }
  };
  
  const style = colorMap[urgency] || colorMap.cool;
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
      background: style.bg, color: style.color, border: style.border,
      animation: urgency === 'breached' && !resolvedAt ? 'pulse-urgency 2s infinite ease-in-out' : undefined
    }}>
      <Clock size={10} /> {timeLeft}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-urgency {
          0% { opacity: 0.6; }
          50% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0.6; }
        }
      `}} />
    </span>
  );
}

/* ═══ COLLABORATIVE PRESENCE INDICATOR ═══ */
function PresenceIndicator({ objectId }: { objectId: string }) {
  const [presence, setPresence] = useState<{ name: string; action: string; avatar: string }[]>([]);
  
  useEffect(() => {
    const candidates = [
      { name: 'Sarah Connor', avatar: 'SC', action: 'viewing this' },
      { name: 'John Doe', avatar: 'JD', action: 'reviewing description' },
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
          return { ...p, action: 'typing a reply...' };
        }
        return p;
      }));
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [objectId]);
  
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
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

/* ═══ EXPANDABLE AGENT AI COPILOT DRAWER ═══ */
function AiCopilotDrawer({
  isOpen,
  onClose,
  ticket,
  onInsertDraft
}: {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
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
      type: 'ticket',
      title: ticket.subject,
      desc: ticket.description || '',
      customer: ticket.customerName,
      status: ticket.status,
      priority: ticket.priority,
      history: ticket.comments?.map(c => `[${c.agentName}]: ${c.content}`).slice(-4).join('\n') || 'None'
    }).then(res => {
      setSentiment(res.sentiment as any);
      setRecommendation(res.recommendation);
      setDraftResponse(res.draft);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [isOpen, ticket]);
  
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
          🤖 AI Agent Copilot
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
      </div>
      
      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Loader2 size={32} style={{ animation: 'spin-ai 2s linear infinite', color: '#a855f7' }} className={styles.spin} />
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

/* ═══ CREATE TICKET MODAL ═══ */
function CreateTicketModal({ onClose, onCreated, agents }: { onClose: () => void; onCreated: () => void; agents: Agent[] }) {
  const [form, setForm] = useState({ subject: '', description: '', customerName: '', customerEmail: '', customerPhone: '', priority: 'Medium', channel: 'Email', queryTheme: 'General', assignedTo: '', assignedName: 'Unassigned', orderId: '' });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const agent = agents.find(a => a.agentId === form.assignedTo);
    const res = await api.createTicket({ ...form, assignedName: agent?.name || 'Unassigned' } as Partial<Ticket>);
    setSaving(false);
    if (res.success) { toast.success('Ticket created!'); onCreated(); onClose(); }
    else toast.error(res.error?.message || 'Failed');
  };
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}><h2><Plus size={20} /> New Ticket</h2><button onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={styles.formField}><label>Subject *</label><input value={form.subject} onChange={e=>set('subject',e.target.value)} required placeholder="Brief issue description" /></div>
            <div className={styles.formField}><label>Channel</label><select value={form.channel} onChange={e=>set('channel',e.target.value)}>{CHANNEL_OPTIONS.map(c=><option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select></div>
            <div className={styles.formField}><label>Customer Name *</label><input value={form.customerName} onChange={e=>set('customerName',e.target.value)} required placeholder="John Doe" /></div>
            <div className={styles.formField}><label>Customer Email *</label><input type="email" value={form.customerEmail} onChange={e=>set('customerEmail',e.target.value)} required placeholder="john@example.com" /></div>
            <div className={styles.formField}><label>Customer Phone</label><input value={form.customerPhone} onChange={e=>set('customerPhone',e.target.value)} placeholder="+1-555-1234" /></div>
            <div className={styles.formField}><label>Order ID</label><input value={form.orderId} onChange={e=>set('orderId',e.target.value)} placeholder="ORD-XXXXXX" /></div>
            <div className={styles.formField}><label>Priority</label><select value={form.priority} onChange={e=>set('priority',e.target.value)}>{QUERY_THEMES.map(q=><option key={q} value={q}>{q}</option>)}</select></div>
            <div className={styles.formField}><label>Category</label><select value={form.queryTheme} onChange={e=>set('queryTheme',e.target.value)}>{QUERY_THEMES.map(q=><option key={q} value={q}>{q}</option>)}</select></div>
            <div className={styles.formField}><label>Assign To</label><select value={form.assignedTo} onChange={e=>set('assignedTo',e.target.value)}><option value="">Unassigned</option>{agents.map(a=><option key={a.agentId} value={a.agentId}>{a.name}</option>)}</select></div>
          </div>
          <div className={styles.formField} style={{marginTop:12}}><label>Description</label><textarea rows={4} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Detailed description of the issue..." /></div>
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={16} className={styles.spin} /> : 'Create Ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══ MAIN TICKETS PAGE ═══ */
export default function TicketsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('view');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Ticket>>({});
  const [commentText, setCommentText] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  
  // Custom states for copilot drawer
  const [showAiCopilot, setShowAiCopilot] = useState(false);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [page, setPage] = useState(1);

  // Load agents once
  useEffect(() => { api.getAgents().then(r => { if (r.success) setAgents(r.data); }); }, []);

  // Listen to view query param to auto-select ticket
  useEffect(() => {
    if (viewId) {
      const loadAndSelect = async () => {
        setDetailLoading(true);
        const res = await api.getTicketById(viewId);
        if (res.success) {
          setSelected(res.data);
        }
        setDetailLoading(false);
      };
      loadAndSelect();
    }
  }, [viewId]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 20, view: viewMode };
    if (filterStatus) params.status = filterStatus;
    if (filterPriority) params.priority = filterPriority;
    if (filterChannel) params.channel = filterChannel;
    if (viewMode === 'myTickets' && user?.agentId) params._currentAgentId = user.agentId;
    let res;
    if (searchQ.trim()) {
      res = await api.searchTickets(searchQ, page, 20);
    } else {
      res = await api.getTickets(params);
    }
    if (res.success) { setTickets(res.data); setMeta(res.meta || null); }
    setLoading(false);
  }, [page, viewMode, filterStatus, filterPriority, filterChannel, searchQ, user?.agentId]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const selectTicket = async (t: Ticket) => {
    setSelected(t); setEditing(false); setDetailLoading(true);
    const res = await api.getTicketById(t.ticketId);
    if (res.success) setSelected(res.data);
    setDetailLoading(false);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const res = await api.updateTicket({ ticketId: selected.ticketId, ...editForm });
    if (res.success) { toast.success('Ticket updated'); setEditing(false); selectTicket({ ...selected, ...editForm } as Ticket); fetchTickets(); }
    else toast.error(res.error?.message || 'Update failed');
  };

  const sendComment = async () => {
    if (!selected || !commentText.trim()) return;
    
    const previousTicket = { ...selected };
    const textToSend = commentText;
    
    // Optimistically create comment
    const newComment: Comment = {
      commentId: 'optimistic-' + Date.now(),
      ticketId: selected.ticketId,
      agentId: user?.agentId || 'unknown',
      agentName: user?.name || 'Me',
      content: textToSend,
      isInternal: commentInternal,
      createdAt: new Date().toISOString()
    };
    
    // Optimistically update UI
    setSelected({
      ...selected,
      comments: [...(selected.comments || []), newComment]
    });
    setCommentText(''); // Clear instantly
    
    const res = await api.addComment(selected.ticketId, textToSend, commentInternal);
    if (res.success) {
      selectTicket(selected);
      toast.success('Comment added');
    } else {
      setSelected(previousTicket);
      setCommentText(textToSend);
      toast.error('Failed to add comment');
    }
  };

  const handleExport = async () => {
    const res = await api.exportTickets();
    if (res.success && res.data?.csv) {
      const blob = new Blob([res.data.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'tickets_export.csv'; a.click();
      toast.success(`Exported ${res.data.count} tickets`);
    }
  };

  return (
    <div className={styles.ticketsPage}>
      {/* ══ LEFT PANEL — Ticket List ══ */}
      <div className={styles.listPanel}>
        <div className={styles.listHeader}>
          <div className={styles.searchBar}>
            <Search size={16} />
            <input placeholder="Search tickets..." value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}><Plus size={16} /> New</button>
        </div>

        {/* View Tabs */}
        <div className={styles.viewTabs}>
          {VIEW_MODES.map(v => (
            <button key={v.value} className={`${styles.viewTab} ${viewMode === v.value ? styles.viewTabActive : ''}`} onClick={() => { setViewMode(v.value); setPage(1); }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setPage(1); }}>
            <option value="">All Priority</option>
            {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setPage(1); }}>
            <option value="">All Channels</option>
            {CHANNEL_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Ticket List */}
        <div className={styles.ticketList}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 8, borderRadius: 10 }} />)
          ) : tickets.length === 0 ? (
            <div className={styles.emptyState}><p>No tickets found</p></div>
          ) : (
            tickets.map(t => (
              <div key={t.ticketId} className={`${styles.ticketCard} ${selected?.ticketId === t.ticketId ? styles.ticketCardActive : ''}`} onClick={() => selectTicket(t)}>
                <div className={styles.ticketCardPriority} style={{ background: PRIORITY_OPTIONS.find(p => p.value === t.priority)?.color || '#6b7280' }} />
                <div className={styles.ticketCardBody}>
                  <div className={styles.ticketCardTop}>
                    <span className={styles.ticketId}><Hash size={12} />{t.ticketId.slice(-10)}</span>
                    <span className={styles.ticketTime} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {formatTimeAgo(t.createdAt)}
                      {t.slaDeadline && <SlaCountdown deadline={t.slaDeadline} resolvedAt={t.resolvedAt} />}
                    </span>
                  </div>
                  <h4 className={styles.ticketSubject}>{t.subject}</h4>
                  <div className={styles.ticketCardBottom}>
                    <span className={`badge ${getStatusBadgeClass(t.status)}`}>{getStatusLabel(t.status)}</span>
                    <span className={styles.ticketCustomer}>{t.customerName}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
            <span>{page} / {meta.totalPages}</span>
            <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {/* ══ CENTER PANEL — Ticket Detail ══ */}
      <div className={styles.detailPanel} style={{ position: 'relative', overflow: 'hidden' }}>
        {!selected ? (
          <div className={styles.emptyDetail}>
            <Eye size={48} strokeWidth={1} />
            <h3>Select a ticket</h3>
            <p>Click on a ticket from the list to view details</p>
          </div>
        ) : detailLoading ? (
          <div className={styles.detailLoading}><div className="spinner" /></div>
        ) : (
          <>
            {/* Detail Header */}
            <div className={styles.detailHeader}>
              <div>
                <div className={styles.detailId}>{selected.ticketId}</div>
                {!editing ? (
                  <h2>{selected.subject}</h2>
                ) : (
                  <input className={styles.editInput} value={editForm.subject || ''} onChange={e => setEditForm(p => ({ ...p, subject: e.target.value }))} />
                )}
              </div>
              <div className={styles.detailActions} style={{ display: 'flex', gap: 6 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAiCopilot(true)}
                  style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  🤖 AI Copilot
                </button>
                {!editing ? (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(true); setEditForm({ subject: selected.subject, description: selected.description, status: selected.status, priority: selected.priority, channel: selected.channel, queryTheme: selected.queryTheme, actionTaken: selected.actionTaken, tags: selected.tags }); }}>
                    <Edit3 size={14} /> Edit
                  </button>
                ) : (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit}><Save size={14} /> Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                  </>
                )}
                <button className="btn btn-ghost btn-sm" onClick={handleExport}><Download size={14} /></button>
              </div>
            </div>

            {/* Presence Indicator */}
            <PresenceIndicator objectId={selected.ticketId} />

            {/* Status & Priority */}
            <div className={styles.detailMeta}>
              {!editing ? (
                <>
                  <span className={`badge ${getStatusBadgeClass(selected.status)}`}>{getStatusLabel(selected.status)}</span>
                  <span className={`badge ${getPriorityBadgeClass(selected.priority)}`}>{selected.priority}</span>
                  <span className={styles.channelTag}>{getChannelIcon(selected.channel)} {selected.channel}</span>
                  {selected.isEscalated && <span className={styles.escalatedTag}><AlertTriangle size={12} /> Escalated</span>}
                </>
              ) : (
                <div className={styles.editRow}>
                  <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as Ticket['status'] }))}>{STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
                  <select value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value as Ticket['priority'] }))}>{PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
                  <select value={editForm.channel} onChange={e => setEditForm(p => ({ ...p, channel: e.target.value as Ticket['channel'] }))}>{CHANNEL_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
                </div>
              )}
            </div>

            {/* Customer Info */}
            <div className={styles.customerCard}>
              <h4><User size={14} /> Customer</h4>
              <div className={styles.customerInfo}>
                <span><strong>{selected.customerName}</strong></span>
                <span><Mail size={12} /> {selected.customerEmail}</span>
                {selected.customerPhone && <span><Phone size={12} /> {selected.customerPhone}</span>}
                {selected.orderId && <span><Package size={12} /> {selected.orderId}</span>}
              </div>
            </div>

            {/* Description */}
            <div className={styles.descSection}>
              <h4>Description</h4>
              {!editing ? (
                <p style={{ whiteSpace: 'pre-wrap' }}>{selected.description || 'No description provided'}</p>
              ) : (
                <textarea rows={3} value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
              )}
            </div>

            {editing && (
              <div className={styles.editExtras}>
                <div className={styles.formField}><label>Category</label><select value={editForm.queryTheme} onChange={e => setEditForm(p => ({ ...p, queryTheme: e.target.value }))}>{QUERY_THEMES.map(q => <option key={q}>{q}</option>)}</select></div>
                <div className={styles.formField}><label>Action Taken</label><input value={editForm.actionTaken || ''} onChange={e => setEditForm(p => ({ ...p, actionTaken: e.target.value }))} placeholder="Describe resolution action" /></div>
                <div className={styles.formField}><label>Tags</label><input value={editForm.tags || ''} onChange={e => setEditForm(p => ({ ...p, tags: e.target.value }))} placeholder="billing, urgent, vip" /></div>
              </div>
            )}

            {/* Tags */}
            {selected.tags && !editing && (
              <div className={styles.tagsRow}>
                <Tag size={12} />
                {selected.tags.split(',').map((tag, i) => <span key={i} className={styles.tag}>{tag.trim()}</span>)}
              </div>
            )}

            {/* Comments / Activity */}
            <div className={styles.commentsSection}>
              <h4><MessageSquare size={14} /> Activity</h4>
              <div className={styles.commentsList}>
                {(selected.comments || []).map((c: Comment) => (
                  <div key={c.commentId} className={`${styles.commentItem} ${c.isInternal ? styles.commentInternal : ''}`}>
                    <div className={styles.commentAvatar}>{c.agentName?.[0] || '?'}</div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentHeader}>
                        <strong>{c.agentName}</strong>
                        {c.isInternal && <span className={styles.internalBadge}>Internal</span>}
                        <span className={styles.commentTime}>{formatTimeAgo(c.createdAt)}</span>
                      </div>
                      <p style={{ whiteSpace: 'pre-wrap' }}>{c.content}</p>
                    </div>
                  </div>
                ))}
                {(!selected.comments || selected.comments.length === 0) && <p className={styles.noComments}>No comments yet</p>}
              </div>

              {/* Comment Input */}
              <div className={styles.commentInput}>
                <textarea rows={2} placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }} />
                <div className={styles.commentInputActions}>
                  <label className={styles.internalToggle}>
                    <input type="checkbox" checked={commentInternal} onChange={e => setCommentInternal(e.target.checked)} />
                    <span>Internal note</span>
                  </label>
                  <button className="btn btn-primary btn-sm" onClick={sendComment} disabled={sendingComment || !commentText.trim()}>
                    {sendingComment ? <Loader2 size={14} className={styles.spin} /> : <><Send size={14} /> Send</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Live AI Drawer Panel */}
            <AiCopilotDrawer
              isOpen={showAiCopilot}
              onClose={() => setShowAiCopilot(false)}
              ticket={selected}
              onInsertDraft={(draft) => setCommentText(draft)}
            />
          </>
        )}
      </div>

      {/* ══ RIGHT PANEL — Insights ══ */}
      <div className={styles.insightsPanel}>
        {selected ? (
          <>
            <h3>Ticket Insights</h3>
            <div className={styles.insightGroup}>
              <div className={styles.insightItem}><Clock size={14} /><span>Created</span><strong>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'}</strong></div>
              <div className={styles.insightItem}><Clock size={14} /><span>Updated</span><strong>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '-'}</strong></div>
              {selected.resolvedAt && <div className={styles.insightItem}><Clock size={14} /><span>Resolved</span><strong>{new Date(selected.resolvedAt).toLocaleString()}</strong></div>}
              <div className={styles.insightItem}>
                <AlertTriangle size={14} />
                <span>SLA Status</span>
                {selected.slaDeadline ? (
                  <SlaCountdown deadline={selected.slaDeadline} resolvedAt={selected.resolvedAt} />
                ) : (
                  <strong>-</strong>
                )}
              </div>
            </div>

            <div className={styles.insightGroup}>
              <h4>Assigned Agent</h4>
              <div className={styles.assignedAgent}>
                <div className={styles.agentAvatar}>{selected.assignedName?.[0] || '?'}</div>
                <div><strong>{selected.assignedName || 'Unassigned'}</strong><span>{selected.assignedTo || ''}</span></div>
              </div>
            </div>

            {selected.order && (
              <div className={styles.insightGroup}>
                <h4><Package size={14} /> Linked Order</h4>
                <div className={styles.orderCard}>
                  <div><span>Order ID</span><strong>{selected.order.orderId}</strong></div>
                  <div><span>Product</span><strong>{selected.order.product}</strong></div>
                  <div><span>Amount</span><strong>${selected.order.amount}</strong></div>
                  <div><span>Status</span><strong>{selected.order.status}</strong></div>
                </div>
              </div>
            )}

            <div className={styles.insightGroup}>
              <h4><ShoppingBag size={14} /> Customer Order History</h4>
              <OrderHistory customerId={selected.customerId} />
            </div>

            {selected.escalations && selected.escalations.length > 0 && (
              <div className={styles.insightGroup}>
                <h4><ArrowUpRight size={14} /> Escalation History</h4>
                {selected.escalations.map((esc, i) => (
                  <div key={i} className={styles.escItem}>
                    <strong>{esc.escalatedByName} → {esc.escalatedToName || esc.escalatedTo}</strong>
                    <p>{esc.reason}</p>
                    <span>{formatTimeAgo(esc.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}

            {selected.attachments && selected.attachments.length > 0 && (
              <div className={styles.insightGroup}>
                <h4><Paperclip size={14} /> Attachments</h4>
                {selected.attachments.map((att, i) => (
                  <a key={i} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.attLink}>
                    <Paperclip size={12} /> {att.fileName}
                  </a>
                ))}
              </div>
            )}

            {selected.queryTheme && (
              <div className={styles.insightGroup}>
                <h4>Category</h4>
                <span className={styles.tag}>{selected.queryTheme}</span>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyInsight}>
            <Filter size={32} strokeWidth={1} />
            <p>Select a ticket to view insights</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} onCreated={fetchTickets} agents={agents} />}
    </div>
  );
}
