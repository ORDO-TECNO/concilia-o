import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PartiesModule } from './modules/parties/parties.module';
import { ImportsModule } from './modules/imports/imports.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ClassificationRulesModule } from './modules/classification-rules/classification-rules.module';
import { DfcModule } from './modules/dfc/dfc.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

const REQUIRED_ENV_VARS = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
  'CORS_ORIGIN',
] as const;

function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED_ENV_VARS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `API cannot start — missing required environment variables: ${missing.join(', ')}. ` +
        'Check your .env file or deployment environment.',
    );
  }
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      validate: validateEnv,
    }),
    // Global rate limit: 100 requests per 60 seconds per IP.
    // Auth mutation routes override this with a tighter limit (see AuthController).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    BankAccountsModule,
    CategoriesModule,
    PartiesModule,
    ImportsModule,
    TransactionsModule,
    ClassificationRulesModule,
    DfcModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    // Apply ThrottlerGuard globally so every route is protected by default.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
