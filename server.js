require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { connectDB } = require('./src/utils/db');
const { seedAndVerifyAuthorizedAdmins } = require('./src/utils/seedAndCleanup');

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach Socket.IO to requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.IO event handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join_portal', (data) => {
    if (data && data.role) {
      socket.join(data.role);
      if (data.userId) {
        socket.join(data.userId);
      }
      console.log(`[Socket.IO] ${socket.id} joined rooms: ${data.role}, ${data.userId || ''}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAndVerifyAuthorizedAdmins(false);

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
