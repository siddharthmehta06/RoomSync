import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance with graceful timeout for development
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/roomsync';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // 2-second timeout so dev server starts immediately
    });
    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`[Database Notice] MongoDB not connected: ${error.message}`);
    console.log(`[Database Notice] Server running in standalone API mode.`);
  }
}
