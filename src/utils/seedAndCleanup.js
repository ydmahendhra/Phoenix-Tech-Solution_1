const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Intern = require('../models/Intern');
const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const EmailLog = require('../models/EmailLog');

const AUTHORIZED_ADMINS = [
  {
    adminId: 'PTS-CEO-001',
    name: 'Y D Mahendhra',
    username: 'mahendhra',
    email: 'mahendhra2005@gamil.com',
    plainPassword: 'ydm@1962',
    designation: 'Chief Executive Officer (CEO)',
    department: 'Executive Board',
    role: 'admin',
    contactNumber: '+91 98765 43210',
    accountStatus: 'active'
  },
  {
    adminId: 'PTS-COO-001',
    name: 'P Praveen Kumar',
    username: 'praveen',
    email: 'praveenpraba399@gamil.com',
    plainPassword: 'sasipraveen',
    designation: 'Chief Operating Officer (COO)',
    department: 'Operations & Strategy',
    role: 'admin',
    contactNumber: '+91 98765 43211',
    accountStatus: 'active'
  }
];

const seedAndVerifyAuthorizedAdmins = async (cleanDemoData = false) => {
  try {
    console.log('[Security] Verifying strict authorized Admin accounts...');

    const validAdminIds = AUTHORIZED_ADMINS.map((a) => a.adminId);

    // Remove any unauthorized admin accounts
    const removedAdmins = await Admin.deleteMany({ adminId: { $nin: validAdminIds } });
    if (removedAdmins.deletedCount > 0) {
      console.log(`[Security] Removed ${removedAdmins.deletedCount} unauthorized admin account(s).`);
    }

    // Ensure both authorized admins exist with updated hashes
    for (const adminData of AUTHORIZED_ADMINS) {
      const existing = await Admin.findOne({ adminId: adminData.adminId });
      const passwordHash = await bcrypt.hash(adminData.plainPassword, 10);

      if (!existing) {
        await Admin.create({
          adminId: adminData.adminId,
          name: adminData.name,
          username: adminData.username,
          email: adminData.email,
          passwordHash,
          designation: adminData.designation,
          department: adminData.department,
          role: 'admin',
          contactNumber: adminData.contactNumber,
          accountStatus: 'active'
        });
        console.log(`[Security] Authorized Admin created: ${adminData.name} (${adminData.adminId})`);
      } else {
        // Update credentials securely while preserving identity
        existing.name = adminData.name;
        existing.username = adminData.username;
        existing.email = adminData.email;
        existing.passwordHash = passwordHash;
        existing.designation = adminData.designation;
        existing.department = adminData.department;
        existing.accountStatus = 'active';
        await existing.save();
        console.log(`[Security] Authorized Admin verified & preserved: ${adminData.name} (${adminData.adminId})`);
      }
    }

    if (cleanDemoData) {
      console.log('[Cleanup] Performing complete demo data cleanup as requested...');
      await Intern.deleteMany({});
      await Project.deleteMany({});
      await ProjectAssignment.deleteMany({});
      await Report.deleteMany({});
      await Notification.deleteMany({});
      await EmailLog.deleteMany({});
      console.log('[Cleanup] All sample interns, projects, assignments, reports, and notifications cleaned.');
    }

    const adminCount = await Admin.countDocuments();
    console.log(`[Security] Verification complete: Exactly ${adminCount} authorized Admin account(s) active.`);
  } catch (error) {
    console.error(`[Security] Error during admin seeding/verification: ${error.message}`);
  }
};

module.exports = {
  seedAndVerifyAuthorizedAdmins,
  AUTHORIZED_ADMINS
};
