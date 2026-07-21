import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity, UserRole } from '../user/models/user.entity';
import { CreateOrderInput, OrderPaginationInput } from './dto/order.input';
import { OrderConnection } from './dto/order.type';
import { OrderEntity } from './models/order.entity';
import { OrderService } from './order.service';

@Resolver(() => OrderEntity)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => OrderEntity, { description: '创建酒店订单并扣减库存' })
  createOrder(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderEntity> {
    return this.orderService.createOrder(user, input);
  }

  @Mutation(() => OrderEntity, { description: '取消本人订单并回补库存' })
  cancelOrder(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OrderEntity> {
    return this.orderService.cancelOrder(user, id);
  }

  @Query(() => OrderConnection, { description: '查询当前用户的订单列表' })
  myOrders(
    @CurrentUser() user: UserEntity,
    @Args('pagination', { nullable: true }) pagination?: OrderPaginationInput,
  ): Promise<OrderConnection> {
    return this.orderService.myOrders(user, pagination);
  }

  @Query(() => OrderEntity, { name: 'order', description: '查询本人订单详情' })
  orderById(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OrderEntity> {
    return this.orderService.getOrder(user, id);
  }
}
