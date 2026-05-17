/**
 * SUPPORTDESK CRM — ANALYTICS CONTROLLER
 * Computes real-time dashboard metrics from ticket data.
 */
const AnalyticsController = {
  getDashboardStats: function (params) {
    var isAgent = params._currentRole === 'Agent' && params._currentAgentId;
    var cacheKey = isAgent ? 'DASHBOARD_STATS_' + params._currentAgentId : 'DASHBOARD_STATS';

    var stats = CacheManager.getOrSet(cacheKey, CONFIG.CACHE_TTL.DASHBOARD, function () {
      var tDao = new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS);
      var allTickets = tDao.getAll();
      
      var tickets = isAgent 
        ? allTickets.filter(function(t) { return t.assignedTo === params._currentAgentId; })
        : allTickets;

      var now = new Date();
      var thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

      var total = tickets.length;
      var open = 0, resolved = 0, pending = 0, inProgress = 0, escalated = 0;
      var totalResMs = 0, resCount = 0;
      var byChannel = {}, byPriority = {}, byStatus = {};
      var byDay = {};
      var agentResolved = {};

      tickets.forEach(function (t) {
        // Status counts
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        if (t.status !== 'Resolved') open++;
        if (t.status === 'Resolved') resolved++;
        if (t.status === 'Pending') pending++;
        if (t.status === 'InProgress') inProgress++;
        if (t.isEscalated === true || t.isEscalated === 'TRUE') escalated++;

        // Resolution time
        if (t.status === 'Resolved' && t.resolvedAt && t.createdAt) {
          var ms = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
          if (ms > 0) { totalResMs += ms; resCount++; }
        }

        // Channel breakdown
        byChannel[t.channel] = (byChannel[t.channel] || 0) + 1;
        // Priority breakdown
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;

        // Daily trend (last 30 days)
        var created = new Date(t.createdAt);
        if (created >= thirtyDaysAgo) {
          var dayKey = created.toISOString().slice(0, 10);
          byDay[dayKey] = (byDay[dayKey] || 0) + 1;
        }

        // Agent leaderboard
        if (t.status === 'Resolved' && t.assignedTo) {
          if (!agentResolved[t.assignedTo]) {
            agentResolved[t.assignedTo] = { name: t.assignedName, count: 0 };
          }
          agentResolved[t.assignedTo].count++;
        }
      });

      var avgResHours = resCount > 0 ? Math.round((totalResMs / resCount) / 3600000 * 10) / 10 : 0;

      // SLA breach count
      var slaBreached = tickets.filter(function (t) {
        if (t.status === 'Resolved') return false;
        if (!t.slaDeadline) return false;
        return new Date(t.slaDeadline) < now;
      }).length;
      var slaPct = open > 0 ? Math.round(slaBreached / open * 1000) / 10 : 0;

      // Format daily trend
      var trend = [];
      for (var i = 29; i >= 0; i--) {
        var d = new Date(now.getTime() - i * 86400000);
        var key = d.toISOString().slice(0, 10);
        trend.push({ date: key, count: byDay[key] || 0 });
      }

      // Top agents
      var topAgents = [];
      for (var aid in agentResolved) {
        topAgents.push({ agentId: aid, name: agentResolved[aid].name, resolved: agentResolved[aid].count });
      }
      topAgents.sort(function (a, b) { return b.resolved - a.resolved; });

      return {
        total: total, open: open, resolved: resolved, pending: pending,
        inProgress: inProgress, escalated: escalated,
        avgResolutionHours: avgResHours, slaBreachPct: slaPct, slaBreached: slaBreached,
        byChannel: byChannel, byPriority: byPriority, byStatus: byStatus,
        trend: trend, topAgents: topAgents.slice(0, 10)
      };
    });
    // Add Agent Specialization context if requester is an agent
    if (params._currentRole === 'Agent' && params._currentAgentId) {
      try {
        var catDao = new SheetDAO(CONFIG.SHEETS.AGENT_CATEGORIES, CONFIG.COLUMNS.AGENT_CATEGORIES);
        var myCategories = catDao.findWhere(function(m) { 
          return m.agentId === params._currentAgentId && (m.isActive === true || m.isActive === 'TRUE');
        }).map(function(m) { return m.category; });
        
        stats.agentContext = {
          categories: myCategories
        };
      } catch(e) {
        // Ignore if error getting categories
      }
    }

    return Response.success(stats);
  }
};
