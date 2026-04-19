require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure DB is connected before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/accounts',     require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/loans',        require('./routes/loans'));

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 NexaBank API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
