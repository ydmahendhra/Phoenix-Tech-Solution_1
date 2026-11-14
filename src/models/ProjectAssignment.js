const mongoose = require('mongoose');

const projectAssignmentSchema = new mongoose.Schema(
  {
    assignmentId: {
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
    assignedBy: {
      type: String,
      required: true
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    assignmentStatus: {
      type: String,
      enum: ['Active', 'Completed', 'Removed'],
      default: 'Active'
    }
  },
  {
    timestamps: true
  }
);

projectAssignmentSchema.index({ projectId: 1, internId: 1 }, { unique: true });

module.exports = mongoose.model('ProjectAssignment', projectAssignmentSchema);
