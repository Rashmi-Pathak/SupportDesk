'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';
import { ISSUE_CATEGORIES } from '@/lib/constants';
import {
  ArrowLeft, ArrowRight, CheckCircle, Clock,
  Send, Loader2, Paperclip, X, ImageIcon, AlertCircle
} from 'lucide-react';
import styles from './new-ticket.module.css';

// Categories that benefit from proof uploads
const PROOF_CATEGORIES = ['Shipping', 'Product', 'Billing'];

// Auto-priority inference (mirrors backend logic)
function inferPriorityLabel(category: string, subject: string, description: string): { label: string; color: string } {
  const text = (subject + ' ' + description).toLowerCase();
  const urgentKeywords = ['urgent', 'not working', 'blocked', 'data loss', 'cannot access', 'cannot login', 'lost', 'error', 'broken', 'critical', 'immediately', 'asap'];
  if (urgentKeywords.some(k => text.includes(k))) return { label: 'Urgent', color: '#ef4444' };
  if (['Billing', 'Account', 'Technical'].includes(category)) return { label: 'High', color: '#f97316' };
  if (['Shipping', 'Product'].includes(category)) return { label: 'Medium', color: '#f59e0b' };
  return { label: 'Low', color: '#10b981' };
}

export default function NewTicketPage() {
  const { user, isCustomer } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{ ticketId: string; assignedName: string; slaDeadline: string } | null>(null);
  const [error, setError] = useState('');

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // File upload state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const needsProof = PROOF_CATEGORIES.includes(category);
  const inferredPriority = inferPriorityLabel(category, subject, description);

  useEffect(() => {
    if (step === 2 && isCustomer) {
      setLoadingOrders(true);
      api.customerGetMyOrders().then(res => {
        if (res.success) setMyOrders(res.data);
        setLoadingOrders(false);
      });
    }
  }, [step, isCustomer]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }
    setProofFile(file);
    setError('');
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in the subject and description.');
      return;
    }
    setError('');
    setLoading(true);

    const res = isCustomer
      ? await api.customerCreateTicket({
          subject,
          description,
          queryTheme: category,
          orderId: orderId || undefined,
        })
      : await api.createTicket({
          subject,
          description,
          queryTheme: category,
          channel: 'Portal',
          customerName: user?.name || '',
          customerEmail: user?.email || '',
        });

    if (!res.success || !res.data) {
      setLoading(false);
      setError(res.error?.message || 'Failed to create ticket');
      return;
    }

    const ticketId = res.data.ticketId;

    // Upload proof file if provided
    if (proofFile && needsProof) {
      setUploadingProof(true);
      try {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = async () => {
            const base64 = (reader.result as string).split(',')[1];
            await api.uploadAttachment(ticketId, proofFile.name, base64, proofFile.type);
            resolve();
          };
          reader.readAsDataURL(proofFile);
        });
      } catch (_) { /* non-blocking */ }
      setUploadingProof(false);
    }

    setLoading(false);
    setCreatedTicket({
      ticketId,
      assignedName: res.data.assignedName || 'Unassigned',
      slaDeadline: res.data.slaDeadline || '',
    });
    setStep(3);
  };

  // Step 3: Confirmation
  if (step === 3 && createdTicket) {
    const slaHours = createdTicket.slaDeadline
      ? Math.max(0, Math.round((new Date(createdTicket.slaDeadline).getTime() - Date.now()) / 3600000))
      : null;

    return (
      <div className={styles.page}>
        <div className={styles.confirmCard}>
          <div className={styles.confirmIcon}>
            <CheckCircle size={48} />
          </div>
          <h2>Ticket Created Successfully!</h2>
          <p className={styles.ticketIdDisplay}>{createdTicket.ticketId}</p>

          <div className={styles.confirmDetails}>
            <div className={styles.confirmRow}>
              <span>Assigned Agent</span>
              <strong>{createdTicket.assignedName}</strong>
            </div>
            {slaHours !== null && (
              <div className={styles.confirmRow}>
                <span>Estimated Response</span>
                <strong><Clock size={14} /> Within {slaHours} hours</strong>
              </div>
            )}
            <div className={styles.confirmRow}>
              <span>Category</span>
              <strong>{ISSUE_CATEGORIES.find(c => c.value === category)?.label || category}</strong>
            </div>
            <div className={styles.confirmRow}>
              <span>Priority Assigned</span>
              <strong>
                <span className={styles.priorityBadge} style={{ background: `${inferredPriority.color}20`, color: inferredPriority.color }}>
                  {inferredPriority.label}
                </span>
              </strong>
            </div>
            {proofFile && (
              <div className={styles.confirmRow}>
                <span>Proof Uploaded</span>
                <strong style={{ color: '#10b981' }}>✓ {proofFile.name}</strong>
              </div>
            )}
          </div>

          <div className={styles.confirmActions}>
            <button className="btn btn-primary" onClick={() => router.push('/my-tickets')}>
              View My Tickets
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={() => {
                setStep(1); setCategory(''); setSubject(''); setDescription('');
                setOrderId(''); setCreatedTicket(null); setProofFile(null);
              }}
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Progress Steps */}
      <div className={styles.progressBar}>
        <div className={`${styles.progressStep} ${step >= 1 ? styles.activeStep : ''}`}>
          <div className={styles.stepCircle}>1</div>
          <span>Category</span>
        </div>
        <div className={styles.progressLine} />
        <div className={`${styles.progressStep} ${step >= 2 ? styles.activeStep : ''}`}>
          <div className={styles.stepCircle}>2</div>
          <span>Details</span>
        </div>
        <div className={styles.progressLine} />
        <div className={`${styles.progressStep} ${step >= 3 ? styles.activeStep : ''}`}>
          <div className={styles.stepCircle}>3</div>
          <span>Confirmation</span>
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <h2>What do you need help with?</h2>
          <p className={styles.stepDesc}>Select the category that best describes your issue.</p>

          <div className={styles.categoryGrid}>
            {ISSUE_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                className={`${styles.categoryCard} ${category === cat.value ? styles.categorySelected : ''}`}
                onClick={() => setCategory(cat.value)}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <strong>{cat.label}</strong>
                <p>{cat.description}</p>
              </button>
            ))}
          </div>

          {category === 'Other' && (
            <div className={styles.otherNote}>
              <span>ℹ️</span>
              <p>
                &ldquo;Other&rdquo; tickets will be reviewed by our admin team who will assign the best agent for your issue.
                This may take slightly longer.
              </p>
            </div>
          )}

          <div className={styles.stepActions}>
            <button className={styles.backLink} onClick={() => router.push(isCustomer ? '/portal' : '/dashboard')}>
              <ArrowLeft size={16} /> Cancel
            </button>
            <button className="btn btn-primary" disabled={!category} onClick={() => setStep(2)}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Ticket Details */}
      {step === 2 && (
        <div className={styles.stepContent}>
          <h2>Tell us more about your issue</h2>
          <p className={styles.stepDesc}>
            Category: <strong>{ISSUE_CATEGORIES.find(c => c.value === category)?.label}</strong>
          </p>

          {error && <div className={styles.errorBox}><AlertCircle size={14} style={{display:'inline',marginRight:6}} />{error}</div>}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief summary of your issue"
                maxLength={100}
              />
            </div>

            <div className={styles.field}>
              <label>Description *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, etc."
                rows={5}
              />
            </div>

            {/* Auto-priority preview */}
            {(subject || description) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                <span>System-assigned priority:</span>
                <span
                  className={styles.priorityBadge}
                  style={{ background: `${inferredPriority.color}20`, color: inferredPriority.color }}
                >
                  {inferredPriority.label}
                </span>
              </div>
            )}

            <div className={styles.fieldRow}>
              {/* Related Order */}
              <div className={styles.field}>
                <label>Related Order (optional)</label>
                {isCustomer ? (
                  loadingOrders ? (
                    <div style={{ padding: '10px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading your orders...</div>
                  ) : myOrders.length > 0 ? (
                    <select
                      value={orderId}
                      onChange={e => setOrderId(e.target.value)}
                      style={{ background: '#1e1e3a', color: '#e2e8f0' }}
                    >
                      <option value="">-- Select an Order (optional) --</option>
                      {myOrders.map(o => (
                        <option key={o.orderId} value={o.orderId}>{o.product} ({o.orderId})</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ padding: '10px 12px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      No orders found.
                    </div>
                  )
                ) : (
                  <input
                    type="text"
                    value={orderId}
                    onChange={e => setOrderId(e.target.value)}
                    placeholder="e.g. ORD-ABC123"
                  />
                )}
              </div>

              {/* Proof Upload (only for relevant categories) */}
              {needsProof && (
                <div className={styles.field}>
                  <label>
                    <Paperclip size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Attach Proof (optional)
                  </label>
                  <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />
                    {proofFile ? (
                      <div className={styles.uploadPreview}>
                        <ImageIcon size={14} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proofFile.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setProofFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        <ImageIcon size={20} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.4 }} />
                        Click to upload image or PDF
                        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>Max 5MB</div>
                      </div>
                    )}
                  </div>
                  <div className={styles.proofNote}>
                    💡 For {category} issues, attaching a screenshot or receipt speeds up resolution significantly.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.stepActions}>
            <button className={styles.backLink} onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || uploadingProof}>
              {loading || uploadingProof ? (
                <><Loader2 size={18} className={styles.spinning} /> {uploadingProof ? 'Uploading...' : 'Submitting...'}</>
              ) : (
                <><Send size={16} /> Submit Ticket</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
