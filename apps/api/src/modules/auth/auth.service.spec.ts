import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  avatarUrl: string | null;
}

function buildPrismaMock(overrides: {
  findByGoogle?: UserRow | null;
  findByEmail?: UserRow | null;
}) {
  const findUnique = jest.fn(({ where }: { where: { googleId?: string; email?: string } }) => {
    if (where.googleId !== undefined) {
      return Promise.resolve(overrides.findByGoogle ?? null);
    }
    return Promise.resolve(overrides.findByEmail ?? null);
  });
  const update = jest.fn(({ data }: { data: Partial<UserRow> }) =>
    Promise.resolve({ ...(overrides.findByEmail as UserRow), ...data }),
  );
  const create = jest.fn(({ data }: { data: Partial<UserRow> }) =>
    Promise.resolve({ id: 'new-user', avatarUrl: null, googleId: null, ...data }),
  );

  const prisma = { user: { findUnique, update, create } } as unknown as PrismaService;
  return { prisma, findUnique, update, create };
}

function makeService(prisma: PrismaService): AuthService {
  return new AuthService(prisma, {} as never, {} as never);
}

const baseProfile = {
  googleId: 'google-123',
  email: 'user@example.com',
  emailVerified: true,
  name: 'Fulano',
  avatarUrl: 'https://pic/avatar.png',
};

describe('AuthService.validateGoogleUser', () => {
  it('retorna o usuário existente quando o googleId já bate (login recorrente)', async () => {
    const existing: UserRow = {
      id: 'u1',
      name: 'Fulano',
      email: 'user@example.com',
      passwordHash: null,
      googleId: 'google-123',
      avatarUrl: null,
    };
    const { prisma, update, create } = buildPrismaMock({ findByGoogle: existing });
    const service = makeService(prisma);

    const result = await service.validateGoogleUser(baseProfile);

    expect(result).toBe(existing);
    expect(update).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('vincula ao usuário existente quando o e-mail verificado bate', async () => {
    const existingByEmail: UserRow = {
      id: 'u2',
      name: 'Fulano',
      email: 'user@example.com',
      passwordHash: 'hash',
      googleId: null,
      avatarUrl: null,
    };
    const { prisma, update, create } = buildPrismaMock({
      findByGoogle: null,
      findByEmail: existingByEmail,
    });
    const service = makeService(prisma);

    const result = await service.validateGoogleUser(baseProfile);

    expect(update).toHaveBeenCalledWith({
      where: { id: 'u2' },
      data: { googleId: 'google-123', avatarUrl: 'https://pic/avatar.png' },
    });
    expect(create).not.toHaveBeenCalled();
    expect(result.googleId).toBe('google-123');
  });

  it('NÃO vincula em e-mail não verificado — cria novo usuário', async () => {
    const existingByEmail: UserRow = {
      id: 'u3',
      name: 'Fulano',
      email: 'user@example.com',
      passwordHash: 'hash',
      googleId: null,
      avatarUrl: null,
    };
    const { prisma, findUnique, update, create } = buildPrismaMock({
      findByGoogle: null,
      findByEmail: existingByEmail,
    });
    const service = makeService(prisma);

    const result = await service.validateGoogleUser({ ...baseProfile, emailVerified: false });

    // não deve nem consultar por e-mail quando não verificado
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
    expect(result.id).toBe('new-user');
  });

  it('cria um novo usuário sem senha quando não há match algum', async () => {
    const { prisma, create } = buildPrismaMock({ findByGoogle: null, findByEmail: null });
    const service = makeService(prisma);

    const result = await service.validateGoogleUser(baseProfile);

    expect(create).toHaveBeenCalledWith({
      data: {
        name: 'Fulano',
        email: 'user@example.com',
        googleId: 'google-123',
        avatarUrl: 'https://pic/avatar.png',
        passwordHash: null,
      },
    });
    expect(result.id).toBe('new-user');
  });
});
