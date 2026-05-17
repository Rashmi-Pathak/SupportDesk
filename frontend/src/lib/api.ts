// ============================================================================
// SUPPORTDESK CRM — API CLIENT
// Typed wrapper around Google Apps Script backend.
// ============================================================================
import type { ApiResponse, Ticket, Customer, Order, Agent, Team, Comment, Escalation, DashboardStats, Attachment } from './types';

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL || '';

class ApiClient {
  private cache = new Map<string, { data: any; expiry: number }>();

  private getToken(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('sdcrm_token') || '';
  }

  private invalidateCacheGroup(action: string) {
    if (['createTicket', 'updateTicket', 'deleteTicket', 'assignTicket', 'escalateTicket', 'customerCreateTicket', 'customerAddReply'].includes(action)) {
      // Clear all ticket cache entries
      for (const key of Array.from(this.cache.keys())) {
        if (key.startsWith('getTickets') || key.startsWith('getMyAssignedTickets') || key.startsWith('getUnassignedTickets') || key.startsWith('customerGetMyTickets') || key.startsWith('getDashboard')) {
          this.cache.delete(key);
        }
      }
    }
    if (['updateOrderStatus', 'customerAddOrder', 'addOrderComment'].includes(action)) {
      // Clear all order cache entries
      for (const key of Array.from(this.cache.keys())) {
        if (key.startsWith('getOrders') || key.startsWith('customerGetMyOrders') || key.startsWith('getDashboard')) {
          this.cache.delete(key);
        }
      }
    }
    if (['logout'].includes(action)) {
      this.cache.clear();
    }
  }

  private async request<T>(action: string, params: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
    this.invalidateCacheGroup(action);
    const token = this.getToken();
    const body = { action, token, ...params };

    try {
      const res = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      const json = JSON.parse(text) as ApiResponse<T>;
      return json;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return {
        success: false,
        data: null as unknown as T,
        error: { code: 0, message },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async requestCached<T>(action: string, ttlMs: number, params: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
    const cacheKey = `${action}_${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      return {
        success: true,
        data: cached.data as T,
        timestamp: new Date().toISOString()
      };
    }

    const res = await this.request<T>(action, params);
    if (res.success && res.data) {
      this.cache.set(cacheKey, { data: res.data, expiry: now + ttlMs });
    }
    return res;
  }

  // --- Auth -----------------------------------------------------------------
  async login(email: string, password: string) {
    return this.request<{ userId: string; name: string; email: string; role: string; agentId: string; customerId: string; token: string; tokenExpiry: string }>('login', { email, password });
  }

  async register(name: string, email: string, password: string, role?: string) {
    return this.request<{ userId: string; name: string; email: string; role: string; agentId: string; customerId: string; token: string; tokenExpiry: string }>('register', { name, email, password, role });
  }

  async getMe() {
    return this.requestCached<{ userId: string; name: string; email: string; role: string; agentId: string; customerId: string }>('getMe', 300000);
  }

  async logout() {
    return this.request<{ message: string }>('logout');
  }

  // --- Tickets (Staff) -------------------------------------------------------
  async getTickets(params: Record<string, string | number> = {}) {
    return this.requestCached<Ticket[]>('getTickets', 10000, params);
  }

  async getTicketById(id: string) {
    return this.request<Ticket>('getTicketById', { id });
  }

  async createTicket(data: Partial<Ticket>) {
    return this.request<Ticket>('createTicket', { data });
  }

  async updateTicket(data: Partial<Ticket> & { ticketId: string }) {
    return this.request<Ticket>('updateTicket', { data });
  }

  async deleteTicket(ticketId: string) {
    return this.request<{ message: string }>('deleteTicket', { ticketId });
  }

  async searchTickets(q: string, page = 1, limit = 25) {
    return this.request<Ticket[]>('searchTickets', { q, page, limit });
  }

  async assignTicket(ticketId: string, agentId: string, agentName: string) {
    return this.request<Ticket>('assignTicket', { data: { ticketId, agentId, agentName } });
  }

  async exportTickets() {
    return this.request<{ csv: string; count: number }>('exportTickets');
  }

  async getMyAssignedTickets(params: Record<string, string | number> = {}) {
    return this.requestCached<Ticket[]>('getMyAssignedTickets', 10000, params);
  }

  async getUnassignedTickets(params: Record<string, string | number> = {}) {
    return this.requestCached<Ticket[]>('getUnassignedTickets', 10000, params);
  }

  // --- Tickets (Customer) ---------------------------------------------------
  async customerCreateTicket(data: { subject: string; description: string; queryTheme: string; priority?: string; orderId?: string }) {
    return this.request<Ticket>('customerCreateTicket', data);
  }

  async customerGetMyTickets(params: Record<string, string | number> = {}) {
    return this.requestCached<Ticket[]>('customerGetMyTickets', 10000, params);
  }

  async customerGetTicketById(id: string) {
    return this.request<Ticket>('customerGetTicketById', { id });
  }

  async customerAddReply(ticketId: string, content: string) {
    return this.request<Comment>('customerAddReply', { ticketId, content });
  }

  // --- Agents & Teams -------------------------------------------------------
  async getAgents(teamId?: string) {
    return this.requestCached<Agent[]>('getAgents', 300000, teamId ? { teamId } : {});
  }

  async getTeams() {
    return this.requestCached<Team[]>('getTeams', 300000);
  }

  // --- Customers ------------------------------------------------------------
  async getCustomers(params: Record<string, string | number> = {}) {
    return this.requestCached<Customer[]>('getCustomers', 60000, params);
  }

  async getCustomerById(id: string) {
    return this.request<Customer>('getCustomerById', { id });
  }

  // --- Orders (Staff) -------------------------------------------------------
  async getOrders(params: Record<string, string | number> = {}) {
    return this.requestCached<Order[]>('getOrders', 10000, params);
  }

  async getOrderById(id: string) {
    return this.request<Order & { comments: Comment[]; activityLogs: any[] }>('getOrderById', { id });
  }

  async updateOrderStatus(id: string, status: string) {
    return this.request<Order>('updateOrderStatus', { id, status });
  }

  // --- Orders (Customer) ---------------------------------------------------
  async customerAddOrder(data: { product: string; amount: number; orderDate: string; status: string; confirmationId: string }) {
    return this.request<Order>('customerAddOrder', data);
  }

  async customerGetMyOrders(params: Record<string, string | number> = {}) {
    return this.requestCached<Order[]>('customerGetMyOrders', 10000, params);
  }

  async customerGetOrderById(id: string) {
    return this.request<Order & { comments: Comment[]; activityLogs: any[] }>('customerGetOrderById', { id });
  }

  async getOrdersByCustomer(customerId: string) {
    return this.requestCached<Order[]>('getOrdersByCustomer', 10000, { customerId });
  }

  async addOrderComment(orderId: string, content: string, isInternal = false) {
    return this.request<Comment>('addOrderComment', { orderId, content, isInternal });
  }

  // --- Comments -------------------------------------------------------------
  async addComment(ticketId: string, content: string, isInternal = false) {
    return this.request<Comment>('addComment', { data: { ticketId, content, isInternal } });
  }

  async getComments(ticketId: string) {
    return this.request<Comment[]>('getComments', { ticketId });
  }

  // --- Escalations ----------------------------------------------------------
  async escalateTicket(data: { ticketId: string; escalatedTo: string; escalatedToName: string; reason: string; teamBucket?: string }) {
    return this.request<Escalation>('escalateTicket', { data });
  }

  async getEscalations(ticketId: string) {
    return this.request<Escalation[]>('getEscalations', { ticketId });
  }

  // --- Dashboard ------------------------------------------------------------
  async getDashboard() {
    return this.requestCached<DashboardStats>('getDashboard', 15000);
  }

  // --- Attachments ----------------------------------------------------------
  async uploadAttachment(ticketId: string, fileName: string, content: string, mimeType: string) {
    return this.request<Attachment>('uploadAttachment', { data: { ticketId, fileName, content, mimeType } });
  }

  async getAttachments(ticketId: string) {
    return this.request<Attachment[]>('getAttachments', { ticketId });
  }

  // --- Notifications --------------------------------------------------------
  async getNotifications() {
    return this.requestCached<any[]>('getNotifications', 15000);
  }

  async markNotificationRead(notificationId: string) {
    return this.request<boolean>('markNotificationRead', { notificationId });
  }
  
  async markAllNotificationsRead() {
    return this.request<boolean>('markAllNotificationsRead');
  }

  async analyzeWithAI(context: { type: 'ticket' | 'order'; title: string; desc: string; customer: string; status: string; priority: string; history: string }) {
    const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "YOUR_GROQ_API_KEY";
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert customer support AI Copilot embedded inside SupportDesk CRM.
Analyze the provided ${context.type} details and history. 
You must respond with a valid JSON object containing exactly these fields:
{
  "sentiment": "Friendly" | "Neutral" | "Frustrated" | "Angry",
  "recommendation": "A single short sentence describing the exact next best operational action for the agent (e.g. update status to processing, assign to team billing, etc.).",
  "draft": "A beautifully written, highly polite, and empathetic response draft to the customer. Address them by name if available, mention the specific issue details, outline next steps, and sign off as 'Support Desk AI Copilot'."
}
Ensure the "draft" uses newlines (\\n) for paragraphs and is formatted professionally. Do not include any markdown outside of the JSON object itself.`
            },
            {
              role: 'user',
              content: `Analyze this ${context.type}:
Title/Subject: ${context.title}
Description: ${context.desc}
Customer Name: ${context.customer}
Status: ${context.status}
Priority: ${context.priority}
Recent chat/activity logs: ${context.history}`
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content) as { sentiment: string; recommendation: string; draft: string };
    } catch (err) {
      console.error('Groq AI error, falling back to local simulation:', err);
      return {
        sentiment: context.priority === 'Urgent' ? 'Frustrated' : 'Neutral',
        recommendation: 'Acknowledge the customer, check operational status, and reply.',
        draft: `Hi ${context.customer},\n\nThank you for reaching out regarding "${context.title}". I am reviewing your request and will provide an update shortly.\n\nBest regards,\nSupport Desk AI Copilot`
      };
    }
  }
}

export const api = new ApiClient();

