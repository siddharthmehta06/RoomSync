import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roomsync');
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Do not exit process in development to allow server testing without local mongo
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
