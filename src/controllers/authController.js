const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Intern = require('../models/Intern');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'phoenix_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Admin Login: supports Admin User ID, Username, or Email
const adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID / Email and password are required.'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Look up in Admin collection
    const admin = await Admin.findOne({
      $or: [
        { adminId: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
        { username: cleanIdentifier },
        { email: cleanIdentifier }
      ]
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    if (admin.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is deactivated. Contact system owner.'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.'
      });
    }

    const token = generateToken({
      id: admin._id,
      adminId: admin.adminId,
      username: admin.username,
      email: admin.email,
      role: 'admin'
    });

    return res.status(200).json({
      success: true,
      message: 'Administrator authentication successful.',
      token,
      user: {
        adminId: admin.adminId,
        name: admin.name,
        username: admin.username,
        email: admin.email,
        designation: admin.designation,
        department: admin.department,
        contactNumber: admin.contactNumber,
        profileImage: admin.profileImage,
        role: 'admin'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during administrator authentication: ' + error.message
    });
  }
};

// Intern Login: supports Intern ID, Username, or Email
const internLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Intern ID / Email and password are required.'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const intern = await Intern.findOne({
      $or: [
        { internId: { $regex: new RegExp(`^${identifier.trim()}$`, 'i') } },
        { username: cleanIdentifier },
        { email: cleanIdentifier }
      ]
    });

    if (!intern) {
      return res.status(401).json({
        success: false,
        message: 'Invalid intern credentials. Contact your Admin if you do not have an account.'
      });
    }

    if (intern.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Intern account is suspended or inactive. Please contact your supervisor.'
      });
    }

    const isMatch = await bcrypt.compare(password, intern.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid intern credentials.'
      });
    }

    const token = generateToken({
      id: intern._id,
      internId: intern.internId,
      username: intern.username,
      email: intern.email,
      role: 'intern'
    });

    return res.status(200).json({
      success: true,
      message: 'Intern authentication successful.',
      token,
      user: {
        internId: intern.internId,
        fullName: intern.fullName,
        username: intern.username,
        email: intern.email,
        phoneNumber: intern.phoneNumber,
        designation: intern.designation,
        department: intern.department,
        collegeName: intern.collegeName,
        profileImage: intern.profileImage,
        technicalSkills: intern.technicalSkills,
        areaOfInterest: intern.areaOfInterest,
        internshipStartDate: intern.internshipStartDate,
        internshipEndDate: intern.internshipEndDate,
        role: 'intern'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during intern authentication: ' + error.message
    });
  }
};

// Check currently authenticated user
const getMe = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const admin = await Admin.findOne({ adminId: req.user.adminId }).select('-passwordHash');
      return res.status(200).json({ success: true, user: admin, role: 'admin' });
    } else {
      const intern = await Intern.findOne({ internId: req.user.internId }).select('-passwordHash');
      return res.status(200).json({ success: true, user: intern, role: 'intern' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Signed out successfully.'
  });
};

module.exports = {
  adminLogin,
  internLogin,
  getMe,
  logout
};
