const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    recipient: {
      type: String,
      required: true
    },
    recipientName: {
      type: String,
      default: ''
    },
    internId: {
      type: String,
      required: true,
      index: true
    },
    projectId: {
      type: String,
      required: true,
      index: true
    },
    projectName: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      required: true
    },
    deliveryStatus: {
      type: String,
      enum: ['SENT', 'MOCKED_SUCCESS', 'FAILED'],
      default: 'SENT'
    },
    errorMessage: {
      type: String,
      default: ''
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EmailLog', emailLogSchema);
