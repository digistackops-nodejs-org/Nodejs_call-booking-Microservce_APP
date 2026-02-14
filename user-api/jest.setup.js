/**
 * Jest Setup File for Backend Service
 */

process.env.NODE_ENV = 'test';
process.env.PORT = 3001;
process.env.DB_NAME = 'test_db';
process.env.JWT_SECRET = 'test_secret_key';

jest.setTimeout(10000);

global.testUtils = {
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  generateTestEmail: () => `test${Date.now()}@example.com`,
  generateTestId: () => Math.floor(Math.random() * 1000000),
};

afterAll(async () => {
  // Cleanup code here
});
