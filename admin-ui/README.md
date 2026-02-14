# Admin UI - Testing Suite Documentation

## Overview
Complete testing suite for the Admin UI frontend service including Unit, Integration, and API tests with health check endpoints.

## Prerequisites
- Node.js >= 14.x
- npm or yarn
- React >= 17.x
- Jest + React Testing Library

## Installation

### 1. Install Dependencies
```bash
cd admin-UI
npm install
```

### 2. Install Dev Dependencies
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event supertest express axios
```

## Project Structure
```
admin-UI/
├── __tests__/
│   ├── unit/
│   │   └── unit.test.js
│   ├── integration/
│   │   └── integration.test.js
│   └── api/
│       └── api.test.js
├── server/
│   ├── health.controller.js
│   └── health.routes.js
├── src/
│   └── components/
├── jest.config.js
├── package.json
└── README.md
```

## Health Check Server Setup

For production deployment, the Admin UI needs a Node.js server to serve health check endpoints.

### Create server.js
```javascript
const express = require('express');
const path = require('path');
const healthRoutes = require('./server/health.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Health check routes
app.use('/health', healthRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, 'build')));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Admin UI server running on port ${PORT}`);
});
```

## Health Check Endpoints

### 1. **GET /health/live**
- **Purpose**: Liveness probe for Kubernetes
- **Response**: 200 if application is running
```json
{
  "status": "UP",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "service": "admin-ui",
  "check": "liveness"
}
```

### 2. **GET /health/ready**
- **Purpose**: Readiness probe - checks backend connectivity
- **Response**: 200 if ready, 503 if not ready
```json
{
  "status": "UP",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "service": "admin-ui",
  "check": "readiness",
  "checks": {
    "backend_connectivity": "UP",
    "static_assets": "UP"
  }
}
```

### 3. **GET /health**
- **Purpose**: General health check
- **Response**: 200 if healthy, 503 if unhealthy
```json
{
  "status": "UP",
  "timestamp": "2026-02-14T10:30:00.000Z",
  "service": "admin-ui",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "backend_connectivity": "UP"
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

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Types

### 1. Unit Tests
- Test React components in isolation
- Mock API calls and external dependencies
- Test component logic and rendering

**Example Tests:**
- LoginForm component rendering
- Form validation logic
- Button click handlers
- State management

### 2. Integration Tests
- Test multiple components working together
- Test user flows and interactions
- Test data flow between components

**Example Tests:**
- Complete login flow
- Booking management workflow
- Navigation between pages
- API integration

### 3. API Tests
- Test health check endpoints
- Test API service layer
- Test HTTP requests and responses

**Example Tests:**
- Health check endpoints
- API service methods
- Error handling
- Request/response formats

## Environment Setup

### Test Environment Variables
Create `.env.test` file:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENV=test
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/serviceWorker.js'
  ]
};
```

### Setup Tests File
```javascript
// src/setupTests.js
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

## Best Practices

1. **Component Testing**: Test behavior, not implementation
2. **User Interactions**: Use userEvent for realistic interactions
3. **Async Operations**: Use waitFor for async operations
4. **Accessibility**: Include accessibility tests
5. **Mocking**: Mock external dependencies and API calls

## Troubleshooting

### Common Issues

#### 1. Module not found errors
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

#### 2. CSS/Image import errors
Add moduleNameMapper to jest.config.js (see above)

#### 3. Act warnings
Wrap state updates in act() or use waitFor()

## Test Coverage Goals
- Unit Tests: >90%
- Integration Tests: >70%
- API Tests: 100% of endpoints

## Support
For issues or questions, contact the development team.
