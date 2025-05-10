const Research = require('../models/Research');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// إنشاء بحث جديد
exports.createResearch = async (req, res) => {
  try {
    // إضافة معرف المستخدم كمؤلف
    req.body.author = req.user.id;

    // إنشاء البحث
    const research = await Research.create(req.body);

    res.status(201).json({
      success: true,
      data: research
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في إنشاء البحث'
    });
  }
};

// الحصول على جميع البحوث
exports.getResearches = async (req, res) => {
  try {
    let query;

    // نسخة من req.query
    const reqQuery = { ...req.query };

    // الحقول المستبعدة
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // إنشاء سلسلة استعلام
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // البحث الأساسي
    if (req.user.role !== 'admin') {
      // المستخدم العادي يرى فقط البحوث الخاصة به
      query = Research.find({
        ...JSON.parse(queryStr),
        $or: [
          { author: req.user.id },
          { coAuthors: req.user.id },
          { supervisor: req.user.id }
        ]
      });
    } else {
      // المسؤول يرى جميع البحوث
      query = Research.find(JSON.parse(queryStr));
    }

    // اختيار حقول محددة
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // الترتيب
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-submissionDate');
    }

    // الصفحات
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Research.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // تنفيذ الاستعلام
    const researches = await query.populate([
      { path: 'author', select: 'name email' },
      { path: 'coAuthors', select: 'name email' },
      { path: 'supervisor', select: 'name email' },
      { path: 'reviewedBy', select: 'name email' }
    ]);

    // معلومات الصفحات
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: researches.length,
      pagination,
      data: researches
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في الحصول على البحوث'
    });
  }
};

// الحصول على بحث محدد
exports.getResearch = async (req, res) => {
  try {
    const research = await Research.findById(req.params.id).populate([
      { path: 'author', select: 'name email' },
      { path: 'coAuthors', select: 'name email' },
      { path: 'supervisor', select: 'name email' },
      { path: 'reviewedBy', select: 'name email' }
    ]);

    if (!research) {
      return res.status(404).json({
        success: false,
        error: 'البحث غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (
      req.user.role !== 'admin' &&
      research.author._id.toString() !== req.user.id &&
      !research.coAuthors.some(author => author._id.toString() === req.user.id) &&
      (!research.supervisor || research.supervisor._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بالوصول إلى هذا البحث'
      });
    }

    res.status(200).json({
      success: true,
      data: research
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في الحصول على البحث'
    });
  }
};

// تحديث بحث
exports.updateResearch = async (req, res) => {
  try {
    let research = await Research.findById(req.params.id);

    if (!research) {
      return res.status(404).json({
        success: false,
        error: 'البحث غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (
      req.user.role !== 'admin' &&
      research.author.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بتحديث هذا البحث'
      });
    }

    // التحقق من حالة البحث
    if (research.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن تحديث البحث بعد المراجعة'
      });
    }

    // تحديث البحث
    research = await Research.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: research
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في تحديث البحث'
    });
  }
};

// حذف بحث
exports.deleteResearch = async (req, res) => {
  try {
    const research = await Research.findById(req.params.id);

    if (!research) {
      return res.status(404).json({
        success: false,
        error: 'البحث غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (
      req.user.role !== 'admin' &&
      research.author.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بحذف هذا البحث'
      });
    }

    // التحقق من حالة البحث
    if (research.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف البحث بعد المراجعة'
      });
    }

    // حذف الملفات المرتبطة
    if (research.files && research.files.length > 0) {
      research.files.forEach(file => {
        const filePath = path.join(process.cwd(), file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await research.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في حذف البحث'
    });
  }
};

// مراجعة البحث (للمسؤولين فقط)
exports.reviewResearch = async (req, res) => {
  try {
    // التحقق من الصلاحيات
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بمراجعة البحوث'
      });
    }

    const { status, adminNotes } = req.body;

    // التحقق من الحالة
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'الحالة غير صالحة'
      });
    }

    let research = await Research.findById(req.params.id);

    if (!research) {
      return res.status(404).json({
        success: false,
        error: 'البحث غير موجود'
      });
    }

    // تحديث البحث
    research = await Research.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNotes,
        reviewDate: Date.now(),
        reviewedBy: req.user.id
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: research
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'خطأ في مراجعة البحث'
    });
  }
};