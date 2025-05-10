const express = require('express');
const router = express.Router();
const { 
  getAllReferenceNumbers, 
  getReferenceNumber, 
  verifyReferenceNumber, 
  updateReceiveStatus,
  getMyReferenceNumbers
} = require('../controllers/referenceNumberController');
const { protect, authorize } = require('../middleware/auth');

// المسارات العامة (تتطلب مصادقة)
router.route('/')
  .get(protect, getMyReferenceNumbers);

// مسارات المسؤول
router.route('/admin')
  .get(protect, authorize('admin'), getAllReferenceNumbers);

// التحقق من صحة رقم مرجعي
router.route('/verify')
  .post(protect, verifyReferenceNumber);

// مسارات محددة
router.route('/:id')
  .get(protect, getReferenceNumber);

// تحديث حالة استلام الرقم المرجعي
router.route('/:id/receive')
  .put(protect, updateReceiveStatus);

module.exports = router;