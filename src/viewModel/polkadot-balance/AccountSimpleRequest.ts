import { ApiProperty } from '@nestjs/swagger';

export class AccountSimpleRequest {
  @ApiProperty({ default: '' })
  account_id: string;
}
