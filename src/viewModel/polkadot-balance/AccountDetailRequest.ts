import { ApiProperty } from '@nestjs/swagger';

export class AccountDetailRequest {
  @ApiProperty({ default: '' })
  account_id: string;

  @ApiProperty()
  time_start: Date;

  @ApiProperty()
  time_end: Date;

  @ApiProperty({ default: false })
  include_transactions_detail: boolean;
}
