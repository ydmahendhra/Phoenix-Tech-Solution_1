const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');
const Intern = require('../models/Intern');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

// Helper to auto-generate next sequential Project ID
const generateNextProjectId = async () => {
  const lastProject = await Project.findOne({ projectId: /^PTS-PRJ-/ }).sort({ createdAt: -1 });
  if (!lastProject) return 'PTS-PRJ-001';

  const parts = lastProject.projectId.split('-');
  const lastNum = parseInt(parts[2], 10);
  if (isNaN(lastNum)) return `PTS-PRJ-${Date.now().toString().slice(-3)}`;

  const nextNum = lastNum + 1;
  return `PTS-PRJ-${String(nextNum).padStart(3, '0')}`;
};

// Create Project
const createProject = async (req, res) => {
  try {
    const {
      projectName,
      description,
      objectives,
      requirements,
      category,
      startDate,
      deadline,
      projectStatus
    } = req.body;

    if (!projectName) {
      return res.status(400).json({ success: false, message: 'Project Name is required.' });
    }

    const projectId = await generateNextProjectId();

    const project = await Project.create({
      projectId,
      projectName: projectName.trim(),
      description: description ? description.trim() : '',
      objectives: objectives ? objectives.trim() : '',
      requirements: requirements ? requirements.trim() : '',
      category: category || 'Web & Cloud',
      startDate: startDate ? new Date(startDate) : new Date(),
      deadline: deadline ? new Date(deadline) : undefined,
      projectStatus: projectStatus || 'Active',
      createdBy: req.user.adminId || 'PTS-CEO-001'
    });

    await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      recipientId: 'ADMINS',
      recipientRole: 'admin',
      notificationTitle: 'New Project Initiated',
      notificationMessage: `Project "${project.projectName}" (${project.projectId}) was registered.`,
      notificationType: 'PROJECT_UPDATED',
      relatedProjectId: project.projectId
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      project
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create project: ' + error.message });
  }
};

// Get All Projects
const getAllProjects = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (status) filter.projectStatus = status;
    if (category) filter.category = category;
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ projectName: searchRegex }, { projectId: searchRegex }, { category: searchRegex }];
    }

    // If intern, only return projects assigned to them!
    if (req.user.role === 'intern') {
      const myAssignments = await ProjectAssignment.find({
        internId: req.user.internId,
        assignmentStatus: 'Active'
      });
      const myProjectIds = myAssignments.map((a) => a.projectId);
      filter.projectId = { $in: myProjectIds };
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    // Populate team member counts and average progress
    const populated = await Promise.all(
      projects.map(async (project) => {
        const assignments = await ProjectAssignment.find({
          projectId: project.projectId,
          assignmentStatus: 'Active'
        });
        const internIds = assignments.map((a) => a.internId);
        const interns = await Intern.find({ internId: { $in: internIds } }).select(
          'internId fullName designation profileImage department email'
        );

        // Average progress from approved or submitted reports
        const reports = await Report.find({ projectId: project.projectId });
        const avgProgress =
          reports.length > 0
            ? Math.round(reports.reduce((acc, r) => acc + (r.workProgress || 0), 0) / reports.length)
            : 0;

        const obj = project.toObject();
        obj.teamMembers = interns;
        obj.teamCount = interns.length;
        obj.progress = avgProgress;
        return obj;
      })
    );

    return res.status(200).json({ success: true, count: populated.length, projects: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Project Details by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ $or: [{ projectId: id }, { _id: id }] });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // If requester is intern, check if assigned
    if (req.user.role === 'intern') {
      const assignment = await ProjectAssignment.findOne({
        projectId: project.projectId,
        internId: req.user.internId,
        assignmentStatus: 'Active'
      });
      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned to this project.'
        });
      }
    }

    // Fetch team members
    const assignments = await ProjectAssignment.find({
      projectId: project.projectId,
      assignmentStatus: 'Active'
    });
    const internIds = assignments.map((a) => a.internId);
    const interns = await Intern.find({ internId: { $in: internIds } }).select(
      'internId fullName designation profileImage department email technicalSkills'
    );

    // Fetch reports for this project
    const reportFilter = { projectId: project.projectId };
    if (req.user.role === 'intern') {
      reportFilter.internId = req.user.internId;
    }
    const reports = await Report.find(reportFilter).sort({ submittedAt: -1 });

    const obj = project.toObject();
    obj.teamMembers = interns;
    obj.reports = reports;
    obj.progress =
      reports.length > 0
        ? Math.round(reports.reduce((acc, r) => acc + (r.workProgress || 0), 0) / reports.length)
        : 0;

    return res.status(200).json({ success: true, project: obj });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Project (Admin only)
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ $or: [{ projectId: id }, { _id: id }] });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const {
      projectName,
      description,
      objectives,
      requirements,
      category,
      startDate,
      deadline,
      projectStatus
    } = req.body;

    if (projectName) project.projectName = projectName.trim();
    if (description !== undefined) project.description = description.trim();
    if (objectives !== undefined) project.objectives = objectives.trim();
    if (requirements !== undefined) project.requirements = requirements.trim();
    if (category) project.category = category;
    if (startDate) project.startDate = new Date(startDate);
    if (deadline) project.deadline = new Date(deadline);
    if (projectStatus) project.projectStatus = projectStatus;

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Project details updated successfully.',
      project
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Project
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findOne({ $or: [{ projectId: id }, { _id: id }] });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Cascade delete assignments
    await ProjectAssignment.deleteMany({ projectId: project.projectId });
    await Project.deleteOne({ _id: project._id });

    return res.status(200).json({
      success: true,
      message: `Project "${project.projectName}" (${project.projectId}) deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject
};
