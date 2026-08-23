import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';

// ─── shared types ────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  avatarUrl: string | null;
}

interface RefreshTokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
}

// ─── mock builders ───────────────────────────────────────────────────────────

function buildJwtMock(overrides: {
  accessToken?: string;
  refreshToken?: string;
  refreshJti?: string;
  refreshExp?: number;
  verifyPayload?: { sub: string; jti: string };
  verifyError?: Error;
} = {}): jest.Mocked<JwtService> {
  const jti = overrides.refreshJti ?? 'test-jti-uuid';
  const exp = overrides.refreshExp ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  return {
    sign: jest.fn().mockImplementation((_payload: unknown, opts: { secret?: string }) => {
      // The first sign call is for the access token, second for the refresh token.
      if (opts?.secret?.includes('access') || opts?.secret === 'test-access-secret') {
        return overrides.accessToken ?? 'mock-access-token';
      }
      return overrides.refreshToken ?? 'mock-refresh-token';
    }),
    decode: jest.fn().mockReturnValue({ exp, jti }),
    verify: jest.fn().mockImplementation(() => {
      if (overrides.verifyError) throw overrides.verifyError;
      return overrides.verifyPayload ?? { sub: 'u1', jti };
    }),
  } as unknown as jest.Mocked<JwtService>;
}

function buildConfigMock(): jest.Mocked<ConfigService> {
  return {
    get: jest.fn().mockImplementation((key: string) => {
      const map: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '30d',
      };
      return map[key];
    }),
  } as unknown as jest.Mocked<ConfigService>;
}

function buildPrismaForAuth(opts: {
  user?: UserRow | null;
  refreshToken?: RefreshTokenRow | null;
} = {}): jest.Mocked<PrismaService> {
  const user = opts.user ?? null;
  const storedToken = opts.refreshToken ?? null;

  return {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      create: jest.fn().mockImplementation(({ data }: { data: Partial<UserRow> }) =>
        Promise.resolve({ id: 'new-user', googleId: null, avatarUrl: null, ...data }),
      ),
      update: jest.fn().mockImplementation(({ data }: { data: Partial<UserRow> }) =>
        Promise.resolve({ ...user, ...data }),
      ),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(storedToken),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: null,
    googleId: null,
    avatarUrl: null,
    ...overrides,
  };
}

function makeRefreshToken(overrides: Partial<RefreshTokenRow> = {}): RefreshTokenRow {
  return {
    id: 'test-jti-uuid',
    userId: 'u1',
    tokenHash: 'some-hash',
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    revokedAt: null,
    replacedBy: null,
    ...overrides,
  };
}

function makeService(
  prisma: jest.Mocked<PrismaService>,
  jwt: jest.Mocked<JwtService> = buildJwtMock(),
  config: jest.Mocked<ConfigService> = buildConfigMock(),
): AuthService {
  return new AuthService(prisma, jwt, config);
}

// ─── AuthService.register ────────────────────────────────────────────────────

describe('AuthService.register', () => {
  it('cria usuário e retorna tokens quando o e-mail não existe', async () => {
    const prisma = buildPrismaForAuth({ user: null });
    // After creation, findUnique returns null (no existing user), create returns new user.
    const createdUser = makeUser({ passwordHash: 'hashed' });
    (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

    const service = makeService(prisma);
    const result = await service.register({ name: 'Test User', email: 'test@example.com', password: 'password123' });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ email: 'test@example.com' }) }),
    );
    expect(result.user).toMatchObject({ id: 'u1', email: 'test@example.com' });
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('lança ConflictException quando o e-mail já está cadastrado', async () => {
    const prisma = buildPrismaForAuth({ user: makeUser() });
    const service = makeService(prisma);

    await expect(
      service.register({ name: 'Dup', email: 'test@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

// ─── AuthService.login ───────────────────────────────────────────────────────

describe('AuthService.login', () => {
  beforeEach(() => {
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retorna tokens em login com senha correta', async () => {
    const user = makeUser({ passwordHash: 'bcrypt-hash' });
    const prisma = buildPrismaForAuth({ user });
    const service = makeService(prisma);

    const result = await service.login({ email: 'test@example.com', password: 'password123' });

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'bcrypt-hash');
    expect(result.user).toMatchObject({ id: 'u1' });
    expect(result.accessToken).toBeDefined();
  });

  it('lança UnauthorizedException quando o usuário não existe', async () => {
    const prisma = buildPrismaForAuth({ user: null });
    const service = makeService(prisma);

    await expect(
      service.login({ email: 'ghost@example.com', password: 'pass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException quando a senha está errada', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);
    const user = makeUser({ passwordHash: 'bcrypt-hash' });
    const prisma = buildPrismaForAuth({ user });
    const service = makeService(prisma);

    await expect(
      service.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o usuário é só-Google (sem passwordHash), sem chamar bcrypt', async () => {
    // User exists but has no passwordHash (Google-only account).
    const user = makeUser({ passwordHash: null });
    const prisma = buildPrismaForAuth({ user });
    const service = makeService(prisma);

    await expect(
      service.login({ email: 'test@example.com', password: 'any' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    // bcrypt.compare must NOT be called — passing null to it would crash.
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
});

// ─── AuthService.refresh ─────────────────────────────────────────────────────

describe('AuthService.refresh', () => {
  it('emite novos tokens e revoga o token antigo (rotação)', async () => {
    const stored = makeRefreshToken();
    const user = makeUser();
    const prisma = buildPrismaForAuth({ user, refreshToken: stored });
    // Verify returns a valid payload; the tokenHash check uses sha256 of the raw token.
    // We bypass the hash check by making the stored token's hash match sha256('mock-refresh-token').
    const { createHash } = await import('crypto');
    const correctHash = createHash('sha256').update('mock-refresh-token').digest('hex');
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
      ...stored,
      tokenHash: correctHash,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

    const jwt = buildJwtMock({ verifyPayload: { sub: 'u1', jti: 'test-jti-uuid' } });
    const service = makeService(prisma, jwt);

    const result = await service.refresh('mock-refresh-token');

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    // Old token must be revoked and linked to the new one.
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-jti-uuid' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('lança UnauthorizedException quando o refresh token está ausente', async () => {
    const prisma = buildPrismaForAuth();
    const service = makeService(prisma);

    await expect(service.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o JWT é inválido/expirado', async () => {
    const prisma = buildPrismaForAuth();
    const jwt = buildJwtMock({ verifyError: new Error('jwt expired') });
    const service = makeService(prisma, jwt);

    await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o token não existe no banco', async () => {
    const prisma = buildPrismaForAuth({ refreshToken: null });
    const service = makeService(prisma);

    await expect(service.refresh('mock-refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('detecção de reuso: token já revogado → revoga toda a família e lança', async () => {
    // Token with revokedAt set = already used.
    const stored = makeRefreshToken({ revokedAt: new Date(Date.now() - 1000) });
    const prisma = buildPrismaForAuth({ refreshToken: stored });
    const service = makeService(prisma);

    await expect(service.refresh('mock-refresh-token')).rejects.toBeInstanceOf(UnauthorizedException);

    // Entire family for the user must be revoked.
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'u1', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });
});

// ─── AuthService.logout ──────────────────────────────────────────────────────

describe('AuthService.logout', () => {
  it('revoga o token apresentado', async () => {
    const prisma = buildPrismaForAuth();
    const jwt = buildJwtMock({ verifyPayload: { sub: 'u1', jti: 'test-jti-uuid' } });
    const service = makeService(prisma, jwt);

    await service.logout('mock-refresh-token');

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'test-jti-uuid', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('não lança quando o token está ausente (logout gracioso)', async () => {
    const prisma = buildPrismaForAuth();
    const service = makeService(prisma);

    await expect(service.logout(undefined)).resolves.toBeUndefined();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('não lança quando o token JWT é inválido (já expirado)', async () => {
    const prisma = buildPrismaForAuth();
    const jwt = buildJwtMock({ verifyError: new Error('jwt expired') });
    const service = makeService(prisma, jwt);

    await expect(service.logout('stale-token')).resolves.toBeUndefined();
  });
});

// ─── AuthService.validateGoogleUser ─────────────────────────────────────────
// (original tests kept below — they test the Google linking logic)

function buildPrismaMockForGoogle(overrides: {
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

  return {
    prisma: { user: { findUnique, update, create } } as unknown as PrismaService,
    findUnique,
    update,
    create,
  };
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
    const { prisma, update, create } = buildPrismaMockForGoogle({ findByGoogle: existing });
    const service = new AuthService(prisma, {} as never, {} as never);

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
    const { prisma, update, create } = buildPrismaMockForGoogle({
      findByGoogle: null,
      findByEmail: existingByEmail,
    });
    const service = new AuthService(prisma, {} as never, {} as never);

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
    const { prisma, findUnique, update, create } = buildPrismaMockForGoogle({
      findByGoogle: null,
      findByEmail: existingByEmail,
    });
    const service = new AuthService(prisma, {} as never, {} as never);

    const result = await service.validateGoogleUser({ ...baseProfile, emailVerified: false });

    // não deve nem consultar por e-mail quando não verificado
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
    expect(result.id).toBe('new-user');
  });

  it('cria um novo usuário sem senha quando não há match algum', async () => {
    const { prisma, create } = buildPrismaMockForGoogle({ findByGoogle: null, findByEmail: null });
    const service = new AuthService(prisma, {} as never, {} as never);

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
