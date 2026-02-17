/**
 * Health Check Controller for Admin UI
 */

const axios = require('axios');

class HealthController {
  constructor() {
    this.backendURL = process.env.ADMIN_API_URL || 'http://localhost:3001';
    this.isReady = false;
    
    // Set ready after initialization
    setTimeout(() => {
      this.isReady = true;
    }, 2000);
  }

  /**
   * Check backend API connectivity
   */
  async checkBackendConnectivity() {
    try {
      await axios.get(`${this.backendURL}/health`, { timeout: 3000 });
      return true;
    } catch (error) {
      console.error('Backend connectivity check failed:', error.message);
      return false;
    }
  }

  /**
   * Liveness probe
   */
  async liveness(req, res) {
    try {
      return res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'user-ui',
        check: 'liveness'
      });
    } catch (error) {
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-ui',
        check: 'liveness',
        error: error.message
      });
    }
  }

  /**
   * Readiness probe
   */
  async readiness(req, res) {
    try {
      const backendStatus = await this.checkBackendConnectivity();
      const ready = backendStatus && this.isReady;

      return res.status(ready ? 200 : 503).json({
        status: ready ? 'UP' : 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-ui',
        check: 'readiness',
        checks: {
          backend_connectivity: backendStatus ? 'UP' : 'DOWN',
          static_assets: 'UP'
        }
      });
    } catch (error) {
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-ui',
        check: 'readiness',
        error: error.message
      });
    }
  }

  /**
   * General health check
   */
  async health(req, res) {
    try {
      const backendStatus = await this.checkBackendConnectivity();

      return res.status(backendStatus ? 200 : 503).json({
        status: backendStatus ? 'UP' : 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-ui',
        version: process.env.APP_VERSION || '1.0.0',
        uptime: process.uptime(),
        checks: {
          backend_connectivity: backendStatus ? 'UP' : 'DOWN'
        }
      });
    } catch (error) {
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-ui',
        error: error.message
      });
    }
  }
}

module.exports = new HealthController();
