const ProjectAssignment = require('../models/ProjectAssignment');
const Project = require('../models/Project');
const Intern = require('../models/Intern');
const Notification = require('../models/Notification');
const { sendProjectAssignmentEmail } = require('../services/emailService');

// Assign one or multiple Interns to a Project
const assignProject = async (req, res) => {
  try {
    const { projectId, internIds } = req.body;

    if (!projectId || !internIds || !Array.isArray(internIds) || internIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project ID and at least one Intern ID are required.'
      });
    }

    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const assignedResults = [];
    const emailResults = [];

    for (const internId of internIds) {
      const intern = await Intern.findOne({ internId, accountStatus: 'active' });
      if (!intern) continue;

      // Check if already assigned
      let assignment = await ProjectAssignment.findOne({ projectId, internId });
      if (!assignment) {
        assignment = await ProjectAssignment.create({
          assignmentId: `ASG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          projectId,
          internId,
          assignedBy: req.user.name || req.user.adminId || 'Admin',
          assignedDate: new Date(),
          assignmentStatus: 'Active'
        });
      } else {
        assignment.assignmentStatus = 'Active';
        await assignment.save();
      }

      assignedResults.push({
        assignmentId: assignment.assignmentId,
        internId: intern.internId,
        fullName: intern.fullName,
        email: intern.email
      });

      // In-app Notification for the Intern
      await Notification.create({
        notificationId: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        recipientId: intern.internId,
        recipientRole: 'intern',
        notificationTitle: 'New Project Assigned!',
        notificationMessage: `You have been assigned to "${project.projectName}" (${project.projectId}) by ${req.user.name}.`,
        notificationType: 'PROJECT_ASSIGNED',
        relatedProjectId: project.projectId
      });

      // Dispatch automated assignment email notification
      try {
        const emailLog = await sendProjectAssignmentEmail({
          intern,
          project,
          adminName: req.user.name || 'Administrator'
        });
        emailResults.push({
          internId: intern.internId,
          email: intern.email,
          status: emailLog.deliveryStatus
        });
      } catch (err) {
        console.error(`Email dispatch error for ${intern.email}:`, err);
        emailResults.push({
          internId: intern.internId,
          email: intern.email,
          status: 'FAILED',
          error: err.message
        });
      }
    }

    // Notify admins
    await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      recipientId: 'ADMINS',
      recipientRole: 'admin',
      notificationTitle: 'Project Assignment Completed',
      notificationMessage: `${assignedResults.length} intern(s) assigned to project "${project.projectName}".`,
      notificationType: 'PROJECT_ASSIGNED',
      relatedProjectId: project.projectId
    });

    return res.status(200).json({
      success: true,
      message: `Successfully assigned ${assignedResults.length} intern(s) to "${project.projectName}".`,
      assignments: assignedResults,
      emailNotifications: emailResults
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to assign project: ' + error.message
    });
  }
};

// Get All Assignments
const getAllAssignments = async (req, res) => {
  try {
    const assignments = await ProjectAssignment.find({ assignmentStatus: 'Active' }).sort({ assignedDate: -1 });

    const populated = await Promise.all(
      assignments.map(async (a) => {
        const project = await Project.findOne({ projectId: a.projectId });
        const intern = await Intern.findOne({ internId: a.internId });
        return {
          ...a.toObject(),
          projectName: project ? project.projectName : 'Unknown',
          projectCategory: project ? project.category : 'N/A',
          internName: intern ? intern.fullName : 'Unknown',
          internEmail: intern ? intern.email : 'Unknown',
          internDesignation: intern ? intern.designation : 'N/A',
          internAvatar: intern ? intern.profileImage : ''
        };
      })
    );

    return res.status(200).json({ success: true, count: populated.length, assignments: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Remove Assignment (Remove member from project)
const removeAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await ProjectAssignment.findOne({
      $or: [{ assignmentId: id }, { _id: id }]
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment record not found.' });
    }

    await ProjectAssignment.deleteOne({ _id: assignment._id });

    return res.status(200).json({
      success: true,
      message: 'Team member removed from project successfully.'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  assignProject,
  getAllAssignments,
  removeAssignment
};
