/**
 * Express Server for Admin UI
 * Serves static files and health check endpoints
 */

const express = require('express');
const path = require('path');
const healthRoutes = require('./server/health.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check routes
app.use('/health', healthRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Admin UI server running on port ${PORT}`);
  });
}
