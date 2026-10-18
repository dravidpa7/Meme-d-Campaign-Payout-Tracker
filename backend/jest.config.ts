import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/domain/**/*.ts'],
  coverageThreshold: {
    global: { branches: 95, functions: 100, lines: 100, statements: 100 },
  },
};

export default config;
