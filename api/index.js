// Vercel Serverless Function
import MongoDB from '../src/database/mongo.js';
import APIServer from '../src/server/API.js';

// Ensure MongoDB is connected for serverless
let isConnected = false;

async function connectDB() {
  if (!isConnected) {
    await MongoDB.connect();
    isConnected = true;
  }
}

// Middleware to ensure DB connection
APIServer.app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Export the Express app for Vercel
export default APIServer.app;

