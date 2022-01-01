import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpCacheInterceptor } from 'src/common/interceptor/HttpCacheInterceptor';
import { AccountDetailRequest } from 'src/viewModel/polkadot-balance/AccountDetailRequest';
import { AccountDetailResponse } from 'src/viewModel/polkadot-balance/AccountDetailResponse';
import { AccountSimpleRequest } from 'src/viewModel/polkadot-balance/AccountSimpleRequest';
import { AccountSimpleResponse } from 'src/viewModel/polkadot-balance/AccountSimpleResponse';
import { AccountsRequest } from 'src/viewModel/polkadot-balance/AccountsRequest';
import { AccountsResponse } from 'src/viewModel/polkadot-balance/AccountsResponse';
import { PolkadotBalanceAnalysisService } from './polkadot-balance-analysis.service';

@UseInterceptors(HttpCacheInterceptor)
@Controller('polkadot-balance-analysis')
export class PolkadotBalanceAnalysisController {
  constructor(private readonly service: PolkadotBalanceAnalysisService) {}

  @Post('/getAccounts')
  @ApiOperation({
    summary: 'get account list;获取所有在polkadot链上的账户列表',
  })
  @ApiOkResponse({ type: AccountsResponse })
  getAccounts(@Body() request: AccountsRequest): Promise<AccountsResponse> {
    return this.service.getAccounts(request);
  }

  @Post('/getAccountSimple')
  @ApiOperation({ summary: 'get account simple information;获取账户基本信息' })
  @ApiOkResponse({ type: AccountSimpleResponse })
  getAccountSimple(
    @Body() request: AccountSimpleRequest,
  ): Promise<AccountSimpleResponse> {
    return this.service.getAccountSimple(request);
  }

  @Post('/getAccountDetail')
  @ApiOperation({
    summary: 'get account detail;获取账户详细信息， 包含历史活动记录',
  })
  @ApiOkResponse({ type: AccountDetailResponse })
  getAccountDetail(
    @Body() request: AccountDetailRequest,
  ): Promise<AccountDetailResponse> {
    return this.service.getAccountDetail(request);
  }
}
