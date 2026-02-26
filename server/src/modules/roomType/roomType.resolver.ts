import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RoomTypeService } from './roomType.service';
import { HotelService } from '../hotel/hotel.service';
import { RoomTypeOpsInput, RoomTypeUpsertInput } from '../hotel/dto/hotel.input';
import { Result } from '../../common/dto/result.type';
import { HotelResult } from '../hotel/dto/result-hotel.output';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity, UserRole } from '../user/models/user.entity';

@Resolver()
export class RoomTypeResolver {
  constructor(
    private readonly roomTypeService: RoomTypeService,
    private readonly hotelService: HotelService,
  ) { }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '新增/更新房型（商户）' })
  async upsertRoomType(
    @CurrentUser() user: UserEntity,
    @Args('hotelId', { type: () => ID }) hotelId: string,
    @Args('roomTypeId', { type: () => ID, nullable: true }) roomTypeId: string | null,
    @Args('input') input: RoomTypeUpsertInput,
  ): Promise<HotelResult> {
    await this.hotelService.assertMerchantHotel(hotelId, user);
    await this.roomTypeService.upsertRoomType(hotelId, roomTypeId, input);
    // 刷新最低价
    const hotel = await this.hotelService.refreshMiniPrice(hotelId);
    if (hotel.status === 3) {
      await this.hotelService.updateStatus(hotelId, 1);
    }
    return { code: CODE.SUCCESS, message: getMsg(CODE.SUCCESS), data: hotel };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => Result, { description: '运营调整房型（商户）' })
  async updateRoomOps(
    @CurrentUser() user: UserEntity,
    @Args('roomTypeId', { type: () => ID }) roomTypeId: string,
    @Args('input') input: RoomTypeOpsInput,
  ): Promise<Result> {
    const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);
    await this.hotelService.assertMerchantHotel(roomType.hotelId, user);
    await this.roomTypeService.updateRoomOps(roomTypeId, input);
    await this.hotelService.refreshMiniPrice(roomType.hotelId);
    return { code: CODE.SUCCESS, message: getMsg(CODE.SUCCESS) };
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => Result, { description: '删除房型（商户）' })
  async deleteRoomType(
    @CurrentUser() user: UserEntity,
    @Args('roomTypeId', { type: () => ID }) roomTypeId: string,
  ): Promise<Result> {
    const roomType = await this.roomTypeService.getRoomTypeById(roomTypeId);
    await this.hotelService.assertMerchantHotel(roomType.hotelId, user);
    const hotel = await this.hotelService.getHotelById(roomType.hotelId);
    await this.roomTypeService.deleteRoomType(roomTypeId);
    // 刷新最低价
    await this.hotelService.refreshMiniPrice(roomType.hotelId);
    if (hotel.status === 3) {
      await this.hotelService.updateStatus(hotel.id, 1);
    }
    return { code: CODE.SUCCESS, message: getMsg(CODE.SUCCESS) };
  }
}
