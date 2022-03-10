import { CacheModule, Module } from '@nestjs/common';
import { databaseProviders_kusama_balance } from 'src/common/orm/database.providers.v2';
import { repositoryProviders_kusama_balance } from 'src/common/orm/repository.providers.v2';

import { PolkadotBalanceAnalysisController } from './polkadot-balance-analysis.controller';
import { PolkadotBalanceAnalysisService } from './polkadot-balance-analysis.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
    }),
  ],
  controllers: [PolkadotBalanceAnalysisController],
  providers: [
    ...databaseProviders_kusama_balance,
    ...repositoryProviders_kusama_balance,
    PolkadotBalanceAnalysisService,
  ],
})
export class PolkadotBalanceAnalysisModule {}
