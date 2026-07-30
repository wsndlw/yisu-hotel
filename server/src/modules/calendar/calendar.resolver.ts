import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarPriceService } from '../calendarPrice/calendarPrice.service';
import { CalendarStockService } from '../calendarStock/calendarStock.service';
import {
  CalendarClearRangeInput,
  CalendarPriceBatchSetInput,
  CalendarRangeQueryInput,
  CalendarStockBatchSetInput,
} from './common/calendar.input';
import { HotelMinPriceCalendar, RoomTypeCalendar } from './common/calendar.type';
import { HotelCalendar } from './common/hotel-calendar.type';
import { HotelCalendarRangeQueryInput } from './common/hotel-calendar.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity, UserRole } from '../user/models/user.entity';
import { RoomTypeService } from '../roomType/roomType.service';
import { HotelService } from '../hotel/hotel.service';
import { Result } from '../../common/dto/result.type';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';

@Resolver()
export class CalendarResolver {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly priceService: CalendarPriceService,
    private readonly stockService: CalendarStockService,
    private readonly roomTypeService: RoomTypeService,
    private readonly hotelService: HotelService,
  ) {}

  /**
   * 移动端：获取酒店最低价日历（默认返回未来 90 天）
   */
  @Query(() => HotelMinPriceCalendar, { description: '酒店最低价日历（移动端）' })
  hotelMinPriceCalendar(
    @Args('hotelId', { type: () => ID }) hotelId: string,
    @Args('startDate', { type: () => String, nullable: true }) startDate?: string,
    @Args('endDate', { type: () => String, nullable: true }) endDate?: string,
  ) {
    return this.calendarService.getHotelMinPriceCalendar(hotelId, startDate, endDate);
  }

  /**
   * 商户：查询房型日历（用于管理端日历面板）
   */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Query(() => RoomTypeCalendar, { description: '房型日历（商户）' })
  async merchantRoomTypeCalendar(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CalendarRangeQueryInput,
  ) {
    const roomType = await this.roomTypeService.getRoomTypeById(input.roomTypeId);
    await this.hotelService.assertMerchantHotel(roomType.hotelId, user);
    return this.calendarService.getRoomTypeCalendar(input.roomTypeId, input.startDate, input.endDate);
  }

  /**
   * 商户：查询酒店下所有房型的日历
   */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Query(() => HotelCalendar, { description: '酒店日历（商户）' })
  async merchantHotelCalendar(
    @CurrentUser() user: UserEntity,
    @Args('input') input: HotelCalendarRangeQueryInput,
  ): Promise<HotelCalendar> {
    await this.hotelService.assertMerchantHotel(input.hotelId, user);
    const hotel = await this.hotelService.getHotelById(input.hotelId);  
    const roomTypes = hotel.roomTypes || [];

    const roomTypeCalendars = await Promise.all(
      roomTypes.map((rt: any) => this.calendarService.getRoomTypeCalendar(rt.id, input.startDate, input.endDate)),
    );

    return {
      hotelId: input.hotelId,
      roomTypeCalendars,
    };
  }

  /** 批量设置价格 */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => Result, { description: '批量设置房型日历价格（商户）' })
  async batchSetRoomTypePrice(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CalendarPriceBatchSetInput,
  ): Promise<Result> {
    const roomType = await this.roomTypeService.getRoomTypeById(input.roomTypeId);
    await this.hotelService.assertMerchantHotel(roomType.hotelId, user);
    await this.priceService.batchSet(input.roomTypeId, input.startDate, input.endDate, input.price);
    await this.hotelService.refreshMiniPrice(roomType.hotelId);
    return { code: CODE.SUCCESS, message: getMsg(CODE.SUCCESS) };
  }

  /** 批量设置库存 */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => Result, { description: '批量设置房型日历库存（商户）' })
  async batchSetRoomTypeStock(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CalendarStockBatchSetInput,
  ): Promise<Result> {
    const roomType = await this.roomTypeService.getRoomTypeById(input.roomTypeId);
    await this.hotelService.assertMerchantHotel(roomType.hotelId, user);
    await this.stockService.batchSet(input.roomTypeId, input.startDate, input.endDate, input.stock);
    return { code: CODE.SUCCESS, message: getMsg(CODE.SUCCESS) };
  }

  /** 清空价格覆盖 */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => Result, { description: '清空房型日历价格覆盖（商户）' })
  async clearRoomTypePrice(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CalendarClearRangeInput,
  ): Promise<Result> {
    const roomType = await this.roomTypeService.getRoomTypeById(input.roomTypeId);
    await this.hotelService.assertMerchantHotel(roomType.hotelId, user);
    await this.priceService.clearRange(input.roomTypeId, input.startDate, input.endDate);
    await this.hotelService.refreshMiniPrice(roomType.hotelId);
    return { code: CODE.SUCCESS, message: getMsg(CODE.SUCCESS) };
  }

  /** 清空库存覆盖 */
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => Result, { description: '清空房型日历库存覆盖（商户）' })
  async clearRoomTypeStock(
    @CurrentUser() user: UserEntity,
    @Args('input') input: CalendarClearRangeInput,
  ): Promise<Result> {
    const roomType = await this.roomTypeService.getRoomTypeById(input.roomTypeId);
    await this.hotelService.assertMerchantHotel(roomType.hotelId, user);
    await this.stockService.clearRange(input.roomTypeId, input.startDate, input.endDate);
    return { code: CODE.SUCCESS, message: getMsg(CODE.SUCCESS) };
  }
}
