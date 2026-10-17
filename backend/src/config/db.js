import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance with graceful timeout for development
 */
export async function connectDB(customUri) {
  const uri =
    customUri ||
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/roomsync';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // 2-second timeout so dev server starts immediately
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    }
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Database Notice] MongoDB not connected: ${error.message}`);
      console.log(`[Database Notice] Server running in standalone API mode.`);
    }
    return null;
  }
}

/**
 * Disconnect from MongoDB database instance
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
