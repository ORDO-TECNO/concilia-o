import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      // Credenciais opcionais no boot (ver .env.example); só falham quando
      // alguém realmente tenta o fluxo Google sem configurá-las.
      throw new InternalServerErrorException(
        'Login com Google não configurado — defina GOOGLE_CLIENT_ID, ' +
          'GOOGLE_CLIENT_SECRET e GOOGLE_CALLBACK_URL.',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value ?? profile._json.email;
    if (!email) {
      done(new InternalServerErrorException('Conta Google sem e-mail'), undefined);
      return;
    }

    // `_json.email_verified` (do ID token) é a fonte confiável do status de
    // verificação — o campo `verified` do array `emails` vem como string.
    const user: GoogleUserProfile = {
      googleId: profile.id,
      email,
      emailVerified: profile._json.email_verified === true,
      name: profile.displayName || email,
      avatarUrl: profile.photos?.[0]?.value,
    };
    done(null, user);
  }
}
