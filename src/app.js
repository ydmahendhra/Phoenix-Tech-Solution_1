require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const { connectDB } = require('./utils/db');
const { seedAndVerifyAuthorizedAdmins } = require('./utils/seedAndCleanup');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const internRoutes = require('./routes/internRoutes');
const projectRoutes = require('./routes/projectRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const exportRoutes = require('./routes/exportRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// Ensure DB is connected for serverless environments
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await connectDB();
      await seedAndVerifyAuthorizedAdmins(false);
      dbInitialized = true;
    } catch (err) {
      console.error('Database connection error in request middleware:', err);
    }
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/interns', internRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/files', fileRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'Phoenix Tech Solutions Enterprise Management System',
    timestamp: new Date().toISOString()
  });
});

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
