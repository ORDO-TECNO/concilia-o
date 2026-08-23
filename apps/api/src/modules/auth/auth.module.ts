import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Só registra a estratégia Google quando as credenciais existem, para que a API
// suba localmente sem elas. Um POST em /auth/google sem a estratégia registrada
// retorna 401/500 do Passport, sem derrubar o boot.
const googleStrategyProvider: Provider = {
  provide: GoogleStrategy,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const hasCredentials =
      config.get<string>('GOOGLE_CLIENT_ID') &&
      config.get<string>('GOOGLE_CLIENT_SECRET') &&
      config.get<string>('GOOGLE_CALLBACK_URL');
    return hasCredentials ? new GoogleStrategy(config) : null;
  },
};

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, googleStrategyProvider],
  exports: [AuthService],
})
export class AuthModule {}
