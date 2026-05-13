import { JwtTokenService } from '../core/infrastructure/auth/auth.adapters';
import { JwtService } from '@nestjs/jwt';

describe('JwtTokenService', () => {
  const jwtService = new JwtService({ secret: 'test' });
  const svc = new JwtTokenService(jwtService);

  it('should sign and verify token', () => {
    const token = svc.sign({ sub: 'u1', role: 'AGENT', email: 'a@x.com' });
    const decoded = svc.verify(token) as any;
    expect(decoded.sub).toBe('u1');
    expect(decoded.role).toBe('AGENT');
  });
});
