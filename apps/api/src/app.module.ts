import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
})
export class AppModule {}
