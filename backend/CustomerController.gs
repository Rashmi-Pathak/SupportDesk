/**
 * SUPPORTDESK CRM — CUSTOMER CONTROLLER
 */
const CustomerController = {
  getCustomers: function (params) {
    var dao = new SheetDAO(CONFIG.SHEETS.CUSTOMERS, CONFIG.COLUMNS.CUSTOMERS);
    var customers = dao.getAll();
    if (params.q) {
      var q = String(params.q).toLowerCase();
      customers = customers.filter(function (c) {
        return String(c.name + '|' + c.email + '|' + c.phone + '|' + c.company + '|' + c.customerId).toLowerCase().indexOf(q) !== -1;
      });
    }
    var result = Helpers.paginate(customers, params.page || 1, params.limit || 25);
    return Response.success(result.data, result.meta);
  },

  getCustomerById: function (params) {
    Validator.requireFields(params, ['id']);
    var dao = new SheetDAO(CONFIG.SHEETS.CUSTOMERS, CONFIG.COLUMNS.CUSTOMERS);
    var customer = dao.findById(params.id);
    if (!customer) return Response.error('Customer not found', 404);
    try {
      var tDao = new SheetDAO(CONFIG.SHEETS.TICKETS, CONFIG.COLUMNS.TICKETS);
      customer.tickets = tDao.findWhere(function (t) { return t.customerId === params.id; });
    } catch (_) { customer.tickets = []; }
    try {
      var oDao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
      customer.orders = oDao.findWhere(function (o) { return o.customerId === params.id; });
    } catch (_) { customer.orders = []; }
    return Response.success(customer);
  }
};
