# User API - Testing Suite Documentation

## Overview
Complete testing suite for the User API backend service including Unit, Integration, and API tests with health check endpoints.

## Prerequisites
- Node.js >= 14.x
- npm or yarn
- MongoDB (for integration tests)
- Jest testing framework

## Installation

### 1. Install Dependencies
```bash
cd user-api
npm install
```

### 2. Install Dev Dependencies
```bash
npm install --save-dev jest supertest @types/jest ts-jest
```

## Project Structure
```
user-api/
├── __tests__/
│   ├── unit/
│   │   └── unit.test.js
│   ├── integration/
│   │   └── integration.test.js
│   └── api/
│       └── api.test.js
├── controllers/
│   └── health.controller.js
├── routes/
│   └── health.routes.js
├── jest.config.js
├── package.json
└── README.md
```

## Configuration

### package.json
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest __tests__/unit",
    "test:integration": "jest __tests__/integration",
    "test:api": "jest __tests__/api",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### jest.config.js
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'utils/**/*.js'
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
```

## Health Check Endpoints

### Implementation
Add health check routes to your Express app:

```javascript
// In app.js or server.js
const healthRoutes = require('./routes/health.routes');
app.use('/health', healthRoutes);
```

### Endpoints

#### 1. **GET /health/live**
- **Purpose**: Liveness probe for Kubernetes
- **Response**: 200 if application is running
```json
{
  "status": "UP",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "service": "user-api",
  "check": "liveness"
}
```

#### 2. **GET /health/ready**
- **Purpose**: Readiness probe - checks if app can serve traffic
- **Response**: 200 if ready, 503 if not ready
```json
{
  "status": "UP",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "service": "user-api",
  "check": "readiness",
  "checks": {
    "database": "UP",
    "dependencies": "UP"
  }
}
```

#### 3. **GET /health**
- **Purpose**: General health check with detailed status
- **Response**: 200 if healthy, 503 if unhealthy
```json
{
  "status": "UP",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "service": "user-api",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "UP",
    "dependencies": "UP"
  }
}
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# API tests only
npm run test:api
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Types

### 1. Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies
- Fast execution
- Located in: `__tests__/unit/`

**Example Tests:**
- Admin authentication logic
- Data validation functions
- Utility functions

### 2. Integration Tests
- Test multiple components working together
- Use test database
- Test data flow between layers
- Located in: `__tests__/integration/`

**Example Tests:**
- Login flow with database
- Booking creation with validation
- Database transaction handling

### 3. API Tests
- Test HTTP endpoints
- Test request/response formats
- Test status codes and headers
- Located in: `__tests__/api/`

**Example Tests:**
- Health check endpoints
- CRUD operations
- Error handling
- Authentication and authorization

## Environment Setup

### Test Environment Variables
Create `.env.test` file:
```env
NODE_ENV=test
PORT=3001
DB_HOST=localhost
DB_PORT=27017
DB_NAME=admin_api_test
JWT_SECRET=test_secret_key
API_TIMEOUT=5000
```

### Database Setup for Tests
```javascript
// jest.setup.js
const mongoose = require('mongoose');

beforeAll(async () => {
  await mongoose.connect(process.env.TEST_DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Clear database before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: User API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Troubleshooting

### Common Issues

#### 1. Tests timing out
```javascript
// Increase timeout in jest.config.js
module.exports = {
  testTimeout: 10000
};
```

#### 2. Database connection issues
- Ensure MongoDB is running
- Check connection string in `.env.test`
- Verify database permissions

#### 3. Port already in use
```javascript
// Use random port for tests
const app = require('../app');
const server = app.listen(0); // Random available port
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clear test data after each test
3. **Mocking**: Mock external services and APIs
4. **Descriptive Names**: Use clear test descriptions
5. **Assertions**: Use specific assertions
6. **Coverage**: Aim for >80% code coverage

## Test Coverage Goals
- Unit Tests: >90%
- Integration Tests: >70%
- API Tests: 100% of endpoints

## Support
For issues or questions, contact the development team or create an issue in the repository.
