/**
 * ============================================================================
 * SUPPORTDESK CRM — MAIN ENTRY POINT
 * Handles doGet/doPost routing with authentication and role-based middleware.
 * Supports 3 roles: Admin, Agent, Customer
 * ============================================================================
 */

function doGet(e) { return _route(e, 'GET'); }
function doPost(e) { return _route(e, 'POST'); }

// Actions that do NOT require authentication
var PUBLIC_ACTIONS = ['login', 'register'];

// Actions restricted to Admin only
var ADMIN_ONLY = ['deleteTicket', 'getUnassignedTickets', 'getRoutingStats'];

// Actions restricted to Agent or Admin (not Customer)
var STAFF_ONLY = [
  'getTickets', 'createTicket', 'updateTicket', 'assignTicket',
  'searchTickets', 'exportTickets', 'getMyAssignedTickets',
  'getAgents', 'getTeams', 'getCustomers', 'getCustomerById',
  'getOrders', 'getOrdersByCustomer', 'getOrderById', 'updateOrderStatus',
  'addComment', 'escalateTicket', 'getEscalations', 'getDashboard',
  'uploadAttachment', 'getAttachments'
];

function _route(e, method) {
  try {
    var params;
    if (method === 'GET') {
      params = e.parameter || {};
    } else {
      params = e.postData ? JSON.parse(e.postData.contents) : {};
    }

    var action = params.action;
    if (!action) return Response.error('Missing "action" parameter', 400);

    // -----------------------------------------------------------------------
    // AUTH MIDDLEWARE — validate token for protected actions
    // -----------------------------------------------------------------------
    if (PUBLIC_ACTIONS.indexOf(action) === -1) {
      var token = params.token || params._token || '';
      try {
        var authUser = AuthController.validateToken(token);
        params._currentUserId     = authUser.userId;
        params._currentAgentId    = authUser.agentId || '';
        params._currentCustomerId = authUser.customerId || '';
        params._currentAgentName  = authUser.name;
        params._currentRole       = authUser.role;
        params._token             = token;
      } catch (authErr) {
        var msg = authErr.message;
        if (msg === 'AUTH_REQUIRED') return Response.error('Authentication required', 401);
        if (msg === 'AUTH_INVALID')  return Response.error('Invalid or expired token', 401);
        if (msg === 'AUTH_EXPIRED')  return Response.error('Session expired — please login again', 401);
        return Response.error('Authentication failed', 401);
      }

      // Role-based access checks
      var role = params._currentRole;

      // Admin-only routes
      if (ADMIN_ONLY.indexOf(action) !== -1 && role !== 'Admin') {
        return Response.error('Admin access required', 403);
      }

      // Staff-only routes (Admin + Agent, not Customer)
      if (STAFF_ONLY.indexOf(action) !== -1 && role === 'Customer') {
        return Response.error('Staff access required', 403);
      }
    }

    // -----------------------------------------------------------------------
    // ROUTE TO CONTROLLER
    // -----------------------------------------------------------------------
    switch (action) {
      // Auth
      case 'login':            return AuthController.login(params);
      case 'register':         return AuthController.register(params);
      case 'getMe':            return AuthController.getMe(params);
      case 'logout':           return AuthController.logout(params);

      // Tickets — Staff (Admin/Agent)
      case 'getTickets':         return TicketController.getTickets(params);
      case 'getTicketById':      return TicketController.getTicketById(params);
      case 'createTicket':       return TicketController.createTicket(params);
      case 'updateTicket':       return TicketController.updateTicket(params);
      case 'deleteTicket':       return TicketController.deleteTicket(params);
      case 'searchTickets':      return TicketController.searchTickets(params);
      case 'assignTicket':       return TicketController.assignTicket(params);
      case 'exportTickets':      return TicketController.exportCSV(params);
      case 'getMyAssignedTickets': return TicketController.getMyAssignedTickets(params);
      case 'getUnassignedTickets': return TicketController.getUnassignedTickets(params);

      // Tickets — Customer
      case 'customerCreateTicket':    return TicketController.customerCreateTicket(params);
      case 'customerGetMyTickets':    return TicketController.customerGetMyTickets(params);
      case 'customerGetTicketById':   return TicketController.customerGetTicketById(params);
      case 'customerAddReply':        return TicketController.customerAddReply(params);

      // Agents & Teams
      case 'getAgents':        return AgentController.getAgents(params);
      case 'getTeams':         return AgentController.getTeams(params);

      // Routing Stats (Admin)
      case 'getRoutingStats':  return Response.success(RoutingEngine.getCategoryStats(params.category));

      // Customers
      case 'getCustomers':     return CustomerController.getCustomers(params);
      case 'getCustomerById':  return CustomerController.getCustomerById(params);

      // Orders — Staff
      case 'getOrders':            return OrderController.getOrders(params);
      case 'getOrdersByCustomer':  return OrderController.getOrdersByCustomer(params);
      case 'getOrderById':         return OrderController.getOrderById(params);
      case 'updateOrderStatus':    return OrderController.updateOrderStatus(params);
      case 'addOrderComment':      return OrderController.addOrderComment(params);

      // Orders — Customer
      case 'customerAddOrder':     return OrderController.customerAddOrder(params);
      case 'customerGetMyOrders':  return OrderController.customerGetMyOrders(params);
      case 'customerGetOrderById': return OrderController.customerGetOrderById(params);

      // Comments
      case 'addComment':       return CommentController.addComment(params);
      case 'getComments':      return CommentController.getComments(params);

      // Escalations
      case 'escalateTicket':   return EscalationController.escalateTicket(params);
      case 'getEscalations':   return EscalationController.getEscalations(params);

      // Analytics
      case 'getDashboard':     return AnalyticsController.getDashboardStats(params);

      // Notifications
      case 'getNotifications':     return Response.success(NotificationController.getUserNotifications([params._currentUserId, params._currentAgentId, params._currentCustomerId].filter(Boolean)));
      case 'markNotificationRead': return Response.success(NotificationController.markAsRead(params.notificationId, [params._currentUserId, params._currentAgentId, params._currentCustomerId].filter(Boolean)));
      case 'markAllNotificationsRead': return Response.success(NotificationController.markAllAsRead([params._currentUserId, params._currentAgentId, params._currentCustomerId].filter(Boolean)));

      // Attachments
      case 'uploadAttachment': return AttachmentController.upload(params);
      case 'getAttachments':   return AttachmentController.getByTicket(params);

      default:
        return Response.error('Unknown action: ' + action, 404);
    }
  } catch (err) {
    Logger.log('ROUTE ERROR: ' + err.message + '\n' + err.stack);
    return Response.error(err.message || 'Internal Server Error', 500);
  }
}
