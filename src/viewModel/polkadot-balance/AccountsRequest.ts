import { ApiProperty } from '@nestjs/swagger';
import { PageRequest } from '../base/pageRequest';

export class AccountsRequest extends PageRequest {
  @ApiProperty({ default: '' })
  filter_account_id: string;
}
