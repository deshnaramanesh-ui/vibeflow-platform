const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vibeflow_db';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB Connection Warning: ${error.message}`);
    console.log(`ℹ️ Running with fallback memory store so the app works seamlessly even without a running MongoDB instance, while fully supporting MongoDB when started!`);
    isConnected = false;
    return null;
  }
};

const getStatus = () => isConnected;

module.exports = { connectDB, getStatus };
