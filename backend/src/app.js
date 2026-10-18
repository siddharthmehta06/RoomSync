import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import savedRoomRoutes from './routes/savedRoomRoutes.js';
import matchRoutes from './routes/matchRoutes.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RoomSync API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    factorsSupported: 22,
    algorithms: [
      'HardConstraintFilter',
      'FuzzyLogicEngine',
      'TOPSIS',
      'CollaborativeFiltering',
    ],
  });
});

// Core API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/saved-rooms', savedRoomRoutes);
app.use('/api/matches', matchRoutes);

// Fallback error middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
