const express = require('express');
const cors = require('cors');
const compression = require('compression');
const apiRoutes = require('./src/routes/api');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(compression({
  filter: (req, res) => {
    if (req.headers.accept && req.headers.accept.includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 Investo Backend running on port ${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`=========================================`);
});
