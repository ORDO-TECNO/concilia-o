import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('estende AuthGuard("jwt-access")', () => {
    // Verify that JwtAuthGuard is a subclass of the passport guard for 'jwt-access'.
    // This ensures the guard is wired to the correct strategy name.
    const JwtPassportGuard = AuthGuard('jwt-access');
    expect(JwtAuthGuard.prototype).toBeInstanceOf(JwtPassportGuard);
  });

  it('pode ser instanciado', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });
});
