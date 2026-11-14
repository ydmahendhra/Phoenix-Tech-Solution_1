const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    recipientId: {
      type: String,
      required: true,
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['admin', 'intern', 'all'],
      required: true
    },
    notificationTitle: {
      type: String,
      required: true
    },
    notificationMessage: {
      type: String,
      required: true
    },
    notificationType: {
      type: String,
      enum: [
        'INTERN_CREATED',
        'PROJECT_ASSIGNED',
        'PROJECT_UPDATED',
        'REPORT_SUBMITTED',
        'REPORT_APPROVED',
        'REPORT_REJECTED',
        'GENERAL'
      ],
      default: 'GENERAL'
    },
    relatedProjectId: {
      type: String,
      default: ''
    },
    relatedReportId: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
