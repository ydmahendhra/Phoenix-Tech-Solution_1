const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gridFSBucket;
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/phoenix_tech_solutions';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });

    isConnected = true;
    console.log(`[MongoDB] Connected to host: ${conn.connection.host}`);

    gridFSBucket = new GridFSBucket(conn.connection.db, {
      bucketName: 'uploads'
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // Do NOT call process.exit(1) in serverless environments (it kills Vercel lambda)
    throw error;
  }
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    if (mongoose.connection && mongoose.connection.db) {
      gridFSBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });
      return gridFSBucket;
    }
    throw new Error('GridFSBucket is not initialized. Ensure DB is connected.');
  }
  return gridFSBucket;
};

module.exports = {
  connectDB,
  getGridFSBucket
};
