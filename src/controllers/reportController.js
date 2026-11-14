const Report = require('../models/Report');
const Project = require('../models/Project');
const Intern = require('../models/Intern');
const Notification = require('../models/Notification');
const { uploadToGridFS } = require('../services/fileService');

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

// Calculate calendar weeks for a given month & year dynamically
const calculateWeeksForMonth = (year, monthIndex) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks = [];

  let currentDay = 1;
  let weekNumber = 1;

  while (currentDay <= daysInMonth) {
    const startDay = currentDay;
    const endDay = Math.min(currentDay + 6, daysInMonth);

    const startDate = new Date(year, monthIndex, startDay);
    const endDate = new Date(year, monthIndex, endDay, 23, 59, 59);

    weeks.push({
      weekNumber,
      label: `Week ${weekNumber} (${MONTH_NAMES[monthIndex]} ${startDay} – ${MONTH_NAMES[monthIndex]} ${endDay})`,
      startDate,
      endDate
    });

    currentDay = endDay + 1;
    weekNumber++;
  }

  return weeks;
};

// API: Dynamic Calendar breakdown
const getReportingCalendar = async (req, res) => {
  try {
    const year = parseInt(req.params.year || new Date().getFullYear(), 10);
    const monthQuery = req.params.month;

    let monthIndex = new Date().getMonth();
    if (monthQuery) {
      if (!isNaN(parseInt(monthQuery, 10))) {
        monthIndex = parseInt(monthQuery, 10) - 1;
      } else {
        const found = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthQuery.toLowerCase());
        if (found !== -1) monthIndex = found;
      }
    }

    const weeks = calculateWeeksForMonth(year, monthIndex);
    return res.status(200).json({
      success: true,
      year,
      month: MONTH_NAMES[monthIndex],
      monthIndex: monthIndex + 1,
      weeks
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Submit / Save Report
const submitReport = async (req, res) => {
  try {
    const internId = req.user.role === 'intern' ? req.user.internId : req.body.internId;
    const {
      projectId,
      month,
      year,
      weekNumber,
      reportTitle,
      description,
      workSummary,
      completedActivities,
      workProgress,
      challengesFaced,
      nextWeekPlan,
      additionalComments,
      submissionStatus // 'Draft' or 'Submitted'
    } = req.body;

    if (!projectId || !month || !year || !weekNumber || !reportTitle) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, Month, Year, Week Number, and Report Title are mandatory.'
      });
    }

    const project = await Project.findOne({ projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const intern = await Intern.findOne({ internId });
    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern profile not found.' });
    }

    // Check existing report for same project, intern, year, month, week
    let report = await Report.findOne({
      projectId,
      internId,
      year: parseInt(year, 10),
      month,
      weekNumber: parseInt(weekNumber, 10)
    });

    const isNew = !report;
    const reportId = report ? report.reportId : `REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const uploadedFiles = report ? [...report.uploadedFiles] : [];

    // Process file uploads if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadRes = await uploadToGridFS(
          file.buffer,
          file.originalname,
          file.mimetype,
          { reportId, internId, projectId }
        );
        uploadedFiles.push({
          fileId: uploadRes.fileId,
          originalFileName: file.originalname,
          storedFileName: uploadRes.storedFileName,
          fileUrl: uploadRes.fileUrl,
          contentType: file.mimetype,
          fileSize: file.size,
          uploadedAt: new Date()
        });
      }
    }

    const status = submissionStatus === 'Draft' ? 'Draft' : 'Submitted';

    if (isNew) {
      report = await Report.create({
        reportId,
        projectId,
        internId,
        month,
        year: parseInt(year, 10),
        weekNumber: parseInt(weekNumber, 10),
        reportTitle: reportTitle.trim(),
        description: description ? description.trim() : '',
        workSummary: workSummary ? workSummary.trim() : '',
        completedActivities: completedActivities ? completedActivities.trim() : '',
        workProgress: workProgress ? parseInt(workProgress, 10) : 0,
        challengesFaced: challengesFaced ? challengesFaced.trim() : '',
        nextWeekPlan: nextWeekPlan ? nextWeekPlan.trim() : '',
        additionalComments: additionalComments ? additionalComments.trim() : '',
        uploadedFiles,
        submissionStatus: status,
        submittedAt: new Date()
      });
    } else {
      report.reportTitle = reportTitle.trim();
      report.description = description ? description.trim() : report.description;
      report.workSummary = workSummary ? workSummary.trim() : report.workSummary;
      report.completedActivities = completedActivities ? completedActivities.trim() : report.completedActivities;
      report.workProgress = workProgress !== undefined ? parseInt(workProgress, 10) : report.workProgress;
      report.challengesFaced = challengesFaced !== undefined ? challengesFaced.trim() : report.challengesFaced;
      report.nextWeekPlan = nextWeekPlan !== undefined ? nextWeekPlan.trim() : report.nextWeekPlan;
      report.additionalComments = additionalComments !== undefined ? additionalComments.trim() : report.additionalComments;
      report.uploadedFiles = uploadedFiles;
      report.submissionStatus = status;
      report.submittedAt = new Date();
      await report.save();
    }

    // If submitted, notify admins automatically
    if (status === 'Submitted') {
      await Notification.create({
        notificationId: `NOTIF-${Date.now()}`,
        recipientId: 'ADMINS',
        recipientRole: 'admin',
        notificationTitle: 'New Weekly Report Submitted',
        notificationMessage: `${intern.fullName} (${intern.internId}) submitted Week ${weekNumber} (${month} ${year}) report for "${project.projectName}".`,
        notificationType: 'REPORT_SUBMITTED',
        relatedProjectId: project.projectId,
        relatedReportId: report.reportId
      });
    }

    return res.status(200).json({
      success: true,
      message: status === 'Draft' ? 'Report saved as draft.' : 'Report submitted successfully.',
      report
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report: ' + error.message
    });
  }
};

// Get All Reports (for Admin, with filters)
const getAllReports = async (req, res) => {
  try {
    const { projectId, internId, month, year, weekNumber, status } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (internId) filter.internId = internId;
    if (month) filter.month = month;
    if (year) filter.year = parseInt(year, 10);
    if (weekNumber) filter.weekNumber = parseInt(weekNumber, 10);
    if (status) filter.submissionStatus = status;

    // If intern role, strictly enforce self internId
    if (req.user.role === 'intern') {
      filter.internId = req.user.internId;
    }

    const reports = await Report.find(filter).sort({ submittedAt: -1 });

    const populated = await Promise.all(
      reports.map(async (r) => {
        const project = await Project.findOne({ projectId: r.projectId }).select('projectName category');
        const intern = await Intern.findOne({ internId: r.internId }).select(
          'fullName email designation profileImage'
        );
        return {
          ...r.toObject(),
          projectName: project ? project.projectName : 'Unknown',
          projectCategory: project ? project.category : 'N/A',
          internName: intern ? intern.fullName : 'Unknown',
          internEmail: intern ? intern.email : 'Unknown',
          internDesignation: intern ? intern.designation : 'N/A',
          internAvatar: intern ? intern.profileImage : ''
        };
      })
    );

    return res.status(200).json({ success: true, count: populated.length, reports: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Report
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findOne({ $or: [{ reportId: id }, { _id: id }] });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (req.user.role === 'intern' && req.user.internId !== report.internId) {
      return res.status(403).json({ success: false, message: 'Unauthorized report access.' });
    }

    const project = await Project.findOne({ projectId: report.projectId });
    const intern = await Intern.findOne({ internId: report.internId });

    return res.status(200).json({
      success: true,
      report: {
        ...report.toObject(),
        projectName: project ? project.projectName : 'Unknown',
        internName: intern ? intern.fullName : 'Unknown',
        internEmail: intern ? intern.email : 'Unknown',
        internDesignation: intern ? intern.designation : 'N/A',
        internAvatar: intern ? intern.profileImage : ''
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Review Report (Approve / Reject / Under Review with Comments)
const reviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    if (!['Approved', 'Rejected', 'Under Review'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Approved, Rejected, Under Review.'
      });
    }

    const report = await Report.findOne({ $or: [{ reportId: id }, { _id: id }] });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.submissionStatus = status;
    report.reviewComments = comments || '';
    report.reviewedBy = req.user.name || req.user.adminId || 'Admin';
    report.reviewedAt = new Date();
    await report.save();

    // Notify the intern
    await Notification.create({
      notificationId: `NOTIF-${Date.now()}`,
      recipientId: report.internId,
      recipientRole: 'intern',
      notificationTitle: `Report ${status}: ${report.reportTitle}`,
      notificationMessage: `Your Week ${report.weekNumber} report has been ${status.toLowerCase()} by ${report.reviewedBy}. Feedback: "${comments || 'No specific feedback.'}"`,
      notificationType: status === 'Approved' ? 'REPORT_APPROVED' : 'REPORT_REJECTED',
      relatedProjectId: report.projectId,
      relatedReportId: report.reportId
    });

    return res.status(200).json({
      success: true,
      message: `Report status updated to ${status}.`,
      report
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getReportingCalendar,
  submitReport,
  getAllReports,
  getReportById,
  reviewReport
};
