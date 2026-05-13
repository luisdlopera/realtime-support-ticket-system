import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { Server } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import { startContainers, stopContainers } from '../../../test/helpers/testcontainers.helper';
import { execSync } from 'child_process';

describe('Socket integration', () => {
  let app: INestApplication;
  let url: string;
  let prisma: PrismaClient;
  let containers: any;

  beforeAll(async () => {
    containers = await startContainers();
    let host = 'localhost';
    let port = 5432;
    if (containers && (containers as any).pg) {
      host = containers.pg.getHost();
      port = containers.pg.getMappedPort(5432);
    }
    process.env.DATABASE_URL = process.env.DATABASE_URL || `postgresql://postgres:postgres@${host}:${port}/support_test`;
    const { prepareDatabase } = require('../../../test/helpers/db.helper');
    prepareDatabase();
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    const server = app.getHttpServer();
    const address = server.address();
    const portListen = (address as any).port;
    url = `http://localhost:${portListen}/realtime`;

    prisma = new PrismaClient();
    await prisma.$connect();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
    await stopContainers(containers);
  }, 60000);

  it('two clients join ticket room and receive messages', (done) => {
    const token = 'testtoken';

    // connect two clients
    const c1 = Client(url, { auth: { token } });
    const c2 = Client(url, { auth: { token } });

    let joined = 0;
    c1.on('connect', () => {
      c1.emit('ticket.join', { ticketId: 'room1' });
    });
    c2.on('connect', () => {
      c2.emit('ticket.join', { ticketId: 'room1' });
    });

    c1.on('ticket.joined', () => {
      joined += 1;
      if (joined === 2) {
        // broadcast from server side using gateway
        // simplistic: c1 emit typing which server broadcasts
        c1.emit('ticket.typing', { ticketId: 'room1', isTyping: true });
      }
    });

    c2.on('ticket.typing', (payload: any) => {
      expect(payload.ticketId).toBe('room1');
      c1.close();
      c2.close();
      done();
    });
  });
});
