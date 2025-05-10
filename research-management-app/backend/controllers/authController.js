const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config');

// تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, email, password, personalInfo } = req.body;

    // التحقق من وجود المستخدم
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'البريد الإلكتروني مسجل بالفعل'
      });
    }

    // إنشاء مستخدم جديد
    const user = await User.create({
      name,
      email,
      password,
      personalInfo
    });

    // إنشاء رمز JWT
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        personalInfo: user.personalInfo
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في تسجيل المستخدم'
    });
  }
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // التحقق من وجود البريد الإلكتروني وكلمة المرور
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور'
      });
    }

    // التحقق من وجود المستخدم
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'بيانات الاعتماد غير صالحة'
      });
    }

    // التحقق من صحة كلمة المرور
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'بيانات الاعتماد غير صالحة'
      });
    }

    // إنشاء رمز JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        personalInfo: user.personalInfo
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في تسجيل الدخول'
    });
  }
};

// الحصول على معلومات المستخدم الحالي
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في الحصول على معلومات المستخدم'
    });
  }
};

// تحديث معلومات المستخدم
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      personalInfo: req.body.personalInfo
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث معلومات المستخدم'
    });
  }
};

// تغيير كلمة المرور
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // التحقق من كلمة المرور الحالية
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // تعيين كلمة المرور الجديدة
    user.password = req.body.newPassword;
    await user.save();

    // إنشاء رمز JWT جديد
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث كلمة المرور'
    });
  }
};

// طلب إعادة تعيين كلمة المرور
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'لا يوجد مستخدم بهذا البريد الإلكتروني'
      });
    }

    // إنشاء رمز إعادة تعيين كلمة المرور
    const resetToken = crypto.randomBytes(20).toString('hex');

    // تشفير الرمز وتخزينه في قاعدة البيانات
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // تعيين وقت انتهاء صلاحية الرمز (10 دقائق)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // إرسال بريد إلكتروني بالرمز (سيتم تنفيذه لاحقًا)
    // await sendResetPasswordEmail(user.email, resetToken);

    res.status(200).json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    });
  } catch (err) {
    // إعادة تعيين حقول إعادة تعيين كلمة المرور في حالة حدوث خطأ
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    next(err);
  }
};