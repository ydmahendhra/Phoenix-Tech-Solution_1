const ExcelJS = require('exceljs');
const Intern = require('../models/Intern');
const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');
const Report = require('../models/Report');

const styleHeaderRow = (row, color = '4F46E5') => {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });
  row.height = 24;
};

const styleDataRow = (row) => {
  row.eachCell((cell) => {
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'E2E8F0' } },
      left: { style: 'thin', color: { argb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
      right: { style: 'thin', color: { argb: 'E2E8F0' } }
    };
  });
  row.height = 20;
};

// 1. Export Interns
const generateInternsExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const sheet = workbook.addWorksheet('Interns Directory');

  sheet.columns = [
    { header: 'Intern ID', key: 'internId', width: 15 },
    { header: 'Full Name', key: 'fullName', width: 22 },
    { header: 'Designation', key: 'designation', width: 26 },
    { header: 'Email Address', key: 'email', width: 28 },
    { header: 'Phone Number', key: 'phoneNumber', width: 16 },
    { header: 'College / University', key: 'collegeName', width: 28 },
    { header: 'Department', key: 'department', width: 22 },
    { header: 'Degree', key: 'degree', width: 16 },
    { header: 'Year', key: 'yearOfStudy', width: 12 },
    { header: 'Technical Skills', key: 'skills', width: 35 },
    { header: 'Areas of Interest', key: 'interests', width: 35 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'End Date', key: 'endDate', width: 15 },
    { header: 'Account Status', key: 'status', width: 14 }
  ];

  styleHeaderRow(sheet.getRow(1), '4338CA');

  const interns = await Intern.find({}).sort({ internId: 1 });
  interns.forEach((intern) => {
    const row = sheet.addRow({
      internId: intern.internId,
      fullName: intern.fullName,
      designation: intern.designation,
      email: intern.email,
      phoneNumber: intern.phoneNumber || 'N/A',
      collegeName: intern.collegeName || 'N/A',
      department: intern.department || 'N/A',
      degree: intern.degree || 'N/A',
      yearOfStudy: intern.yearOfStudy || 'N/A',
      skills: (intern.technicalSkills || []).concat(intern.customSkills || []).join(', '),
      interests: (intern.areaOfInterest || []).concat(intern.customInterests || []).join(', '),
      startDate: intern.internshipStartDate ? new Date(intern.internshipStartDate).toISOString().split('T')[0] : 'N/A',
      endDate: intern.internshipEndDate ? new Date(intern.internshipEndDate).toISOString().split('T')[0] : 'N/A',
      status: intern.accountStatus.toUpperCase()
    });
    styleDataRow(row);
  });

  return workbook;
};

// 2. Export Projects
const generateProjectsExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const sheet = workbook.addWorksheet('Projects Directory');

  sheet.columns = [
    { header: 'Project ID', key: 'projectId', width: 16 },
    { header: 'Project Name', key: 'projectName', width: 30 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Start Date', key: 'startDate', width: 15 },
    { header: 'Deadline', key: 'deadline', width: 15 },
    { header: 'Assigned Interns', key: 'internCount', width: 18 },
    { header: 'Description', key: 'description', width: 45 }
  ];

  styleHeaderRow(sheet.getRow(1), '059669');

  const projects = await Project.find({}).sort({ createdAt: -1 });
  for (const project of projects) {
    const assignedCount = await ProjectAssignment.countDocuments({
      projectId: project.projectId,
      assignmentStatus: 'Active'
    });
    const row = sheet.addRow({
      projectId: project.projectId,
      projectName: project.projectName,
      category: project.category,
      status: project.projectStatus,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : 'N/A',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : 'N/A',
      internCount: assignedCount,
      description: project.description
    });
    styleDataRow(row);
  }

  return workbook;
};

// 3. Export Assignments
const generateAssignmentsExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const sheet = workbook.addWorksheet('Project Assignments');

  sheet.columns = [
    { header: 'Assignment ID', key: 'assignmentId', width: 18 },
    { header: 'Project ID', key: 'projectId', width: 16 },
    { header: 'Project Name', key: 'projectName', width: 30 },
    { header: 'Intern ID', key: 'internId', width: 16 },
    { header: 'Intern Name', key: 'internName', width: 24 },
    { header: 'Intern Email', key: 'internEmail', width: 28 },
    { header: 'Assigned By', key: 'assignedBy', width: 18 },
    { header: 'Assigned Date', key: 'assignedDate', width: 16 },
    { header: 'Status', key: 'status', width: 14 }
  ];

  styleHeaderRow(sheet.getRow(1), 'D97706');

  const assignments = await ProjectAssignment.find({}).sort({ assignedDate: -1 });
  for (const a of assignments) {
    const project = await Project.findOne({ projectId: a.projectId });
    const intern = await Intern.findOne({ internId: a.internId });

    const row = sheet.addRow({
      assignmentId: a.assignmentId,
      projectId: a.projectId,
      projectName: project ? project.projectName : 'Unknown',
      internId: a.internId,
      internName: intern ? intern.fullName : 'Unknown',
      internEmail: intern ? intern.email : 'Unknown',
      assignedBy: a.assignedBy,
      assignedDate: a.assignedDate ? new Date(a.assignedDate).toISOString().split('T')[0] : 'N/A',
      status: a.assignmentStatus
    });
    styleDataRow(row);
  }

  return workbook;
};

// 4. Export Weekly Reports
const generateWeeklyReportsExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const sheet = workbook.addWorksheet('Weekly Reports');

  sheet.columns = [
    { header: 'Report ID', key: 'reportId', width: 16 },
    { header: 'Project ID', key: 'projectId', width: 14 },
    { header: 'Intern ID', key: 'internId', width: 14 },
    { header: 'Intern Name', key: 'internName', width: 22 },
    { header: 'Period', key: 'period', width: 20 },
    { header: 'Report Title', key: 'reportTitle', width: 28 },
    { header: 'Progress (%)', key: 'progress', width: 14 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Submitted At', key: 'submittedAt', width: 16 },
    { header: 'Work Summary', key: 'workSummary', width: 45 },
    { header: 'Admin Comments', key: 'reviewComments', width: 35 }
  ];

  styleHeaderRow(sheet.getRow(1), '2563EB');

  const reports = await Report.find({}).sort({ submittedAt: -1 });
  for (const r of reports) {
    const intern = await Intern.findOne({ internId: r.internId });
    const row = sheet.addRow({
      reportId: r.reportId,
      projectId: r.projectId,
      internId: r.internId,
      internName: intern ? intern.fullName : 'N/A',
      period: `${r.month} ${r.year} - Week ${r.weekNumber}`,
      reportTitle: r.reportTitle,
      progress: `${r.workProgress}%`,
      status: r.submissionStatus,
      submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString().split('T')[0] : 'N/A',
      workSummary: r.workSummary,
      reviewComments: r.reviewComments || 'None'
    });
    styleDataRow(row);
  }

  return workbook;
};

// 5. Export Monthly Summary
const generateMonthlyReportsExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Tech Solutions';
  const sheet = workbook.addWorksheet('Monthly Summary');

  sheet.columns = [
    { header: 'Intern ID', key: 'internId', width: 14 },
    { header: 'Intern Name', key: 'internName', width: 22 },
    { header: 'Project ID', key: 'projectId', width: 14 },
    { header: 'Month & Year', key: 'monthYear', width: 18 },
    { header: 'Total Reports', key: 'total', width: 15 },
    { header: 'Approved', key: 'approved', width: 12 },
    { header: 'Pending / Review', key: 'pending', width: 18 },
    { header: 'Rejected', key: 'rejected', width: 12 }
  ];

  styleHeaderRow(sheet.getRow(1), '7C3AED');

  const reports = await Report.find({});
  const summaryMap = {};

  for (const r of reports) {
    const key = `${r.internId}_${r.projectId}_${r.month}_${r.year}`;
    if (!summaryMap[key]) {
      const intern = await Intern.findOne({ internId: r.internId });
      summaryMap[key] = {
        internId: r.internId,
        internName: intern ? intern.fullName : 'Unknown',
        projectId: r.projectId,
        monthYear: `${r.month} ${r.year}`,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      };
    }
    summaryMap[key].total += 1;
    if (r.submissionStatus === 'Approved') summaryMap[key].approved += 1;
    else if (r.submissionStatus === 'Rejected') summaryMap[key].rejected += 1;
    else summaryMap[key].pending += 1;
  }

  Object.values(summaryMap).forEach((item) => {
    const row = sheet.addRow(item);
    styleDataRow(row);
  });

  return workbook;
};

module.exports = {
  generateInternsExcel,
  generateProjectsExcel,
  generateAssignmentsExcel,
  generateWeeklyReportsExcel,
  generateMonthlyReportsExcel
};
