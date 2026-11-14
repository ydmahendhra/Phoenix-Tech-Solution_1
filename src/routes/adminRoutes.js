const express = require('express');
const router = express.Router();
const {
  getAdminProfile,
  updateAdminProfile,
  getOverviewStats,
  getActivityLogs
} = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.get('/overview', getOverviewStats);
router.get('/activity', getActivityLogs);

module.exports = router;
