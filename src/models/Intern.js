const mongoose = require('mongoose');

const internSchema = new mongoose.Schema(
  {
    internId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    profileImage: {
      type: String,
      default: ''
    },
    phoneNumber: {
      type: String,
      default: ''
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    collegeName: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    degree: {
      type: String,
      default: ''
    },
    yearOfStudy: {
      type: String,
      default: ''
    },
    graduationYear: {
      type: String,
      default: ''
    },
    designation: {
      type: String,
      default: 'Software Development Intern'
    },
    areaOfInterest: {
      type: [String],
      default: []
    },
    technicalSkills: {
      type: [String],
      default: []
    },
    customInterests: {
      type: [String],
      default: []
    },
    customSkills: {
      type: [String],
      default: []
    },
    internshipStartDate: {
      type: Date
    },
    internshipEndDate: {
      type: Date
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    createdBy: {
      type: String,
      default: 'PTS-CEO-001'
    }
  },
  {
    timestamps: true
  }
);

internSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Intern', internSchema);
