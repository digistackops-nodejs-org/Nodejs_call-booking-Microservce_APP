/**
 * Health Check Routes for Admin UI
 */

const express = require('express');
const router = express.Router();
const healthController = require('./health.controller');

router.get('/live', (req, res) => healthController.liveness(req, res));
router.get('/ready', (req, res) => healthController.readiness(req, res));
router.get('/', (req, res) => healthController.health(req, res));

module.exports = router;
