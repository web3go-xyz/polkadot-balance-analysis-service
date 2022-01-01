import { ApiProperty } from '@nestjs/swagger';
import { Accounts } from 'src/common/entity/PolkadotBalanceModule/Accounts';
import { Transfers } from 'src/common/entity/PolkadotBalanceModule/Transfers';
import { TransactionTypeEnum } from './TransactionTypeEnum';

export class AccountDetailResponse {
  @ApiProperty({ default: '' })
  account: Accounts;

  @ApiProperty()
  time_start: Date;

  @ApiProperty()
  time_end: Date;

  @ApiProperty()
  transactions: TransactionType[];
}
export class TransactionType {
  @ApiProperty()
  type: TransactionTypeEnum;
  list: any[];
}
