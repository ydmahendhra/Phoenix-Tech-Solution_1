const Admin = require('../models/Admin');
const Intern = require('../models/Intern');
const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

// Admin Profile
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ adminId: req.user.adminId }).select('-passwordHash');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin record not found.' });
    }
    return res.status(200).json({ success: true, admin });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const { name, contactNumber, designation, department, profileImage } = req.body;
    const admin = await Admin.findOne({ adminId: req.user.adminId });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    if (name) admin.name = name.trim();
    if (contactNumber) admin.contactNumber = contactNumber.trim();
    if (designation) admin.designation = designation.trim();
    if (department) admin.department = department.trim();
    if (profileImage !== undefined) admin.profileImage = profileImage;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully.',
      admin: admin.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Overview Statistics
const getOverviewStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({
      projectStatus: { $in: ['Active', 'In Progress', 'Planning'] }
    });
    const completedProjects = await Project.countDocuments({ projectStatus: 'Completed' });

    const totalInterns = await Intern.countDocuments({ accountStatus: 'active' });

    // Distinct assigned interns
    const assignedInternIds = await ProjectAssignment.distinct('internId', {
      assignmentStatus: 'Active'
    });
    const assignedInterns = assignedInternIds.length;
    const availableInterns = Math.max(0, totalInterns - assignedInterns);

    const pendingReports = await Report.countDocuments({
      submissionStatus: { $in: ['Submitted', 'Under Review'] }
    });
    const submittedReports = await Report.countDocuments({
      submissionStatus: { $ne: 'Draft' }
    });

    const unreadNotifications = await Notification.countDocuments({
      recipientRole: { $in: ['admin', 'all'] },
      isRead: false
    });

    return res.status(200).json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalInterns,
        availableInterns,
        assignedInterns,
        pendingReports,
        submittedReports,
        unreadNotifications
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Activity & Logs
const getActivityLogs = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientRole: { $in: ['admin', 'all'] }
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const recentReports = await Report.find({})
      .sort({ submittedAt: -1 })
      .limit(10);

    const recentProjects = await Project.find({})
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        recentReports,
        recentProjects
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  getOverviewStats,
  getActivityLogs
};
