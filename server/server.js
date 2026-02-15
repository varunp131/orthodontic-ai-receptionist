// server/server.js
// Main server file for AI Receptionist Demo

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config/config');
const logger = require('./utils/logger');

// Import routes
const vapiRoutes = require('./routes/vapi');
const dashboardRoutes = require('./routes/dashboard');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/vapi', vapiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.environment
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 AI Receptionist server running on port ${PORT}`);
  logger.info(`📊 Dashboard: http://localhost:${PORT}`);
  logger.info(`🔗 Vapi webhook: http://localhost:${PORT}/api/vapi/webhook`);
  logger.info(`🏥 Clinic: ${config.clinicInfo.name}`);
});

module.exports = app;
