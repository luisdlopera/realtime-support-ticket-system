import { PrismaClient } from '@prisma/client';
import { startContainers, stopContainers } from '../../../test/helpers/testcontainers.helper';
import { execSync } from 'child_process';

describe('UserRepository (integration)', () => {
  let containers: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    try {
      containers = await startContainers();
      let host = 'localhost';
      let port = 5432;
      if (containers && (containers as any).pg) {
        host = containers.pg.getHost();
        port = containers.pg.getMappedPort(5432);
      }
      process.env.DATABASE_URL = process.env.DATABASE_URL || `postgresql://postgres:postgres@${host}:${port}/support_test`;

      // Prepare DB: either run migrations (CI/docker) or use sqlite push for local
      // This helper will set DATABASE_URL if needed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { prepareDatabase } = require('../../../test/helpers/db.helper');
      prepareDatabase();

    prisma = new PrismaClient();
    await prisma.$connect();
    // restore schema after tests finish
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { restoreDatabaseSchema } = require('../../../test/helpers/db.helper');
    // attach restore to global teardown
    (global as any).__restoreDbSchema = restoreDatabaseSchema;
  } catch (e) {
    console.error('Integration beforeAll error:', e);
    throw e;
  }
  }, 60000);

  afterAll(async () => {
    try {
      if (prisma) await prisma.$disconnect();
    } catch (e) {
      console.warn('Error disconnecting prisma', e);
    }
    try {
      await stopContainers(containers);
    } catch (e) {
      console.warn('Error stopping containers', e);
    }
    try {
      const restore = (global as any).__restoreDbSchema;
      if (restore) restore();
    } catch (e) {
      console.warn('Error restoring prisma schema', e);
    }
  }, 60000);

  it('creates and finds a user', async () => {
    const u = await prisma.user.create({ data: { name: 'U', email: `u${Date.now()}@int.test`, passwordHash: 'h', role: 'CUSTOMER' } });
    const found = await prisma.user.findUnique({ where: { id: u.id } });
    expect(found).toBeTruthy();
    expect(found?.email).toBe(u.email);
  });
});
