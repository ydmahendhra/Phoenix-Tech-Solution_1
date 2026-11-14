const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    projectName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    objectives: {
      type: String,
      default: ''
    },
    requirements: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'Full Stack & Cloud'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    deadline: {
      type: Date
    },
    projectStatus: {
      type: String,
      enum: ['Planning', 'Active', 'In Progress', 'Under Review', 'Completed', 'On Hold'],
      default: 'Active'
    },
    referenceDocuments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    createdBy: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Project', projectSchema);
