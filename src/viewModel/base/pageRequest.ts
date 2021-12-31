import { ApiProperty } from '@nestjs/swagger';
import { OrderBy } from './orderBy';

export class PageRequest {
  constructor() {
    console.log('PageRequest constructor ');
  }

  @ApiProperty({ description: 'record size per page', default: 10 })
  public pageSize: number = 10;
  @ApiProperty({ description: 'page index', default: 1 })
  public pageIndex: number = 1;

  public static getSkip(instance: PageRequest): number {
    var skip = (instance.pageSize || 10) * ((instance.pageIndex || 1) - 1);
    if (skip < 0) {
      skip = 0;
    }
    return skip;
  }
  public static getTake(instance: PageRequest): number {
    if (!instance.pageSize || instance.pageSize <= 0) {
      instance.pageSize = 10;
    }
    return instance.pageSize;
  }
  public static getOrderBy(instance: PageRequest): any {
    if (instance.orderBys && instance.orderBys.length > 0) {
      let orderBy = {};
      instance.orderBys.forEach(d => {
        orderBy[d.sort] = d.order;
      });
      return orderBy;
    }
    else {
      return {};
    }
  }

  @ApiProperty({ default: [], type: [OrderBy] })
  public orderBys: OrderBy[];
}
