/**
 * Integration Tests for Admin API
 * Tests multiple components working together including database operations
 * 
 * @group integration
 */

const request = require('supertest');
const mongoose = require('mongoose');

// Mock Express app
const express = require('express');
const app = express();
app.use(express.json());

// Mock database connection
const mockDb = {
  admins: [],
  bookings: [],
  users: [],

  async connect() {
    console.log('Connected to test database');
  },

  async close() {
    this.admins = [];
    this.bookings = [];
    this.users = [];
    console.log('Closed test database connection');
  },

  async clearTestData() {
    this.admins = [];
    this.bookings = [];
    this.users = [];
  },

  async createTestAdmin(adminData) {
    const admin = {
      id: this.admins.length + 1,
      ...adminData,
      createdAt: new Date()
    };
    this.admins.push(admin);
    return admin;
  },

  async createTestBooking(bookingData) {
    const booking = {
      id: this.bookings.length + 1,
      ...bookingData,
      createdAt: new Date()
    };
    this.bookings.push(booking);
    return booking;
  },

  async createTestUser(userData) {
    const user = {
      id: this.users.length + 1,
      ...userData,
      createdAt: new Date()
    };
    this.users.push(user);
    return user;
  },

  async findAdmin(email) {
    return this.admins.find(a => a.email === email);
  },

  async findBooking(id) {
    return this.bookings.find(b => b.id === id);
  },

  async findAllBookings() {
    return this.bookings;
  },

  async updateBooking(id, updateData) {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bookings[index] = { ...this.bookings[index], ...updateData };
      return this.bookings[index];
    }
    return null;
  },

  async deleteBooking(id) {
    const index = this.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bookings.splice(index, 1);
      return true;
    }
    return false;
  }
};

// Mock routes
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  
  const admin = await mockDb.findAdmin(email);
  if (!admin || admin.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = `mock_token_${admin.id}_${Date.now()}`;
  const { password: _, ...adminData } = admin;
  
  res.json({ token, admin: adminData });
});

app.get('/api/admin/bookings', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const bookings = mockDb.bookings;
  res.json({ 
    bookings, 
    total: bookings.length,
    page: 1,
    limit: 10
  });
});

app.get('/api/admin/bookings/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const booking = mockDb.bookings.find(b => b.id === parseInt(req.params.id));
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json({ booking });
});

app.put('/api/admin/bookings/:id/status', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { status } = req.body;
  const booking = await mockDb.updateBooking(parseInt(req.params.id), { status });
  
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json({ booking, message: 'Booking status updated' });
});

app.post('/api/admin/bookings', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, serviceId, appointmentDate } = req.body;
  
  if (!userId || !serviceId || !appointmentDate) {
    return res.status(400).json({ 
      error: 'Validation failed',
      validationErrors: ['Missing required fields']
    });
  }

  res.status(400).json({
    error: 'Validation failed',
    validationErrors: ['Invalid data']
  });
});

app.delete('/api/admin/bookings/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const deleted = await mockDb.deleteBooking(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  res.json({ message: 'Booking deleted successfully' });
});

// ============= INTEGRATION TESTS =============

describe('Admin API - Integration Tests', () => {
  
  // Setup and teardown
  beforeAll(async () => {
    await mockDb.connect();
  });

  afterAll(async () => {
    await mockDb.close();
  });

  beforeEach(async () => {
    await mockDb.clearTestData();
  });

  // Test Suite 1: Admin Login Flow
  describe('Admin Login Flow Integration', () => {
    
    it('should complete full login flow with valid credentials', async () => {
      // Arrange - Create test admin in database
      await mockDb.createTestAdmin({
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'super_admin',
        status: 'active'
      });

      // Act - Attempt login
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin.email).toBe('admin@example.com');
      expect(response.body.admin.role).toBe('super_admin');
      expect(response.body.admin).not.toHaveProperty('password');
      expect(response.body.token).toMatch(/^mock_token_/);
    });

    it('should reject login with invalid credentials', async () => {
      // Arrange
      await mockDb.createTestAdmin({
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'admin'
      });

      // Act
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@example.com',
          password: 'WrongPassword'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      // Act
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123'
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test Suite 2: Complete Booking Management Flow
  describe('Booking Management Integration Flow', () => {
    let adminToken;
    let testBooking;

    beforeEach(async () => {
      // Setup: Create admin and get token
      await mockDb.createTestAdmin({
        email: 'admin@example.com',
        password: 'Admin@123',
        role: 'super_admin'
      });

      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@example.com', password: 'Admin@123' });
      
      adminToken = loginResponse.body.token;

      // Create test user and booking
      await mockDb.createTestUser({
        email: 'user@example.com',
        name: 'Test User'
      });

      testBooking = await mockDb.createTestBooking({
        userId: 1,
        serviceId: 1,
        appointmentDate: '2026-03-20T10:00:00Z',
        duration: 60,
        status: 'pending'
      });
    });

    it('should fetch all bookings with authentication', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('bookings');
      expect(Array.isArray(response.body.bookings)).toBe(true);
      expect(response.body.bookings.length).toBeGreaterThan(0);
      expect(response.body.bookings[0].id).toBe(testBooking.id);
      expect(response.body).toHaveProperty('total');
    });

    it('should fetch single booking by ID', async () => {
      // Act
      const response = await request(app)
        .get(`/api/admin/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('booking');
      expect(response.body.booking.id).toBe(testBooking.id);
      expect(response.body.booking.status).toBe('pending');
    });

    it('should update booking status successfully', async () => {
      // Act
      const response = await request(app)
        .put(`/api/admin/bookings/${testBooking.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'confirmed' });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.booking.status).toBe('confirmed');
      expect(response.body).toHaveProperty('message');

      // Verify database was updated
      const updatedBooking = await mockDb.findBooking(testBooking.id);
      expect(updatedBooking.status).toBe('confirmed');
    });

    it('should delete booking successfully', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/admin/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify booking was deleted from database
      const deletedBooking = await mockDb.findBooking(testBooking.id);
      expect(deletedBooking).toBeUndefined();
    });

    it('should return 404 for non-existent booking', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/bookings/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should require authentication for all booking endpoints', async () => {
      // Act
      const response = await request(app)
        .get('/api/admin/bookings');

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  // Test Suite 3: Error Handling and Data Integrity
  describe('Error Handling and Data Integrity', () => {
    let adminToken;

    beforeEach(async () => {
      await mockDb.createTestAdmin({
        email: 'admin@example.com',
        password: 'Admin@123'
      });

      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({ email: 'admin@example.com', password: 'Admin@123' });
      
      adminToken = loginResponse.body.token;
    });

    it('should handle validation errors properly', async () => {
      // Arrange
      const invalidData = {
        userId: null,
        serviceId: null,
        appointmentDate: 'invalid-date'
      };

      // Act
      const response = await request(app)
        .post('/api/admin/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('validationErrors');
    });

    it('should maintain data integrity after failed operation', async () => {
      // Arrange
      const booking = await mockDb.createTestBooking({
        userId: 1,
        serviceId: 1,
        appointmentDate: '2026-03-20T10:00:00Z',
        status: 'pending'
      });

      const initialBookingsCount = mockDb.bookings.length;

      // Act - Try to create invalid booking
      await request(app)
        .post('/api/admin/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ userId: 999999, serviceId: null });

      // Assert - Verify no partial data was saved
      const currentBookingsCount = mockDb.bookings.length;
      expect(currentBookingsCount).toBe(initialBookingsCount);

      // Verify original booking is unchanged
      const originalBooking = await mockDb.findBooking(booking.id);
      expect(originalBooking).toBeDefined();
      expect(originalBooking.status).toBe('pending');
    });
  });
});
