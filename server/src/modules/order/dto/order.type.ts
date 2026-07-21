import { Field, Int, ObjectType } from '@nestjs/graphql';
import { OrderEntity } from '../models/order.entity';

@ObjectType({ description: '我的订单分页结果' })
export class OrderConnection {
  @Field(() => [OrderEntity])
  items: OrderEntity[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;
}
