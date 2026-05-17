/**
 * ============================================================================
 * SUPPORTDESK CRM — SEED DATA SCRIPT
 * Creates all 13 sheets with headers, validation, formatting, and 250+ rows
 * of realistic demo data. Run this ONCE after creating the spreadsheet.
 *
 * To add new data without resetting existing:
 *   - Run seedCustomerUsers() — adds 10 customer login accounts
 *   - Run seedAgentCategories() — creates agent-to-category mappings
 *   - Run seedMoreAgents() — adds agents to reach 14 total
 * ============================================================================
 */

function seedAllData() {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } catch(e) {
    ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  }
  var names = [
    'Users','Tickets','Customers','Orders','Agents','TeamBuckets',
    'Comments','Escalations','ActivityLogs','Attachments','Settings','DashboardCache',
    'AgentCategories','Notifications'
  ];
  names.forEach(function(n){ if(!ss.getSheetByName(n)) ss.insertSheet(n); });

  Logger.log('Seeding Users...');       seedUsers(ss);
  Logger.log('Seeding TeamBuckets...');  seedTeamBuckets(ss);
  Logger.log('Seeding Agents...');      seedAgents(ss);
  Logger.log('Seeding AgentCategories...'); seedAgentCategories(ss);
  Logger.log('Seeding Customers...');   var custs = seedCustomers(ss);
  Logger.log('Seeding Orders...');      var ords = seedOrders(ss, custs);
  Logger.log('Seeding Tickets...');     var tkts = seedTickets(ss, custs, ords);
  Logger.log('Seeding Comments...');    seedComments(ss, tkts);
  Logger.log('Seeding Escalations...'); seedEscalations(ss, tkts);
  Logger.log('Seeding ActivityLogs...'); seedActivityLogs(ss, tkts);
  Logger.log('Seeding Settings...');    seedSettings(ss);
  Logger.log('Seeding DashboardCache...'); seedDashboardCache(ss);
  Logger.log('Seeding Attachments header...'); seedAttachments(ss);
  Logger.log('Seeding Notifications header...'); seedNotifications(ss);
  Logger.log('✅ All sheets seeded successfully!');
}

// --- Utility helpers --------------------------------------------------------
function _rc(a){return a[Math.floor(Math.random()*a.length)];}
function _ri(n,x){return Math.floor(Math.random()*(x-n+1))+n;}
function _id(p,l){l=l||6;var c='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',r='';for(var i=0;i<l;i++)r+=c[Math.floor(Math.random()*c.length)];return p?p+'-'+r:r;}
function _clr(sh,h){sh.clear();if(sh.getFilter())sh.getFilter().remove();sh.getRange(1,1,1,h).clearDataValidations();}
function _hdr(sh,headers){sh.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold').setBackground('#1a1a2e').setFontColor('#ffffff');sh.setFrozenRows(1);try{sh.getRange(1,1,1,headers.length).createFilter();}catch(_){}}

// --- USERS ------------------------------------------------------------------
function seedUsers(ss){
  var sh=ss.getSheetByName('Users');
  var h=CONFIG.COLUMNS.USERS;
  _clr(sh,h.length);
  var now=new Date().toISOString();
  var adminHash = Helpers.hashPassword('admin123');
  var agentHash = Helpers.hashPassword('agent123');
  var custHash  = Helpers.hashPassword('customer123');
  var data=[
    // Admin (no agentId — admin is not in the agent pool)
    ['USR-ADMIN01','Admin User','admin@supportdesk.com',adminHash,'Admin','','','','',now,true],
    // Agents (14 total)
    ['USR-AGENT01','Sarah Connor','sarah@supportdesk.com',agentHash,'Agent','AGT-1002','','','',now,true],
    ['USR-AGENT02','John Doe','john@supportdesk.com',agentHash,'Agent','AGT-1003','','','',now,true],
    ['USR-AGENT03','Jane Smith','jane@supportdesk.com',agentHash,'Agent','AGT-1004','','','',now,true],
    ['USR-AGENT04','Mike Ross','mike@supportdesk.com',agentHash,'Agent','AGT-1005','','','',now,true],
    ['USR-AGENT05','Emily Chen','emily@supportdesk.com',agentHash,'Agent','AGT-1006','','','',now,true],
    ['USR-AGENT06','David Kim','david@supportdesk.com',agentHash,'Agent','AGT-1007','','','',now,true],
    ['USR-AGENT07','Lisa Wang','lisa@supportdesk.com',agentHash,'Agent','AGT-1008','','','',now,true],
    ['USR-AGENT08','Ryan Patel','ryan@supportdesk.com',agentHash,'Agent','AGT-1009','','','',now,true],
    ['USR-AGENT09','Olivia Brown','olivia@supportdesk.com',agentHash,'Agent','AGT-1010','','','',now,true],
    ['USR-AGENT10','Alex Turner','alex@supportdesk.com',agentHash,'Agent','AGT-1011','','','',now,true],
    ['USR-AGENT11','Priya Sharma','priya@supportdesk.com',agentHash,'Agent','AGT-1012','','','',now,true],
    ['USR-AGENT12','Tom Wilson','tom@supportdesk.com',agentHash,'Agent','AGT-1013','','','',now,true],
    ['USR-AGENT13','Nina Garcia','nina@supportdesk.com',agentHash,'Agent','AGT-1014','','','',now,true],
    // VIP Priority Team Agents (10 agents, TEAM-05)
    ['USR-AGENT14','VIP Agent 1','vip1@supportdesk.com',agentHash,'Agent','AGT-1015','','','',now,true],
    ['USR-AGENT15','VIP Agent 2','vip2@supportdesk.com',agentHash,'Agent','AGT-1016','','','',now,true],
    ['USR-AGENT16','VIP Agent 3','vip3@supportdesk.com',agentHash,'Agent','AGT-1017','','','',now,true],
    ['USR-AGENT17','VIP Agent 4','vip4@supportdesk.com',agentHash,'Agent','AGT-1018','','','',now,true],
    ['USR-AGENT18','VIP Agent 5','vip5@supportdesk.com',agentHash,'Agent','AGT-1019','','','',now,true],
    ['USR-AGENT19','VIP Agent 6','vip6@supportdesk.com',agentHash,'Agent','AGT-1020','','','',now,true],
    ['USR-AGENT20','VIP Agent 7','vip7@supportdesk.com',agentHash,'Agent','AGT-1021','','','',now,true],
    ['USR-AGENT21','VIP Agent 8','vip8@supportdesk.com',agentHash,'Agent','AGT-1022','','','',now,true],
    ['USR-AGENT22','VIP Agent 9','vip9@supportdesk.com',agentHash,'Agent','AGT-1023','','','',now,true],
    ['USR-AGENT23','VIP Agent 10','vip10@supportdesk.com',agentHash,'Agent','AGT-1024','','','',now,true],
    // Consulting Support Team Agents (10 agents, TEAM-08)
    ['USR-AGENT24','Consulting Agent 1','consult1@supportdesk.com',agentHash,'Agent','AGT-1025','','','',now,true],
    ['USR-AGENT25','Consulting Agent 2','consult2@supportdesk.com',agentHash,'Agent','AGT-1026','','','',now,true],
    ['USR-AGENT26','Consulting Agent 3','consult3@supportdesk.com',agentHash,'Agent','AGT-1027','','','',now,true],
    ['USR-AGENT27','Consulting Agent 4','consult4@supportdesk.com',agentHash,'Agent','AGT-1028','','','',now,true],
    ['USR-AGENT28','Consulting Agent 5','consult5@supportdesk.com',agentHash,'Agent','AGT-1029','','','',now,true],
    ['USR-AGENT29','Consulting Agent 6','consult6@supportdesk.com',agentHash,'Agent','AGT-1030','','','',now,true],
    ['USR-AGENT30','Consulting Agent 7','consult7@supportdesk.com',agentHash,'Agent','AGT-1031','','','',now,true],
    ['USR-AGENT31','Consulting Agent 8','consult8@supportdesk.com',agentHash,'Agent','AGT-1032','','','',now,true],
    ['USR-AGENT32','Consulting Agent 9','consult9@supportdesk.com',agentHash,'Agent','AGT-1033','','','',now,true],
    ['USR-AGENT33','Consulting Agent 10','consult10@supportdesk.com',agentHash,'Agent','AGT-1034','','','',now,true],
    // Customers (10 demo accounts)
    ['USR-CUST01','Alice Johnson','customer1@example.com',custHash,'Customer','','CUST-DEMO01','','',now,true],
    ['USR-CUST02','Bob Williams','customer2@example.com',custHash,'Customer','','CUST-DEMO02','','',now,true],
    ['USR-CUST03','Carol Davis','customer3@example.com',custHash,'Customer','','CUST-DEMO03','','',now,true],
    ['USR-CUST04','Dan Miller','customer4@example.com',custHash,'Customer','','CUST-DEMO04','','',now,true],
    ['USR-CUST05','Eva Martinez','customer5@example.com',custHash,'Customer','','CUST-DEMO05','','',now,true],
    ['USR-CUST06','Frank Thomas','customer6@example.com',custHash,'Customer','','CUST-DEMO06','','',now,true],
    ['USR-CUST07','Grace Lee','customer7@example.com',custHash,'Customer','','CUST-DEMO07','','',now,true],
    ['USR-CUST08','Henry Clark','customer8@example.com',custHash,'Customer','','CUST-DEMO08','','',now,true],
    ['USR-CUST09','Iris Nguyen','customer9@example.com',custHash,'Customer','','CUST-DEMO09','','',now,true],
    ['USR-CUST10','Jake Anderson','customer10@example.com',custHash,'Customer','','CUST-DEMO10','','',now,true],
    ['USR-CUST11','Kevin White','customer11@example.com',custHash,'Customer','','CUST-DEMO11','','',now,true],
    ['USR-CUST12','Laura Martin','customer12@example.com',custHash,'Customer','','CUST-DEMO12','','',now,true],
    ['USR-CUST13','Mike Taylor','customer13@example.com',custHash,'Customer','','CUST-DEMO13','','',now,true],
    ['USR-CUST14','Nancy Scott','customer14@example.com',custHash,'Customer','','CUST-DEMO14','','',now,true],
    ['USR-CUST15','Oliver King','customer15@example.com',custHash,'Customer','','CUST-DEMO15','','',now,true],
    ['USR-CUST16','Paula Wright','customer16@example.com',custHash,'Customer','','CUST-DEMO16','','',now,true],
    ['USR-CUST17','Quinn Evans','customer17@example.com',custHash,'Customer','','CUST-DEMO17','','',now,true],
    ['USR-CUST18','Rachel Baker','customer18@example.com',custHash,'Customer','','CUST-DEMO18','','',now,true],
    ['USR-CUST19','Steve Green','customer19@example.com',custHash,'Customer','','CUST-DEMO19','','',now,true],
    ['USR-CUST20','Tracy Hall','customer20@example.com',custHash,'Customer','','CUST-DEMO20','','',now,true]
  ];
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- TEAM BUCKETS -----------------------------------------------------------
function seedTeamBuckets(ss){
  var sh=ss.getSheetByName('TeamBuckets');
  var h=['teamId','name','description','isVIP'];
  _clr(sh,h.length);
  var data=[
    ['TEAM-01','Tier 1 Support','Front-line customer support',false],
    ['TEAM-02','Tier 2 Technical','Advanced technical issues',false],
    ['TEAM-03','Billing','Payment and invoice queries',false],
    ['TEAM-04','Escalations','Escalated critical issues',false],
    ['TEAM-05','VIP Priority','High-value customer handling',true],
    ['TEAM-06','Shipping','Shipping and delivery queries',false],
    ['TEAM-07','Product','Product-related issues',false],
    ['TEAM-08','Consulting Support','Consulting order assistance',false]
  ];
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- AGENTS -----------------------------------------------------------------
function seedAgents(ss){
  var sh=ss.getSheetByName('Agents');
  var h=['agentId','name','email','role','teamId','isActive'];
  _clr(sh,h.length);
  var data=[
    // Admin is NOT in the agents table — admin is a separate role
    ['AGT-1002','Sarah Connor','sarah@supportdesk.com','TeamLead','TEAM-02',true],
    ['AGT-1003','John Doe','john@supportdesk.com','Agent','TEAM-01',true],
    ['AGT-1004','Jane Smith','jane@supportdesk.com','Agent','TEAM-01',true],
    ['AGT-1005','Mike Ross','mike@supportdesk.com','Agent','TEAM-03',true],
    ['AGT-1006','Emily Chen','emily@supportdesk.com','Agent','TEAM-02',true],
    ['AGT-1007','David Kim','david@supportdesk.com','Agent','TEAM-03',true],
    ['AGT-1008','Lisa Wang','lisa@supportdesk.com','Agent','TEAM-06',true],
    ['AGT-1009','Ryan Patel','ryan@supportdesk.com','Agent','TEAM-01',true],
    ['AGT-1010','Olivia Brown','olivia@supportdesk.com','Agent','TEAM-07',true],
    ['AGT-1011','Alex Turner','alex@supportdesk.com','Agent','TEAM-02',true],
    ['AGT-1012','Priya Sharma','priya@supportdesk.com','Agent','TEAM-06',true],
    ['AGT-1013','Tom Wilson','tom@supportdesk.com','Agent','TEAM-07',true],
    ['AGT-1014','Nina Garcia','nina@supportdesk.com','TeamLead','TEAM-03',true],
    // VIP Priority Agents
    ['AGT-1015','VIP Agent 1','vip1@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1016','VIP Agent 2','vip2@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1017','VIP Agent 3','vip3@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1018','VIP Agent 4','vip4@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1019','VIP Agent 5','vip5@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1020','VIP Agent 6','vip6@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1021','VIP Agent 7','vip7@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1022','VIP Agent 8','vip8@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1023','VIP Agent 9','vip9@supportdesk.com','Agent','TEAM-05',true],
    ['AGT-1024','VIP Agent 10','vip10@supportdesk.com','Agent','TEAM-05',true],
    // Consulting Agents
    ['AGT-1025','Consulting Agent 1','consult1@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1026','Consulting Agent 2','consult2@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1027','Consulting Agent 3','consult3@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1028','Consulting Agent 4','consult4@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1029','Consulting Agent 5','consult5@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1030','Consulting Agent 6','consult6@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1031','Consulting Agent 7','consult7@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1032','Consulting Agent 8','consult8@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1033','Consulting Agent 9','consult9@supportdesk.com','Agent','TEAM-08',true],
    ['AGT-1034','Consulting Agent 10','consult10@supportdesk.com','Agent','TEAM-08',true]
  ];
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
  var rule=SpreadsheetApp.newDataValidation().requireValueInList(['Admin','TeamLead','Agent']).build();
  sh.getRange(2,4,100,1).setDataValidation(rule);
}

// --- AGENT CATEGORIES (routing mappings) ------------------------------------
function seedAgentCategories(ss){
  if(!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch(e) {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }
  }
  var sh=ss.getSheetByName('AgentCategories');
  if(!sh) sh = ss.insertSheet('AgentCategories');
  _clr(sh,4);
  var h=CONFIG.COLUMNS.AGENT_CATEGORIES;

  // Each category gets 2-4 agents (expandable in production to 10-15)
  var data=[
    // Billing (3 agents)
    ['AGT-1005','Mike Ross','Billing',true],
    ['AGT-1007','David Kim','Billing',true],
    ['AGT-1014','Nina Garcia','Billing',true],
    // Technical (3 agents)
    ['AGT-1002','Sarah Connor','Technical',true],
    ['AGT-1006','Emily Chen','Technical',true],
    ['AGT-1011','Alex Turner','Technical',true],
    // Shipping (2 agents)
    ['AGT-1008','Lisa Wang','Shipping',true],
    ['AGT-1012','Priya Sharma','Shipping',true],
    // Account (3 agents)
    ['AGT-1003','John Doe','Account',true],
    ['AGT-1004','Jane Smith','Account',true],
    ['AGT-1009','Ryan Patel','Account',true],
    // Product (2 agents)
    ['AGT-1010','Olivia Brown','Product',true],
    ['AGT-1013','Tom Wilson','Product',true],
    // Feature Request (2 agents)
    ['AGT-1014','Nina Garcia','Feature Request',true],
    ['AGT-1010','Olivia Brown','Feature Request',true]
  ];
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- CUSTOMERS --------------------------------------------------------------
function seedCustomers(ss){
  var sh=ss.getSheetByName('Customers'); _clr(sh,7);
  var h=['customerId','name','email','phone','totalTickets','createdAt'];
  var custs=[];
  var now=Date.now();

  // Add 20 demo customer accounts
  var demoCusts=[
    {id:'CUST-DEMO01',name:'Alice Johnson',email:'customer1@example.com',phone:'+1-555-1001'},
    {id:'CUST-DEMO02',name:'Bob Williams',email:'customer2@example.com',phone:'+1-555-1002'},
    {id:'CUST-DEMO03',name:'Carol Davis',email:'customer3@example.com',phone:'+1-555-1003'},
    {id:'CUST-DEMO04',name:'Dan Miller',email:'customer4@example.com',phone:'+1-555-1004'},
    {id:'CUST-DEMO05',name:'Eva Martinez',email:'customer5@example.com',phone:'+1-555-1005'},
    {id:'CUST-DEMO06',name:'Frank Thomas',email:'customer6@example.com',phone:'+1-555-1006'},
    {id:'CUST-DEMO07',name:'Grace Lee',email:'customer7@example.com',phone:'+1-555-1007'},
    {id:'CUST-DEMO08',name:'Henry Clark',email:'customer8@example.com',phone:'+1-555-1008'},
    {id:'CUST-DEMO09',name:'Iris Nguyen',email:'customer9@example.com',phone:'+1-555-1009'},
    {id:'CUST-DEMO10',name:'Jake Anderson',email:'customer10@example.com',phone:'+1-555-1010'},
    {id:'CUST-DEMO11',name:'Kevin White',email:'customer11@example.com',phone:'+1-555-1011'},
    {id:'CUST-DEMO12',name:'Laura Martin',email:'customer12@example.com',phone:'+1-555-1012'},
    {id:'CUST-DEMO13',name:'Mike Taylor',email:'customer13@example.com',phone:'+1-555-1013'},
    {id:'CUST-DEMO14',name:'Nancy Scott',email:'customer14@example.com',phone:'+1-555-1014'},
    {id:'CUST-DEMO15',name:'Oliver King',email:'customer15@example.com',phone:'+1-555-1015'},
    {id:'CUST-DEMO16',name:'Paula Wright',email:'customer16@example.com',phone:'+1-555-1016'},
    {id:'CUST-DEMO17',name:'Quinn Evans',email:'customer17@example.com',phone:'+1-555-1017'},
    {id:'CUST-DEMO18',name:'Rachel Baker',email:'customer18@example.com',phone:'+1-555-1018'},
    {id:'CUST-DEMO19',name:'Steve Green',email:'customer19@example.com',phone:'+1-555-1019'},
    {id:'CUST-DEMO20',name:'Tracy Hall',email:'customer20@example.com',phone:'+1-555-1020'}
  ];
  demoCusts.forEach(function(d){
    custs.push({id:d.id,name:d.name,email:d.email,phone:d.phone,created:new Date(now-_ri(30,180)*86400000).toISOString()});
  });

  var data=custs.map(function(c){
    return [c.id,c.name,c.email,c.phone,5,c.created]; // 5 tickets per customer
  });
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
  return custs;
}

// --- ORDERS -----------------------------------------------------------------
function seedOrders(ss, custs) {
  var sh = ss.getSheetByName('Orders');
  var h = CONFIG.COLUMNS.ORDERS;
  _clr(sh, h.length);
  
  // Wipe and rebuild headers
  sh.getRange(1, 1, 1, h.length).setValues([h]);
  _hdr(sh, h);

  var vipAgents = [
    { id: 'AGT-1015', name: 'VIP Agent 1' },
    { id: 'AGT-1016', name: 'VIP Agent 2' },
    { id: 'AGT-1017', name: 'VIP Agent 3' },
    { id: 'AGT-1018', name: 'VIP Agent 4' },
    { id: 'AGT-1019', name: 'VIP Agent 5' },
    { id: 'AGT-1020', name: 'VIP Agent 6' },
    { id: 'AGT-1021', name: 'VIP Agent 7' },
    { id: 'AGT-1022', name: 'VIP Agent 8' },
    { id: 'AGT-1023', name: 'VIP Agent 9' },
    { id: 'AGT-1024', name: 'VIP Agent 10' }
  ];
  var consultingAgents = [
    { id: 'AGT-1025', name: 'Consulting Agent 1' },
    { id: 'AGT-1026', name: 'Consulting Agent 2' },
    { id: 'AGT-1027', name: 'Consulting Agent 3' },
    { id: 'AGT-1028', name: 'Consulting Agent 4' },
    { id: 'AGT-1029', name: 'Consulting Agent 5' },
    { id: 'AGT-1030', name: 'Consulting Agent 6' },
    { id: 'AGT-1031', name: 'Consulting Agent 7' },
    { id: 'AGT-1032', name: 'Consulting Agent 8' },
    { id: 'AGT-1033', name: 'Consulting Agent 9' },
    { id: 'AGT-1034', name: 'Consulting Agent 10' }
  ];
  var generalAgents = [
    { id: 'AGT-1003', name: 'John Doe' },
    { id: 'AGT-1004', name: 'Jane Smith' },
    { id: 'AGT-1009', name: 'Ryan Patel' }
  ];

  var vipIdx = 0;
  var consultIdx = 0;
  var generalIdx = 0;

  var allOrders = [];
  
  // For every customer, generate 5 random orders
  custs.forEach(function(c) {
    for (var i = 0; i < 5; i++) {
      var product = OrderService.PRODUCTS[Math.floor(Math.random() * OrderService.PRODUCTS.length)];
      var status = OrderService.STATUSES[Math.floor(Math.random() * OrderService.STATUSES.length)];
      var orderDate = new Date(Date.now() - Math.random() * 180 * 24 * 3600 * 1000);
      
      // Determine priority: 40% VIP, 40% Consulting, 20% Standard
      var rand = Math.random();
      var priority = 'Standard';
      var assignedTo = '';
      var assignedName = '';
      var teamBucket = 'TEAM-01';
      
      if (rand < 0.4) {
        priority = 'VIP';
        var ag = vipAgents[vipIdx];
        assignedTo = ag.id;
        assignedName = ag.name;
        teamBucket = 'TEAM-05';
        vipIdx = (vipIdx + 1) % 10;
      } else if (rand < 0.8) {
        priority = 'Consulting';
        var ag = consultingAgents[consultIdx];
        assignedTo = ag.id;
        assignedName = ag.name;
        teamBucket = 'TEAM-08';
        consultIdx = (consultIdx + 1) % 10;
      } else {
        var ag = generalAgents[generalIdx];
        assignedTo = ag.id;
        assignedName = ag.name;
        teamBucket = 'TEAM-01';
        generalIdx = (generalIdx + 1) % 3;
      }

      // Ensure we push exactly h.length items in the correct order
      var row = [];
      h.forEach(function(col) {
        if (col === 'orderId') row.push(`ORD-${_id('', 8)}`);
        else if (col === 'customerId') row.push(c.id);
        else if (col === 'customerName') row.push(c.name);
        else if (col === 'orderDate') row.push(orderDate.toISOString());
        else if (col === 'amount') row.push(product.price);
        else if (col === 'status') row.push(status);
        else if (col === 'product') row.push(product.name);
        else if (col === 'confirmationId' || col === 'confId') row.push(`CONF-${_id('', 8).toUpperCase()}`);
        else if (col === 'assignedTo') row.push(assignedTo);
        else if (col === 'assignedName') row.push(assignedName);
        else if (col === 'teamBucket') row.push(teamBucket);
        else if (col === 'priority') row.push(priority);
        else if (col === 'updatedAt') row.push(orderDate.toISOString());
        else row.push('');
      });
      allOrders.push(row);
    }
  });

  if (allOrders.length > 0) {
    sh.getRange(2, 1, allOrders.length, h.length).setValues(allOrders);
  }
  
  // Return objects for seedTickets
  return allOrders.map(function(o) {
    var obj = {};
    h.forEach(function(col, idx) {
      if (col === 'orderId') obj.id = o[idx];
      else if (col === 'customerId') obj.custId = o[idx];
      else obj[col] = o[idx];
    });
    return obj;
  });
}

// --- TICKETS ----------------------------------------------------------------
function seedTickets(ss,custs,ords){
  var h=CONFIG.COLUMNS.TICKETS;
  var sh=ss.getSheetByName('Tickets'); _clr(sh,h.length);
  var statuses=CONFIG.STATUSES;
  var priorities=CONFIG.PRIORITIES;
  var channels=CONFIG.CHANNELS;
  var agents=[
    {id:'AGT-1002',n:'Sarah Connor'},{id:'AGT-1003',n:'John Doe'},{id:'AGT-1004',n:'Jane Smith'},
    {id:'AGT-1005',n:'Mike Ross'},{id:'AGT-1006',n:'Emily Chen'},{id:'AGT-1007',n:'David Kim'},
    {id:'AGT-1008',n:'Lisa Wang'},{id:'AGT-1009',n:'Ryan Patel'},{id:'AGT-1010',n:'Olivia Brown'},
    {id:'AGT-1011',n:'Alex Turner'},{id:'AGT-1012',n:'Priya Sharma'},{id:'AGT-1013',n:'Tom Wilson'},
    {id:'AGT-1014',n:'Nina Garcia'}
  ];
  
  var categoryAgents = {
    'Shipping': [{id:'AGT-1008',n:'Lisa Wang'}, {id:'AGT-1012',n:'Priya Sharma'}],
    'Product': [{id:'AGT-1010',n:'Olivia Brown'}, {id:'AGT-1013',n:'Tom Wilson'}],
    'Billing': [{id:'AGT-1005',n:'Mike Ross'}, {id:'AGT-1007',n:'David Kim'}, {id:'AGT-1014',n:'Nina Garcia'}],
    'Account': [{id:'AGT-1003',n:'John Doe'}, {id:'AGT-1004',n:'Jane Smith'}, {id:'AGT-1009',n:'Ryan Patel'}],
    'Feature Request': [{id:'AGT-1014',n:'Nina Garcia'}, {id:'AGT-1010',n:'Olivia Brown'}],
    'Technical': [{id:'AGT-1002',n:'Sarah Connor'}, {id:'AGT-1006',n:'Emily Chen'}, {id:'AGT-1011',n:'Alex Turner'}]
  };
  
  var teams=['TEAM-01','TEAM-02','TEAM-03','TEAM-04','TEAM-05','TEAM-06','TEAM-07'];
  // Create 6 realistic ticket scenarios covering all categories
  var allScenarios = [
    { subject: 'Where is my order?', desc: 'I ordered this a week ago and the tracking has not updated. Can you please check?', cat: 'Shipping', pri: 'Medium' },
    { subject: 'Received broken item', desc: 'The box was completely crushed and the product inside is damaged. I need a refund ASAP.', cat: 'Product', pri: 'Urgent' },
    { subject: 'Charged twice on my card', desc: 'My credit card shows two charges for the same order amount. Please reverse one.', cat: 'Billing', screenshot: true, pri: 'High' },
    { subject: 'How do I change my password?', desc: 'I forgot my password and the reset link is not coming to my email.', cat: 'Account', pri: 'High' },
    { subject: 'App is crashing on startup', desc: 'Every time I open the application, it freezes on the loading screen and crashes. Please help.', cat: 'Technical', pri: 'Urgent' },
    { subject: 'Feature request: Add Paypal', desc: 'I love your store but it would be so much easier if I could pay with Paypal.', cat: 'Feature Request', pri: 'Low' }
  ];

  var tkts=[];
  var now=Date.now();
  var agentIndex = {}; // Track agent round-robin assignment
  
  custs.forEach(function(c) {
    var custOrds=ords.filter(function(o){return o.custId===c.id;});
    
    // Shuffle scenarios to cover all categories across customers, but limit to 5 tickets per customer
    var shuffledScenarios = allScenarios.slice().sort(function() { return 0.5 - Math.random() });
    var customerScenarios = shuffledScenarios.slice(0, 5);
    
    customerScenarios.forEach(function(scenario, index) {
      var catAgents = categoryAgents[scenario.cat] || agents;
      
      // Strict round-robin assignment to ensure perfect distribution
      if (agentIndex[scenario.cat] === undefined) agentIndex[scenario.cat] = 0;
      var ag = catAgents[agentIndex[scenario.cat] % catAgents.length];
      agentIndex[scenario.cat]++;
      var ordId= (index < 3 && custOrds.length > index) ? custOrds[index].id : ''; // Link to order for first 3 scenarios
      
      var created=new Date(now-_ri(0,30)*86400000); // Created within last 30 days
      var st=_rc(statuses);
      var resolved='';
      if(st==='Resolved') resolved=new Date(created.getTime()+_ri(1,48)*3600000).toISOString();
      var updated=resolved||new Date(created.getTime()+_ri(1,10)*3600000).toISOString();
      var slaH=CONFIG.SLA[scenario.pri]||24;
      
      tkts.push({
        ticketId:'TKT-'+created.toISOString().slice(2,10).replace(/-/g,'')+'-'+_id('',6),
        subject:scenario.subject,
        description:scenario.desc,
        status:st,
        priority:scenario.pri,
        channel:_rc(channels),
        queryTheme:scenario.cat,
        actionTaken:st==='Resolved'?'Issue resolved and confirmed with customer':'',
        customerId:c.id,customerName:c.name,customerEmail:c.email,customerPhone:c.phone,
        orderId:ordId,assignedTo:ag.id,assignedName:ag.n,teamBucket:_rc(teams),
        createdAt:created.toISOString(),updatedAt:updated,resolvedAt:resolved,
        slaDeadline:new Date(created.getTime()+slaH*3600000).toISOString(),
        isEscalated:Math.random()<0.1,tags:_rc(['billing','technical','shipping','general','urgent','vip','product','account'])
      });
    });
  });

  tkts.sort(function(a,b){return new Date(b.createdAt)-new Date(a.createdAt);});
  var data=tkts.map(function(t){return h.map(function(col){return t[col]!==undefined?t[col]:'';});});
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
  sh.getRange(2,4,300,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(statuses).build());
  sh.getRange(2,5,300,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(priorities).build());
  sh.getRange(2,6,300,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(channels).build());
  return tkts;
}

// --- COMMENTS ---------------------------------------------------------------
function seedComments(ss,tkts){
  var sh=ss.getSheetByName('Comments');
  var h=CONFIG.COLUMNS.COMMENTS;
  _clr(sh,h.length);
  var msgs=['Looking into this right now.','Can you provide more details?','Issue identified — working on fix.','Escalating to Tier 2.','Resolved. Please confirm.','Internal note: checked logs, no errors found.','Customer confirmed resolution.','Waiting for third-party response.'];
  var data=[];
  for(var i=0;i<Math.min(75,tkts.length);i++){
    var t=tkts[i];
    var numComments=_ri(1,3);
    for(var j=0;j<numComments;j++){
      data.push([
        'COM-'+_id('',6),
        t.ticketId,
        t.orderId || '',
        t.assignedTo,
        t.assignedName,
        _rc(msgs),
        Math.random()<0.2,
        new Date(new Date(t.createdAt).getTime()+(j+1)*1800000).toISOString()
      ]);
    }
  }
  sh.getRange(1,1,1,h.length).setValues([h]);
  if(data.length>0) sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- ESCALATIONS ------------------------------------------------------------
function seedEscalations(ss,tkts){
  var sh=ss.getSheetByName('Escalations'); _clr(sh,8);
  var h=CONFIG.COLUMNS.ESCALATIONS;
  var reasons=['SLA breach','Customer complaint','Technical complexity','VIP customer','Repeated issue'];
  var escalated=tkts.filter(function(t){return t.isEscalated;});
  var data=escalated.map(function(t){
    return['ESC-'+_id('',6),t.ticketId,t.assignedTo,t.assignedName,'AGT-1001','Admin User',_rc(reasons),new Date(new Date(t.createdAt).getTime()+3600000).toISOString()];
  });
  sh.getRange(1,1,1,h.length).setValues([h]);
  if(data.length>0) sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- ACTIVITY LOGS ----------------------------------------------------------
function seedActivityLogs(ss,tkts){
  var sh=ss.getSheetByName('ActivityLogs');
  var h=CONFIG.COLUMNS.ACTIVITY_LOGS;
  _clr(sh,h.length);
  var data=[];
  for(var i=0;i<Math.min(50,tkts.length);i++){
    var t=tkts[i];
    data.push([
      'LOG-'+_id('',6),
      t.ticketId,
      t.orderId || '',
      t.assignedTo,
      t.assignedName,
      'Created',
      '{"status":"Pending"}',
      t.createdAt
    ]);
    if(t.resolvedAt) {
      data.push([
        'LOG-'+_id('',6),
        t.ticketId,
        t.orderId || '',
        t.assignedTo,
        t.assignedName,
        'Resolved',
        '{"status":"Resolved"}',
        t.resolvedAt
      ]);
    }
  }
  sh.getRange(1,1,1,h.length).setValues([h]);
  if(data.length>0) sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- SETTINGS ---------------------------------------------------------------
function seedSettings(ss){
  var sh=ss.getSheetByName('Settings'); _clr(sh,3);
  var h=['key','value','description'];
  var data=[['SLA_HOURS_LOW','48','SLA for low priority'],['SLA_HOURS_MEDIUM','24','SLA for medium'],['SLA_HOURS_HIGH','8','SLA for high'],['SLA_HOURS_URGENT','4','SLA for urgent']];
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- DASHBOARD CACHE --------------------------------------------------------
function seedDashboardCache(ss){
  var sh=ss.getSheetByName('DashboardCache'); _clr(sh,3);
  var h=['metricKey','metricValue','lastUpdated'];
  var now=new Date().toISOString();
  var data=[['TOTAL_TICKETS',250,now],['OPEN_TICKETS',0,now]];
  sh.getRange(1,1,1,h.length).setValues([h]);
  sh.getRange(2,1,data.length,h.length).setValues(data);
  _hdr(sh,h);
}

// --- ATTACHMENTS (header only) ----------------------------------------------
function seedAttachments(ss){
  var sh=ss.getSheetByName('Attachments');
  var h=CONFIG.COLUMNS.ATTACHMENTS;
  _clr(sh,h.length);
  sh.getRange(1,1,1,h.length).setValues([h]);
  _hdr(sh,h);
}

// --- NOTIFICATIONS (header only) --------------------------------------------
function seedNotifications(ss){
  var sh=ss.getSheetByName('Notifications');
  var h=CONFIG.COLUMNS.NOTIFICATIONS;
  _clr(sh,h.length);
  sh.getRange(1,1,1,h.length).setValues([h]);
  _hdr(sh,h);
}
