/**
 * ============================================================================
 * SUPPORTDESK CRM — AUTH CONTROLLER
 * Handles login, registration, token validation, and logout.
 * Supports 3 roles: Admin, Agent, Customer.
 * ============================================================================
 */
var AuthController = {
  _dao: function () {
    return new SheetDAO(CONFIG.SHEETS.USERS, CONFIG.COLUMNS.USERS);
  },

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
  login: function (params) {
    Validator.requireFields(params, ['email', 'password']);
    Validator.isValidEmail(params.email);

    var dao = this._dao();
    var users = dao.getAll();
    var email = String(params.email).toLowerCase().trim();
    var hash = Helpers.hashPassword(params.password);

    var user = users.find(function (u) {
      return String(u.email).toLowerCase().trim() === email;
    });

    if (!user) return Response.error('Invalid email or password', 401);
    if (String(user.passwordHash) !== hash) return Response.error('Invalid email or password', 401);
    if (user.isActive === false || user.isActive === 'FALSE') return Response.error('Account is deactivated', 403);

    // Generate token
    var token = Helpers.uuid();
    var expiry = new Date(Date.now() + CONFIG.AUTH.TOKEN_EXPIRY_HOURS * 3600000).toISOString();

    dao.update(user.userId, { token: token, tokenExpiry: expiry });

    return Response.success({
      userId:      user.userId,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      agentId:     user.agentId || '',
      customerId:  user.customerId || '',
      token:       token,
      tokenExpiry: expiry
    });
  },

  // ---------------------------------------------------------------------------
  // REGISTER (creates Customer account by default)
  // ---------------------------------------------------------------------------
  register: function (params) {
    Validator.requireFields(params, ['name', 'email', 'password']);
    Validator.isValidEmail(params.email);
    Validator.minLength(params.password, CONFIG.AUTH.MIN_PASSWORD_LENGTH, 'Password');

    var dao = this._dao();
    var existing = dao.getAll();
    var email = String(params.email).toLowerCase().trim();

    var dup = existing.find(function (u) {
      return String(u.email).toLowerCase().trim() === email;
    });
    if (dup) return Response.error('An account with this email already exists', 409);

    var role = params.role || 'Customer'; // Default to Customer
    var userId = Helpers.generateId('USR', 8);
    var token = Helpers.uuid();
    var expiry = new Date(Date.now() + CONFIG.AUTH.TOKEN_EXPIRY_HOURS * 3600000).toISOString();
    var now = new Date().toISOString();

    var newUser = {
      userId:       userId,
      name:         params.name,
      email:        email,
      passwordHash: Helpers.hashPassword(params.password),
      role:         role,
      agentId:      '',
      customerId:   '',
      token:        token,
      tokenExpiry:  expiry,
      createdAt:    now,
      isActive:     true
    };

    // Role-specific setup
    if (role === 'Customer') {
      var custId = Helpers.generateId('CUST', 6);
      newUser.customerId = custId;

      // Create matching Customer entry
      var custDao = new SheetDAO(CONFIG.SHEETS.CUSTOMERS, CONFIG.COLUMNS.CUSTOMERS);
      custDao.insert({
        customerId:   custId,
        name:         params.name,
        email:        email,
        phone:        params.phone || '',
        totalTickets: 0,
        createdAt:    now
      }, false);
      
      // Auto-generate order history for realistic CRM demonstration
      OrderService.generateForCustomer(custId, params.name);
    } else if (role === 'Agent') {
      var agentId = Helpers.generateId('AGT', 4);
      newUser.agentId = agentId;

      // Create matching Agent entry
      try {
        var agentDao = new SheetDAO(CONFIG.SHEETS.AGENTS, CONFIG.COLUMNS.AGENTS);
        agentDao.insert({
          agentId:  agentId,
          name:     params.name,
          email:    email,
          role:     'Agent',
          teamId:   'TEAM-01',
          isActive: true
        }, false);
      } catch (e) {
        Logger.log('[Register] Agent sheet insert failed: ' + e.message);
      }
    }

    dao.insert(newUser, false);

    return Response.success({
      userId:     userId,
      name:       params.name,
      email:      email,
      role:       role,
      agentId:    newUser.agentId,
      customerId: newUser.customerId,
      token:      token,
      tokenExpiry: expiry
    });
  },

  // ---------------------------------------------------------------------------
  // GET CURRENT USER
  // ---------------------------------------------------------------------------
  getMe: function (params) {
    var user = this.validateToken(params._token);
    return Response.success({
      userId:     user.userId,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      agentId:    user.agentId || '',
      customerId: user.customerId || ''
    });
  },

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------
  logout: function (params) {
    try {
      var user = this.validateToken(params._token);
      var dao = this._dao();
      dao.update(user.userId, { token: '', tokenExpiry: '' });
    } catch (_) { /* already invalid — that's fine */ }
    return Response.success({ message: 'Logged out' });
  },

  // ---------------------------------------------------------------------------
  // TOKEN VALIDATION (internal — used by Code.gs router)
  // ---------------------------------------------------------------------------
  validateToken: function (token) {
    if (!token) throw new Error('AUTH_REQUIRED');

    var dao = this._dao();
    var users = dao.getAll();
    var user = users.find(function (u) { return u.token === token; });

    if (!user) throw new Error('AUTH_INVALID');

    var expiry = new Date(user.tokenExpiry);
    if (isNaN(expiry.getTime()) || expiry < new Date()) {
      throw new Error('AUTH_EXPIRED');
    }

    return user;
  }
};
