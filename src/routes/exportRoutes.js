const express = require('express');
const router = express.Router();
const {
  exportInterns,
  exportProjects,
  exportAssignments,
  exportWeeklyReports,
  exportMonthlyReports
} = require('../controllers/exportController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/interns', exportInterns);
router.get('/projects', exportProjects);
router.get('/assignments', exportAssignments);
router.get('/weekly-reports', exportWeeklyReports);
router.get('/monthly-reports', exportMonthlyReports);

module.exports = router;
