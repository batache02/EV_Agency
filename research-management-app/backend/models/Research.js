const mongoose = require('mongoose');

const ResearchSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'الرجاء إدخال عنوان البحث'],
    trim: true
  },
  abstract: {
    type: String,
    required: [true, 'الرجاء إدخال ملخص البحث']
  },
  keywords: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coAuthors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

module.exports = mongoose.model('Research', ResearchSchema);