import { PrismaClient } from '@prisma/client';
import { startContainers, stopContainers } from '../../../test/helpers/testcontainers.helper';
import { execSync } from 'child_process';

describe('TicketRepository (integration)', () => {
  let containers: any;
  let prisma: PrismaClient;

  beforeAll(async () => {
    containers = await startContainers();
    let host = 'localhost';
    let port = 5432;
    if (containers && (containers as any).pg) {
      host = containers.pg.getHost();
      port = containers.pg.getMappedPort(5432);
    }
    process.env.DATABASE_URL = process.env.DATABASE_URL || `postgresql://postgres:postgres@${host}:${port}/support_test`;
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    prisma = new PrismaClient();
    await prisma.$connect();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await stopContainers(containers);
  }, 60000);

  it('creates ticket and related message', async () => {
    const user = await prisma.user.create({ data: { name: 'U', email: `u${Date.now()}@int.test`, passwordHash: 'h', role: 'CUSTOMER' } });
    const t = await prisma.ticket.create({ data: { title: 'Hi', description: 'd', customerId: user.id } });
    const m = await prisma.ticketMessage.create({ data: { ticketId: t.id, authorId: user.id, text: 'hello' } });
    const messages = await prisma.ticketMessage.findMany({ where: { ticketId: t.id } });
    expect(messages.length).toBe(1);
    expect(messages[0].text).toBe('hello');
  });
});
