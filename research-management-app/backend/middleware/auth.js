const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

// حماية المسارات
exports.protect = async (req, res, next) => {
  let token;

  // التحقق من وجود الرمز في الرأس
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // التحقق من وجود الرمز
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح بالوصول'
    });
  }

  try {
    // التحقق من الرمز
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // إضافة المستخدم إلى الطلب
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح بالوصول'
    });
  }
};

// التحقق من الأدوار
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لهذا الدور بالوصول'
      });
    }
    next();
  };
};