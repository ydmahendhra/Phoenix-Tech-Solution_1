const express = require('express');
const router = express.Router();
const {
  assignProject,
  getAllAssignments,
  removeAssignment
} = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.post('/', assignProject);
router.get('/', getAllAssignments);
router.delete('/:id', removeAssignment);

module.exports = router;
