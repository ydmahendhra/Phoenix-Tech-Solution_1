require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { connectDB } = require('./src/utils/db');
const { seedAndVerifyAuthorizedAdmins } = require('./src/utils/seedAndCleanup');
const Admin = require('./src/models/Admin');
const Intern = require('./src/models/Intern');
const Project = require('./src/models/Project');
const ProjectAssignment = require('./src/models/ProjectAssignment');
const Report = require('./src/models/Report');
const EmailLog = require('./src/models/EmailLog');
const {
  generateInternsExcel,
  generateProjectsExcel,
  generateAssignmentsExcel,
  generateWeeklyReportsExcel,
  generateMonthlyReportsExcel
} = require('./src/services/excelService');

async function runTestSuite() {
  console.log('====================================================');
  console.log('PHOENIX TECH SOLUTIONS - END-TO-END VERIFICATION');
  console.log('====================================================\n');

  await connectDB();
  await seedAndVerifyAuthorizedAdmins(true);

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, title) => {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${title}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  };

  // 1. Check strict authorized Admins
  const adminCount = await Admin.countDocuments();
  assert(adminCount === 2, 'Exactly 2 authorized Admin accounts exist in MongoDB');

  const admin1 = await Admin.findOne({ adminId: 'PTS-CEO-001' });
  const admin2 = await Admin.findOne({ adminId: 'PTS-COO-001' });
  assert(admin1 && admin1.email === 'mahendhra2005@gamil.com', 'Admin 1 (Y D Mahendhra, CEO) verified');
  assert(admin2 && admin2.email === 'praveenpraba399@gamil.com', 'Admin 2 (P Praveen Kumar, COO) verified');

  // Verify passwords are not stored in plaintext
  assert(admin1.passwordHash.startsWith('$2'), 'Admin 1 password is secure bcrypt hash');
  assert(admin2.passwordHash.startsWith('$2'), 'Admin 2 password is secure bcrypt hash');

  // 2. Clean state verification
  const internCount = await Intern.countDocuments();
  const projectCount = await Project.countDocuments();
  assert(internCount === 0, 'Clean database: 0 demo interns');
  assert(projectCount === 0, 'Clean database: 0 demo projects');

  // 3. Create Intern 1 (Software)
  const bcrypt = require('bcryptjs');
  const int1Hash = await bcrypt.hash('intern@123', 10);
  const intern1 = await Intern.create({
    internId: 'PTS-INT-001',
    fullName: 'Aditya Verma',
    username: 'aditya',
    email: 'aditya.verma@example.com',
    passwordHash: int1Hash,
    phoneNumber: '+91 9123456780',
    collegeName: 'IIT Madras',
    department: 'Computer Science',
    degree: 'B.Tech',
    designation: 'Software Development Intern',
    areaOfInterest: ['Web Development', 'Full Stack Development', 'Cloud Computing'],
    technicalSkills: ['JavaScript', 'TypeScript', 'Node.js', 'React.js', 'MongoDB'],
    createdBy: 'PTS-CEO-001'
  });
  assert(intern1 && intern1.internId === 'PTS-INT-001', 'Created Software Development Intern (PTS-INT-001)');

  // 4. Create Intern 2 (Hardware)
  const int2Hash = await bcrypt.hash('intern@456', 10);
  const intern2 = await Intern.create({
    internId: 'PTS-INT-002',
    fullName: 'Kavitha Raman',
    username: 'kavitha',
    email: 'kavitha.raman@example.com',
    passwordHash: int2Hash,
    phoneNumber: '+91 9123456781',
    collegeName: 'Anna University',
    department: 'Electronics & Communication',
    degree: 'B.E',
    designation: 'Hardware Development Intern',
    areaOfInterest: ['Hardware Development', 'Embedded Systems', 'Internet of Things (IoT)'],
    technicalSkills: ['Arduino', 'ESP32', 'Embedded C', 'PCB Design', 'MQTT'],
    createdBy: 'PTS-COO-001'
  });
  assert(intern2 && intern2.internId === 'PTS-INT-002', 'Created Hardware Development Intern (PTS-INT-002)');

  // 5. Create Project
  const project = await Project.create({
    projectId: 'PTS-PRJ-001',
    projectName: 'Website Development System',
    description: 'Develop a responsive website with frontend and backend functionality.',
    objectives: 'Build enterprise role-based portal for Phoenix Tech Solutions.',
    requirements: 'Node.js, Express, MongoDB, Tailwind, GridFS, ExcelJS',
    category: 'Web & Cloud',
    startDate: new Date(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    projectStatus: 'Active',
    createdBy: 'PTS-CEO-001'
  });
  assert(project && project.projectId === 'PTS-PRJ-001', 'Created Project (PTS-PRJ-001)');

  // 6. Project Assignment Workflow with Email dispatch
  const { sendProjectAssignmentEmail } = require('./src/services/emailService');

  const asg1 = await ProjectAssignment.create({
    assignmentId: 'ASG-001',
    projectId: project.projectId,
    internId: intern1.internId,
    assignedBy: 'Y D Mahendhra',
    assignedDate: new Date(),
    assignmentStatus: 'Active'
  });

  const asg2 = await ProjectAssignment.create({
    assignmentId: 'ASG-002',
    projectId: project.projectId,
    internId: intern2.internId,
    assignedBy: 'Y D Mahendhra',
    assignedDate: new Date(),
    assignmentStatus: 'Active'
  });

  const emailLog1 = await sendProjectAssignmentEmail({
    intern: intern1,
    project,
    adminName: 'Y D Mahendhra (CEO)'
  });

  const emailLog2 = await sendProjectAssignmentEmail({
    intern: intern2,
    project,
    adminName: 'Y D Mahendhra (CEO)'
  });

  assert(asg1 && asg2, 'Both interns assigned to project PTS-PRJ-001');
  assert(emailLog1 && emailLog1.recipient === intern1.email, 'Email notification generated for Intern 1');
  assert(emailLog2 && emailLog2.recipient === intern2.email, 'Email notification generated for Intern 2');

  const emailLogsInDb = await EmailLog.countDocuments();
  assert(emailLogsInDb === 2, '2 email logs recorded persistently in MongoDB');

  // 7. Intern Submits Week 1 Report
  const report = await Report.create({
    reportId: 'REP-001',
    projectId: project.projectId,
    internId: intern1.internId,
    month: 'November',
    year: 2026,
    weekNumber: 1,
    weekStartDate: new Date('2026-11-01'),
    weekEndDate: new Date('2026-11-07'),
    reportTitle: 'System Architecture & Database Schema Setup',
    description: 'Initial project setup deliverable',
    workSummary: 'Configured MongoDB schemas, GridFS file bucket, and authentication middleware.',
    completedActivities: 'Created Admin, Intern, Project, and Report schemas.',
    workProgress: 40,
    challengesFaced: 'None',
    nextWeekPlan: 'Implement frontend UI and Excel export routines.',
    submissionStatus: 'Submitted',
    submittedAt: new Date()
  });
  assert(report && report.submissionStatus === 'Submitted', 'Intern 1 successfully submitted Week 1 Report');

  // 8. Admin Reviews and Approves Report
  report.submissionStatus = 'Approved';
  report.reviewComments = 'Excellent architectural setup. Approved with high commendation.';
  report.reviewedBy = 'Y D Mahendhra';
  report.reviewedAt = new Date();
  await report.save();

  const updatedReport = await Report.findOne({ reportId: 'REP-001' });
  assert(updatedReport.submissionStatus === 'Approved', 'Admin approved report with review comments');

  // 9. Excel Exports Verification
  const internWb = await generateInternsExcel();
  const projectWb = await generateProjectsExcel();
  const asgWb = await generateAssignmentsExcel();
  const weeklyWb = await generateWeeklyReportsExcel();
  const monthlyWb = await generateMonthlyReportsExcel();

  assert(internWb.worksheets.length > 0, 'ExcelJS generated valid Interns directory workbook');
  assert(projectWb.worksheets.length > 0, 'ExcelJS generated valid Projects directory workbook');
  assert(asgWb.worksheets.length > 0, 'ExcelJS generated valid Assignments workbook');
  assert(weeklyWb.worksheets.length > 0, 'ExcelJS generated valid Weekly Reports workbook');
  assert(monthlyWb.worksheets.length > 0, 'ExcelJS generated valid Monthly Summary workbook');

  console.log('\n====================================================');
  console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================');
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
