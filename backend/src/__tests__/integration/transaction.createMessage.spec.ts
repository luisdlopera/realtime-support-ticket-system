import { PrismaClient } from '@prisma/client';
import { startContainers, stopContainers } from '../../../test/helpers/testcontainers.helper';
import { execSync } from 'child_process';

describe('CreateMessage transaction (integration)', () => {
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

  it('persists message and activity together', async () => {
    const user = await prisma.user.create({ data: { name: 'U', email: `u${Date.now()}@int.test`, passwordHash: 'h', role: 'CUSTOMER' } });
    const t = await prisma.ticket.create({ data: { title: 'T', description: 'd', customerId: user.id } });

    await prisma.$transaction(async (tx) => {
      await tx.ticketMessage.create({ data: { ticketId: t.id, authorId: user.id, text: 'm1' } });
      await tx.ticketActivity.create({ data: { ticketId: t.id, actorUserId: user.id, type: 'TICKET_MESSAGE' } });
    });

    const msgs = await prisma.ticketMessage.findMany({ where: { ticketId: t.id } });
    const acts = await prisma.ticketActivity.findMany({ where: { ticketId: t.id } });

    expect(msgs.length).toBe(1);
    expect(acts.length).toBe(1);
  });
});
