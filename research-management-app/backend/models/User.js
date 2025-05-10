const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الرجاء إدخال الاسم']
  },
  email: {
    type: String,
    required: [true, 'الرجاء إدخال البريد الإلكتروني'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'الرجاء إدخال بريد إلكتروني صحيح'
    ]
  },
  password: {
    type: String,
    required: [true, 'الرجاء إدخال كلمة المرور'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  personalInfo: {
    phone: String,
    address: String,
    department: String,
    specialization: String
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// مطابقة كلمة المرور المدخلة مع المخزنة
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// توليد رمز JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });
};

module.exports = mongoose.model('User', UserSchema);