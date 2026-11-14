const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gridFSBucket;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    gridFSBucket = new GridFSBucket(conn.connection.db, {
      bucketName: 'uploads'
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFSBucket is not initialized. Ensure DB is connected.');
  }
  return gridFSBucket;
};

module.exports = {
  connectDB,
  getGridFSBucket
};
