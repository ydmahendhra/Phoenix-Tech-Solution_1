const express = require('express');
const router = express.Router();
const { adminLogin, internLogin, getMe, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/admin/login', adminLogin);
router.post('/intern/login', internLogin);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);

module.exports = router;
