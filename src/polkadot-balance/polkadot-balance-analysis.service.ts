import { Inject, Injectable } from '@nestjs/common';
import {
  Between,
  FindConditions,
  FindManyOptions,
  FindOneOptions,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { RepositoryConsts } from 'src/common/orm/repositoryConsts';

import { PageRequest } from 'src/viewModel/base/pageRequest';

import { MyLogger } from 'src/common/log/logger.service';
import { FunctionExt } from 'src/common/utility/functionExt';
import { Accounts } from 'src/common/entity/PolkadotBalanceModule/Accounts';
import { AccountsRequest } from 'src/viewModel/polkadot-balance/AccountsRequest';
import { AccountsResponse } from 'src/viewModel/polkadot-balance/AccountsResponse';
import { AccountDetailRequest } from 'src/viewModel/polkadot-balance/AccountDetailRequest';
import { AccountDetailResponse } from 'src/viewModel/polkadot-balance/AccountDetailResponse';
import { AccountSimpleRequest } from 'src/viewModel/polkadot-balance/AccountSimpleRequest';
import { AccountSimpleResponse } from 'src/viewModel/polkadot-balance/AccountSimpleResponse';
import { Transfers } from 'src/common/entity/PolkadotBalanceModule/Transfers';
@Injectable()
export class PolkadotBalanceAnalysisService {
  async getAccounts(request: AccountsRequest): Promise<AccountsResponse> {
    let findOption: FindManyOptions<Accounts> = {
      take: PageRequest.getTake(request),
      skip: PageRequest.getSkip(request),
      order: {
        id: 'ASC',
      },
    };
    if (request.filter_account_id) {
      findOption.where = {
        id: request.filter_account_id,
      };
    }
    let result = await this.accountRepository.findAndCount(findOption);

    let resp: AccountsResponse = { list: result[0], totalCount: result[1] };

    return resp;
  }

  async getAccountSimple(
    request: AccountSimpleRequest,
  ): Promise<AccountSimpleResponse> {
    let findOption: FindOneOptions<Accounts> = {
      where: {
        id: request.account_id,
      },
    };

    let result = await this.accountRepository.findOne(findOption);

    let resp: AccountSimpleResponse = { account: result };

    return resp;
  }

  async getAccountDetail(
    request: AccountDetailRequest,
  ): Promise<AccountDetailResponse> {
    let findOption: FindOneOptions<Accounts> = {
      where: {
        id: request.account_id,
      },
    };

    let result = await this.accountRepository.findOne(findOption);

    let resp: AccountDetailResponse = {
      account: result,
      time_start: request.time_start,
      time_end: request.time_end,
      transfers: [],
    };

    if (request.include_transfers) {
      //from
      let transfers_from = await this.transfersRepository.find({
        where: {
          fromAccountId: request.account_id,
          timestamp: Between(request.time_start, request.time_end),
        },
        order: { timestamp: 'ASC' },
      });

      //to
      let transfers_to = await this.transfersRepository.find({
        where: {
          toAccountId: request.account_id,
          timestamp: Between(request.time_start, request.time_end),
        },
        order: { timestamp: 'ASC' },
      });

      let transfers: Transfers[] = [];
      if (transfers_from) {
        transfers_from.forEach((t) => {
          transfers.push(t);
        });
      }
      if (transfers_to) {
        transfers_to.forEach((t) => {
          transfers.push(t);
        });
      }

      transfers = transfers.sort((a, b) => {
        return a.timestamp.getTime() - b.timestamp.getTime();
      });

      resp.transfers = transfers;
    }

    //TODO
    return resp;
  }

  constructor(
    @Inject(RepositoryConsts.POLKADOT_BALANCE_ACCOUNT_REPOSITORY)
    private accountRepository: Repository<Accounts>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_TRANSFERS_REPOSITORY)
    private transfersRepository: Repository<Transfers>,
  ) {}
}
