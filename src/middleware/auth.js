const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Intern = require('../models/Intern');

const verifyToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'phoenix_secret');

    if (decoded.role === 'admin') {
      const admin = await Admin.findOne({ adminId: decoded.adminId, accountStatus: 'active' });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid or inactive admin account.' });
      }
      req.user = {
        _id: admin._id,
        adminId: admin.adminId,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        designation: admin.designation,
        role: 'admin'
      };
    } else if (decoded.role === 'intern') {
      const intern = await Intern.findOne({ internId: decoded.internId, accountStatus: 'active' });
      if (!intern) {
        return res.status(401).json({ success: false, message: 'Invalid or inactive intern account.' });
      }
      req.user = {
        _id: intern._id,
        internId: intern.internId,
        username: intern.username,
        email: intern.email,
        fullName: intern.fullName,
        designation: intern.designation,
        role: 'intern'
      };
    } else {
      return res.status(401).json({ success: false, message: 'Unrecognized user role.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not possess the required permissions.'
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
