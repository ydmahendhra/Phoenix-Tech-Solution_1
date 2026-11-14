require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const { connectDB } = require('./src/utils/db');
const { seedAndVerifyAuthorizedAdmins } = require('./src/utils/seedAndCleanup');

// Import Route Handlers
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const internRoutes = require('./src/routes/internRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const assignmentRoutes = require('./src/routes/assignmentRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const exportRoutes = require('./src/routes/exportRoutes');
const fileRoutes = require('./src/routes/fileRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Static folder for UI assets
app.use(express.static(path.join(__dirname, 'public')));

// Attach Socket.IO instance to requests
app.use((req, res, next) => {
  req.io = io;
  next();
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

// System health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    system: 'Phoenix Tech Solutions Enterprise Management System',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for all other client routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO real-time notification handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_portal', (data) => {
    if (data && data.role) {
      socket.join(data.role); // 'admin' or 'intern'
      if (data.userId) {
        socket.join(data.userId); // specific intern or admin ID
      }
      console.log(`[Socket.IO] ${socket.id} joined rooms: ${data.role}, ${data.userId || ''}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    // Seed and verify the two authorized admins and clean all dummy data
    await seedAndVerifyAuthorizedAdmins(true);

    server.listen(PORT, () => {
      console.log('================================================================');
      console.log(` Phoenix Tech Solutions - Enterprise System running on port ${PORT}`);
      console.log(` Web Portal: http://localhost:${PORT}`);
      console.log('================================================================');
    });
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
};

startServer();
