import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

export enum MobileHotelSort {
  DEFAULT = 'DEFAULT',
  PRICE_ASC = 'PRICE_ASC',
  SCORE_DESC = 'SCORE_DESC',
  DISTANCE_ASC = 'DISTANCE_ASC',
}

registerEnumType(MobileHotelSort, {
  name: 'MobileHotelSort',
  description: '酒店排序方式',
});

@InputType({ description: '分页参数' })
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1, description: '页码' })
  page: number;

  @Field(() => Int, { defaultValue: 10, description: '每页数量' })
  pageSize: number;
}

@InputType({ description: '酒店搜索条件（移动端）' })
export class SearchHotelInput {
  @Field(() => String, { description: '城市编码' })
  cityCode: string;

  @Field(() => String, { description: '入住日期（YYYY-MM-DD）' })
  checkIn: string;

  @Field(() => String, { description: '离店日期（YYYY-MM-DD）' })
  checkOut: string;

  @Field(() => String, { nullable: true, description: '关键词（酒店名/地址）' })
  keyword?: string;

  @Field(() => Number, { nullable: true, description: '最低价' })
  priceMin?: number;

  @Field(() => Number, { nullable: true, description: '最高价' })
  priceMax?: number;

  @Field(() => Int, { nullable: true, description: '星级' })
  starRating?: number;

  @Field(() => [String], { nullable: true, description: '设施ID列表（筛选）' })
  facilityIds?: string[];

  @Field(() => String, { nullable: true, description: 'POI ID（单选）' })
  poiId?: string;

  @Field(() => Number, { nullable: true, description: '用户纬度（用于距离筛选/排序）' })
  latitude?: number;

  @Field(() => Number, { nullable: true, description: '用户经度（用于距离筛选/排序）' })
  longitude?: number;

  @Field(() => Number, { nullable: true, description: '最大距离（公里，筛选）' })
  distanceMax?: number;

  @Field(() => MobileHotelSort, { defaultValue: MobileHotelSort.DEFAULT, description: '排序' })
  sort: MobileHotelSort;

  @Field(() => PaginationInput, { nullable: true, description: '分页' })
  pagination?: PaginationInput;
}
