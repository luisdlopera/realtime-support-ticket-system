import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

export async function createUser(prisma: PrismaClient, overrides: Partial<any> = {}) {
  const passwordHash = overrides.passwordHash ?? (await hash('password123', 10));
  const user = await prisma.user.create({ data: { name: 'User', email: `u${Date.now()}@test.local`, passwordHash, role: 'CUSTOMER', ...overrides } });
  return user;
}

export async function createTicket(prisma: PrismaClient, overrides: Partial<any> = {}) {
  const ticket = await prisma.ticket.create({ data: { title: 'T', description: 'd', customerId: overrides.customerId, ...overrides } });
  return ticket;
}
