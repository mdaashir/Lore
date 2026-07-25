import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/notes?schema=public';
const adapter = new PrismaPg({ connectionString });
export const testPrisma = new PrismaClient({ adapter });

export async function cleanDatabase() {
  await testPrisma.noteShare.deleteMany();
  await testPrisma.noteVersion.deleteMany();
  await testPrisma.note.deleteMany();
  await testPrisma.workspaceMember.deleteMany();
  await testPrisma.workspace.deleteMany();
  await testPrisma.auditLog.deleteMany();
  await testPrisma.user.deleteMany();
}
