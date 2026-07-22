import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

@InputType({ description: '创建酒店订单参数' })
export class CreateOrderInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  hotelId: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  roomTypeId: string;

  @Field(() => String, { description: '入住日期（YYYY-MM-DD）' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  checkIn: string;

  @Field(() => String, { description: '离店日期（YYYY-MM-DD）' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  checkOut: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(20)
  guestCount: number;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  guestName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^\+?[0-9][0-9\s-]{5,30}$/, { message: '请输入有效的入住人手机号' })
  guestPhone: string;
}

@InputType({ description: '订单分页参数' })
export class OrderPaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  page = 1;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;
}
