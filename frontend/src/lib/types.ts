// ============================================================================
// SUPPORTDESK CRM — TYPESCRIPT TYPE DEFINITIONS
// ============================================================================

export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Customer';
  agentId?: string;
  customerId?: string;
  token: string;
  tokenExpiry?: string;
}

export interface Ticket {
  ticketId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: Channel;
  queryTheme: string;
  actionTaken: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderId: string;
  assignedTo: string;
  assignedName: string;
  teamBucket: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string;
  slaDeadline: string;
  isEscalated: boolean;
  tags: string;
  // Related data (populated on detail fetch)
  comments?: Comment[];
  escalations?: Escalation[];
  activityLogs?: ActivityLog[];
  attachments?: Attachment[];
  order?: Order | null;
}

export type TicketStatus = 'Pending' | 'InProgress' | 'WaitingCustomer' | 'WaitingThirdParty' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type Channel = 'WhatsApp' | 'Instagram' | 'Facebook' | 'Email' | 'Calls' | 'Portal';

export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  totalTickets: number;
  createdAt: string;
  tickets?: Ticket[];
  orders?: Order[];
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  amount: number;
  status: string;
  product: string;
  confirmationId: string;
  assignedTo?: string;
  assignedName?: string;
  teamBucket?: string;
  priority?: 'Standard' | 'VIP' | 'Consulting';
  updatedAt?: string;
  comments?: Comment[];
  activityLogs?: ActivityLog[];
}

export interface Agent {
  agentId: string;
  name: string;
  email: string;
  role: string;
  teamId: string;
  isActive: boolean;
}

export interface Team {
  teamId: string;
  name: string;
  description: string;
  isVIP: boolean;
}

export interface Comment {
  commentId: string;
  ticketId: string;
  orderId?: string;
  agentId: string;
  agentName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface Escalation {
  escalationId: string;
  ticketId: string;
  escalatedBy: string;
  escalatedByName: string;
  escalatedTo: string;
  escalatedToName: string;
  reason: string;
  createdAt: string;
}

export interface ActivityLog {
  logId: string;
  ticketId: string;
  orderId?: string;
  agentId: string;
  agentName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Attachment {
  attachmentId: string;
  ticketId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  open: number;
  resolved: number;
  pending: number;
  inProgress: number;
  escalated: number;
  avgResolutionHours: number;
  slaBreachPct: number;
  slaBreached: number;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;
  trend: { date: string; count: number }[];
  topAgents: { agentId: string; name: string; resolved: number }[];
  agentContext?: {
    categories: string[];
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: { code: number; message: string; field?: string };
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
