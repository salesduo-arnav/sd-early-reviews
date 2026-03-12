// Set required env vars for test suite before any modules are imported
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-testing-only';
