import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: '房型日历（按天）' })
export class RoomTypeCalendarDay {
  @Field(() => String, { description: '日期（YYYY-MM-DD）' })
  date: string;

  @Field(() => Int, { description: '价格（单位：分）' })
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
