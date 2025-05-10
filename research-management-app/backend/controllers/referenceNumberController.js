const ReferenceNumber = require('../models/ReferenceNumber');
const User = require('../models/User');

// الحصول على جميع الأرقام المرجعية (للمسؤول فقط)
exports.getAllReferenceNumbers = async (req, res, next) => {
  try {
    const referenceNumbers = await ReferenceNumber.find()
      .populate('issuedBy', 'name email')
      .populate('receivedBy', 'name email')
      .populate({
        path: 'requestId',
        select: 'title student supervisor',
        populate: {
          path: 'student supervisor',
          select: 'name email'
        }
      });

    res.status(200).json({
      success: true,
      count: referenceNumbers.length,
      data: referenceNumbers
    });
  } catch (err) {
    next(err);
  }
};

// الحصول على رقم مرجعي محدد
exports.getReferenceNumber = async (req, res, next) => {
  try {
    const referenceNumber = await ReferenceNumber.findById(req.params.id)
      .populate('issuedBy', 'name email')
      .populate('receivedBy', 'name email')
      .populate({
        path: 'requestId',
        select: 'title student supervisor',
        populate: {
          path: 'student supervisor',
          select: 'name email'
        }
      });

    if (!referenceNumber) {
      return res.status(404).json({
        success: false,
        error: 'الرقم المرجعي غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      data: referenceNumber
    });
  } catch (err) {
    next(err);
  }
};

// التحقق من صحة رقم مرجعي
exports.verifyReferenceNumber = async (req, res, next) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({
        success: false,
        error: 'الرجاء تقديم الرقم المرجعي للتحقق'
      });
    }

    const referenceNumber = await ReferenceNumber.findOne({ number })
      .populate('issuedBy', 'name email')
      .populate('receivedBy', 'name email')
      .populate({
        path: 'requestId',
        select: 'title type status',
      });

    if (!referenceNumber) {
      return res.status(404).json({
        success: false,
        error: 'الرقم المرجعي غير صالح'
      });
    }

    // إضافة سجل التحقق
    referenceNumber.verificationLog.push({
      verifiedBy: req.user.id,
      result: true,
      notes: 'تم التحقق من خلال واجهة API'
    });

    await referenceNumber.save();

    res.status(200).json({
      success: true,
      data: referenceNumber
    });
  } catch (err) {
    next(err);
  }
};

// تحديث حالة استلام الرقم المرجعي
exports.updateReceiveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    let referenceNumber = await ReferenceNumber.findById(id);

    if (!referenceNumber) {
      return res.status(404).json({
        success: false,
        error: 'الرقم المرجعي غير موجود'
      });
    }

    // تحديث حالة الاستلام
    referenceNumber.status = 'received';
    referenceNumber.receivedDate = Date.now();
    referenceNumber.receivedBy = req.user.id;

    await referenceNumber.save();

    res.status(200).json({
      success: true,
      data: referenceNumber
    });
  } catch (err) {
    next(err);
  }
};

// الحصول على الأرقام المرجعية للمستخدم الحالي
exports.getMyReferenceNumbers = async (req, res, next) => {
  try {
    // البحث في الأبحاث والمذكرات التي يملكها المستخدم
    const referenceNumbers = await ReferenceNumber.find()
      .populate('issuedBy', 'name email')
      .populate('receivedBy', 'name email')
      .populate({
        path: 'requestId',
        select: 'title student supervisor',
        populate: {
          path: 'student supervisor',
          select: 'name email'
        }
      });

    // تصفية النتائج للحصول على الأرقام المرجعية المرتبطة بالمستخدم
    const userReferenceNumbers = referenceNumbers.filter(ref => {
      if (ref.requestModel === 'Research' || ref.requestModel === 'Thesis') {
        return ref.requestId && 
               ((ref.requestId.student && ref.requestId.student._id.toString() === req.user.id) ||
                (ref.requestId.supervisor && ref.requestId.supervisor._id.toString() === req.user.id));
      }
      return false;
    });

    res.status(200).json({
      success: true,
      count: userReferenceNumbers.length,
      data: userReferenceNumbers
    });
  } catch (err) {
    next(err);
  }
};