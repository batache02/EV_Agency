const mongoose = require('mongoose');

const ThesisSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'الرجاء إدخال عنوان المذكرة'],
    trim: true
  },
  type: {
    type: String,
    enum: ['bachelor', 'master', 'phd'],
    required: [true, 'الرجاء تحديد نوع المذكرة']
  },
  abstract: {
    type: String,
    required: [true, 'الرجاء إدخال ملخص المذكرة']
  },
  keywords: [String],
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  files: [{
    name: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  defenseInfo: {
    date: Date,
    location: String,
    committee: [{
      name: String,
      role: String
    }]
  },
  notes: String,
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  reviewDate: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: String
});

module.exports = mongoose.model('Thesis', ThesisSchema);