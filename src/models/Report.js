const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    projectId: {
      type: String,
      required: true,
      index: true
    },
    internId: {
      type: String,
      required: true,
      index: true
    },
    month: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    weekNumber: {
      type: Number,
      required: true
    },
    weekStartDate: {
      type: Date
    },
    weekEndDate: {
      type: Date
    },
    reportTitle: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    workSummary: {
      type: String,
      default: ''
    },
    completedActivities: {
      type: String,
      default: ''
    },
    workProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    challengesFaced: {
      type: String,
      default: ''
    },
    nextWeekPlan: {
      type: String,
      default: ''
    },
    additionalComments: {
      type: String,
      default: ''
    },
    uploadedFiles: [
      {
        fileId: String,
        originalFileName: String,
        storedFileName: String,
        fileUrl: String,
        contentType: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    submissionStatus: {
      type: String,
      enum: ['Not Submitted', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'],
      default: 'Submitted',
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: String,
      default: ''
    },
    reviewComments: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ projectId: 1, internId: 1, year: 1, month: 1, weekNumber: 1 });

module.exports = mongoose.model('Report', reportSchema);
