const mongoose = require("mongoose");

let connectionPromise = null;
let lastConnectionError = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not set. Database connection skipped.");
    return null;
  }

  connectionPromise = mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
    bufferCommands: false,
  }).then(() => {
    lastConnectionError = null;
    console.log("MongoDB connected");
    return mongoose.connection;
  }).catch((error) => {
    connectionPromise = null;
    lastConnectionError = error.message;
    console.error("MongoDB connection error:", error.message);
    return null;
  });

  return connectionPromise;
}

function getDbStatus() {
  return {
    hasMongoUri: Boolean(process.env.MONGO_URI),
    readyState: mongoose.connection.readyState,
    readyStateLabel: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
    host: mongoose.connection.host || null,
    lastConnectionError,
  };
}

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
