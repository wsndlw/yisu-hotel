import { Field, ObjectType, Int } from '@nestjs/graphql';
import { HotelEntity } from '../models/hotel.entity';

@ObjectType({ description: '酒店列表返回' })
export class HotelListResult {
  @Field(() => [HotelEntity], { description: '酒店列表' })
  list: HotelEntity[];

  @Field(() => Int, { description: '总数' })
  total: number;

  @Field(() => Int, { description: '页码（从1开始）' })
  page: number;

  @Field(() => Int, { description: '每页数量' })
  pageSize: number;
}
