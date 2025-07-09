import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment variables if not provided
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/job-autofill-test';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

// Increase timeout for async operations
jest.setTimeout(10000);
