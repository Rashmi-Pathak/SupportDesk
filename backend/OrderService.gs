/**
 * SUPPORT CRM - ORDER SERVICE
 * Generates randomized order data for operational realism.
 * Aligned with CONFIG.COLUMNS.ORDERS
 */
const OrderService = {
  PRODUCTS: [
    { name: "Nova Pro Wireless Headphones", price: 299.99, sku: "AUD-PRO-WRL" },
    { name: "Mechanical Gaming Keyboard v2", price: 159.50, sku: "INP-KBD-MECH" },
    { name: "ErgoLift Standing Desk", price: 499.00, sku: "FUR-DSK-ERG" },
    { name: "UltraWide 34\" Curved Monitor", price: 650.00, sku: "DSP-34-CRV" },
    { name: "Precision Optical Mouse", price: 89.00, sku: "INP-MSE-PRE" },
    { name: "Thunderbolt 4 Docking Station", price: 220.00, sku: "ACC-DCK-TB4" },
    { name: "SmartFocus 4K Webcam", price: 129.99, sku: "ACC-WCM-4K" },
    { name: "Noise-Cancelling Desk Mic", price: 145.00, sku: "AUD-MIC-NC" }
  ],

  STATUSES: ["Delivered", "Shipped", "Processing", "Cancelled", "Returned"],

  /**
   * Generates 5 random orders for a given customer.
   */
  generateForCustomer: function(customerId, customerName) {
    const orders = [];
    const now = new Date();
    
    // Fetch agents dynamically from database for fair assignment
    const agentsDao = new SheetDAO(CONFIG.SHEETS.AGENTS, CONFIG.COLUMNS.AGENTS);
    const allAgents = agentsDao.findAll() || [];
    const vipAgents = allAgents.filter(a => a.teamId === 'TEAM-05' && a.isActive);
    const consultingAgents = allAgents.filter(a => a.teamId === 'TEAM-08' && a.isActive);
    const generalAgents = allAgents.filter(a => a.teamId === 'TEAM-01' && a.isActive);

    let vipIdx = 0;
    let consultIdx = 0;
    let generalIdx = 0;

    for (let i = 0; i < 5; i++) {
      const product = this.PRODUCTS[Math.floor(Math.random() * this.PRODUCTS.length)];
      const status = this.STATUSES[Math.floor(Math.random() * this.STATUSES.length)];
      const orderDate = new Date(now.getTime() - Math.random() * 180 * 24 * 3600 * 1000);
      
      const rand = Math.random();
      let priority = 'Standard';
      let assignedTo = '';
      let assignedName = '';
      let teamBucket = 'TEAM-01';

      if (rand < 0.4 && vipAgents.length > 0) {
        priority = 'VIP';
        const ag = vipAgents[vipIdx % vipAgents.length];
        assignedTo = ag.agentId;
        assignedName = ag.name;
        teamBucket = 'TEAM-05';
        vipIdx++;
      } else if (rand < 0.8 && consultingAgents.length > 0) {
        priority = 'Consulting';
        const ag = consultingAgents[consultIdx % consultingAgents.length];
        assignedTo = ag.agentId;
        assignedName = ag.name;
        teamBucket = 'TEAM-08';
        consultIdx++;
      } else if (generalAgents.length > 0) {
        const ag = generalAgents[generalIdx % generalAgents.length];
        assignedTo = ag.agentId;
        assignedName = ag.name;
        teamBucket = 'TEAM-01';
        generalIdx++;
      }

      const order = {
        orderId: `ORD-${Helpers.generateId('', 8)}`,
        customerId: customerId,
        customerName: customerName,
        orderDate: orderDate.toISOString(),
        amount: product.price,
        status: status,
        product: product.name,
        confirmationId: `CONF-${Helpers.generateId('', 8).toUpperCase()}`,
        assignedTo: assignedTo,
        assignedName: assignedName,
        teamBucket: teamBucket,
        priority: priority,
        updatedAt: orderDate.toISOString()
      };
      
      orders.push(order);
    }
    
    const dao = new SheetDAO(CONFIG.SHEETS.ORDERS, CONFIG.COLUMNS.ORDERS);
    dao.insertMany(orders);
    
    return orders;
  }
};
