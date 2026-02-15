const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import health routes
const healthRoutes = require('./routes/health.routes');

const app = express();

/* -------------------- Rate Limiter -------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,                   // 100 requests per window
  standardHeaders: true,
  legacyHeaders: true         // REQUIRED for x-ratelimit-* headers
});

// Apply BEFORE routes
app.use(limiter);

/* -------------------- Middleware -------------------- */
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- Routes -------------------- */
app.use('/health', healthRoutes);

// Your other routes here
// app.use('/api/admin', adminRoutes);
// app.use('/api/bookings', bookingRoutes);

/* -------------------- Error Handling -------------------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

/* -------------------- 404 Handler -------------------- */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;
