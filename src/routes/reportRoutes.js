const express = require('express');
const router = express.Router();
const {
  getReportingCalendar,
  submitReport,
  getAllReports,
  getReportById,
  reviewReport
} = require('../controllers/reportController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload } = require('../services/fileService');

router.use(verifyToken);

// Dynamic calendar routes supporting optional params cleanly
router.get('/calendar', getReportingCalendar);
router.get('/calendar/:year', getReportingCalendar);
router.get('/calendar/:year/:month', getReportingCalendar);

// Submit report (Intern or Admin)
router.post('/', upload.array('files', 5), submitReport);

// View reports
router.get('/', getAllReports);
router.get('/:id', getReportById);

// Admin review
router.put('/:id/review', requireRole('admin'), reviewReport);

module.exports = router;
