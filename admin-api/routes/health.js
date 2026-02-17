/**
 * Health Check Routes for Admin API
 * Exposes health check endpoints for monitoring and Kubernetes probes
 * 
 * @module routes/health
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controllers');

/**
 * @route GET /health/live
 * @description Liveness probe - Returns if application is alive
 * @access Public
 * @returns {Object} 200 - Liveness status
 */
router.get('/live', (req, res) => healthControllers.liveness(req, res));

/**
 * @route GET /health/ready
 * @description Readiness probe - Returns if application is ready to serve traffic
 * @access Public
 * @returns {Object} 200 - Readiness status with dependency checks
 */
router.get('/ready', (req, res) => healthControllers.readiness(req, res));

/**
 * @route GET /health
 * @description General health check with detailed information
 * @access Public
 * @returns {Object} 200 - Comprehensive health status
 */
router.get('/', (req, res) => healthControllers.health(req, res));

module.exports = router;
