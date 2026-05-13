import { PrismaClient } from '@prisma/client';
import { startContainers, stopContainers } from '../../../test/helpers/testcontainers.helper';
import { execSync } from 'child_process';

describe('UserRepository (integration)', () => {
  let containers: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    containers = await startContainers();
    const host = containers.pg.getHost();
    const port = containers.pg.getMappedPort(5432);
    process.env.DATABASE_URL = `postgresql://postgres:postgres@${host}:${port}/support_test`;

    // Run prisma migrate deploy
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });

    prisma = new PrismaClient();
    await prisma.$connect();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await stopContainers(containers);
  }, 60000);

  it('creates and finds a user', async () => {
    const u = await prisma.user.create({ data: { name: 'U', email: `u${Date.now()}@int.test`, passwordHash: 'h', role: 'CUSTOMER' } });
    const found = await prisma.user.findUnique({ where: { id: u.id } });
    expect(found).toBeTruthy();
    expect(found?.email).toBe(u.email);
  });
});
