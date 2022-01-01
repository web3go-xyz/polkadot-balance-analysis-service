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
import { TransactionTypeEnum } from 'src/viewModel/polkadot-balance/TransactionTypeEnum';
import { ReservRepatriateds } from 'src/common/entity/PolkadotBalanceModule/ReservRepatriateds';
import { Slashes } from 'src/common/entity/PolkadotBalanceModule/Slashes';
import { Withdraws } from 'src/common/entity/PolkadotBalanceModule/Withdraws';
import { Unreserveds } from 'src/common/entity/PolkadotBalanceModule/Unreserveds';
import { Reserveds } from 'src/common/entity/PolkadotBalanceModule/Reserveds';
import { Deposits } from 'src/common/entity/PolkadotBalanceModule/Deposits';
import { BalanceSets } from 'src/common/entity/PolkadotBalanceModule/BalanceSets';
import { Endoweds } from 'src/common/entity/PolkadotBalanceModule/Endoweds';
import { AccountSnapshots } from 'src/common/entity/PolkadotBalanceModule/AccountSnapshots';
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
      transactions: [],
    };

    if (request.include_transactions_detail) {
      // //Endowed
      let endowed: Endoweds[] = await this.getEndowed(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.Endowed,
        list: endowed,
      });

      // //Transfer
      let transfers: Transfers[] = await this.getTransfers(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.Transfer,
        list: transfers,
      });

      // BalanceSet;
      let balanceSet: BalanceSets[] = await this.getBalanceSet(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.BalanceSet,
        list: balanceSet,
      });
      // Deposit;
      let deposit: Deposits[] = await this.getDeposit(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.Deposit,
        list: deposit,
      });

      // Reserved;
      let reserved: Reserveds[] = await this.getReserved(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.Reserved,
        list: reserved,
      });

      // Unreserved;
      let unreserved: Unreserveds[] = await this.getUnreserved(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.Unreserved,
        list: unreserved,
      });

      // Withdraw;
      let withdraw: Withdraws[] = await this.getWithdraw(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.Withdraw,
        list: withdraw,
      });

      // Slash;
      let slash: Slashes[] = await this.getSlash(
        request.account_id,
        request.time_start,
        request.time_end,
      );
      resp.transactions.push({
        type: TransactionTypeEnum.Slash,
        list: slash,
      });

      // ReservRepatriated;
      let reservRepatriated: ReservRepatriateds[] =
        await this.getReservRepatriated(
          request.account_id,
          request.time_start,
          request.time_end,
        );
      resp.transactions.push({
        type: TransactionTypeEnum.ReservRepatriated,
        list: reservRepatriated,
      });
    }

    return resp;
  }
  async getReservRepatriated(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<ReservRepatriateds[]> {
    let records_from = await this.reservRepatriatedRepository.find({
      where: {
        fromAccountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    let records_to = await this.reservRepatriatedRepository.find({
      where: {
        toAccountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });

    let records: ReservRepatriateds[] = [];
    if (records_from) {
      records.forEach((t) => {
        records_from.push(t);
      });
    }
    if (records_to) {
      records.forEach((t) => {
        records_to.push(t);
      });
    }

    records = records.sort((a, b) => {
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    return records;
  }
  async getSlash(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Slashes[]> {
    let records = await this.slashRepository.find({
      where: {
        accountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    return records;
  }
  async getWithdraw(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Withdraws[]> {
    let records = await this.withdrawRepository.find({
      where: {
        accountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    return records;
  }
  async getUnreserved(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Unreserveds[]> {
    let records = await this.unreservedRepository.find({
      where: {
        accountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    return records;
  }
  async getReserved(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Reserveds[]> {
    let records = await this.reservedRepository.find({
      where: {
        accountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    return records;
  }
  async getDeposit(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Deposits[]> {
    let records = await this.depositRepository.find({
      where: {
        accountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    return records;
  }
  async getBalanceSet(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<BalanceSets[]> {
    let records = await this.balanceSetRepository.find({
      where: {
        accountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    return records;
  }
  async getEndowed(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Endoweds[]> {
    let records = await this.endowedRepository.find({
      where: {
        accountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });
    return records;
  }

  async getTransfers(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Transfers[]> {
    //from
    let transfers_from = await this.getTransfersFrom(
      account_id,
      time_start,
      time_end,
    );

    //to
    let transfers_to = await this.getTransfersTo(
      account_id,
      time_start,
      time_end,
    );

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

    return transfers;
  }
  async getTransfersFrom(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Transfers[]> {
    //from
    let transfers_from = await this.transfersRepository.find({
      where: {
        fromAccountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });

    return transfers_from;
  }
  async getTransfersTo(
    account_id: string,
    time_start: Date,
    time_end: Date,
  ): Promise<Transfers[]> {
    //to
    let transfers_to = await this.transfersRepository.find({
      where: {
        toAccountId: account_id,
        timestamp: Between(time_start, time_end),
      },
      order: { timestamp: 'ASC' },
    });

    return transfers_to;
  }
  constructor(
    @Inject(RepositoryConsts.POLKADOT_BALANCE_ACCOUNT_REPOSITORY)
    private accountRepository: Repository<Accounts>,
    @Inject(RepositoryConsts.POLKADOT_BALANCE_ACCOUNT_SNAPSHOTS_REPOSITORY)
    private accountSnapshotRepository: Repository<AccountSnapshots>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_ENDOWEDS_REPOSITORY)
    private endowedRepository: Repository<Endoweds>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_TRANSFERS_REPOSITORY)
    private transfersRepository: Repository<Transfers>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_BALANCE_SETS_REPOSITORY)
    private balanceSetRepository: Repository<BalanceSets>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_DEPOSITS_REPOSITORY)
    private depositRepository: Repository<Deposits>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_RESERVREPATRIATEDS_REPOSITORY)
    private reservRepatriatedRepository: Repository<ReservRepatriateds>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_RESERVEDS_REPOSITORY)
    private reservedRepository: Repository<Reserveds>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_SLASH_REPOSITORY)
    private slashRepository: Repository<Slashes>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_UNRESERVEDS_REPOSITORY)
    private unreservedRepository: Repository<Unreserveds>,

    @Inject(RepositoryConsts.POLKADOT_BALANCE_WITHDRAWS_REPOSITORY)
    private withdrawRepository: Repository<Withdraws>,
  ) {}
}
