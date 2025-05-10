const express = require('express');
const router = express.Router();
const { 
  createThesis, 
  getMyThesis, 
  getThesis, 
  updateThesis, 
  deleteThesis, 
  getAllThesis, 
  reviewThesis,
  getThesisBySupervisor
} = require('../controllers/thesisController');
const { protect, authorize } = require('../middleware/auth');

// المسارات العامة (تتطلب مصادقة)
router.route('/')
  .post(protect, createThesis)
  .get(protect, getMyThesis);

// مسارات المشرف
router.route('/supervisor')
  .get(protect, authorize('supervisor', 'admin'), getThesisBySupervisor);

// مسارات المسؤول
router.route('/admin')
  .get(protect, authorize('admin'), getAllThesis);

// مسارات محددة
router.route('/:id')
  .get(protect, getThesis)
  .put(protect, updateThesis)
  .delete(protect, deleteThesis);

// مسار المراجعة (للمسؤول فقط)
router.route('/:id/review')
  .put(protect, authorize('admin'), reviewThesis);

module.exports = router;