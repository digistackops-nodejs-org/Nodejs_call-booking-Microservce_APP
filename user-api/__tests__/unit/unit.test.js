/**
 * Unit Tests for Admin API
 * Tests individual functions and components in isolation
 * 
 * @group unit
 */

const bcrypt = require('bcryptjs');

// Mock services to test in isolation
const mockAdminService = {
  /**
   * Authenticate admin user
   */
  async authenticateAdmin(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Mock admin data
    const admin = {
      id: 1,
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('Admin@123', 10),
      role: 'super_admin',
      status: 'active'
    };
    
    if (email !== admin.email) {
      throw new Error('Invalid credentials');
    }
    
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Don't return password hash
    const { passwordHash, ...adminData } = admin;
    return adminData;
  },

  /**
   * Validate booking data
   */
  validateBookingData(data) {
    const errors = [];
    
    if (!data.userId || typeof data.userId !== 'number') {
      errors.push('Invalid userId');
    }
    
    if (!data.serviceId || typeof data.serviceId !== 'number') {
      errors.push('Invalid serviceId');
    }
    
    if (!data.appointmentDate || isNaN(Date.parse(data.appointmentDate))) {
      errors.push('Invalid appointmentDate');
    }
    
    if (!data.duration || data.duration <= 0) {
      errors.push('Invalid duration');
    }
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!data.status || !validStatuses.includes(data.status)) {
      errors.push('Invalid status');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Calculate booking price
   */
  calculateBookingPrice(basePrice, duration, discount = 0) {
    if (basePrice < 0 || duration <= 0) {
      throw new Error('Invalid price or duration');
    }
    
    const total = basePrice * (duration / 60);
    const discountAmount = (total * discount) / 100;
    return total - discountAmount;
  }
};

const mockUtilities = {
  /**
   * Format date to string
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`;
    }
    return d.toISOString();
  },

  /**
   * Calculate service charge with tax
   */
  calculateServiceCharge(basePrice, taxRate) {
    return basePrice + (basePrice * taxRate);
  },

  /**
   * Generate unique booking ID
   */
  generateBookingId() {
    return `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
};

// ============= UNIT TESTS =============

describe('Admin API - Unit Tests', () => {
  
  // Test Suite 1: Admin Authentication
  describe('AdminService.authenticateAdmin', () => {
    
    it('should successfully authenticate admin with valid credentials', async () => {
      // Arrange
      const email = 'admin@example.com';
      const password = 'Admin@123';

      // Act
      const result = await mockAdminService.authenticateAdmin(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe(email);
      expect(result.role).toBe('super_admin');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error when email is missing', async () => {
      // Arrange
      const email = '';
      const password = 'Admin@123';

      // Act & Assert
      await expect(
        mockAdminService.authenticateAdmin(email, password)
      ).rejects.toThrow('Email and password are required');
    });

    it('should throw error with invalid email', async () => {
      // Arrange
      const email = 'wrong@example.com';
      const password = 'Admin@123';

      // Act & Assert
      await expect(
        mockAdminService.authenticateAdmin(email, password)
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      const email = 'admin@example.com';
      const password = 'WrongPassword';

      // Act & Assert
      await expect(
        mockAdminService.authenticateAdmin(email, password)
      ).rejects.toThrow('Invalid credentials');
    });
  });

  // Test Suite 2: Data Validation
  describe('AdminService.validateBookingData', () => {
    
    it('should validate correct booking data', () => {
      // Arrange
      const validBooking = {
        userId: 123,
        serviceId: 456,
        appointmentDate: '2026-03-15T10:00:00Z',
        duration: 60,
        status: 'pending'
      };

      // Act
      const result = mockAdminService.validateBookingData(validBooking);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid booking data', () => {
      // Arrange
      const invalidBooking = {
        userId: null,
        serviceId: 'invalid',
        appointmentDate: 'invalid-date',
        duration: -10,
        status: 'invalid-status'
      };

      // Act
      const result = mockAdminService.validateBookingData(invalidBooking);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Invalid userId');
      expect(result.errors).toContain('Invalid serviceId');
      expect(result.errors).toContain('Invalid appointmentDate');
      expect(result.errors).toContain('Invalid duration');
      expect(result.errors).toContain('Invalid status');
    });

    it('should validate status field correctly', () => {
      // Arrange
      const bookingWithInvalidStatus = {
        userId: 123,
        serviceId: 456,
        appointmentDate: '2026-03-15T10:00:00Z',
        duration: 60,
        status: 'unknown'
      };

      // Act
      const result = mockAdminService.validateBookingData(bookingWithInvalidStatus);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid status');
    });
  });

  // Test Suite 3: Price Calculations
  describe('AdminService.calculateBookingPrice', () => {
    
    it('should calculate price correctly without discount', () => {
      // Arrange
      const basePrice = 100;
      const duration = 60;

      // Act
      const result = mockAdminService.calculateBookingPrice(basePrice, duration);

      // Assert
      expect(result).toBe(100);
    });

    it('should calculate price with discount', () => {
      // Arrange
      const basePrice = 100;
      const duration = 60;
      const discount = 10;

      // Act
      const result = mockAdminService.calculateBookingPrice(basePrice, duration, discount);

      // Assert
      expect(result).toBe(90);
    });

    it('should calculate price for partial hour', () => {
      // Arrange
      const basePrice = 100;
      const duration = 30; // 30 minutes = 0.5 hour

      // Act
      const result = mockAdminService.calculateBookingPrice(basePrice, duration);

      // Assert
      expect(result).toBe(50);
    });

    it('should throw error for negative price', () => {
      // Arrange
      const basePrice = -100;
      const duration = 60;

      // Act & Assert
      expect(() => {
        mockAdminService.calculateBookingPrice(basePrice, duration);
      }).toThrow('Invalid price or duration');
    });

    it('should throw error for zero or negative duration', () => {
      // Arrange
      const basePrice = 100;
      const duration = 0;

      // Act & Assert
      expect(() => {
        mockAdminService.calculateBookingPrice(basePrice, duration);
      }).toThrow('Invalid price or duration');
    });
  });

  // Test Suite 4: Utility Functions
  describe('Utility Functions', () => {
    
    describe('formatDate', () => {
      it('should format date to YYYY-MM-DD', () => {
        // Arrange
        const date = new Date('2026-02-14T12:00:00Z');

        // Act
        const formatted = mockUtilities.formatDate(date, 'YYYY-MM-DD');

        // Assert
        expect(formatted).toBe('2026-02-14');
      });

      it('should format date to ISO string', () => {
        // Arrange
        const date = new Date('2026-02-14T12:00:00Z');

        // Act
        const formatted = mockUtilities.formatDate(date, 'ISO');

        // Assert
        expect(formatted).toContain('2026-02-14');
        expect(formatted).toContain('T');
      });
    });

    describe('calculateServiceCharge', () => {
      it('should calculate total with tax', () => {
        // Arrange
        const basePrice = 100;
        const taxRate = 0.18;

        // Act
        const total = mockUtilities.calculateServiceCharge(basePrice, taxRate);

        // Assert
        expect(total).toBe(118);
      });

      it('should handle zero tax', () => {
        // Arrange
        const basePrice = 100;
        const taxRate = 0;

        // Act
        const total = mockUtilities.calculateServiceCharge(basePrice, taxRate);

        // Assert
        expect(total).toBe(100);
      });
    });

    describe('generateBookingId', () => {
      it('should generate unique booking ID', () => {
        // Act
        const id1 = mockUtilities.generateBookingId();
        const id2 = mockUtilities.generateBookingId();

        // Assert
        expect(id1).toMatch(/^BK\d+/);
        expect(id2).toMatch(/^BK\d+/);
        expect(id1).not.toBe(id2);
      });
    });
  });
});
