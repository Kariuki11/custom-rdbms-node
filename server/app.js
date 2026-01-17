/**
 * Express Application Module
 * 
 * Main HTTP server application.
 * Sets up Express middleware, routes, and database connection.
 */

const express = require('express');
const path = require('path');
require('dotenv').config();

const DB = require('../db/index');
const tableRoutes = require('./routes/tableRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files

// Initialize database
let db;
async function initializeDatabase() {
  const dbPath = process.env.DB_FILE || path.join(__dirname, '../data/dump.json');
  db = new DB(dbPath);
  await db.initialize();
  app.set('db', db);
  console.log('Database initialized and connected');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Database server is running'
  });
});

// API routes
app.use('/api', tableRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Custom RDBMS HTTP API',
    endpoints: {
      health: '/health',
      tables: '/api/:tableName',
      create: 'POST /api/:tableName',
      read: 'GET /api/:tableName',
      readOne: 'GET /api/:tableName?id=:id',
      update: 'PUT /api/:tableName/:id',
      delete: 'DELETE /api/:tableName/:id'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Determine status code based on error type
  let statusCode = 500;
  let message = 'Internal server error';

  if (err.message.includes('not found') || err.message.includes('not exist')) {
    statusCode = 404;
    message = err.message;
  } else if (err.message.includes('Duplicate') || err.message.includes('PRIMARY KEY') || err.message.includes('UNIQUE')) {
    statusCode = 409;
    message = err.message;
  } else if (err.message.includes('Type') || err.message.includes('Column') || err.message.includes('Invalid')) {
    statusCode = 400;
    message = err.message;
  } else {
    message = err.message || message;
  }

  res.status(statusCode).json({
    success: false,
    error: message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  if (db) {
    await db.save();
    console.log('Database saved');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down server...');
  if (db) {
    await db.save();
    console.log('Database saved');
  }
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
