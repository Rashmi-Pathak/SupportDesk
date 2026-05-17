/**
 * ============================================================================
 * SUPPORTDESK CRM — TICKET CONTROLLER
 * Full CRUD, search, filtering, pagination, CSV export, and customer endpoints.
 * ============================================================================
 */
const TicketController = {
  _dao: function () {
    return new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS);
  },

  // ---------------------------------------------------------------------------
  // GET TICKETS (with filters + pagination) — Admin/Agent only
  // ---------------------------------------------------------------------------
  getTickets: function (params) {
    var allTickets = CacheManager.getOrSet('ALL_TICKETS', CONFIG.CACHE_TTL.TICKETS, function () {
      return new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS).getAll();
    });

    var filtered = allTickets.slice(); // clone

    // --- Filters ---
    if (params.status)     filtered = filtered.filter(function (t) { return t.status === params.status; });
    if (params.priority)   filtered = filtered.filter(function (t) { return t.priority === params.priority; });
    if (params.channel)    filtered = filtered.filter(function (t) { return t.channel === params.channel; });
    if (params.assignedTo) filtered = filtered.filter(function (t) { return t.assignedTo === params.assignedTo; });
    if (params.teamBucket) filtered = filtered.filter(function (t) { return t.teamBucket === params.teamBucket; });
    if (params.queryTheme) filtered = filtered.filter(function (t) { return t.queryTheme === params.queryTheme; });
    if (params.isEscalated === 'true') filtered = filtered.filter(function (t) { return t.isEscalated === true || t.isEscalated === 'TRUE'; });

    // Date range filter
    if (params.dateFrom) {
      var from = new Date(params.dateFrom);
      filtered = filtered.filter(function (t) { return new Date(t.createdAt) >= from; });
    }
    if (params.dateTo) {
      var to = new Date(params.dateTo);
      to.setHours(23, 59, 59);
      filtered = filtered.filter(function (t) { return new Date(t.createdAt) <= to; });
    }

    // View modes
    if (params.view === 'active') {
      filtered = filtered.filter(function (t) { return t.status !== 'Resolved'; });
    } else if (params.view === 'myTickets' && params._currentAgentId) {
      filtered = filtered.filter(function (t) { return t.assignedTo === params._currentAgentId; });
    } else if (params.view === 'escalated') {
      filtered = filtered.filter(function (t) { return t.isEscalated === true || t.isEscalated === 'TRUE'; });
    } else if (params.view === 'unassigned') {
      filtered = filtered.filter(function (t) { return !t.assignedTo || t.assignedTo === ''; });
    }

    // Sort by most recent first
    filtered.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    var result = Helpers.paginate(filtered, params.page || 1, params.limit || 25);
    return Response.success(result.data, result.meta);
  },

  // ---------------------------------------------------------------------------
  // GET AGENT'S ASSIGNED TICKETS (Agent-specific view)
  // ---------------------------------------------------------------------------
  getMyAssignedTickets: function (params) {
    var agentId = params._currentAgentId;
    if (!agentId) return Response.error('Agent ID required', 400);

    var allTickets = CacheManager.getOrSet('ALL_TICKETS', CONFIG.CACHE_TTL.TICKETS, function () {
      return new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS).getAll();
    });

    var mine = allTickets.filter(function (t) {
      return t.assignedTo === agentId;
    });

    // Apply optional status filter
    if (params.status) {
      mine = mine.filter(function (t) { return t.status === params.status; });
    }

    mine.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    var result = Helpers.paginate(mine, params.page || 1, params.limit || 25);
    return Response.success(result.data, result.meta);
  },

  // ---------------------------------------------------------------------------
  // GET UNASSIGNED TICKETS (Admin-only: tickets with no agent)
  // ---------------------------------------------------------------------------
  getUnassignedTickets: function (params) {
    var allTickets = CacheManager.getOrSet('ALL_TICKETS', CONFIG.CACHE_TTL.TICKETS, function () {
      return new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS).getAll();
    });

    var unassigned = allTickets.filter(function (t) {
      return !t.assignedTo || t.assignedTo === '';
    });

    unassigned.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    var result = Helpers.paginate(unassigned, params.page || 1, params.limit || 25);
    return Response.success(result.data, result.meta);
  },

  // ---------------------------------------------------------------------------
  // SEARCH TICKETS (multi-field)
  // ---------------------------------------------------------------------------
  searchTickets: function (params) {
    Validator.requireFields(params, ['q']);
    var query = String(params.q).toLowerCase().trim();

    var allTickets = CacheManager.getOrSet('ALL_TICKETS', CONFIG.CACHE_TTL.TICKETS, function () {
      return new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS).getAll();
    });

    var matches = allTickets.filter(function (t) {
      var haystack = [
        t.ticketId, t.subject, t.customerName, t.customerEmail,
        t.customerPhone, t.orderId, t.tags, t.assignedName, t.description
      ].join('|').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });

    var result = Helpers.paginate(matches, params.page || 1, params.limit || 25);
    return Response.success(result.data, result.meta);
  },

  // ---------------------------------------------------------------------------
  // GET TICKET BY ID (with related data)
  // ---------------------------------------------------------------------------
  getTicketById: function (params) {
    Validator.requireFields(params, ['id']);

    var ticket = this._dao().findById(params.id);
    if (!ticket) return Response.error('Ticket not found', 404);

    // Fetch related comments
    try {
      var commentsDao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
      var allComments = commentsDao.findWhere(function (c) { return c.ticketId === params.id; });
      // If current user is a customer, filter out internal comments
      if (params._currentRole === 'Customer') {
        allComments = allComments.filter(function (c) {
          return c.isInternal !== true && c.isInternal !== 'TRUE';
        });
      }
      ticket.comments = allComments;
    } catch (_) { ticket.comments = []; }

    // Fetch escalation history
    try {
      var escDao = new SheetDAO(CONFIG.SHEETS.ESCALATIONS, CONFIG.COLUMNS.ESCALATIONS);
      ticket.escalations = escDao.findWhere(function (e) { return e.ticketId === params.id; });
    } catch (_) { ticket.escalations = []; }

    // Fetch activity logs
    try {
      var logDao = new SheetDAO(CONFIG.SHEETS.ACTIVITY_LOGS, CONFIG.COLUMNS.ACTIVITY_LOGS);
      ticket.activityLogs = logDao.findWhere(function (l) { return l.ticketId === params.id; });
    } catch (_) { ticket.activityLogs = []; }

    // Fetch attachments
    try {
      var attDao = new SheetDAO(CONFIG.SHEETS.ATTACHMENTS, CONFIG.COLUMNS.ATTACHMENTS);
      ticket.attachments = attDao.findWhere(function (a) { return a.ticketId === params.id; });
    } catch (_) { ticket.attachments = []; }

    // Fetch order info if linked
    if (ticket.orderId) {
      try {
        var orderDao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
        ticket.order = orderDao.findById(ticket.orderId) || null;
      } catch (_) { ticket.order = null; }
    }

    return Response.success(ticket);
  },

  // ---------------------------------------------------------------------------
  // CREATE TICKET (Admin/Agent — manual assignment)
  // ---------------------------------------------------------------------------
  createTicket: function (params) {
    var data = params.data || params;
    Validator.requireFields(data, ['subject', 'customerName', 'customerEmail']);

    var now = new Date();
    var ticketId = Helpers.generateTicketId();
    var priority = data.priority || 'Medium';
    var slaHours = CONFIG.SLA[priority] || 24;
    var category = data.queryTheme || 'Other';

    // Check if customer exists, if not create them
    var custDao = new SheetDAO(CONFIG.SHEETS.CUSTOMERS, CONFIG.COLUMNS.CUSTOMERS);
    var customer = custDao.findFirst('email', data.customerEmail);
    var customerId = customer ? customer.customerId : (data.customerId || Helpers.generateId('CUST', 6));

    if (!customer) {
      customer = {
        customerId:    customerId,
        name:          data.customerName,
        email:         data.customerEmail,
        phone:         data.customerPhone || '',
        company:       data.company || '',
        totalTickets:  1,
        createdAt:     now.toISOString()
      };
      custDao.insert(customer);
      // GENERATE 5 RANDOM ORDERS FOR NEW CUSTOMER
      OrderService.generateForCustomer(customerId, data.customerName);
    } else {
      custDao.update(customerId, { totalTickets: (customer.totalTickets || 0) + 1 });
    }

    // Auto-route if no agent specified
    var assignedTo = data.assignedTo || '';
    var assignedName = data.assignedName || 'Unassigned';
    var teamBucket = data.teamBucket || '';

    if (!assignedTo && category !== 'Other') {
      var routing = RoutingEngine.assignByCategory(category);
      if (routing) {
        assignedTo = routing.agentId;
        assignedName = routing.agentName;
        teamBucket = routing.teamBucket;
      }
    }

    var newTicket = {
      ticketId:      ticketId,
      subject:       data.subject,
      description:   data.description || '',
      status:        data.status || 'Pending',
      priority:      priority,
      channel:       data.channel || 'Email',
      queryTheme:    category,
      actionTaken:   '',
      customerId:    customerId,
      customerName:  data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || '',
      orderId:       data.orderId || '',
      assignedTo:    assignedTo,
      assignedName:  assignedName,
      teamBucket:    teamBucket,
      createdAt:     now.toISOString(),
      updatedAt:     now.toISOString(),
      resolvedAt:    '',
      slaDeadline:   new Date(now.getTime() + slaHours * 3600000).toISOString(),
      isEscalated:   false,
      tags:          data.tags || ''
    };

    this._dao().insert(newTicket, true);
    CacheManager.clearMany(['ALL_TICKETS', 'ALL_CUSTOMERS']);

    ActivityLogService.log(ticketId, params._currentAgentId || 'SYSTEM', params._currentAgentName || 'System', 'Created', { channel: newTicket.channel });

    return Response.success(newTicket);
  },

  // ---------------------------------------------------------------------------
  // PRIORITY INFERENCE ENGINE — auto-assigns priority from category + keywords
  // ---------------------------------------------------------------------------
  _inferPriority: function (category, subject, description) {
    var text = (subject + ' ' + (description || '')).toLowerCase();
    var urgentKeywords = ['urgent', 'not working', 'blocked', 'data loss', 'cannot access',
      'cannot login', 'lost', 'broken', 'critical', 'immediately', 'asap',
      'account locked', 'payment failed', 'refund denied', 'wrong item'];
    if (urgentKeywords.some(function(k) { return text.indexOf(k) !== -1; })) {
      return 'Urgent';
    }
    if (['Billing', 'Account', 'Technical'].indexOf(category) !== -1) return 'High';
    if (['Shipping', 'Product'].indexOf(category) !== -1) return 'Medium';
    return 'Low';
  },

  // ---------------------------------------------------------------------------
  // CUSTOMER CREATE TICKET (auto-routing via RoutingEngine)
  // ---------------------------------------------------------------------------
  customerCreateTicket: function (params) {
    var data = params.data || params;
    Validator.requireFields(data, ['subject', 'description', 'queryTheme']);

    // Get customer info from the authenticated user
    var customerId = params._currentCustomerId || data.customerId;
    if (!customerId) return Response.error('Customer ID required', 400);

    // Look up customer details
    var custDao = new SheetDAO(CONFIG.SHEETS.CUSTOMERS, CONFIG.COLUMNS.CUSTOMERS);
    var customer = custDao.findById(customerId);
    if (!customer) return Response.error('Customer not found', 404);

    var now = new Date();
    var ticketId = Helpers.generateTicketId();
    var category = data.queryTheme || 'Other';

    // AUTO-infer priority — customer input is ignored
    var priority = this._inferPriority(category, data.subject, data.description);
    var slaHours = CONFIG.SLA[priority] || 24;

    // Auto-route based on category
    var assignedTo = '';
    var assignedName = 'Unassigned';
    var teamBucket = '';

    if (category !== 'Other') {
      var routing = RoutingEngine.assignByCategory(category);
      if (routing) {
        assignedTo = routing.agentId;
        assignedName = routing.agentName;
        teamBucket = routing.teamBucket;
      }
    }

    // Validate order belongs to this customer (if provided)
    var validOrderId = '';
    if (data.orderId) {
      var verifiedOrder = OrderController.validateOrderForCustomer(data.orderId, customerId);
      if (!verifiedOrder) {
        return Response.error('Order not found or does not belong to your account', 400);
      }
      validOrderId = verifiedOrder.orderId;
    }

    var newTicket = {
      ticketId:      ticketId,
      subject:       data.subject,
      description:   data.description,
      status:        'Pending',
      priority:      priority,
      channel:       'Portal',
      queryTheme:    category,
      actionTaken:   '',
      customerId:    customerId,
      customerName:  customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone || '',
      orderId:       validOrderId,
      assignedTo:    assignedTo,
      assignedName:  assignedName,
      teamBucket:    teamBucket,
      createdAt:     now.toISOString(),
      updatedAt:     now.toISOString(),
      resolvedAt:    '',
      slaDeadline:   new Date(now.getTime() + slaHours * 3600000).toISOString(),
      isEscalated:   false,
      tags:          ''
    };

    this._dao().insert(newTicket, true);
    CacheManager.clear('ALL_TICKETS');

    // Update customer total tickets count
    try {
      custDao.update(customerId, { totalTickets: (customer.totalTickets || 0) + 1 });
    } catch (_) {}

    ActivityLogService.log(ticketId, 'CUSTOMER', customer.name, 'Created via Portal', { category: category, assignedTo: assignedName, priority: priority });

    return Response.success(newTicket);
  },

  // ---------------------------------------------------------------------------
  // CUSTOMER GET MY TICKETS (only their own)
  // ---------------------------------------------------------------------------
  customerGetMyTickets: function (params) {
    var customerId = params._currentCustomerId;
    if (!customerId) return Response.error('Customer ID required', 400);

    var allTickets = CacheManager.getOrSet('ALL_TICKETS', CONFIG.CACHE_TTL.TICKETS, function () {
      return new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS).getAll();
    });

    var mine = allTickets.filter(function (t) {
      return t.customerId === customerId;
    });

    // Apply optional filters
    if (params.status) mine = mine.filter(function (t) { return t.status === params.status; });
    if (params.queryTheme) mine = mine.filter(function (t) { return t.queryTheme === params.queryTheme; });

    mine.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    var result = Helpers.paginate(mine, params.page || 1, params.limit || 25);
    return Response.success(result.data, result.meta);
  },

  // ---------------------------------------------------------------------------
  // CUSTOMER GET TICKET BY ID (ownership check)
  // ---------------------------------------------------------------------------
  customerGetTicketById: function (params) {
    Validator.requireFields(params, ['id']);

    var ticket = this._dao().findById(params.id);
    if (!ticket) return Response.error('Ticket not found', 404);

    // Ownership check
    if (ticket.customerId !== params._currentCustomerId) {
      return Response.error('Access denied — not your ticket', 403);
    }

    // Fetch comments (exclude internal notes)
    try {
      var commentsDao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
      ticket.comments = commentsDao.findWhere(function (c) {
        return c.ticketId === params.id && c.isInternal !== true && c.isInternal !== 'TRUE';
      });
    } catch (_) { ticket.comments = []; }

    return Response.success(ticket);
  },

  // ---------------------------------------------------------------------------
  // CUSTOMER ADD REPLY (public comment only)
  // ---------------------------------------------------------------------------
  customerAddReply: function (params) {
    Validator.requireFields(params, ['ticketId', 'content']);

    var ticket = this._dao().findById(params.ticketId);
    if (!ticket) return Response.error('Ticket not found', 404);
    if (ticket.customerId !== params._currentCustomerId) {
      return Response.error('Access denied', 403);
    }

    var commentId = Helpers.generateId('COM', 6);
    var now = new Date().toISOString();

    var comment = {
      commentId: commentId,
      ticketId:  params.ticketId,
      agentId:   params._currentCustomerId,
      agentName: params._currentAgentName || 'Customer',
      content:   params.content,
      isInternal: false,
      createdAt:  now
    };

    var commentsDao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
    commentsDao.insert(comment, false);

    // Update ticket timestamp
    this._dao().update(params.ticketId, { updatedAt: now });
    CacheManager.clear('ALL_TICKETS');

    // Notify assigned agent
    if (ticket.assignedTo) {
      NotificationController.createNotification(
        ticket.assignedTo,
        'Customer Replied',
        `${ticket.customerName} replied to ticket ${ticket.ticketId}.`,
        'info',
        `/tickets?view=${ticket.ticketId}`
      );
    }

    return Response.success(comment);
  },

  // ---------------------------------------------------------------------------
  // UPDATE TICKET
  // ---------------------------------------------------------------------------
  updateTicket: function (params) {
    var data = params.data || params;
    Validator.requireFields(data, ['ticketId']);

    var updates = {};
    var allowedFields = [
      'subject', 'description', 'status', 'priority', 'channel',
      'queryTheme', 'actionTaken', 'assignedTo', 'assignedName',
      'teamBucket', 'tags', 'orderId', 'customerPhone'
    ];

    allowedFields.forEach(function (f) {
      if (data[f] !== undefined) updates[f] = data[f];
    });

    updates.updatedAt = new Date().toISOString();

    // Auto-set resolvedAt on status change to Resolved
    if (data.status === 'Resolved') {
      updates.resolvedAt = new Date().toISOString();
    }

    var oldTicket = this._dao().findById(data.ticketId);
    var updated = this._dao().update(data.ticketId, updates);
    CacheManager.clear('ALL_TICKETS');

    // Notify customer on status change
    if (data.status && oldTicket && data.status !== oldTicket.status) {
      NotificationController.createNotification(
        updated.customerId, 
        'Ticket Status Updated', 
        `Your ticket ${updated.ticketId} is now ${data.status.replace(/([A-Z])/g, ' $1').trim()}.`, 
        'info', 
        `/my-tickets?view=${updated.ticketId}`
      );
    }

    ActivityLogService.log(data.ticketId, params._currentAgentId, params._currentAgentName || 'System', 'Updated', updates);

    return Response.success(updated);
  },

  // ---------------------------------------------------------------------------
  // DELETE TICKET (Admin only — soft delete via status)
  // ---------------------------------------------------------------------------
  deleteTicket: function (params) {
    Validator.requireFields(params, ['ticketId']);

    this._dao().deleteById(params.ticketId);
    CacheManager.clearMany(['ALL_TICKETS', 'DASHBOARD_STATS']);

    return Response.success({ message: 'Ticket deleted', ticketId: params.ticketId });
  },

  // ---------------------------------------------------------------------------
  // ASSIGN TICKET (Admin manual assignment)
  // ---------------------------------------------------------------------------
  assignTicket: function (params) {
    var data = params.data || params;
    Validator.requireFields(data, ['ticketId', 'agentId', 'agentName']);

    var updated = this._dao().update(data.ticketId, {
      assignedTo:     data.agentId,
      assignedName:   data.agentName,
      teamBucket:     data.teamBucket || '',
      updatedAt:      new Date().toISOString()
    });

    CacheManager.clear('ALL_TICKETS');
    ActivityLogService.log(data.ticketId, params._currentAgentId || data.agentId,
      params._currentAgentName || data.agentName, 'Assigned', { assignedTo: data.agentId });

    return Response.success(updated);
  },

  // ---------------------------------------------------------------------------
  // EXPORT TICKETS TO CSV
  // ---------------------------------------------------------------------------
  exportCSV: function (params) {
    var tickets = this._dao().getAll();
    var headers = CONFIG.COLUMNS.TICKETS;
    var csv = headers.join(',') + '\n';

    tickets.forEach(function (t) {
      var row = headers.map(function (h) {
        var val = String(t[h] || '').replace(/"/g, '""');
        return '"' + val + '"';
      });
      csv += row.join(',') + '\n';
    });

    return Response.success({ csv: csv, count: tickets.length });
  }
};
