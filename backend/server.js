const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const causeRoutes = require('./routes/causeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const sankalpRoutes = require('./routes/sankalpRoutes');
const statsRoutes = require('./routes/statsRoutes');
const detectionRoutes = require('./routes/detectionRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '5000', 10);

// Enable CORS for all frontends (Vite runs on 5173, 5174, etc.)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Smart Dan Peti Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount all API routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/causes', causeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/sankalps', sankalpRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server with graceful fallback if default port is in use
function startServer(portToTry) {
  const server = app.listen(portToTry, async () => {
    console.log('====================================================');
    console.log(`[Smart Dan Peti Server] Listening on port ${portToTry}`);
    console.log(`[API Base URL] http://localhost:${portToTry}/api`);
    console.log('====================================================');
    await testConnection();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Port Notice] Port ${portToTry} is already in use. Trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('[Server Listen Error]', err);
    }
  });
}

startServer(DEFAULT_PORT);
