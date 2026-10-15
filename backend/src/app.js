import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
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
    algorithms: ['HardConstraintFilter', 'FuzzyLogicEngine', 'TOPSIS', 'CollaborativeFiltering'],
  });
});

// Fallback error middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
