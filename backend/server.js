import http from 'http';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

import { setupSocketIO } from './src/services/socketHandler.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Initialize HTTP server
const server = http.createServer(app);

// Initialize Socket.IO instance for real-time enquiries
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach Socket.IO to Express app for access in controllers
app.set('io', io);

// Configure Socket.IO authentication and messaging handlers
setupSocketIO(io);

// Connect database and start listening
async function startServer() {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`🚀 [RoomSync Server] Running on http://localhost:${PORT}`);
    console.log(`🌐 [Environment] ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
