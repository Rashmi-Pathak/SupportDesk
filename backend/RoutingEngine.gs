/**
 * ============================================================================
 * SUPPORTDESK CRM — ROUTING ENGINE
 * Assigns tickets to agents based on issue category using Least-Load balancing.
 *
 * Algorithm:
 * 1. Look up all active agents for the given category (AgentCategories sheet)
 * 2. Count each agent's currently OPEN tickets (non-resolved)
 * 3. Pick the agent with the fewest open tickets
 * 4. If category = "Other" → return null (goes to Admin unassigned queue)
 * ============================================================================
 */
const RoutingEngine = {

  /**
   * Auto-assign a ticket to the best agent for the given category.
   * @param {string} category - The issue category (e.g. 'Billing', 'Technical')
   * @returns {{ agentId: string, agentName: string, teamBucket: string } | null}
   *          null if category is "Other" or no agents available.
   */
  assignByCategory: function (category) {
    // "Other" tickets go to Admin for manual assignment
    if (!category || category === 'Other') {
      return null;
    }

    // 1. Find all active agents for this category
    var catDao = new SheetDAO(CONFIG.SHEETS.AGENT_CATEGORIES, CONFIG.COLUMNS.AGENT_CATEGORIES);
    var allMappings = catDao.getAll();
    var categoryAgents = allMappings.filter(function (m) {
      return m.category === category &&
             (m.isActive === true || m.isActive === 'TRUE' || m.isActive === true);
    });

    if (categoryAgents.length === 0) {
      Logger.log('[RoutingEngine] No agents found for category: ' + category);
      return null;
    }

    // 2. Get all open tickets to count per-agent load
    var ticketDao = new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS);
    var allTickets = CacheManager.getOrSet('ALL_TICKETS', CONFIG.CACHE_TTL.TICKETS, function () {
      return ticketDao.getAll();
    });

    var openTickets = allTickets.filter(function (t) {
      return t.status !== 'Resolved';
    });

    // 3. Count open tickets for each eligible agent
    var agentLoads = categoryAgents.map(function (mapping) {
      var count = 0;
      for (var i = 0; i < openTickets.length; i++) {
        if (openTickets[i].assignedTo === mapping.agentId) {
          count++;
        }
      }
      return {
        agentId:   mapping.agentId,
        agentName: mapping.agentName,
        openCount: count
      };
    });

    // 4. Sort by fewest open tickets (least-load first)
    agentLoads.sort(function (a, b) {
      return a.openCount - b.openCount;
    });

    // 5. Pick the agent with the lightest load
    var chosen = agentLoads[0];
    Logger.log('[RoutingEngine] Category=' + category + ' → Assigned to ' +
               chosen.agentName + ' (openCount=' + chosen.openCount + ')');

    // Look up agent details for team bucket
    var agentDao = new SheetDAO(CONFIG.SHEETS.AGENTS, CONFIG.COLUMNS.AGENTS);
    var agentDetail = agentDao.findById(chosen.agentId);

    return {
      agentId:    chosen.agentId,
      agentName:  chosen.agentName,
      teamBucket: agentDetail ? (agentDetail.teamId || '') : ''
    };
  },

  /**
   * Get load statistics for all agents in a given category.
   * Useful for admin dashboards.
   */
  getCategoryStats: function (category) {
    var catDao = new SheetDAO(CONFIG.SHEETS.AGENT_CATEGORIES, CONFIG.COLUMNS.AGENT_CATEGORIES);
    var mappings = catDao.getAll().filter(function (m) {
      return (!category || m.category === category) &&
             (m.isActive === true || m.isActive === 'TRUE');
    });

    var ticketDao = new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS);
    var allTickets = ticketDao.getAll();

    return mappings.map(function (m) {
      var open = 0, resolved = 0;
      allTickets.forEach(function (t) {
        if (t.assignedTo === m.agentId) {
          if (t.status === 'Resolved') resolved++;
          else open++;
        }
      });
      return {
        agentId:   m.agentId,
        agentName: m.agentName,
        category:  m.category,
        open:      open,
        resolved:  resolved,
        total:     open + resolved
      };
    });
  }
};
