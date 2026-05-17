/**
 * ============================================================================
 * SUPPORTDESK CRM — CONFIGURATION
 * Central configuration for sheet names, column schemas, and system constants.
 * ============================================================================
 */
const CONFIG = {
  // ---------------------------------------------------------------------------
  // Google Spreadsheet Configuration
  // ---------------------------------------------------------------------------
  SPREADSHEET_ID: '1VxecyH6lCXQFalu8CzLHYzBLByBpWFLB5ioirDPZu7g',

  // ---------------------------------------------------------------------------
  // Sheet Names (must match exactly in Google Sheets)
  // ---------------------------------------------------------------------------
  SHEETS: {
    USERS:              'Users',
    TICKETS:            'Tickets',
    CUSTOMERS:          'Customers',
    ORDERS:             'Orders',
    AGENTS:             'Agents',
    TEAM_BUCKETS:       'TeamBuckets',
    COMMENTS:           'Comments',
    ESCALATIONS:        'Escalations',
    ACTIVITY_LOGS:      'ActivityLogs',
    ATTACHMENTS:        'Attachments',
    SETTINGS:           'Settings',
    DASHBOARD_CACHE:    'DashboardCache',
    AGENT_CATEGORIES:   'AgentCategories',
    NOTIFICATIONS:      'Notifications'
  },

  // ---------------------------------------------------------------------------
  // Column schemas — order MUST match the sheet header row
  // ---------------------------------------------------------------------------
  COLUMNS: {
    USERS: [
      'userId', 'name', 'email', 'passwordHash', 'role',
      'agentId', 'customerId', 'token', 'tokenExpiry', 'createdAt', 'isActive'
    ],
    TICKETS: [
      'ticketId', 'subject', 'description', 'status', 'priority',
      'channel', 'queryTheme', 'actionTaken',
      'customerId', 'customerName', 'customerEmail', 'customerPhone',
      'orderId', 'assignedTo', 'assignedName', 'teamBucket',
      'createdAt', 'updatedAt', 'resolvedAt', 'slaDeadline',
      'isEscalated', 'tags'
    ],
    CUSTOMERS: [
      'customerId', 'name', 'email', 'phone', 'totalTickets', 'createdAt'
    ],
    ORDERS: [
      'orderId', 'customerId', 'customerName', 'orderDate', 'amount', 'status', 'product', 'confirmationId',
      'assignedTo', 'assignedName', 'teamBucket', 'priority', 'updatedAt'
    ],
    AGENTS: [
      'agentId', 'name', 'email', 'role', 'teamId', 'isActive'
    ],
    TEAM_BUCKETS: [
      'teamId', 'name', 'description', 'isVIP'
    ],
    COMMENTS: [
      'commentId', 'ticketId', 'orderId', 'agentId', 'agentName', 'content', 'isInternal', 'createdAt'
    ],
    ESCALATIONS: [
      'escalationId', 'ticketId', 'escalatedBy', 'escalatedByName',
      'escalatedTo', 'escalatedToName', 'reason', 'createdAt'
    ],
    ACTIVITY_LOGS: [
      'logId', 'ticketId', 'orderId', 'agentId', 'agentName', 'action', 'details', 'timestamp'
    ],
    ATTACHMENTS: [
      'attachmentId', 'ticketId', 'fileName', 'fileUrl', 'mimeType', 'uploadedBy', 'createdAt'
    ],
    SETTINGS: ['key', 'value', 'description'],
    DASHBOARD_CACHE: ['metricKey', 'metricValue', 'lastUpdated'],
    AGENT_CATEGORIES: ['agentId', 'agentName', 'category', 'isActive'],
    NOTIFICATIONS: ['notificationId', 'userId', 'title', 'message', 'type', 'link', 'isRead', 'createdAt']
  },

  // ---------------------------------------------------------------------------
  // Enumerations
  // ---------------------------------------------------------------------------
  STATUSES: ['Pending', 'InProgress', 'WorkCompleted', 'WaitingCustomer', 'WaitingThirdParty', 'Resolved'],
  PRIORITIES: ['Low', 'Medium', 'High', 'Urgent'],
  CHANNELS: ['WhatsApp', 'Instagram', 'Facebook', 'Email', 'Calls', 'Portal'],
  ROLES: ['Admin', 'Agent', 'Customer'],
  AGENT_ROLES: ['Admin', 'TeamLead', 'Agent'],

  // Issue categories for ticket routing
  ISSUE_CATEGORIES: [
    'Billing', 'Technical', 'Shipping', 'Account', 'Product', 'Feature Request', 'Other'
  ],

  // Legacy alias
  QUERY_THEMES: ['Billing', 'Technical', 'Shipping', 'Account', 'Product', 'Feature Request', 'Other'],

  // ---------------------------------------------------------------------------
  // Cache TTL (seconds)
  // ---------------------------------------------------------------------------
  CACHE_TTL: {
    TICKETS:   300,   // 5 min
    AGENTS:    1800,  // 30 min
    DASHBOARD: 600,   // 10 min
    CUSTOMERS: 900    // 15 min
  },

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------
  AUTH: {
    TOKEN_EXPIRY_HOURS: 24,
    MIN_PASSWORD_LENGTH: 6
  },

  // ---------------------------------------------------------------------------
  // SLA defaults (hours)
  // ---------------------------------------------------------------------------
  SLA: {
    Low:    48,
    Medium: 24,
    High:   8,
    Urgent: 4
  },

  // ---------------------------------------------------------------------------
  // API Keys (External Integrations)
  // ---------------------------------------------------------------------------
  API_KEYS: {
    GROQ_API_KEY: "YOUR_GROQ_API_KEY",
    DEEPGRAM_API_KEY: "YOUR_DEEPGRAM_API_KEY"
  }
};

