const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Intern = require('../models/Intern');
const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { uploadToGridFS } = require('../services/fileService');

// Safe query builder to prevent Mongoose CastError on custom string IDs like PTS-INT-001
const getInternQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ internId: id }, { _id: id }] };
  }
  return { internId: id };
};

// Helper to auto-generate next sequential Intern ID: PTS-INT-001, PTS-INT-002...
const generateNextInternId = async () => {
  const lastIntern = await Intern.findOne({ internId: /^PTS-INT-/ }).sort({ createdAt: -1 });
  if (!lastIntern) return 'PTS-INT-001';

  const parts = lastIntern.internId.split('-');
  const lastNum = parseInt(parts[2], 10);
  if (isNaN(lastNum)) return `PTS-INT-${Date.now().toString().slice(-3)}`;

  const nextNum = lastNum + 1;
  return `PTS-INT-${String(nextNum).padStart(3, '0')}`;
};

// Create Intern
const createIntern = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      collegeName,
      department,
      degree,
      yearOfStudy,
      graduationYear,
      designation,
      areaOfInterest,
      technicalSkills,
      customInterests,
      customSkills,
      internshipStartDate,
      internshipEndDate
    } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Username, Email, and Password are required.'
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    const existing = await Intern.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.username === cleanUsername ? 'Username already in use.' : 'Email address already registered.'
      });
    }

    const internId = await generateNextInternId();
    const passwordHash = await bcrypt.hash(password, 10);

    let profileImageUrl = '';
    if (req.file) {
      const uploadRes = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { internId, type: 'avatar' }
      );
      profileImageUrl = uploadRes.fileUrl;
    }

    const newIntern = await Intern.create({
      internId,
      fullName: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      profileImage: profileImageUrl,
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: gender || '',
      address: address ? address.trim() : '',
      collegeName: collegeName ? collegeName.trim() : '',
      department: department ? department.trim() : '',
      degree: degree ? degree.trim() : '',
      yearOfStudy: yearOfStudy || '',
      graduationYear: graduationYear || '',
      designation: designation || 'Software Development Intern',
      areaOfInterest: Array.isArray(areaOfInterest) ? areaOfInterest : (areaOfInterest ? [areaOfInterest] : []),
      technicalSkills: Array.isArray(technicalSkills) ? technicalSkills : (technicalSkills ? [technicalSkills] : []),
      customInterests: Array.isArray(customInterests) ? customInterests : (customInterests ? [customInterests] : []),
      customSkills: Array.isArray(customSkills) ? customSkills : (customSkills ? [customSkills] : []),
      internshipStartDate: internshipStartDate ? new Date(internshipStartDate) : undefined,
      internshipEndDate: internshipEndDate ? new Date(internshipEndDate) : undefined,
      createdBy: req.user.adminId || 'PTS-CEO-001'
    });

    await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      recipientId: 'ADMINS',
      recipientRole: 'admin',
      notificationTitle: 'New Intern Account Registered',
      notificationMessage: `${newIntern.fullName} (${newIntern.internId}) registered under ${newIntern.designation}.`,
      notificationType: 'INTERN_CREATED'
    });

    return res.status(201).json({
      success: true,
      message: 'Intern account created successfully.',
      intern: newIntern.toJSON()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create intern account: ' + error.message
    });
  }
};

// Get All Interns
const getAllInterns = async (req, res) => {
  try {
    const { search, designation, status, department } = req.query;
    const filter = {};

    if (status) filter.accountStatus = status;
    if (designation) filter.designation = designation;
    if (department) filter.department = { $regex: department, $options: 'i' };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { internId: searchRegex },
        { email: searchRegex },
        { username: searchRegex },
        { technicalSkills: { $in: [searchRegex] } },
        { areaOfInterest: { $in: [searchRegex] } }
      ];
    }

    const interns = await Intern.find(filter).sort({ createdAt: -1 });

    const populated = await Promise.all(
      interns.map(async (intern) => {
        const activeAssignments = await ProjectAssignment.countDocuments({
          internId: intern.internId,
          assignmentStatus: 'Active'
        });

        const obj = intern.toJSON();
        obj.activeProjectsCount = activeAssignments;
        obj.availabilityStatus = activeAssignments > 0 ? 'Assigned' : 'Available';
        return obj;
      })
    );

    return res.status(200).json({ success: true, count: populated.length, interns: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Intern by ID
const getInternById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getInternQuery(id);
    const intern = await Intern.findOne(query);

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern profile not found.' });
    }

    if (req.user.role === 'intern' && req.user.internId !== intern.internId) {
      return res.status(403).json({ success: false, message: 'Unauthorized profile access.' });
    }

    const assignments = await ProjectAssignment.find({
      internId: intern.internId,
      assignmentStatus: 'Active'
    });
    const projectIds = assignments.map((a) => a.projectId);
    const projects = await Project.find({ projectId: { $in: projectIds } });

    const reports = await Report.find({ internId: intern.internId }).sort({ submittedAt: -1 });

    const internObj = intern.toJSON();
    internObj.projects = projects;
    internObj.reports = reports;

    return res.status(200).json({ success: true, intern: internObj });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Intern
const updateIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getInternQuery(id);
    const intern = await Intern.findOne(query);

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    if (req.user.role === 'intern') {
      if (req.user.internId !== intern.internId) {
        return res.status(403).json({ success: false, message: 'Unauthorized update.' });
      }
      const { phoneNumber, address } = req.body;
      if (phoneNumber !== undefined) intern.phoneNumber = phoneNumber.trim();
      if (address !== undefined) intern.address = address.trim();
      await intern.save();
      return res.status(200).json({ success: true, message: 'Profile updated.', intern: intern.toJSON() });
    }

    const {
      fullName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      collegeName,
      department,
      degree,
      yearOfStudy,
      graduationYear,
      designation,
      areaOfInterest,
      technicalSkills,
      customInterests,
      customSkills,
      internshipStartDate,
      internshipEndDate,
      accountStatus
    } = req.body;

    if (fullName) intern.fullName = fullName.trim();
    if (email) intern.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) intern.phoneNumber = phoneNumber.trim();
    if (dateOfBirth) intern.dateOfBirth = new Date(dateOfBirth);
    if (gender) intern.gender = gender;
    if (address !== undefined) intern.address = address.trim();
    if (collegeName !== undefined) intern.collegeName = collegeName.trim();
    if (department !== undefined) intern.department = department.trim();
    if (degree !== undefined) intern.degree = degree.trim();
    if (yearOfStudy !== undefined) intern.yearOfStudy = yearOfStudy;
    if (graduationYear !== undefined) intern.graduationYear = graduationYear;
    if (designation) intern.designation = designation;
    if (areaOfInterest) intern.areaOfInterest = Array.isArray(areaOfInterest) ? areaOfInterest : [areaOfInterest];
    if (technicalSkills) intern.technicalSkills = Array.isArray(technicalSkills) ? technicalSkills : [technicalSkills];
    if (customInterests) intern.customInterests = Array.isArray(customInterests) ? customInterests : [customInterests];
    if (customSkills) intern.customSkills = Array.isArray(customSkills) ? customSkills : [customSkills];
    if (internshipStartDate) intern.internshipStartDate = new Date(internshipStartDate);
    if (internshipEndDate) intern.internshipEndDate = new Date(internshipEndDate);
    if (accountStatus) intern.accountStatus = accountStatus;

    if (req.file) {
      const uploadRes = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        { internId: intern.internId, type: 'avatar' }
      );
      intern.profileImage = uploadRes.fileUrl;
    }

    await intern.save();

    return res.status(200).json({
      success: true,
      message: 'Intern details updated successfully.',
      intern: intern.toJSON()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reset Password (Admin only)
const resetInternPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getInternQuery(id);
    const intern = await Intern.findOne(query);

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    intern.passwordHash = await bcrypt.hash(newPassword, 10);
    await intern.save();

    return res.status(200).json({
      success: true,
      message: `Password for ${intern.fullName} (${intern.internId}) has been successfully reset.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Intern (Admin only)
const deleteIntern = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getInternQuery(id);
    const intern = await Intern.findOne(query);

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    // Cascade remove assignments and reports
    await ProjectAssignment.deleteMany({ internId: intern.internId });
    await Report.deleteMany({ internId: intern.internId });
    await Intern.deleteOne({ _id: intern._id });

    return res.status(200).json({
      success: true,
      message: `Intern ${intern.fullName} (${intern.internId}) has been permanently removed.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Upload Avatar
const uploadInternAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    const query = getInternQuery(id);
    const intern = await Intern.findOne(query);

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const uploadRes = await uploadToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { internId: intern.internId, type: 'avatar' }
    );

    intern.profileImage = uploadRes.fileUrl;
    await intern.save();

    return res.status(200).json({
      success: true,
      message: 'Profile image updated successfully.',
      profileImage: intern.profileImage
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createIntern,
  getAllInterns,
  getInternById,
  updateIntern,
  resetInternPassword,
  deleteIntern,
  uploadInternAvatar
};
