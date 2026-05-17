// ============================================================================
// SUPPORTDESK CRM — CONSTANTS
// ============================================================================

export const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'Pending',            label: 'Pending',              color: '#f59e0b' },
  { value: 'InProgress',         label: 'In Progress',          color: '#3b82f6' },
  { value: 'WorkCompleted',      label: 'Work Completed',       color: '#10b981' },
  { value: 'WaitingCustomer',    label: 'Waiting on Customer',  color: '#a855f7' },
  { value: 'WaitingThirdParty',  label: 'Waiting on Third Party', color: '#ec4899' },
  { value: 'Resolved',           label: 'Resolved',             color: '#10b981' },
];

export const PRIORITY_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'Low',    label: 'Low',    color: '#6b7280' },
  { value: 'Medium', label: 'Medium', color: '#f59e0b' },
  { value: 'High',   label: 'High',   color: '#f97316' },
  { value: 'Urgent', label: 'Urgent', color: '#ef4444' },
];

export const CHANNEL_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'WhatsApp',  label: 'WhatsApp',  icon: '💬' },
  { value: 'Instagram', label: 'Instagram', icon: '📸' },
  { value: 'Facebook',  label: 'Facebook',  icon: '👤' },
  { value: 'Email',     label: 'Email',     icon: '📧' },
  { value: 'Calls',     label: 'Calls',     icon: '📞' },
  { value: 'Portal',    label: 'Portal',    icon: '🌐' },
];

export const ISSUE_CATEGORIES = [
  { value: 'Billing',         label: 'Billing & Payments',   icon: '💳', description: 'Invoice issues, refunds, payment errors' },
  { value: 'Technical',       label: 'Technical Support',     icon: '🔧', description: 'Bugs, crashes, API issues' },
  { value: 'Shipping',        label: 'Shipping & Delivery',   icon: '📦', description: 'Delayed orders, wrong items, tracking' },
  { value: 'Account',         label: 'Account & Access',      icon: '🔑', description: 'Login issues, password reset, permissions' },
  { value: 'Product',         label: 'Product Issues',        icon: '📱', description: 'Defective products, feature questions' },
  { value: 'Feature Request', label: 'Feature Request',       icon: '💡', description: 'New feature suggestions, improvements' },
  { value: 'Other',           label: 'Other',                 icon: '📋', description: 'Anything else not listed above' },
];

export const QUERY_THEMES = [
  'Billing', 'Technical', 'Shipping', 'Account', 'Product', 'Feature Request', 'Other'
];

export const VIEW_MODES = [
  { value: 'all',        label: 'All Tickets' },
  { value: 'active',     label: 'Active' },
  { value: 'myTickets',  label: 'My Tickets' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'escalated',  label: 'Escalated' },
];

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'Pending': 'badge-pending',
    'InProgress': 'badge-inprogress',
    'WorkCompleted': 'badge-resolved',
    'WaitingCustomer': 'badge-waiting-customer',
    'WaitingThirdParty': 'badge-waiting-third',
    'Resolved': 'badge-resolved',
  };
  return map[status] || 'badge-pending';
}

export function getPriorityBadgeClass(priority: string): string {
  const map: Record<string, string> = {
    'Low': 'badge-low',
    'Medium': 'badge-medium',
    'High': 'badge-high',
    'Urgent': 'badge-urgent',
  };
  return map[priority] || 'badge-medium';
}

export function getStatusLabel(status: string): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.label || status;
}

export function getStatusColor(status: string): string {
  return STATUS_OPTIONS.find(s => s.value === status)?.color || '#6b7280';
}

export function getPriorityColor(priority: string): string {
  return PRIORITY_OPTIONS.find(p => p.value === priority)?.color || '#6b7280';
}

export function getChannelIcon(channel: string): string {
  return CHANNEL_OPTIONS.find(c => c.value === channel)?.icon || '📧';
}

export function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
