import { Module } from '@nestjs/common';
import { StatusMonitorModule } from 'nestjs-status-monitor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PolkadotBalanceAnalysisModule } from './polkadot-balance/polkadot-balance-analysis.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    StatusMonitorModule.forRoot(), 
    PolkadotBalanceAnalysisModule,
    ScheduleModule.forRoot(),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
