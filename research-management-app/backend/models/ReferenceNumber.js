const mongoose = require('mongoose');

const ReferenceNumberSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['BH', 'LI', 'MA', 'PH'],
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'requestModel'
  },
  requestModel: {
    type: String,
    required: true,
    enum: ['Research', 'Thesis']
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receivedDate: Date,
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['issued', 'received'],
    default: 'issued'
  },
  verificationLog: [{
    date: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    result: Boolean,
    notes: String
  }]
});

module.exports = mongoose.model('ReferenceNumber', ReferenceNumberSchema);