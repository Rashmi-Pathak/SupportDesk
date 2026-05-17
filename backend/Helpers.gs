/**
 * ============================================================================
 * SUPPORTDESK CRM — HELPER UTILITIES
 * ID generators, pagination, and the shared ActivityLogService.
 * ============================================================================
 */
const Helpers = {
  /**
   * Generates a random alphanumeric ID.
   * @param {string} prefix - e.g. 'CUST', 'ORD'
   * @param {number} len - length of random part (default 6)
   */
  generateId: function (prefix, len) {
    len = len || 6;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = '';
    for (var i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix ? prefix + '-' + result : result;
  },

  /**
   * Generates a unique ticket ID in the format TKT-YYMMDD-XXXXXX.
   */
  generateTicketId: function () {
    var d = new Date();
    var yy = String(d.getFullYear()).slice(2);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    var rand = this.generateId('', 6);
    return 'TKT-' + yy + mm + dd + '-' + rand;
  },

  /**
   * Generates a UUID v4 string (for auth tokens).
   */
  uuid: function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Simple pagination over an array.
   * @returns {{ data: Array, meta: Object }}
   */
  paginate: function (array, page, limit) {
    var p = parseInt(page) || 1;
    var l = parseInt(limit) || 25;
    var offset = (p - 1) * l;
    return {
      data: array.slice(offset, offset + l),
      meta: {
        page: p,
        limit: l,
        total: array.length,
        totalPages: Math.ceil(array.length / l)
      }
    };
  },

  /**
   * Very simple hash function for demo purposes.
   * NOT cryptographically secure — adequate for assessment scope.
   */
  hashPassword: function (password) {
    var hash = 0;
    var str = 'SDCRM_SALT_' + password;
    for (var i = 0; i < str.length; i++) {
      var chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return 'HASH_' + Math.abs(hash).toString(36).toUpperCase();
  }
};

// =============================================================================
// ACTIVITY LOG SERVICE  — shared across all controllers
// =============================================================================
const ActivityLogService = {
  log: function (ticketId, agentId, agentName, action, detailsObj) {
    try {
      var dao = new SheetDAO(CONFIG.SHEETS.ACTIVITY_LOGS, CONFIG.COLUMNS.ACTIVITY_LOGS);
      dao.insert({
        logId:     Helpers.generateId('LOG', 6),
        ticketId:  ticketId,
        agentId:   agentId || 'SYSTEM',
        agentName: agentName || 'System',
        action:    action,
        details:   JSON.stringify(detailsObj || {}),
        timestamp: new Date().toISOString()
      }, false);
    } catch (e) {
      Logger.log('[ActivityLog] Failed: ' + e.message);
    }
  }
};
