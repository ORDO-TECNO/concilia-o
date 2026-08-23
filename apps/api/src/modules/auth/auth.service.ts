import { randomUUID, createHash } from 'crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
    });

    const { refreshTokenId: _refreshTokenId, ...tokens } = await this.issueTokens(
      user.id,
      user.email,
    );
    return { user: this.toPublicUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Usuário só-Google não tem passwordHash — cai no mesmo erro genérico, sem
    // passar null para o bcrypt.compare (que lançaria).
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const { refreshTokenId: _refreshTokenId, ...tokens } = await this.issueTokens(
      user.id,
      user.email,
    );
    return { user: this.toPublicUser(user), ...tokens };
  }

  /**
   * Resolve o usuário de um login Google, aplicando a regra de vínculo de conta.
   *
   * Ordem:
   *   1. Usuário com este `googleId` já existe → retorna (login recorrente).
   *   2. Só se o e-mail Google for verificado, procura por e-mail. Se existir,
   *      vincula o `googleId` (e preenche `avatarUrl` se estiver vazio) e retorna.
   *   3. Caso contrário, cria um novo usuário sem senha (`passwordHash: null`).
   *
   * Nunca vincula em e-mail Google não verificado — evita tomada de conta.
   */
  async validateGoogleUser(profile: {
    googleId: string;
    email: string;
    emailVerified: boolean;
    name: string;
    avatarUrl?: string;
  }) {
    const existingByGoogle = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (existingByGoogle) {
      return existingByGoogle;
    }

    if (profile.emailVerified) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });
      if (existingByEmail) {
        return this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: existingByEmail.avatarUrl ?? profile.avatarUrl ?? null,
          },
        });
      }
    }

    return this.prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        avatarUrl: profile.avatarUrl ?? null,
        passwordHash: null,
      },
    });
  }

  /** Emite access + refresh para um usuário já resolvido (ex.: callback OAuth). */
  async issueSessionForUser(user: { id: string; name: string; email: string }) {
    const { refreshTokenId: _refreshTokenId, ...tokens } = await this.issueTokens(
      user.id,
      user.email,
    );
    return { user: this.toPublicUser(user), ...tokens };
  }

  async refresh(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token ausente');
    }

    let payload: { sub: string; jti: string };
    try {
      payload = this.jwt.verify(rawRefreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { id: payload.jti } });
    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.revokedAt) {
      // Reuso de token já revogado — possível comprometimento. Revoga tudo do usuário.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token já utilizado. Faça login novamente.');
    }

    if (stored.expiresAt < new Date() || stored.tokenHash !== hashToken(rawRefreshToken)) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    const tokens = await this.issueTokens(user.id, user.email);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: tokens.refreshTokenId },
    });

    const { refreshTokenId: _refreshTokenId, ...publicTokens } = tokens;
    return { user: this.toPublicUser(user), ...publicTokens };
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    try {
      const payload = this.jwt.verify<{ jti: string }>(rawRefreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // token já inválido/expirado — nada a revogar
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: { include: { company: true } } },
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      ...this.toPublicUser(user),
      companies: user.companies.map((uc) => ({
        id: uc.company.id,
        name: uc.company.name,
        role: uc.role,
      })),
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<IssuedTokens & { refreshTokenId: string }> {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m',
      },
    );

    const jti = randomUUID();
    const expiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
    const refreshToken = this.jwt.sign(
      { sub: userId, jti },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn,
      },
    );

    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    const refreshExpiresAt = new Date(decoded.exp * 1000);

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: refreshExpiresAt,
      },
    });

    return { accessToken, refreshToken, refreshExpiresAt, refreshTokenId: jti };
  }

  private toPublicUser(user: { id: string; name: string; email: string }) {
    return { id: user.id, name: user.name, email: user.email };
  }
}
