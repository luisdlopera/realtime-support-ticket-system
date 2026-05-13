import { WhatsappInboundService } from '../modules/whatsapp/whatsapp-inbound.service';

// Minimal smoke tests using R2 disabled scenario
describe('WhatsappInboundService', () => {
  const fakeConfig = { get: (k: string) => undefined } as any;
  const fakeUsers = { findById: jest.fn(), findByEmail: jest.fn(), create: jest.fn() } as any;
  const fakeContacts = { findByPhone: jest.fn(), createForUser: jest.fn() } as any;
  const fakeTickets = { findOpenWhatsappByContact: jest.fn() } as any;
  const fakeMessages = { findByWhatsappMessageId: jest.fn(), create: jest.fn() } as any;
  const fakeR2 = { isEnabled: jest.fn().mockReturnValue(false), buildKey: jest.fn(), putObject: jest.fn() } as any;
  const fakeCreateTicket = { execute: jest.fn().mockResolvedValue({ id: 't1' }) } as any;
  const fakeCreateMessage = { execute: jest.fn() } as any;
  const fakeHasher = { hash: jest.fn().mockResolvedValue('h') } as any;

  const svc = new WhatsappInboundService(
    fakeConfig,
    fakeUsers,
    fakeContacts,
    fakeTickets,
    fakeMessages,
    fakeR2,
    fakeCreateTicket,
    fakeCreateMessage,
    fakeHasher,
  );

  it('should skip when empty messages', async () => {
    await expect(svc.processWebhook({} as any)).resolves.toBeUndefined();
  });
});
