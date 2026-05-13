// minimal test setup
process.env.NODE_ENV = 'test';
// Provide a lightweight mock for ConfigService if needed in tests
jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({ get: (k: string) => process.env[k] })),
}));

// Mock isomorphic-dompurify (ESM lib) for Jest environment
jest.mock('isomorphic-dompurify', () => ({ default: { sanitize: (s: any) => s } }));
