/**
 * ============================================================================
 * SUPPORTDESK CRM — ORDER CONTROLLER
 * Staff order listing + Customer self-service order management.
 *
 * Customers add their own orders with a "Confirmation ID" from the
 * e-commerce site.  This validates the order is real and prevents
 * fake ticket submissions.
 * ============================================================================
 */
const OrderController = {

  // -------------------------------------------------------------------------
  // STAFF endpoints (Admin / Agent)
  // -------------------------------------------------------------------------
  getOrders: function (params) {
    var dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var orders = dao.getAll();
    if (params.q) {
      var q = String(params.q).toLowerCase();
      orders = orders.filter(function (o) {
        return String(o.orderId + '|' + o.customerName + '|' + o.product + '|' + o.confirmationId).toLowerCase().indexOf(q) !== -1;
      });
    }
    if (params.status) orders = orders.filter(function (o) { return o.status === params.status; });
    if (params.customerId) orders = orders.filter(function (o) { return o.customerId === params.customerId; });
    if (params.assignedTo) orders = orders.filter(function (o) { return o.assignedTo === params.assignedTo; });
    var result = Helpers.paginate(orders, params.page || 1, params.limit || 25);
    return Response.success(result.data, result.meta);
  },

  getOrdersByCustomer: function (params) {
    Validator.requireFields(params, ['customerId']);
    var dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var orders = dao.findWhere(function (o) { return o.customerId === params.customerId; });
    return Response.success(orders);
  },

  // -------------------------------------------------------------------------
  // CUSTOMER endpoints — self-service order management
  // -------------------------------------------------------------------------

  /**
   * Customer adds an order they placed on the e-commerce site.
   * Requires: product, amount, orderDate, confirmationId
   * The confirmationId acts as proof the order is genuine.
   */
  customerAddOrder: function (params) {
    var customerId = params._currentCustomerId;
    if (!customerId) return Response.error('Customer ID not found. Please login again.', 401);

    // Validate required fields
    if (!params.product || !params.confirmationId) {
      return Response.error('Product name and Confirmation ID are required', 400);
    }

    // Get customer info
    var userDao = new SheetDAO(CONFIG.SHEETS.USERS, CONFIG.COLUMNS.USERS);
    var users = userDao.getAll();
    var currentUser = users.find(function (u) { return u.customerId === customerId; });
    if (!currentUser) return Response.error('Customer not found', 404);

    // Check for duplicate confirmation ID (prevent re-use)
    var orderDao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var allOrders = orderDao.getAll();
    var duplicate = allOrders.find(function (o) {
      return String(o.confirmationId).trim().toUpperCase() === String(params.confirmationId).trim().toUpperCase();
    });
    if (duplicate) {
      return Response.error('This Confirmation ID has already been registered', 409);
    }

    var now = new Date().toISOString();
    var orderId = 'ORD-' + Helpers.uuid().substring(0, 8).toUpperCase();

    var orderData = {
      orderId:        orderId,
      customerId:     customerId,
      customerName:   currentUser.name,
      orderDate:      params.orderDate || now,
      amount:         params.amount || 0,
      status:         params.status || 'Processing',
      product:        params.product,
      confirmationId: String(params.confirmationId).trim().toUpperCase()
    };

    orderDao.insert(orderData, false);

    Logger.log('[OrderController] Customer ' + customerId + ' added order: ' + orderId + ' (Conf: ' + orderData.confirmationId + ')');

    return Response.success(orderData);
  },

  /**
   * Customer views their own orders (filtered by customerId).
   */
  customerGetMyOrders: function (params) {
    var customerId = params._currentCustomerId;
    if (!customerId) return Response.error('Customer ID not found', 401);

    var dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var orders = dao.findWhere(function (o) { return o.customerId === customerId; });

    // Sort newest first
    orders.sort(function (a, b) {
      return new Date(b.orderDate) - new Date(a.orderDate);
    });

    return Response.success(orders);
  },

  /**
   * Validate that a confirmation ID exists and belongs to the customer.
   * Used internally during ticket creation.
   */
  validateOrderForCustomer: function (orderId, customerId) {
    var dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var order = dao.findWhere(function (o) {
      return o.orderId === orderId && o.customerId === customerId;
    });
    return order.length > 0 ? order[0] : null;
  },

  getOrderById: function (params) {
    Validator.requireFields(params, ['id']);
    var dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var order = dao.findById(params.id);
    if (!order) return Response.error('Order not found', 404);

    // Fetch related comments
    try {
      var commentsDao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
      var allComments = commentsDao.findWhere(function (c) { return c.orderId === params.id; });
      if (params._currentRole === 'Customer') {
        allComments = allComments.filter(function (c) {
          return c.isInternal !== true && c.isInternal !== 'TRUE';
        });
      }
      order.comments = allComments;
    } catch (_) { order.comments = []; }

    // Fetch activity logs
    try {
      var logDao = new SheetDAO(CONFIG.SHEETS.ACTIVITY_LOGS, CONFIG.COLUMNS.ACTIVITY_LOGS);
      order.activityLogs = logDao.findWhere(function (l) { return l.orderId === params.id; });
    } catch (_) { order.activityLogs = []; }

    return Response.success(order);
  },

  customerGetOrderById: function (params) {
    Validator.requireFields(params, ['id']);
    var customerId = params._currentCustomerId;
    if (!customerId) return Response.error('Customer ID required', 401);

    var dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var order = dao.findById(params.id);
    if (!order) return Response.error('Order not found', 404);
    if (order.customerId !== customerId) return Response.error('Access denied to this order', 403);

    // Fetch related comments
    try {
      var commentsDao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
      var allComments = commentsDao.findWhere(function (c) { return c.orderId === params.id; });
      allComments = allComments.filter(function (c) {
        return c.isInternal !== true && c.isInternal !== 'TRUE';
      });
      order.comments = allComments;
    } catch (_) { order.comments = []; }

    // Fetch activity logs
    try {
      var logDao = new SheetDAO(CONFIG.SHEETS.ACTIVITY_LOGS, CONFIG.COLUMNS.ACTIVITY_LOGS);
      order.activityLogs = logDao.findWhere(function (l) { return l.orderId === params.id; });
    } catch (_) { order.activityLogs = []; }

    return Response.success(order);
  },

  updateOrderStatus: function (params) {
    Validator.requireFields(params, ['id', 'status']);
    var dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var order = dao.findById(params.id);
    if (!order) return Response.error('Order not found', 404);

    var oldStatus = order.status;
    order.status = params.status;
    order.updatedAt = new Date().toISOString();
    dao.update(order.orderId, order);

    // Log this action
    try {
      var logDao = new SheetDAO(CONFIG.SHEETS.ACTIVITY_LOGS, CONFIG.COLUMNS.ACTIVITY_LOGS);
      var logId = 'LOG-' + Helpers.generateId('', 8);
      logDao.insert({
        logId: logId,
        ticketId: '',
        orderId: order.orderId,
        agentId: params._currentAgentId || 'SYSTEM',
        agentName: params._currentUserName || 'System',
        action: 'Status Changed',
        details: 'Order status updated from ' + oldStatus + ' to ' + params.status,
        timestamp: new Date().toISOString()
      });
    } catch (_) {}

    // Notify customer
    try {
      NotificationController.createNotification(
        order.customerId,
        'Order Status Update',
        'Your order ' + order.orderId + ' is now ' + params.status,
        'info',
        '/my-orders?view=' + order.orderId
      );
    } catch (_) {}

    return Response.success(order);
  },

  addOrderComment: function (params) {
    Validator.requireFields(params, ['orderId', 'content']);
    
    var orderDao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    var order = orderDao.findById(params.orderId);
    if (!order) return Response.error('Order not found', 404);

    var commentDao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
    var commentId = 'CMT-' + Helpers.generateId('', 8);
    var isInternal = params.isInternal === true || params.isInternal === 'true';

    var comment = {
      commentId: commentId,
      ticketId: '',
      orderId: params.orderId,
      agentId: params._currentAgentId || params._currentCustomerId || 'SYSTEM',
      agentName: params._currentUserName || 'System',
      content: params.content,
      isInternal: isInternal,
      createdAt: new Date().toISOString()
    };

    commentDao.insert(comment, false);

    // Send notifications
    try {
      if (params._currentRole === 'Customer') {
        if (order.assignedTo) {
          NotificationController.createNotification(
            order.assignedTo,
            'New Customer Comment on Order',
            params._currentUserName + ' added a comment on order ' + order.orderId,
            'info',
            '/orders?view=' + order.orderId
          );
        }
      } else {
        NotificationController.createNotification(
          order.customerId,
          'New Comment on Order',
          params._currentUserName + ' added a comment on order ' + order.orderId,
          'info',
          '/my-orders?view=' + order.orderId
        );
      }
    } catch (_) {}

    return Response.success(comment);
  }
};
