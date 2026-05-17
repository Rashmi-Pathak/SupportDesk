'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import type { Ticket, Comment } from '@/lib/types';
import {
  getStatusColor, getStatusLabel, getPriorityColor,
  formatTimeAgo, ISSUE_CATEGORIES, STATUS_OPTIONS
} from '@/lib/constants';
import {
  Search, Filter, Inbox, ChevronRight,
  ArrowLeft, Send, Clock, User, MessageSquare, X, Loader2
} from 'lucide-react';
import styles from './my-tickets.module.css';

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

export default function MyTicketsPage() {
  const { user, isCustomer } = useAuth();
  const searchParams = useSearchParams();
  const viewId = searchParams.get('view');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Detail view
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  // Custom states for copilot drawer
  const [showAiCopilot, setShowAiCopilot] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: 100 };
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.queryTheme = categoryFilter;

    const res = isCustomer
      ? await api.customerGetMyTickets(params)
      : await api.getMyAssignedTickets(params);

    if (res.success && res.data) {
      setTickets(Array.isArray(res.data) ? res.data : []);
    }
    setLoading(false);
  }, [isCustomer, statusFilter, categoryFilter]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Check for ?view=TICKET_ID in URL
  useEffect(() => {
    if (viewId) {
      openDetail(viewId);
    }
  }, [viewId]);

  const openDetail = async (ticketId: string) => {
    setDetailLoading(true);
    const res = isCustomer
      ? await api.customerGetTicketById(ticketId)
      : await api.getTicketById(ticketId);
    if (res.success && res.data) {
      setSelectedTicket(res.data);
    }
    setDetailLoading(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    
    // Save current state for rollback
    const previousTicket = { ...selectedTicket };
    const textToSend = replyText;
    
    // Optimistically create comment
    const newComment: Comment = {
      commentId: 'optimistic-' + Date.now(),
      ticketId: selectedTicket.ticketId,
      agentId: user?.customerId || user?.agentId || 'unknown',
      agentName: user?.name || 'Me',
      content: textToSend,
      isInternal: false,
      createdAt: new Date().toISOString()
    };
    
    // Optimistically update UI
    setSelectedTicket({
      ...selectedTicket,
      comments: [...(selectedTicket.comments || []), newComment]
    });
    setReplyText(''); // Clear input immediately
    
    const res = isCustomer
      ? await api.customerAddReply(selectedTicket.ticketId, textToSend)
      : await api.addComment(selectedTicket.ticketId, textToSend, false);

    if (res.success) {
      // Background refresh to get real ID
      openDetail(selectedTicket.ticketId);
    } else {
      // Rollback on failure
      setSelectedTicket(previousTicket);
      setReplyText(textToSend);
      alert('Failed to send message.');
    }
  };

  // Agent: update ticket status
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket || isCustomer) return;
    await api.updateTicket({ ticketId: selectedTicket.ticketId, status: newStatus as Ticket['status'] });
    openDetail(selectedTicket.ticketId);
    loadTickets();
  };

  // Filtered tickets by search
  const filtered = tickets.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.ticketId.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.queryTheme.toLowerCase().includes(q)
    );
  });

  // Detail view
  if (selectedTicket) {
    return (
      <div className={styles.detailView} style={{ position: 'relative', overflow: 'hidden' }}>
        <button className={styles.backBtn} onClick={() => setSelectedTicket(null)}>
          <ArrowLeft size={18} /> Back to tickets
        </button>

        <div className={styles.detailHeader}>
          <div>
            <span className={styles.detailId}>{selectedTicket.ticketId}</span>
            <h2 className={styles.detailSubject}>{selectedTicket.subject}</h2>
            <div className={styles.detailMeta} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                className={styles.detailStatus}
                style={{ color: getStatusColor(selectedTicket.status), borderColor: getStatusColor(selectedTicket.status) }}
              >
                {getStatusLabel(selectedTicket.status)}
              </span>
              <span style={{ color: getPriorityColor(selectedTicket.priority) }}>
                {selectedTicket.priority}
              </span>
              <span>{selectedTicket.queryTheme}</span>
              <span><Clock size={13} /> {formatTimeAgo(selectedTicket.createdAt)}</span>
              {selectedTicket.slaDeadline && (
                <SlaCountdown deadline={selectedTicket.slaDeadline} resolvedAt={selectedTicket.resolvedAt} />
              )}
            </div>
          </div>

          {/* Agent-only: Status dropdown & Copilot */}
          {!isCustomer && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAiCopilot(true)}
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
              >
                🤖 AI Copilot
              </button>
              <div className={styles.statusControl}>
                <label>Status:</label>
                <select
                  value={selectedTicket.status}
                  onChange={e => handleStatusChange(e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className={styles.detailCards}>
          <div className={styles.infoCard}>
            <h4>Description</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket.description || 'No description provided.'}</p>
          </div>
          <div className={styles.infoCard}>
            <h4>Details</h4>
            <div className={styles.infoGrid}>
              <span>Assigned To</span><span>{selectedTicket.assignedName || 'Unassigned'}</span>
              <span>Channel</span><span>{selectedTicket.channel}</span>
              <span>Created</span><span>{new Date(selectedTicket.createdAt).toLocaleDateString()}</span>
              {selectedTicket.orderId && <><span>Order</span><span>{selectedTicket.orderId}</span></>}
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className={styles.conversationSection}>
          <h3><MessageSquare size={18} /> Conversation</h3>
          <div className={styles.conversationList}>
            {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
              <p className={styles.noComments}>No messages yet. Start the conversation below.</p>
            ) : (
              selectedTicket.comments.map((c: Comment) => (
                <div key={c.commentId} className={`${styles.commentBubble} ${c.agentId === user?.customerId || c.agentId === user?.agentId ? styles.myComment : styles.otherComment}`}>
                  <div className={styles.commentHeader}>
                    <User size={14} />
                    <strong>{c.agentName}</strong>
                    <span className={styles.commentTime}>{formatTimeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{c.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Reply input */}
          <div className={styles.replyBox}>
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={isCustomer ? 'Type your message...' : 'Reply to customer...'}
              onKeyDown={e => e.key === 'Enter' && handleReply()}
            />
            <button onClick={handleReply} disabled={replySending || !replyText.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Live AI Drawer Panel */}
        <AiCopilotDrawer
          isOpen={showAiCopilot}
          onClose={() => setShowAiCopilot(false)}
          ticket={selectedTicket}
          onInsertDraft={(draft) => setReplyText(draft)}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={18} />
          <input
            placeholder="Search tickets..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Filter size={14} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {ISSUE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Count */}
      <div className={styles.countBar}>
        <span>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Inbox size={48} strokeWidth={1.2} />
          <h3>No tickets found</h3>
          <p>{isCustomer ? 'Create a ticket to get help from our team.' : 'No tickets assigned to you.'}</p>
        </div>
      ) : (
        <div className={styles.ticketList}>
          {filtered.map(ticket => (
            <div
              key={ticket.ticketId}
              className={styles.ticketRow}
              onClick={() => openDetail(ticket.ticketId)}
            >
              <div className={styles.ticketRowLeft}>
                <span className={styles.ticketRowId}>{ticket.ticketId}</span>
                <h4>{ticket.subject}</h4>
                <div className={styles.ticketRowMeta} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={styles.categoryTag}>{ticket.queryTheme}</span>
                  {!isCustomer && <span>Customer: {ticket.customerName}</span>}
                  <span>{formatTimeAgo(ticket.createdAt)}</span>
                  {ticket.slaDeadline && <SlaCountdown deadline={ticket.slaDeadline} resolvedAt={ticket.resolvedAt} />}
                </div>
              </div>
              <div className={styles.ticketRowRight}>
                <span
                  className={styles.statusBadge}
                  style={{ color: getStatusColor(ticket.status), borderColor: getStatusColor(ticket.status) }}
                >
                  {getStatusLabel(ticket.status)}
                </span>
                <span style={{ color: getPriorityColor(ticket.priority), fontSize: 12, fontWeight: 600 }}>
                  {ticket.priority}
                </span>
                <ChevronRight size={16} className={styles.chevron} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
