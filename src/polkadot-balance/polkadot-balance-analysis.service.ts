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
import { AccountsLatestSyncBlock } from 'src/common/entity/PolkadotBalanceModule/AccountsLatestSyncBlock';
import { Cron } from '@nestjs/schedule';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { AccountInfo } from "@polkadot/types/interfaces/system";

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

  private isRunning = false;
  private logger: MyLogger;
  private wsProvider: WsProvider;
  private api: ApiPromise;
  private ws_endpoint: string;

  @Cron('0 */5 * * * *')
  async updateMoonbeamBalanceAccounts(): Promise<any> {
    if (this.isRunning) {
      this.logger.log("Accounts updating service is running, aborting new job...");
      return;
    } else {
      this.isRunning = true;
    }

    const latestSyncBlock: AccountsLatestSyncBlock = await this.polkadotBalanceAccountsLatestSyncBlockRepository.findOne();
    let latestSyncBlockNum;
    let ws_endpoint = 'wss://rpc.polkadot.io';
    // If the AccountsLatestSyncBlock table is empty, init it with block number 0; else retrieve the latest sync block
    if (!latestSyncBlock) {
      latestSyncBlockNum = 0;
      let newAccountsLatestSyncBlock = new AccountsLatestSyncBlock();
      newAccountsLatestSyncBlock.id = "1";
      newAccountsLatestSyncBlock.blockNumber = 0;
      newAccountsLatestSyncBlock.chain_name = 'polkadot';
      newAccountsLatestSyncBlock.ws_endpoint = ws_endpoint;
      newAccountsLatestSyncBlock.sync_time = new Date();
      await this.polkadotBalanceAccountsLatestSyncBlockRepository.save(newAccountsLatestSyncBlock);
    } else {
      latestSyncBlockNum = latestSyncBlock.blockNumber;
      ws_endpoint = latestSyncBlock.ws_endpoint;
    }
    this.logger.verbose(`latestSyncBlockNum:${latestSyncBlockNum},ws_endpoint:${ws_endpoint}`);

    const query1 = `
      SELECT max(max_block_num) as max_block_number
      FROM (
      SELECT 1 as "id",max(block_number) as max_block_num
      FROM transfers
      UNION 
      SELECT 2 as "id",max(block_number) as max_block_num
      FROM withdraws
      UNION
      SELECT 3 as "id",max(block_number) as max_block_num
      FROM deposits
      UNION
      SELECT 4 as "id",max(block_number) as max_block_num
      FROM balance_sets
      UNION
      SELECT 5 as "id",max(block_number) as max_block_num
      FROM endoweds
      UNION
      SELECT 6 as "id",max(block_number) as max_block_num
      FROM reserv_repatriateds
      UNION
      SELECT 7 as "id",max(block_number) as max_block_num
      FROM reserveds
      UNION
      SELECT 8 as "id",max(block_number) as max_block_num
      FROM unreserveds
      UNION
      SELECT 9 as "id",max(block_number) as max_block_num
      FROM slashes) temp`;
    const rawData1 = await this.transfersRepository.query(query1);

    const query2 = `
      SELECT DISTINCT from_account_id as account_id
      FROM transfers
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT to_account_id as account_id
      from transfers
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT account_id
      FROM deposits
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT account_id
      FROM withdraws
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT account_id
      FROM balance_sets
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT account_id
      FROM endoweds
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT from_account_id as account_id
      FROM reserv_repatriateds
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT to_account_id as account_id
      FROM reserv_repatriateds
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT account_id
      FROM reserveds
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT account_id
      FROM unreserveds
      WHERE block_number > ${latestSyncBlockNum}
      UNION
      SELECT DISTINCT account_id
      FROM slashes
      WHERE block_number > ${latestSyncBlockNum}`;
    const rawData2 = await this.transfersRepository.query(query2);

    if (rawData2 && rawData2.length > 0) {

      let batch_size = 100;
      let currentIndex = 0;
      let total = rawData2.length;
      this.logger.verbose(`total account count:${total}`);

      this.ws_endpoint = ws_endpoint;
      this.api = await this.initApi(this.ws_endpoint);

      //Use multi query to improve performance
      while (currentIndex < total) {

        let batchAccountList = [];
        for (let i = 0; i < batch_size; i++) {
          let index = currentIndex + i;
          if (index < total) {
            const record = rawData2[index];
            batchAccountList.push(record.account_id);
          }
        }

        try {

          await this.checkReady(this.wsProvider, this.ws_endpoint);

          let rawList = (await this.api.query.system.account.multi(
            batchAccountList
          ));

          let accountEntities: Accounts[] = [];
          for (let rawIndex = 0; rawIndex < rawList.length; rawIndex++) {
            const raw = rawList[rawIndex] as AccountInfo;
            let acc: Accounts = new Accounts();
            acc.id = batchAccountList[rawIndex];
            acc.freeBalance = raw.data.free.toBigInt().toString();
            acc.reserveBalance = raw.data.reserved.toBigInt().toString();
            acc.totalBalance = (BigInt(acc.freeBalance) + BigInt(acc.reserveBalance)).toString();
            accountEntities.push(acc);
            this.logger.debug(`[${currentIndex + rawIndex}/${total}] account ${acc.id} ...`);
          }
          this.logger.verbose(`[${currentIndex + rawList.length}/${total}] ${accountEntities.length} accounts saving to database...`);
          await this.accountRepository.save(accountEntities);

          currentIndex += batchAccountList.length;

        } catch (error) {
          console.log(error);
          this.logger.error(`error occurs when query accounts, will retry from ${currentIndex}`);
        }
      }

    } else {
      this.logger.verbose("No accounts found in the new blocks range.")
    }

    if (rawData1 && rawData1.length > 0) {
      const record = rawData1[0];
      let latestBlockNumIndexed = record.max_block_number as number;
      latestBlockNumIndexed = latestBlockNumIndexed - 1;// -1 to avoid leaving out accounts at ongoing block by accident
      this.logger.verbose("Start synchronizing accounts from block " + latestSyncBlockNum + " to block " + latestBlockNumIndexed);
      await this.polkadotBalanceAccountsLatestSyncBlockRepository.update(
        { id: '1' },
        { blockNumber: latestBlockNumIndexed })
    }
    this.isRunning = false;
  }

  async initApi(ws_endpoint: string): Promise<ApiPromise> {
    this.wsProvider = new WsProvider(ws_endpoint);
    this.api = await ApiPromise.create({ provider: this.wsProvider });

    await this.checkReady(this.wsProvider, ws_endpoint);

    return this.api;
  }
  async checkReady(wsProvider: WsProvider, ws_endpoint: string) {
    let isReady = wsProvider.isConnected;
    let maxWait = 30;
    while (!isReady && maxWait > 0) {
      maxWait--;
      await FunctionExt.sleep(1000);
    }
    if (isReady) {
      this.logger.debug('checkReady pass, the connection is avaliable');
    }
    else {
      this.logger.warn('checkReady failed , reInit the connection');
      await this.initApi(ws_endpoint);
    }
  }

  constructor(
    @Inject(RepositoryConsts.POLKADOT_BALANCE_ACCOUNT_REPOSITORY)
    private accountRepository: Repository<Accounts>,

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

    @Inject(RepositoryConsts.POLKADOT_BALANCE_ACCOUNTS_LATEST_SYNC_BLOCK_REPOSITORY)
    private polkadotBalanceAccountsLatestSyncBlockRepository: Repository<AccountsLatestSyncBlock>,
  ) {
    this.logger = new MyLogger('PolkadotBalanceAnalysisService');
  }
}
