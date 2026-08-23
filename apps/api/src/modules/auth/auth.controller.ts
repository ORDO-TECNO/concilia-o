import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import type { GoogleUserProfile } from './strategies/google.strategy';

// Tighter limit for auth mutation routes: 10 attempts per minute per IP.
// Prevents brute-force attacks on login, registration, and token refresh.
const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Throttle(AUTH_THROTTLE)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, refreshExpiresAt, ...result } = await this.authService.register(dto);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return result;
  }

  @Throttle(AUTH_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, refreshExpiresAt, ...result } = await this.authService.login(dto);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return result;
  }

  @Throttle(AUTH_THROTTLE)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    const { refreshToken, refreshExpiresAt, ...result } = await this.authService.refresh(raw);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(raw);
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return { success: true };
  }

  // Início do fluxo OAuth: o AuthGuard('google') dispara o redirect para o Google.
  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  googleAuth() {
    // O guard cuida do redirect; nada a fazer aqui.
  }

  @SkipThrottle()
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleUserProfile;
    const user = await this.authService.validateGoogleUser(profile);
    const { refreshToken, refreshExpiresAt } = await this.authService.issueSessionForUser(user);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);

    // Handoff sem token na URL: o cookie httpOnly de refresh já foi setado no
    // domínio da API; a página web /auth/callback chama refreshAccessToken()
    // para obter o access token a partir dele.
    const webAppUrl =
      this.config.get<string>('WEB_APP_URL') ??
      this.config.get<string>('CORS_ORIGIN')?.split(',')[0] ??
      'http://localhost:3000';
    res.redirect(`${webAppUrl}/auth/callback`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.userId);
  }

  private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      // In production (Vercel web → Railway API), the request is cross-site,
      // so sameSite must be 'none' + secure for the browser to send the cookie.
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      expires: expiresAt,
    });
  }
}
