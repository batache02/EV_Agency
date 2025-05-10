const Notification = require('../models/Notification');

// الحصول على إشعارات المستخدم
exports.getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 }); // ترتيب تنازلي حسب تاريخ الإنشاء

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

// تحديث حالة قراءة الإشعار
exports.markAsRead = async (req, res, next) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'الإشعار غير موجود'
      });
    }

    // التحقق من أن الإشعار ينتمي للمستخدم الحالي
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بتحديث هذا الإشعار'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// تحديث حالة قراءة جميع الإشعارات
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'تم تحديث جميع الإشعارات كمقروءة'
    });
  } catch (err) {
    next(err);
  }
};

// حذف إشعار
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'الإشعار غير موجود'
      });
    }

    // التحقق من أن الإشعار ينتمي للمستخدم الحالي
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بحذف هذا الإشعار'
      });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// إنشاء إشعار (للاستخدام الداخلي فقط)
exports.createNotification = async (recipientId, title, message, relatedTo = null) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      relatedTo
    });

    return notification;
  } catch (err) {
    console.error('خطأ في إنشاء الإشعار:', err);
    return null;
  }
};

// الحصول على عدد الإشعارات غير المقروءة
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (err) {
    next(err);
  }
};