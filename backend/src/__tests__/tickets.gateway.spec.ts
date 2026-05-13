import { TicketsGateway } from '../modules/realtime/tickets.gateway';

describe('TicketsGateway', () => {
  const fakeTokenService = { verify: jest.fn().mockReturnValue({ sub: 'u1', role: 'CUSTOMER' }) } as any;
  const gw = new TicketsGateway(fakeTokenService);

  it('should allow join and leave ticket using socket mock', () => {
    const client = {
      handshake: { auth: { token: 't' } },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      data: {},
    } as any;

    gw.handleConnection(client);
    expect(client.data.user.sub).toBe('u1');

    gw.handleJoinTicket(client, { ticketId: 't1' });
    expect(client.join).toHaveBeenCalledWith('ticket:t1');
    expect(client.emit).toHaveBeenCalledWith('ticket.joined', { ticketId: 't1' });

    gw.handleLeaveTicket(client, { ticketId: 't1' });
    expect(client.leave).toHaveBeenCalledWith('ticket:t1');
  });
});
