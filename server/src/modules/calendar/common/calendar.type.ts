import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: '房型日历（按天）' })
export class RoomTypeCalendarDay {
  @Field(() => String, { description: '日期（YYYY-MM-DD）' })
  date: string;

  @Field(() => Float, { description: '价格（单位：元）' })
  price: number;

  @Field(() => Int, { nullable: true, description: '库存（为空表示不限制或未知）' })
  stock?: number | null;
}

@ObjectType({ description: '房型日历返回' })
export class RoomTypeCalendar {
  @Field(() => ID)
  roomTypeId: string;

  @Field(() => [RoomTypeCalendarDay])
  days: RoomTypeCalendarDay[];
}

@ObjectType({ description: '酒店最低价日历（按天）' })
export class HotelMinPriceCalendarDay {
  @Field(() => String, { description: '日期（YYYY-MM-DD）' })
  date: string;

  @Field(() => Float, { nullable: true, description: '当晚最低可售价（单位：元；无可售房型时为空）' })
  price: number | null;

  @Field(() => Boolean, { description: '当日是否存在可售房型' })
  available: boolean;

  @Field(() => Int, { nullable: true, description: '最低价房型的合计有效库存（为空表示不限制或未知）' })
  stock?: number | null;
}

@ObjectType({ description: '酒店最低价日历返回' })
export class HotelMinPriceCalendar {
  @Field(() => ID)
  hotelId: string;

  @Field(() => [HotelMinPriceCalendarDay])
  days: HotelMinPriceCalendarDay[];
}
