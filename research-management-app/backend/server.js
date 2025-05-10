const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');

// إنشاء تطبيق Express
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// اتصال بقاعدة البيانات
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('تم الاتصال بقاعدة البيانات بنجاح'))
  .catch(err => console.error('فشل الاتصال بقاعدة البيانات:', err));

// تعريف المسارات (سيتم إضافتها لاحقًا)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/research', require('./routes/research'));
app.use('/api/thesis', require('./routes/thesis')); // إضافة مسارات المذكرات
app.use('/api/reference', require('./routes/reference'));
app.use('/api/notifications', require('./routes/notifications'));

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'خطأ في الخادم'
  });
});

// تشغيل الخادم
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});