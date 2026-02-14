/**
 * API Tests for Admin API
 * Tests HTTP endpoints, health checks, request/response formats, and status codes
 * 
 * @group api
 */

const request = require('supertest');
const express = require('express');

// Create mock Express app with health routes
const app = express();
app.use(express.json());

// Import health controller
const healthController = {
  async checkDatabase() {
    return true;
  },
  
  async checkDependencies() {
    return true;
  },

  async liveness(req, res) {
    try {
      return res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        check: 'liveness'
      });
    } catch (error) {
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        check: 'liveness',
        error: error.message
      });
    }
  },

  async readiness(req, res) {
    try {
      const dbStatus = await this.checkDatabase();
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
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        check: 'readiness',
        error: error.message
      });
    }
  },

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
      return res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'user-api',
        error: error.message
      });
    }
  }
};

// Health routes
app.get('/health/live', (req, res) => healthController.liveness(req, res));
app.get('/health/ready', (req, res) => healthController.readiness(req, res));
app.get('/health', (req, res) => healthController.health(req, res));

// Mock admin routes
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@example.com' && password === 'Admin@123') {
    res.json({ 
      token: 'mock_token_123', 
      admin: { id: 1, email, role: 'super_admin' } 
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/admin/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    users: [
      { id: 1, email: 'user1@example.com', name: 'User 1' },
      { id: 2, email: 'user2@example.com', name: 'User 2' }
    ],
    total: 2,
    page: 1
  });
});

app.get('/api/admin/users/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = parseInt(req.params.id);
  if (userId === 999999) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: { 
      id: userId, 
      email: `user${userId}@example.com`, 
      name: `User ${userId}`,
      status: 'active'
    }
  });
});

app.put('/api/admin/users/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, status } = req.body;
  res.json({
    user: { 
      id: parseInt(req.params.id), 
      name, 
      status 
    },
    message: 'User updated successfully'
  });
});

app.delete('/api/admin/users/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  // Mock role check
  if (token === 'user_token') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  res.json({ message: 'User deleted successfully' });
});

app.post('/api/admin/bookings', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { appointmentDate } = req.body;
  if (!appointmentDate || appointmentDate === 'invalid-date') {
    return res.status(400).json({
      error: 'Validation failed',
      validationErrors: ['Invalid appointmentDate']
    });
  }

  res.status(201).json({ booking: { id: 1, ...req.body } });
});

// CORS handling
app.options('/api/admin/users', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.status(200).send();
});

// Mock rate limiting headers
app.use((req, res, next) => {
  res.set({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '95'
  });
  next();
});

// ============= API TESTS =============

describe('Admin API - API Tests', () => {

  // ==================== HEALTH CHECK ENDPOINTS ====================
  describe('Health Check Endpoints', () => {
    
    describe('GET /health/live', () => {
      it('should return 200 and liveness status', async () => {
        // Act
        const response = await request(app)
          .get('/health/live')
          .expect('Content-Type', /json/)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('status', 'UP');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('service', 'user-api');
        expect(response.body).toHaveProperty('check', 'liveness');
        expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      });

      it('should respond quickly (within 100ms)', async () => {
        // Arrange
        const startTime = Date.now();

        // Act
        await request(app).get('/health/live').expect(200);
        const responseTime = Date.now() - startTime;

        // Assert
        expect(responseTime).toBeLessThan(100);
      });
    });

    describe('GET /health/ready', () => {
      it('should return 200 when service is ready', async () => {
        // Act
        const response = await request(app)
          .get('/health/ready')
          .expect('Content-Type', /json/)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('status', 'UP');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('service', 'user-api');
        expect(response.body).toHaveProperty('check', 'readiness');
        expect(response.body).toHaveProperty('checks');
        expect(response.body.checks).toHaveProperty('database', 'UP');
        expect(response.body.checks).toHaveProperty('dependencies', 'UP');
      });

      it('should return 503 when dependencies are not ready', async () => {
        // Arrange - Mock database failure
        const originalCheckDatabase = healthController.checkDatabase;
        healthController.checkDatabase = jest.fn().mockResolvedValue(false);

        // Act
        const response = await request(app)
          .get('/health/ready')
          .expect('Content-Type', /json/)
          .expect(503);

        // Assert
        expect(response.body).toHaveProperty('status', 'DOWN');
        expect(response.body.checks.database).toBe('DOWN');

        // Cleanup
        healthController.checkDatabase = originalCheckDatabase;
      });

      it('should include all dependency checks', async () => {
        // Act
        const response = await request(app)
          .get('/health/ready')
          .expect(200);

        // Assert
        expect(response.body.checks).toHaveProperty('database');
        expect(response.body.checks).toHaveProperty('dependencies');
      });
    });

    describe('GET /health', () => {
      it('should return comprehensive health status', async () => {
        // Act
        const response = await request(app)
          .get('/health')
          .expect('Content-Type', /json/)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('status', 'UP');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('service', 'user-api');
        expect(response.body).toHaveProperty('version');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('memory');
        expect(response.body).toHaveProperty('checks');
        expect(typeof response.body.uptime).toBe('number');
        expect(response.body.uptime).toBeGreaterThan(0);
      });

      it('should include memory usage information', async () => {
        // Act
        const response = await request(app)
          .get('/health')
          .expect(200);

        // Assert
        expect(response.body.memory).toHaveProperty('used');
        expect(response.body.memory).toHaveProperty('total');
        expect(typeof response.body.memory.used).toBe('number');
        expect(typeof response.body.memory.total).toBe('number');
      });

      it('should return version information', async () => {
        // Act
        const response = await request(app)
          .get('/health')
          .expect(200);

        // Assert
        expect(response.body.version).toBeDefined();
        expect(typeof response.body.version).toBe('string');
      });
    });
  });

  // ==================== ADMIN MANAGEMENT ENDPOINTS ====================
  describe('Admin Management Endpoints', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get auth token
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123'
        });
      authToken = loginResponse.body.token;
    });

    describe('GET /api/admin/users', () => {
      it('should fetch all users with authentication', async () => {
        // Act
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('users');
        expect(Array.isArray(response.body.users)).toBe(true);
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body.users.length).toBeGreaterThan(0);
      });

      it('should return 401 without authentication', async () => {
        // Act
        const response = await request(app)
          .get('/api/admin/users')
          .expect('Content-Type', /json/)
          .expect(401);

        // Assert
        expect(response.body).toHaveProperty('error');
      });
    });

    describe('GET /api/admin/users/:id', () => {
      it('should fetch single user by ID', async () => {
        // Act
        const response = await request(app)
          .get('/api/admin/users/1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id', 1);
        expect(response.body.user).toHaveProperty('email');
        expect(response.body.user).not.toHaveProperty('password');
      });

      it('should return 404 for non-existent user', async () => {
        // Act
        const response = await request(app)
          .get('/api/admin/users/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect('Content-Type', /json/)
          .expect(404);

        // Assert
        expect(response.body).toHaveProperty('error', 'User not found');
      });
    });

    describe('PUT /api/admin/users/:id', () => {
      it('should update user successfully', async () => {
        // Arrange
        const updateData = {
          name: 'Updated Name',
          status: 'active'
        };

        // Act
        const response = await request(app)
          .put('/api/admin/users/1')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect('Content-Type', /json/)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.name).toBe(updateData.name);
        expect(response.body).toHaveProperty('message', 'User updated successfully');
      });
    });

    describe('DELETE /api/admin/users/:id', () => {
      it('should delete user successfully', async () => {
        // Act
        const response = await request(app)
          .delete('/api/admin/users/999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect('Content-Type', /json/)
          .expect(200);

        // Assert
        expect(response.body).toHaveProperty('message', 'User deleted successfully');
      });

      it('should return 403 for insufficient permissions', async () => {
        // Act
        const response = await request(app)
          .delete('/api/admin/users/1')
          .set('Authorization', 'Bearer user_token')
          .expect('Content-Type', /json/)
          .expect(403);

        // Assert
        expect(response.body).toHaveProperty('error', 'Insufficient permissions');
      });
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('should return 400 for invalid request data', async () => {
      // Act
      const response = await request(app)
        .post('/api/admin/bookings')
        .set('Authorization', 'Bearer mock_token')
        .send({
          appointmentDate: 'invalid-date'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('validationErrors');
      expect(Array.isArray(response.body.validationErrors)).toBe(true);
    });

    it('should return 401 for unauthorized access', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/users')
        .expect('Content-Type', /json/)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent resource', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/users/999999')
        .set('Authorization', 'Bearer mock_token')
        .expect('Content-Type', /json/)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  // ==================== RESPONSE FORMAT AND HEADERS ====================
  describe('Response Format and Headers', () => {
    it('should return correct CORS headers', async () => {
      // Act
      const response = await request(app)
        .options('/api/admin/users')
        .expect(200);

      // Assert
      expect(response.headers).toHaveProperty('access-control-allow-origin', '*');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should return JSON content type for all API responses', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      // Assert
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include rate limit headers', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer mock_token');

      // Assert
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(parseInt(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    });

    it('should return consistent timestamp format', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Assert
      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(timestamp)).toBeInstanceOf(Date);
      expect(isNaN(Date.parse(timestamp))).toBe(false);
    });
  });
});
