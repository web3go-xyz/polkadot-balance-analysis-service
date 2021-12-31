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
import { PolkadotBalanceAnalysisService } from './polkadot-balance-analysis.service';

@UseInterceptors(HttpCacheInterceptor)
@Controller('polkadot-balance-analysis')
export class PolkadotBalanceAnalysisController {
  constructor(private readonly service: PolkadotBalanceAnalysisService) {}

  //  @Post('/getCollections')
  // @ApiOperation({ summary: 'get basic info of collection list;' })
  // @ApiOkResponse({ type: CollectionResponse })
  // getCollections(@Body() request: CollectionRequest): Promise<CollectionResponse> {
  //   return this.service.getCollections(request);
  // }
}
