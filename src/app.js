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

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Static files (for local express runs)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Database middleware for API routes
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/health') {
    try {
      await connectDB();
      if (!dbInitialized) {
        await seedAndVerifyAuthorizedAdmins(false);
        dbInitialized = true;
      }
    } catch (err) {
      console.error('[DB Middleware Error]:', err.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please configure MONGODB_URI in Vercel Project Settings > Environment Variables.',
        details: err.message
      });
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  try {
    await connectDB();
    dbStatus = 'CONNECTED';
  } catch (e) {
    dbStatus = `ERROR: ${e.message}`;
  }

  res.status(200).json({
    status: 'ONLINE',
    system: 'Phoenix Tech Solutions Enterprise Management System',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

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

// Fallback to index.html for client-side routing
app.use((req, res) => {
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

module.exports = app;
