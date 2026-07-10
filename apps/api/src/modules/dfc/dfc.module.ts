import { Module } from '@nestjs/common';
import { DfcController } from './dfc.controller';
import { DfcService } from './dfc.service';

@Module({
  controllers: [DfcController],
  providers: [DfcService],
  exports: [DfcService],
})
export class DfcModule {}
