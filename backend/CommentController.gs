/**
 * ============================================================================
 * SUPPORTDESK CRM — COMMENT CONTROLLER
 * Handles adding and fetching comments for tickets.
 * ============================================================================
 */
const CommentController = {
  /**
   * Add a comment to a ticket.
   */
  addComment: function (params) {
    var data = params.data || params;
    Validator.requireFields(data, ['ticketId', 'content']);

    var newComment = {
      commentId:  Helpers.generateId('COM', 6),
      ticketId:   data.ticketId,
      agentId:    data.agentId || params._currentAgentId || 'SYSTEM',
      agentName:  data.agentName || params._currentAgentName || 'System',
      content:    data.content,
      isInternal: data.isInternal === true || data.isInternal === 'true',
      createdAt:  new Date().toISOString()
    };

    var dao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
    dao.insert(newComment, false);

    // Update ticket's lastActivityAt
    try {
      var ticketDao = new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS);
      var ticket = ticketDao.findById(data.ticketId);
      if (ticket) {
        ticketDao.update(data.ticketId, { updatedAt: new Date().toISOString() });
        CacheManager.clear('ALL_TICKETS');

        // Notification routing logic
        // If agent is commenting, notify customer
        if (params._currentRole === 'Agent' || params._currentRole === 'Admin') {
          NotificationController.createNotification(
            ticket.customerId,
            'New Message on Ticket',
            `Agent ${newComment.agentName} left a message on ticket ${ticket.ticketId}.`,
            'info',
            `/my-tickets?view=${ticket.ticketId}`
          );
        }
        // If customer is commenting, notify agent (if assigned)
        else if (params._currentRole === 'Customer' && ticket.assignedTo) {
          NotificationController.createNotification(
            ticket.assignedTo,
            'Customer Replied',
            `${ticket.customerName} replied to ticket ${ticket.ticketId}.`,
            'info',
            `/tickets?view=${ticket.ticketId}`
          );
        }
      }
    } catch (_) {}

    ActivityLogService.log(data.ticketId, newComment.agentId, newComment.agentName,
      'Commented', { isInternal: newComment.isInternal });

    return Response.success(newComment);
  },

  /**
   * Get all comments for a ticket.
   */
  getComments: function (params) {
    Validator.requireFields(params, ['ticketId']);

    var dao = new SheetDAO(CONFIG.SHEETS.COMMENTS, CONFIG.COLUMNS.COMMENTS);
    var comments = dao.findWhere(function (c) {
      return c.ticketId === params.ticketId;
    });

    // Sort chronologically
    comments.sort(function (a, b) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return Response.success(comments);
  }
};
