const mongoose = require('mongoose');

// Global Mongoose Config
mongoose.set('bufferCommands', false);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  if (!process.env.MONGO_URI) {
    console.error('❌ CRITICAL: MONGO_URI is not defined');
    throw new Error('Database configuration missing');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    throw err;
  }
};

module.exports = connectDB;
