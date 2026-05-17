/**
 * ============================================================================
 * SUPPORTDESK CRM — ESCALATION CONTROLLER
 * Handles escalation creation and history retrieval.
 * ============================================================================
 */
const EscalationController = {
  /**
   * Escalate a ticket to another agent/team.
   */
  escalateTicket: function (params) {
    var data = params.data || params;
    Validator.requireFields(data, ['ticketId', 'escalatedTo', 'reason']);

    var newEscalation = {
      escalationId:   Helpers.generateId('ESC', 6),
      ticketId:       data.ticketId,
      escalatedBy:    data.escalatedBy || params._currentAgentId || '',
      escalatedByName: data.escalatedByName || params._currentAgentName || '',
      escalatedTo:    data.escalatedTo,
      escalatedToName: data.escalatedToName || '',
      reason:         data.reason,
      createdAt:      new Date().toISOString()
    };

    var dao = new SheetDAO(CONFIG.SHEETS.ESCALATIONS, CONFIG.COLUMNS.ESCALATIONS);
    dao.insert(newEscalation, false);

    // Mark ticket as escalated and reassign
    try {
      var ticketDao = new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS);
      var ticketUpdates = {
        isEscalated: true,
        updatedAt:   new Date().toISOString()
      };
      // Optionally reassign
      if (data.escalatedTo) {
        ticketUpdates.assignedTo = data.escalatedTo;
        if (data.escalatedToName) ticketUpdates.assignedName = data.escalatedToName;
      }
      if (data.teamBucket) {
        ticketUpdates.teamBucket = data.teamBucket;
      }
      ticketDao.update(data.ticketId, ticketUpdates);
      CacheManager.clear('ALL_TICKETS');
    } catch (e) {
      Logger.log('[Escalation] Ticket update failed: ' + e.message);
    }

    ActivityLogService.log(data.ticketId, newEscalation.escalatedBy, newEscalation.escalatedByName,
      'Escalated', { reason: data.reason, escalatedTo: data.escalatedTo });

    return Response.success(newEscalation);
  },

  /**
   * Get escalation history for a ticket.
   */
  getEscalations: function (params) {
    Validator.requireFields(params, ['ticketId']);

    var dao = new SheetDAO(CONFIG.SHEETS.ESCALATIONS, CONFIG.COLUMNS.ESCALATIONS);
    var escalations = dao.findWhere(function (e) {
      return e.ticketId === params.ticketId;
    });

    escalations.sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return Response.success(escalations);
  }
};
