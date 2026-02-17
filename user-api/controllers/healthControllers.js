/**
 * Health Check Controller for Admin API
 * Implements /health, /health/live, and /health/ready endpoints
 * 
 * @module controllers/health.controller
 */

const mongoose = require('mongoose');

class HealthController {
  /**
   * Liveness probe - checks if application is running
   * Returns 200 if the process is alive
   * 
   * @route GET /health/live
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with liveness status
   */
  async liveness(req, res) {
    try {
      return res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        check: 'liveness'
      });
    } catch (error) {
      console.error('Liveness check failed:', error);
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        check: 'liveness',
        error: error.message
      });
    }
  }

  /**
   * Readiness probe - checks if application is ready to serve traffic
   * Validates database connections and external dependencies
   * 
   * @route GET /health/ready
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with readiness status
   */
  async readiness(req, res) {
    try {
      // Check database connection
      const dbStatus = await this.checkDatabase();
      
      // Check external dependencies (optional)
      const depsStatus = await this.checkDependencies();

      const isReady = dbStatus && depsStatus;

      return res.status(isReady ? 200 : 503).json({
        status: isReady ? 'UP' : 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        check: 'readiness',
        checks: {
          database: dbStatus ? 'UP' : 'DOWN',
          dependencies: depsStatus ? 'UP' : 'DOWN'
        }
      });
    } catch (error) {
      console.error('Readiness check failed:', error);
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        check: 'readiness',
        error: error.message
      });
    }
  }

  /**
   * General health check - combines liveness and readiness
   * Provides comprehensive health status with version and uptime
   * 
   * @route GET /health
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} JSON response with detailed health status
   */
  async health(req, res) {
    try {
      const dbStatus = await this.checkDatabase();
      const depsStatus = await this.checkDependencies();
      
      const isHealthy = dbStatus && depsStatus;

      return res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'UP' : 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        version: process.env.APP_VERSION || '1.0.0',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        checks: {
          database: dbStatus ? 'UP' : 'DOWN',
          dependencies: depsStatus ? 'UP' : 'DOWN'
        }
      });
    } catch (error) {
      console.error('Health check failed:', error);
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        error: error.message
      });
    }
  }

  /**
   * Check database connectivity
   * Tests MongoDB connection status
   * 
   * @returns {Promise<boolean>} true if database is connected
   */
  async checkDatabase() {
    try {
      if (mongoose.connection.readyState === 1) {
        // Perform a simple query to verify connection
        await mongoose.connection.db.admin().ping();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Database check failed:', error);
      return false;
    }
  }

  /**
   * Check external dependencies
   * Can be extended to check user-api, message queues, cache, etc.
   * 
   * @returns {Promise<boolean>} true if all dependencies are healthy
   */
  async checkDependencies() {
    try {
      // Add checks for external services here
      // Example: await axios.get('http://user-api:3002/health');
      
      // For now, return true (no external dependencies)
      return true;
    } catch (error) {
      console.error('Dependencies check failed:', error);
      return false;
    }
  }
}

module.exports = new HealthController();
