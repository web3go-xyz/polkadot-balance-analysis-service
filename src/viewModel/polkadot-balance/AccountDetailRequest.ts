import { ApiProperty } from '@nestjs/swagger';

export class AccountDetailRequest {
  @ApiProperty({ default: '' })
  account_id: string;

  @ApiProperty()
  time_start: Date;

  @ApiProperty()
  time_end: Date;

  @ApiProperty()
  include_transfers: boolean;
}
