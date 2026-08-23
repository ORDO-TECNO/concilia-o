import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { CompanyAccessGuard } from './company-access.guard';
import { PrismaService } from '../../prisma/prisma.service';

function buildContext(params: Record<string, string> = {}, user: Record<string, string> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ params, user }),
    }),
  } as unknown as ExecutionContext;
}

function buildPrisma(membership: { userId: string; companyId: string } | null): jest.Mocked<PrismaService> {
  return {
    userCompany: {
      findUnique: jest.fn().mockResolvedValue(membership),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

describe('CompanyAccessGuard', () => {
  it('permite acesso quando o usuário pertence à empresa', async () => {
    const prisma = buildPrisma({ userId: 'u1', companyId: 'c1' });
    const guard = new CompanyAccessGuard(prisma);
    const ctx = buildContext({ companyId: 'c1' }, { userId: 'u1' });

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(prisma.userCompany.findUnique).toHaveBeenCalledWith({
      where: { userId_companyId: { userId: 'u1', companyId: 'c1' } },
    });
  });

  it('lança ForbiddenException quando o usuário não é membro da empresa', async () => {
    const prisma = buildPrisma(null);
    const guard = new CompanyAccessGuard(prisma);
    const ctx = buildContext({ companyId: 'c1' }, { userId: 'u1' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lança ForbiddenException quando companyId está ausente', async () => {
    const prisma = buildPrisma(null);
    const guard = new CompanyAccessGuard(prisma);
    // No companyId in params.
    const ctx = buildContext({}, { userId: 'u1' });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    // Should not even query the DB.
    expect(prisma.userCompany.findUnique).not.toHaveBeenCalled();
  });

  it('lança ForbiddenException quando userId está ausente', async () => {
    const prisma = buildPrisma(null);
    const guard = new CompanyAccessGuard(prisma);
    // No userId in user object.
    const ctx = buildContext({ companyId: 'c1' }, {});

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.userCompany.findUnique).not.toHaveBeenCalled();
  });
});
