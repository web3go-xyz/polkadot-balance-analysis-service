import { Module } from '@nestjs/common';
import { StatusMonitorModule } from 'nestjs-status-monitor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PolkadotBalanceAnalysisModule } from './rmrk-analysis/polkadot-balance-analysis.module';
@Module({
  imports: [StatusMonitorModule.forRoot(), PolkadotBalanceAnalysisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
