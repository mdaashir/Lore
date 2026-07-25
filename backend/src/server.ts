import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

async function main() {
  await prisma.$connect();
  console.log('Database connected');

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
