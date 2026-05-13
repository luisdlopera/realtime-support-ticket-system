import http from 'http';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { TicketsGateway } from '../../modules/realtime/tickets.gateway';
import { shouldRunIntegration } from '../../../test/helpers/integration.guard';

describe('Socket integration', () => {
  if (!shouldRunIntegration()) {
    it('skipped integration tests (USE_POSTGRES or CI not set)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  let serverHttp: http.Server;
  let ioServer: Server;
  let gw: TicketsGateway;

  beforeAll((done) => {
    serverHttp = http.createServer();
    ioServer = new Server(serverHttp, { cors: { origin: '*' } });
    gw = new TicketsGateway({ verify: () => ({ sub: 'u1', role: 'CUSTOMER' }) } as any);
    // attach server instance to gateway
    (gw as any).server = ioServer;

    serverHttp.listen(() => {
      const port = (serverHttp.address() as any).port;
      (global as any).__socketUrl = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    serverHttp.close(() => done());
  });

  it('two clients join ticket room and receive typing broadcasts', (done) => {
    const c1 = Client((global as any).__socketUrl);
    const c2 = Client((global as any).__socketUrl);

    // wait for connections
    let conns = 0;
    c1.on('connect', () => {
      conns += 1;
      if (conns === 2) {
        (gw as any).handleJoinTicket(c1, { ticketId: 'room1' });
        (gw as any).handleJoinTicket(c2, { ticketId: 'room1' });
        (gw as any).handleTyping(c1, { ticketId: 'room1', isTyping: true });
      }
    });
    c2.on('connect', () => {
      conns += 1;
      if (conns === 2) {
        (gw as any).handleJoinTicket(c1, { ticketId: 'room1' });
        (gw as any).handleJoinTicket(c2, { ticketId: 'room1' });
        (gw as any).handleTyping(c1, { ticketId: 'room1', isTyping: true });
      }
    });

    c2.on('ticket.typing', (payload: any) => {
      try {
        expect(payload.ticketId).toBe('room1');
        c1.close();
        c2.close();
        done();
      } catch (e) {
        done(e);
      }
    });
  });
});
