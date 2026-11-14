const express = require('express');
const router = express.Router();
const {
  createIntern,
  getAllInterns,
  getInternById,
  updateIntern,
  resetInternPassword,
  deleteIntern,
  uploadInternAvatar
} = require('../controllers/internController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload } = require('../services/fileService');

// Admin only: create intern
router.post('/', verifyToken, requireRole('admin'), upload.single('profileImage'), createIntern);

// Intern listing: Admins can list all
router.get('/', verifyToken, requireRole('admin'), getAllInterns);

// Specific intern details: Admin or self
router.get('/:id', verifyToken, getInternById);

// Update intern: Admin full update or self limited update
router.put('/:id', verifyToken, upload.single('profileImage'), updateIntern);

// Admin only: reset password
router.put('/:id/reset-password', verifyToken, requireRole('admin'), resetInternPassword);

// Admin only: delete intern
router.delete('/:id', verifyToken, requireRole('admin'), deleteIntern);

// Upload avatar
router.post('/:id/profile-image', verifyToken, upload.single('profileImage'), uploadInternAvatar);

module.exports = router;
