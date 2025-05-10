const Thesis = require('../models/Thesis');
const User = require('../models/User');
const ReferenceNumber = require('../models/ReferenceNumber');
const Notification = require('../models/Notification');

// إنشاء مذكرة جديدة
exports.createThesis = async (req, res, next) => {
  try {
    // إضافة معرف المستخدم كطالب
    req.body.student = req.user.id;

    const thesis = await Thesis.create(req.body);

    res.status(201).json({
      success: true,
      data: thesis
    });
  } catch (err) {
    next(err);
  }
};

// الحصول على جميع المذكرات للمستخدم الحالي
exports.getMyThesis = async (req, res, next) => {
  try {
    const thesis = await Thesis.find({ student: req.user.id })
      .populate('student', 'name email')
      .populate('coStudents', 'name email')
      .populate('supervisor', 'name email')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      count: thesis.length,
      data: thesis
    });
  } catch (err) {
    next(err);
  }
};

// الحصول على مذكرة محددة
exports.getThesis = async (req, res, next) => {
  try {
    const thesis = await Thesis.findById(req.params.id)
      .populate('student', 'name email')
      .populate('coStudents', 'name email')
      .populate('supervisor', 'name email')
      .populate('reviewedBy', 'name email');

    if (!thesis) {
      return res.status(404).json({
        success: false,
        error: 'المذكرة غير موجودة'
      });
    }

    // التحقق من الصلاحيات (الطالب أو المشرف أو المسؤول)
    if (
      thesis.student.toString() !== req.user.id &&
      !thesis.coStudents.some(student => student._id.toString() === req.user.id) &&
      thesis.supervisor.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بالوصول إلى هذه المذكرة'
      });
    }

    res.status(200).json({
      success: true,
      data: thesis
    });
  } catch (err) {
    next(err);
  }
};

// تحديث مذكرة
exports.updateThesis = async (req, res, next) => {
  try {
    let thesis = await Thesis.findById(req.params.id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        error: 'المذكرة غير موجودة'
      });
    }

    // التحقق من الصلاحيات (الطالب فقط)
    if (thesis.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بتحديث هذه المذكرة'
      });
    }

    // لا يمكن تحديث المذكرة إذا تمت الموافقة عليها أو رفضها
    if (thesis.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن تحديث المذكرة بعد الموافقة عليها أو رفضها'
      });
    }

    thesis = await Thesis.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: thesis
    });
  } catch (err) {
    next(err);
  }
};

// حذف مذكرة
exports.deleteThesis = async (req, res, next) => {
  try {
    const thesis = await Thesis.findById(req.params.id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        error: 'المذكرة غير موجودة'
      });
    }

    // التحقق من الصلاحيات (الطالب فقط)
    if (thesis.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بحذف هذه المذكرة'
      });
    }

    // لا يمكن حذف المذكرة إذا تمت الموافقة عليها
    if (thesis.status === 'approved') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف المذكرة بعد الموافقة عليها'
      });
    }

    await thesis.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// الحصول على جميع المذكرات (للمسؤول فقط)
exports.getAllThesis = async (req, res, next) => {
  try {
    // التحقق من صلاحيات المسؤول
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بالوصول إلى هذه البيانات'
      });
    }

    const thesis = await Thesis.find()
      .populate('student', 'name email')
      .populate('coStudents', 'name email')
      .populate('supervisor', 'name email')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      count: thesis.length,
      data: thesis
    });
  } catch (err) {
    next(err);
  }
};

// مراجعة مذكرة (للمسؤول فقط)
exports.reviewThesis = async (req, res, next) => {
  try {
    // التحقق من صلاحيات المسؤول
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بمراجعة المذكرات'
      });
    }

    const { status, adminNotes } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'الرجاء تحديد حالة صحيحة (approved/rejected)'
      });
    }

    let thesis = await Thesis.findById(req.params.id);

    if (!thesis) {
      return res.status(404).json({
        success: false,
        error: 'المذكرة غير موجودة'
      });
    }

    // تحديث المذكرة
    thesis.status = status;
    thesis.adminNotes = adminNotes;
    thesis.reviewDate = Date.now();
    thesis.reviewedBy = req.user.id;

    // إذا تمت الموافقة، قم بإنشاء رقم مرجعي
    if (status === 'approved') {
      // توليد الرقم المرجعي
      const year = new Date().getFullYear();
      let typeCode;
      
      switch(thesis.type) {
        case 'bachelor':
          typeCode = 'LI';
          break;
        case 'master':
          typeCode = 'MA';
          break;
        case 'phd':
          typeCode = 'PH';
          break;
        default:
          typeCode = 'XX';
      }
      
      const count = await ReferenceNumber.countDocuments({ 
        type: typeCode,
        issuedDate: { 
          $gte: new Date(year, 0, 1), 
          $lte: new Date(year, 11, 31) 
        }
      });
      
      const sequentialNumber = (count + 1).toString().padStart(4, '0');
      const referenceNumber = `${typeCode}${year}${sequentialNumber}CS`; // CS للعلوم الحاسوبية كمثال
      
      thesis.referenceNumber = referenceNumber;
      
      // إنشاء سجل الرقم المرجعي
      await ReferenceNumber.create({
        number: referenceNumber,
        type: typeCode,
        requestId: thesis._id,
        requestModel: 'Thesis',
        issuedBy: req.user.id
      });
    }

    await thesis.save();

    // إنشاء إشعار للمستخدم
    await Notification.create({
      recipient: thesis.student,
      title: status === 'approved' ? 'تمت الموافقة على المذكرة' : 'تم رفض المذكرة',
      message: status === 'approved' 
        ? `تمت الموافقة على مذكرتك بعنوان "${thesis.title}". الرقم المرجعي الخاص بك هو: ${thesis.referenceNumber}`
        : `تم رفض مذكرتك بعنوان "${thesis.title}". الرجاء مراجعة الملاحظات: ${adminNotes || 'لا توجد ملاحظات'}`
    });

    // إرسال الرد
    res.status(200).json({
      success: true,
      data: thesis
    });
  } catch (err) {
    next(err);
  }
};

// الحصول على المذكرات حسب المشرف
exports.getThesisBySupervisor = async (req, res, next) => {
  try {
    const thesis = await Thesis.find({ supervisor: req.user.id })
      .populate('student', 'name email')
      .populate('coStudents', 'name email')
      .populate('supervisor', 'name email')
      .populate('reviewedBy', 'name email');

    res.status(200).json({
      success: true,
      count: thesis.length,
      data: thesis
    });
  } catch (err) {
    next(err);
  }
};