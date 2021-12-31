import { Inject, Injectable } from '@nestjs/common';
import {
  FindConditions,
  FindManyOptions,
  In,
  IsNull,
  Like,
  Not,
  Repository,
} from 'typeorm';
import { RepositoryConsts } from 'src/common/orm/repositoryConsts';

import { PageRequest } from 'src/viewModel/base/pageRequest';

import { MyLogger } from 'src/common/log/logger.service';
import { FunctionExt } from 'src/common/utility/functionExt';
import { Accounts } from 'src/common/entity/PolkadotBalanceModule/Accounts';
@Injectable()
export class PolkadotBalanceAnalysisService {
  
  constructor(
    @Inject(RepositoryConsts.POLKADOT_BALANCE_ACCOUNT_REPOSITORY)
    private accountRepository: Repository<Accounts>,
  ) {}

  // //OK
  // async getNFTs(request: NFTRequest): Promise<NFTResponse> {
  //   let where: FindConditions<NFTEntities> = {
  //     collectionId: request.collection_id,
  //     burned: false,
  //   };
  //   if (request.nft_name) {
  //     where.name = Like('%' + request.nft_name + '%');
  //   }

  //   let response: NFTResponse = new NFTResponse();

  //   response.totalCount = await this.nftRepository.count({ where: where });

  //   if (response.totalCount > 0) {
  //     let records: NFTEntities[] = await this.nftRepository.find({
  //       select: [
  //         'id',
  //         'collectionId',
  //         'name',
  //         'sn',
  //         'instance',
  //         'price',
  //         'timestampCreatedAt',
  //       ],
  //       where: where,
  //       order: PageRequest.getOrderBy(request),
  //       skip: PageRequest.getSkip(request),
  //       take: PageRequest.getTake(request),
  //     });
  //     if (records) {
  //       records.forEach((d) => {
  //         response.list.push(d);
  //       });
  //     }
  //   }
  //   return response;
  // }

  // //OK
  // async getNFT(request: NFTDetailRequest): Promise<NFTDetailResponse> {
  //   let response: NFTDetailResponse = new NFTDetailResponse();

  //   let record: NFTEntities = await this.nftRepository.findOne({
  //     where: {
  //       id: request.nft_id,
  //     },
  //   });
  //   if (record) {
  //     response = {
  //       ...record,
  //     };
  //   }
  //   return response;
  // }
}
