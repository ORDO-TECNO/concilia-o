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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
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
