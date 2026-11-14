const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);

// Admin-only mutations
router.post('/', requireRole('admin'), createProject);
router.put('/:id', requireRole('admin'), updateProject);
router.delete('/:id', requireRole('admin'), deleteProject);

module.exports = router;
