import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsOptional, Matches, Min } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

@InputType({ description: '日历查询（按日期范围）' })
export class CalendarRangeQueryInput {
  @Field(() => ID)
  roomTypeId: string;

  @Field(() => String, { description: '开始日期（YYYY-MM-DD）' })
  @Matches(DATE_RE)
  startDate: string;

  @Field(() => String, { description: '结束日期（YYYY-MM-DD，包含）' })
  @Matches(DATE_RE)
  endDate: string;
}

@InputType({ description: '批量设置日历价格（日期范围，包含起止）' })
export class CalendarPriceBatchSetInput {
  @Field(() => ID)
  roomTypeId: string;

  @Field(() => String)
  @Matches(DATE_RE)
  startDate: string;

  @Field(() => String)
  @Matches(DATE_RE)
  endDate: string;

  @Field(() => Int, { description: '价格（单位：分）' })
  @IsInt()
  @Min(0)
  price: number;
}

@InputType({ description: '批量设置日历库存（日期范围，包含起止）' })
export class CalendarStockBatchSetInput {
  @Field(() => ID)
  roomTypeId: string;

  @Field(() => String)
  @Matches(DATE_RE)
  startDate: string;

  @Field(() => String)
  @Matches(DATE_RE)
  endDate: string;

  @Field(() => Int, { description: '库存（>=0）' })
  @IsInt()
  @Min(0)
  stock: number;
}

@InputType({ description: '清空日期范围内的日历覆盖（价格或库存）' })
export class CalendarClearRangeInput {
  @Field(() => ID)
  roomTypeId: string;

  @Field(() => String)
  @Matches(DATE_RE)
  startDate: string;

  @Field(() => String)
  @Matches(DATE_RE)
  endDate: string;
}
