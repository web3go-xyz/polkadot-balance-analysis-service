import { ApiProperty } from '@nestjs/swagger';
import { Accounts } from 'src/common/entity/PolkadotBalanceModule/Accounts';
import { PageResponse } from '../base/pageResponse';

export class AccountsResponse extends PageResponse {
  @ApiProperty()
  list: Accounts[];
}
