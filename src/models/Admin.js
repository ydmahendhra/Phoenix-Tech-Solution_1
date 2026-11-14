const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
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
    contactNumber: {
      type: String,
      default: ''
    },
    designation: {
      type: String,
      default: 'Administrator'
    },
    department: {
      type: String,
      default: 'Executive Board'
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin'
    },
    accountStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Method to remove sensitive password hash when returning JSON
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
