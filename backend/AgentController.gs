/**
 * ============================================================================
 * SUPPORTDESK CRM — AGENT CONTROLLER
 * Agent and team management endpoints.
 * ============================================================================
 */
const AgentController = {
  /**
   * Get all agents (cached).
   */
  getAgents: function (params) {
    var agents = CacheManager.getOrSet('ALL_AGENTS', CONFIG.CACHE_TTL.AGENTS, function () {
      var dao = new SheetDAO(CONFIG.SHEETS.AGENTS, CONFIG.COLUMNS.AGENTS);
      return dao.getAll();
    });

    // Filter by team if requested
    if (params.teamId) {
      agents = agents.filter(function (a) { return a.teamId === params.teamId; });
    }

    // Filter active only by default
    if (params.includeInactive !== 'true') {
      agents = agents.filter(function (a) { return a.isActive === true || a.isActive === 'TRUE'; });
    }

    return Response.success(agents);
  },

  /**
   * Get all team buckets.
   */
  getTeams: function (params) {
    var dao = new SheetDAO(CONFIG.SHEETS.TEAM_BUCKETS, CONFIG.COLUMNS.TEAM_BUCKETS);
    var teams = dao.getAll();
    return Response.success(teams);
  }
};
