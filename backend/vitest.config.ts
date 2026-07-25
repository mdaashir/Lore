import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/notes?schema=public',
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
      JWT_EXPIRES_IN: '7d',
      OPENAI_API_KEY: '',
      PORT: '4000',
      NODE_ENV: 'test',
    },
    coverage: {
      reporter: ['text', 'json'],
      exclude: ['node_modules/', 'dist/', 'tests/'],
    },
  },
});
