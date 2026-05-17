/**
 * SUPPORTDESK CRM — NOTIFICATION CONTROLLER
 * Handles creating and retrieving real-time notifications for users (Agents and Customers).
 */

const NotificationController = {
  /**
   * Retrieves notifications for a user based on their various IDs (userId, agentId, customerId).
   */
  getUserNotifications: function(userIds, limit = 50) {
    const dao = new SheetDAO(CONFIG.SHEETS.NOTIFICATIONS, CONFIG.COLUMNS.NOTIFICATIONS);
    const allNotifications = dao.getAll();
    
    // Filter where notification.userId is in the userIds array
    const notifications = allNotifications.filter(n => userIds.includes(n.userId));
    
    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return notifications.slice(0, limit);
  },

  /**
   * Creates a new notification.
   */
  createNotification: function(userId, title, message, type = 'info', link = '') {
    const dao = new SheetDAO(CONFIG.SHEETS.NOTIFICATIONS, CONFIG.COLUMNS.NOTIFICATIONS);
    
    const notification = {
      notificationId: `NOTIF-${Helpers.generateId('', 8)}`,
      userId: userId,
      title: title,
      message: message,
      type: type, // 'info', 'success', 'warning', 'error'
      link: link,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    dao.insert(notification);
    return notification;
  },

  /**
   * Marks a specific notification as read.
   */
  markAsRead: function(notificationId, userIds) {
    const dao = new SheetDAO(CONFIG.SHEETS.NOTIFICATIONS, CONFIG.COLUMNS.NOTIFICATIONS);
    const notification = dao.findById('notificationId', notificationId);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    // Ensure the user owns this notification
    if (!userIds.includes(notification.userId)) {
      throw new Error('Unauthorized');
    }
    
    notification.isRead = true;
    dao.update('notificationId', notificationId, notification);
    return true;
  },
  
  /**
   * Marks all notifications as read for a user.
   */
  markAllAsRead: function(userIds) {
    const dao = new SheetDAO(CONFIG.SHEETS.NOTIFICATIONS, CONFIG.COLUMNS.NOTIFICATIONS);
    const allNotifications = dao.getAll();
    const notifications = allNotifications.filter(n => userIds.includes(n.userId) && n.isRead === false);
    
    for (let i = 0; i < notifications.length; i++) {
      notifications[i].isRead = true;
      dao.update('notificationId', notifications[i].notificationId, notifications[i]);
    }
    return true;
  }
};
