import { Field, ID, InputType } from '@nestjs/graphql';
import { Matches } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

@InputType({ description: '酒店日历查询（按日期范围）' })
export class HotelCalendarRangeQueryInput {
  @Field(() => ID)
  hotelId: string;

  @Field(() => String, { description: '开始日期（YYYY-MM-DD）' })
  @Matches(DATE_RE)
  startDate: string;

  @Field(() => String, { description: '结束日期（YYYY-MM-DD，包含）' })
  @Matches(DATE_RE)
  endDate: string;
}
