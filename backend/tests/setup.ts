// Test environment defaults. Runs before every test file (see jest.config.ts).
process.env['NODE_ENV'] = 'test';
process.env['MONGO_URI'] ??= 'mongodb://localhost:27017/memed-test';
process.env['JWT_SECRET'] ??= 'test-secret-test-secret-123456';
