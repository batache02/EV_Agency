const express = require('express');
const router = express.Router();
const { 
  getMyNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getUnreadCount
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// المسارات العامة (تتطلب مصادقة)
router.route('/')
  .get(protect, getMyNotifications);

// الحصول على عدد الإشعارات غير المقروءة
router.route('/unread-count')
  .get(protect, getUnreadCount);

// تحديث حالة قراءة جميع الإشعارات
router.route('/mark-all-read')
  .put(protect, markAllAsRead);

// مسارات محددة
router.route('/:id')
  .put(protect, markAsRead)
  .delete(protect, deleteNotification);

module.exports = router;